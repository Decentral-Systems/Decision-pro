/**
 * API Gateway Client
 * Handles all API Gateway requests (http://196.188.249.48:4000)
 */
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import {
  APIServiceError,
  APITimeoutError,
  APINetworkError,
  ApiResponse,
} from "@/types/api";
import {
  normalizeApiResponse,
  normalizeErrorResponse,
} from "@/lib/utils/apiResponseNormalizer";
import { creditScoreCache } from "@/lib/utils/creditScoreCache";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { isAllowedOpaqueToken, isValidJWT, rejectDevBypass } from "@/lib/auth/utils/token-validation";

// API Gateway URL
const API_GATEWAY_URL =
  process.env.NEXT_PUBLIC_API_GATEWAY_URL ||
  "http://196.188.249.48:4000";

class APIGatewayClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  // Request deduplication: track in-flight requests by URL + params
  private pendingRequests: Map<string, Promise<any>> = new Map();
  // Network state tracking
  private isNetworkOffline: boolean = false;
  private lastNetworkCheck: number = 0;
  private networkCheckInterval: number = 5000; // Check every 5 seconds

  constructor() {
    this.client = axios.create({
      baseURL: API_GATEWAY_URL,
      timeout: 120000, // 120 seconds - increased for complex approval operations
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });
    
    // CRITICAL FIX: Monitor browser online/offline events
    // This keeps network state accurate and prevents blocking requests
    if (typeof window !== 'undefined') {
      this.isNetworkOffline = !navigator.onLine;
      this.lastNetworkCheck = Date.now();
      
      // Listen for online/offline events
      window.addEventListener('online', () => {
        console.log('[APIGateway] Network came online');
        this.isNetworkOffline = false;
        this.lastNetworkCheck = Date.now();
      });
      
      window.addEventListener('offline', () => {
        console.warn('[APIGateway] Network went offline');
        this.isNetworkOffline = true;
        this.lastNetworkCheck = Date.now();
      });
    }

    // Request interceptor to add auth token, API key, and correlation ID
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        // CRITICAL FIX: Check network state before making requests
        // This prevents blocking all requests when network is down
        if (typeof window !== 'undefined') {
          const now = Date.now();
          // Update network state periodically
          if (now - this.lastNetworkCheck > this.networkCheckInterval) {
            this.isNetworkOffline = !navigator.onLine;
            this.lastNetworkCheck = now;
          }
          
          // For login/auth endpoints, allow request even if network appears offline
          // (user might be trying to reconnect)
          const isAuthEndpoint = config.url?.includes('/auth/login') || 
                                 config.url?.includes('/api/v1/auth/login') ||
                                 config.url?.includes('/auth/refresh') ||
                                 config.url?.includes('/health');
          
          // If network is offline and this is NOT an auth endpoint, fail fast
          if (this.isNetworkOffline && !isAuthEndpoint) {
            console.warn('[APIGateway] Network appears offline, failing request fast:', config.url);
            return Promise.reject(new APINetworkError("Network is offline - please check your connection"));
          }
        }
        
        // Check if this is a public endpoint that doesn't require authentication
        const isPublicEndpoint = config.url?.includes('/auth/login') || config.url?.includes('/api/v1/auth/login') || 
                                config.url?.includes('/auth/refresh') ||
                                config.url?.includes('/health');
        
        // Only add authentication for non-public endpoints
        if (!isPublicEndpoint) {
          // Always try to use access token first if available
          if (this.accessToken && this.accessToken !== "dev-bypass-token") {
            config.headers.Authorization = `Bearer ${this.accessToken}`;
          }
          
          // Add API key as fallback authentication (only if no valid token or token is invalid)
          // This ensures requests work even if token sync is delayed
          const apiKey = process.env.NEXT_PUBLIC_API_KEY;
          
          // Only use API key if explicitly configured and no valid token available
          // Use API key if no token, or if token is dev-bypass (which won't work)
          // Note: API Gateway may accept both token and API key, so we can send both
          if (apiKey && (!this.accessToken || this.accessToken === "dev-bypass-token")) {
            config.headers["X-API-Key"] = apiKey;
            // Remove invalid Authorization header if using API key fallback
            if (this.accessToken === "dev-bypass-token") {
              delete config.headers.Authorization;
            }
          } else if (!this.accessToken && !apiKey) {
            // No authentication available - log warning but allow request to proceed
            // (will likely fail with 401, but that's expected)
            console.warn("[APIGateway] No authentication token or API key available");
          }
        }
        
        // Add correlation ID for request tracing
        if (!config.headers["X-Correlation-ID"]) {
          config.headers["X-Correlation-ID"] = getOrCreateCorrelationId();
        }
        
        // Log for debugging (only in development)
        if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
          console.debug("[APIGateway] Request:", {
            url: config.url,
            method: config.method,
            hasToken: !!this.accessToken,
            tokenType: this.accessToken === "dev-bypass-token" ? "dev-bypass" : (this.accessToken ? "jwt/opaque" : "none"),
            hasApiKey: !!config.headers["X-API-Key"],
            hasAuth: !!config.headers.Authorization,
          });
        }
        
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling and correlation ID tracking
    this.client.interceptors.response.use(
      (response) => {
        // Store correlation ID from response headers if present
        const correlationId = response.headers["x-correlation-id"];
        if (correlationId && typeof window !== 'undefined') {
          // Store in sessionStorage for reference
          sessionStorage.setItem('last_api_correlation_id', correlationId);
        }
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

        // Don't intercept 401 errors for login or refresh endpoints
        const url = originalRequest.url || '';
        const isAuthEndpoint = url.includes('/auth/login') || url.includes('/api/v1/auth/login') || url.includes('/auth/refresh');
        
        // CRITICAL FIX: Check network state BEFORE attempting token refresh
        // This prevents infinite refresh loops when network is down
        const isNetworkError = error.code === "ERR_NETWORK" || 
                               error.code === "ECONNABORTED" || 
                               !error.response;
        
        // Update network state
        if (typeof window !== 'undefined') {
          this.isNetworkOffline = !navigator.onLine || isNetworkError;
          this.lastNetworkCheck = Date.now();
        }
        
        // Handle 401 Unauthorized - attempt token refresh (but not for auth endpoints)
        // Add retry limits to prevent infinite refresh loops
        const MAX_RETRY_ATTEMPTS = 1; // Only retry once
        const REFRESH_TIMEOUT_MS = 5000; // 5 second timeout for refresh operation
        
        if (error.response?.status === 401 && originalRequest && !originalRequest._retry && !isAuthEndpoint) {
          // CRITICAL FIX: Skip token refresh if network is offline
          // This prevents blocking login and other requests
          if (this.isNetworkOffline || isNetworkError) {
            console.warn('[APIGateway] Network offline, skipping token refresh for 401');
            // Don't redirect to login if network is down - allow user to try again
            throw new APINetworkError("Network is offline - cannot refresh token");
          }
          
          originalRequest._retry = true;
          
          // Track retry count
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;
          
          if (originalRequest._retryCount > MAX_RETRY_ATTEMPTS) {
            console.error('[APIGateway] Max retry attempts exceeded, redirecting to login');
            if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
            return Promise.reject(error);
          }
          
          try {
            console.log('[APIGateway] 401 error - attempting token refresh');
            
            // Check if we're in a browser environment and auth refresh is available
            if (typeof window !== 'undefined') {
              const authRefresh = (window as any).__authRefresh;
              
              if (authRefresh && typeof authRefresh === 'function') {
                // Call the auth context refresh function with timeout
                const refreshPromise = authRefresh();
                const timeoutPromise = new Promise((_, reject) => 
                  setTimeout(() => reject(new Error('Token refresh timeout')), REFRESH_TIMEOUT_MS)
                );
                
                // Race between refresh and timeout
                await Promise.race([refreshPromise, timeoutPromise]);
                
                // Get the new token from localStorage
                const newToken = localStorage.getItem('auth_access_token');
                
                if (newToken) {
                  // Update API client token
                  this.setAccessToken(newToken);
                  
                  // Update request header
                  originalRequest.headers.Authorization = `Bearer ${newToken}`;
                  
                  // Retry the original request
                  console.log('[APIGateway] Token refreshed, retrying request');
                  return this.client(originalRequest);
                } else {
                  console.error('[APIGateway] No token found after refresh');
                }
              } else {
                console.warn('[APIGateway] Auth refresh function not available');
              }
              
              // If we get here, refresh failed - redirect to login
              console.log('[APIGateway] Token refresh failed, redirecting to login');
              if (window.location.pathname !== '/login') {
                // Use a timeout to allow user to see any error message
                setTimeout(() => {
                  window.location.href = '/login';
                }, 1000);
              }
            }
          } catch (refreshError) {
            console.error('[APIGateway] Token refresh failed:', refreshError);
            
            // Clear tokens and redirect to login
            if (typeof window !== 'undefined') {
              localStorage.removeItem('auth_user');
              localStorage.removeItem('auth_access_token');
              localStorage.removeItem('auth_refresh_token');
              localStorage.removeItem('auth_session_expires_at');
              
              if (window.location.pathname !== '/login') {
                // Delay redirect to show error message
                setTimeout(() => {
                  window.location.href = '/login';
                }, 1000);
              }
            }
            
            return Promise.reject(refreshError);
          }
        }

        // CRITICAL FIX: Handle network errors gracefully without blocking everything
        // Update network state
        if (typeof window !== 'undefined') {
          this.isNetworkOffline = !navigator.onLine;
          this.lastNetworkCheck = Date.now();
        }
        
        if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
          // For auth endpoints, allow timeout to pass through (user might be trying to login)
          if (isAuthEndpoint) {
            throw new APITimeoutError("Request timeout - please check your connection");
          }
          throw new APITimeoutError("Request timeout");
        }

        if (error.code === "ERR_NETWORK" || !error.response) {
          // CRITICAL FIX: For auth endpoints (login), don't block - allow user to try again
          // For other endpoints, fail gracefully
          if (isAuthEndpoint) {
            // Login requests should fail gracefully so user can retry
            throw new APINetworkError("Network error - please check your connection and try again");
          }
          throw new APINetworkError("Network error - cannot reach API Gateway");
        }

        const status = error.response?.status || 500;
        const message =
          (error.response?.data as any)?.detail ||
          (error.response?.data as any)?.message ||
          error.message ||
          "API request failed";

        throw new APIServiceError(status, message);
      }
    );
  }

  /**
   * Check if network is currently offline
   * This helps prevent unnecessary requests when network is down
   */
  isOffline(): boolean {
    if (typeof window !== 'undefined') {
      const now = Date.now();
      // Update state if check is stale
      if (now - this.lastNetworkCheck > this.networkCheckInterval) {
        this.isNetworkOffline = !navigator.onLine;
        this.lastNetworkCheck = now;
      }
    }
    return this.isNetworkOffline;
  }

  setAccessToken(token: string | null) {
    // Validate token before setting (reject dev bypass; allow opaque tokens if enabled)
    if (token) {
      if (rejectDevBypass(token)) {
        console.error("[APIGateway] Attempted to set dev bypass token - rejected");
        this.accessToken = null;
        return;
      }

      const jwtOk = isValidJWT(token);
      const opaqueOk = isAllowedOpaqueToken(token);

      if (!jwtOk && !opaqueOk) {
        console.error("[APIGateway] Attempted to set invalid token - rejected", {
          tokenPrefix: token.substring(0, 12),
          parts: token.split(".").length,
          length: token.length,
        });
        this.accessToken = null;
        return;
      }

      // Store the token (opaque or JWT). Full validation & refresh handled upstream.
      this.accessToken = token;
    } else {
      this.accessToken = null;
    }
  }

  // Generic HTTP methods
  async get<T>(url: string, params?: Record<string, any>, config?: { signal?: AbortSignal }): Promise<T> {
    // Create request key for deduplication
    const requestKey = `${url}:${JSON.stringify(params || {})}`;
    
    // Check if same request is already in flight
    if (this.pendingRequests.has(requestKey)) {
      return this.pendingRequests.get(requestKey) as Promise<T>;
    }
    
    // Create new request
    const requestPromise = (async () => {
      try {
        const response = await this.client.get<ApiResponse<T>>(url, {
          params,
          signal: config?.signal,
        });
        return normalizeApiResponse<T>(response.data);
      } catch (error: any) {
        if (
          error instanceof APIServiceError ||
          error instanceof APITimeoutError ||
          error instanceof APINetworkError
        ) {
          throw error;
        }
        const normalizedError = normalizeErrorResponse(error);
        throw new APIServiceError(
          normalizedError.statusCode,
          normalizedError.message,
          normalizedError.correlationId
        );
      } finally {
        // Remove from pending requests when done
        this.pendingRequests.delete(requestKey);
      }
    })();
    
    // Store request in pending map
    this.pendingRequests.set(requestKey, requestPromise);
    
    return requestPromise;
  }

  async post<T>(url: string, data?: any, config?: { signal?: AbortSignal }): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, {
        signal: config?.signal,
      });
      return normalizeApiResponse<T>(response.data);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message,
        normalizedError.correlationId
      );
    }
  }

  async put<T>(url: string, data?: any, config?: { signal?: AbortSignal }): Promise<T> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, {
        signal: config?.signal,
      });
      return normalizeApiResponse<T>(response.data);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message,
        normalizedError.correlationId
      );
    }
  }

  async delete<T>(url: string, config?: { signal?: AbortSignal }): Promise<T> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, {
        signal: config?.signal,
      });
      return normalizeApiResponse<T>(response.data);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message,
        normalizedError.correlationId
      );
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<{
    access_token: string;
    refresh_token?: string;
    user_info?: any;
    user?: any;
    expires_in?: number;
  }> {
    try {
      // Log request details in development mode
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('[APIGateway] Login request:', {
          url: '/auth/login',
          baseURL: this.client.defaults.baseURL,
          hasApiKey: !!process.env.NEXT_PUBLIC_API_KEY,
          timestamp: new Date().toISOString(),
        });
      }
      
      // Use /api/v1/auth/login endpoint (proxied to Credit Scoring Service - the working one)
      const response = await this.client.post<ApiResponse<{
        access_token: string;
        refresh_token?: string;
        user_info?: any;
        user?: any;
        expires_in?: number;
      }>>("/api/v1/auth/login", {
        username,
        password,
      });
      
      // Log response details in development mode
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.log('[APIGateway] Login response received:', {
          status: response.status,
          hasAccessToken: !!response.data?.access_token,
          hasUserInfo: !!response.data?.user_info,
          timestamp: new Date().toISOString(),
        });
      }
      
      // API Gateway returns response directly (not wrapped in {success: true, data: {...}})
      // BYPASS the normalizer - use response.data directly to avoid issues
      let data = response.data;
      
      // If it's double-wrapped for some reason, unwrap it
      while (data && data.data && !data.access_token) {
        data = data.data;
      }
      
      // Verify we have the access token
      if (!data || !data.access_token) {
        console.error('[APIGateway] Login response missing access_token:', data);
        throw new APIServiceError(500, "Invalid login response from server - no access token received");
      }
      
      // Set the token
      this.setAccessToken(data.access_token);
      
      console.log('[APIGateway] Login successful, token set');
      
      return data;
    } catch (error: any) {
      // Log detailed error information in development mode
      if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
        console.error('[APIGateway] Login error details:', {
          message: error?.message,
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: error?.response?.data,
          code: error?.code,
          isNetworkError: error?.code === 'ERR_NETWORK' || error?.code === 'ECONNABORTED',
          timestamp: new Date().toISOString(),
        });
      }
      
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      
      // Extract detailed error message from API response
      const apiMessage = error?.response?.data?.detail || 
                        error?.response?.data?.message ||
                        error?.response?.data?.error ||
                        error?.message;
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        apiMessage || normalizedError.message || "Login failed - please check your credentials and try again",
        normalizedError.correlationId
      );
    }
  }

  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
  }> {
    try {
      // Use /auth/refresh (API Gateway's own auth endpoint) instead of /api/v1/auth/refresh (proxy)
      const response = await this.client.post<ApiResponse<{
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      }>>("/auth/refresh", {
        refresh_token: refreshToken,
      });
      
      const data = normalizeApiResponse<{
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      }>(response.data);
      
      if (data.access_token) {
        this.setAccessToken(data.access_token);
      }
      
      return data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Token refresh failed",
        normalizedError.correlationId
      );
    }
  }

  // Customer methods
  async getCustomers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
    sort_by?: string;
    order?: "asc" | "desc";
    // Server-side filters
    region?: string;
    status?: string;
    riskLevel?: string;
    minScore?: number;
    maxScore?: number;
    dateFrom?: string;
    dateTo?: string;
    employment_status?: string;
  }): Promise<import("@/types/api").CustomersListResponse> {
    try {
      const page = params?.page || 1;
      const page_size = params?.page_size || 50;
      
      // Determine which endpoint to use based on whether we have search or filters
      const hasSearch = params?.search && params.search.trim().length > 0;
      const hasFilters = params?.region || params?.status || params?.riskLevel || 
                        params?.minScore || params?.maxScore || params?.dateFrom || 
                        params?.dateTo || params?.employment_status;
      
      // If we have search or filters, use search endpoint which supports advanced filtering
      // Otherwise, use the list endpoint
      const endpoint = hasSearch || hasFilters ? "/api/v1/customers/search/" : "/api/v1/customers/";
      
      // Map frontend params to backend params
      const backendParams: any = {};
      
      if (hasSearch) {
        // For search endpoint, query is required
        backendParams.query = params!.search;
      } else if (hasFilters) {
        // If we only have filters but no search query, use empty string as query
        // The search endpoint requires a query parameter
        backendParams.query = "";
      }
      
      // Pagination parameters
      if (params?.page !== undefined && params?.page_size !== undefined) {
        backendParams.page = params.page;
        backendParams.page_size = params.page_size;
        // Also provide limit/offset for search endpoint compatibility
        backendParams.limit = params.page_size;
        backendParams.offset = (params.page - 1) * params.page_size;
      } else {
        backendParams.limit = page_size;
        backendParams.offset = (page - 1) * page_size;
      }
      
      // Sorting parameters
      if (params?.sort_by) backendParams.sort_by = params.sort_by;
      if (params?.order) backendParams.sort_order = params.order;
      
      // Filter parameters - map frontend filter names to backend API parameter names
      if (params?.region && params.region !== "all") {
        backendParams.region = params.region;
      }
      if (params?.status && params.status !== "all") {
        backendParams.status = params.status;
      }
      if (params?.employment_status) {
        backendParams.employment_status = params.employment_status;
      }
      if (params?.minScore !== undefined) {
        backendParams.min_credit_score = params.minScore;
      }
      if (params?.maxScore !== undefined) {
        backendParams.max_credit_score = params.maxScore;
      }
      if (params?.dateFrom) {
        backendParams.date_from = params.dateFrom;
      }
      if (params?.dateTo) {
        backendParams.date_to = params.dateTo;
      }
      
      // Note: riskLevel filter would need backend support or client-side filtering
      // For now, we'll pass it and let backend handle if supported
      if (params?.riskLevel && params.riskLevel !== "all") {
        backendParams.risk_level = params.riskLevel;
      }
      
      // For getCustomers, we need the raw response structure before normalization
      // The generic get() method normalizes responses, losing pagination metadata
      // So we'll use axios directly to preserve total, limit, offset, etc.
      const axiosResponse = await this.client.get(endpoint, { params: backendParams });
      const responseData = axiosResponse.data || axiosResponse;
      
      // Debug logging
      if (typeof window !== 'undefined') {
        console.log('[getCustomers] API Response:', {
          endpoint,
          params: backendParams,
          status: axiosResponse.status,
          hasData: !!responseData,
          dataKeys: responseData ? Object.keys(responseData) : [],
          dataArrayLength: responseData?.data?.length || responseData?.items?.length || 0,
          total: responseData?.total,
          success: responseData?.success,
          sampleData: responseData?.data?.[0] || null,
        });
      }
      
      // Handle the response - axios already extracts response.data, so we get the API response directly
      // The response structure is: {success: true, data: [...], total: ..., limit: ..., offset: ...}
      
      // Transform backend format {success: true, data: [...], total: ..., limit: ..., offset: ...} 
      // to frontend format {items: [...], total: ..., page: ..., page_size: ..., has_more: ...}
      if (responseData && typeof responseData === 'object') {
        // If it's already in the correct format (has items property)
        if ('items' in responseData && Array.isArray(responseData.items)) {
          return responseData as import("@/types/api").CustomersListResponse;
        }
        
        // If it's in backend format {success: true, data: [...], total: ..., limit: ..., offset: ...}
        if (responseData.success && 'data' in responseData && Array.isArray(responseData.data)) {
          const dataArray = responseData.data;
          const total = responseData.total || dataArray.length || 0;
          const limit = responseData.limit || page_size;
          const offset = responseData.offset || 0;
          
          // Transform API response items to match CustomerListItem interface
          // Map fields and ensure all required fields are present
          let transformedItems = dataArray.map((item: any) => ({
            customer_id: item.customer_id || item.id,
            full_name: item.full_name || item.name || '',
            email: item.email || undefined,
            phone_number: item.phone_number || item.phone || undefined,
            region: item.region || undefined,
            credit_score: item.credit_score !== undefined && item.credit_score !== null ? item.credit_score : 0,
            risk_score: item.risk_score !== undefined && item.risk_score !== null ? item.risk_score : undefined,
            status: item.status || (item.credit_score && item.credit_score > 0 ? 'active' : 'pending') || 'active',
            created_at: item.created_at || undefined,
            last_updated: item.updated_at || item.last_updated || undefined,
          }));
          
          // Enhance credit scores by fetching from credit assessment history if not available
          // Check cache first to avoid unnecessary API calls
          // Only fetch if credit_score is 0 or missing (to avoid unnecessary API calls)
          // Limit to first 20 customers per page to avoid performance issues
          
          // First, check cache for any customers needing scores
          const customersNeedingScores = transformedItems
            .filter(item => !item.credit_score || item.credit_score === 0)
            .slice(0, 20);
          
          // Apply cached scores first
          const cachedScoreMap = new Map<string, number>();
          customersNeedingScores.forEach(customer => {
            const cachedScore = creditScoreCache.get(customer.customer_id);
            if (cachedScore !== null) {
              cachedScoreMap.set(customer.customer_id, cachedScore);
            }
          });
          
          // Filter out customers that have cached scores
          const customersToFetch = customersNeedingScores.filter(
            customer => !cachedScoreMap.has(customer.customer_id)
          );
          
          if (customersToFetch.length > 0) {
            // Fetch credit scores from credit assessment history in parallel
            // Use Promise.allSettled to handle individual failures gracefully
            try {
              const creditScorePromises = customersToFetch.map(async (customer) => {
                try {
                  // Try to get from customer 360 endpoint first (most reliable source)
                  try {
                    const customer360Response = await this.client.get(
                      `/api/v1/customers/${customer.customer_id}/360`
                    );
                    // this.client.get() returns axios response, so customer360Response.data is the API response
                    // The API response structure is: {success: true, data: {...}}
                    const apiResponse = customer360Response.data;
                    const customer360 = apiResponse?.success && apiResponse?.data 
                      ? apiResponse.data 
                      : (apiResponse?.data || apiResponse);
                    
                    // Check credit.score first (most common location)
                    if (customer360?.credit?.score && customer360.credit.score > 0) {
                      // Cache the score
                      creditScoreCache.set(customer.customer_id, customer360.credit.score);
                      return { customer_id: customer.customer_id, credit_score: customer360.credit.score };
                    }
                    // Check credit.history[0].credit_score
                    if (customer360?.credit?.history && Array.isArray(customer360.credit.history) && customer360.credit.history.length > 0) {
                      const latestScore = customer360.credit.history[0].credit_score;
                      if (latestScore && latestScore > 0) {
                        // Cache the score
                        creditScoreCache.set(customer.customer_id, latestScore);
                        return { customer_id: customer.customer_id, credit_score: latestScore };
                      }
                    }
                  } catch (e) {
                    // Ignore 360 endpoint errors, try history endpoint
                  }
                  
                  // Fallback: Try credit scoring history endpoint
                  try {
                    const creditHistoryResponse = await this.client.get(
                      "/api/intelligence/credit-scoring/history",
                      {
                        params: {
                          customer_id: customer.customer_id,
                          page_size: 1,
                          sort_by: "created_at",
                          sort_order: "desc"
                        }
                      }
                    );
                    
                    const apiResponse = creditHistoryResponse.data;
                    const creditHistory = apiResponse?.success && apiResponse?.data 
                      ? apiResponse.data 
                      : (apiResponse?.data || apiResponse);
                    
                    if (creditHistory?.items && Array.isArray(creditHistory.items) && creditHistory.items.length > 0) {
                      const latestScore = creditHistory.items[0].credit_score;
                      if (latestScore && latestScore > 0) {
                        // Cache the score
                        creditScoreCache.set(customer.customer_id, latestScore);
                        return { customer_id: customer.customer_id, credit_score: latestScore };
                      }
                    }
                  } catch (e) {
                    // Ignore history endpoint errors
                  }
                  
                  return null;
                } catch (error) {
                  // Ignore errors for individual credit score fetches
                  return null;
                }
              });
              
              // Use Promise.allSettled to handle individual failures gracefully
              const creditScoreResults = await Promise.allSettled(creditScorePromises);
              
              // Merge fetched scores with cached scores
              const fetchedScoreMap = new Map(
                creditScoreResults
                  .filter((result): result is PromiseFulfilledResult<{ customer_id: string; credit_score: number } | null> => 
                    result.status === 'fulfilled' && result.value !== null
                  )
                  .map(result => {
                    const score = result.value!;
                    return [score.customer_id, score.credit_score] as [string, number];
                  })
              );
              
              // Combine cached and fetched scores
              const allScoresMap = new Map([...cachedScoreMap, ...fetchedScoreMap]);
              
              transformedItems = transformedItems.map(item => {
                const fetchedScore = allScoresMap.get(item.customer_id);
                if (fetchedScore && fetchedScore > 0) {
                  return { ...item, credit_score: fetchedScore };
                }
                return item;
              });
            } catch (error) {
              // If batch credit score fetch fails, use cached scores if available
              transformedItems = transformedItems.map(item => {
                const cachedScore = cachedScoreMap.get(item.customer_id);
                if (cachedScore && cachedScore > 0) {
                  return { ...item, credit_score: cachedScore };
                }
                return item;
              });
              console.warn('[getCustomers] Failed to fetch credit scores:', error);
            }
          } else if (cachedScoreMap.size > 0) {
            // Only cached scores available, apply them
            transformedItems = transformedItems.map(item => {
              const cachedScore = cachedScoreMap.get(item.customer_id);
              if (cachedScore && cachedScore > 0) {
                return { ...item, credit_score: cachedScore };
              }
              return item;
            });
          }
          
          const result = {
            items: transformedItems,
            total: total,
            page: responseData.page || page || Math.floor(offset / limit) + 1,
            page_size: responseData.page_size || limit || page_size,
            has_more: responseData.has_more !== undefined 
              ? responseData.has_more 
              : (offset + dataArray.length < total),
          } as import("@/types/api").CustomersListResponse;
          
          // Debug logging for transformation result
          if (typeof window !== 'undefined') {
            console.log('[getCustomers] Transformation result:', {
              itemsCount: result.items.length,
              total: result.total,
              page: result.page,
              page_size: result.page_size,
              has_more: result.has_more,
              sampleItem: result.items[0] || null,
            });
          }
          
          return result;
        }
        
        // If response.data is directly an array (unwrapped)
        if (Array.isArray(responseData)) {
          // Transform array items to match CustomerListItem interface
          let transformedItems = responseData.map((item: any) => ({
            customer_id: item.customer_id || item.id,
            full_name: item.full_name || item.name || '',
            email: item.email || undefined,
            phone_number: item.phone_number || item.phone || undefined,
            region: item.region || undefined,
            credit_score: item.credit_score !== undefined && item.credit_score !== null ? item.credit_score : 0,
            risk_score: item.risk_score !== undefined && item.risk_score !== null ? item.risk_score : undefined,
            status: item.status || (item.credit_score && item.credit_score > 0 ? 'active' : 'pending') || 'active',
            created_at: item.created_at || undefined,
            last_updated: item.updated_at || item.last_updated || undefined,
          }));
          
          // Enhance credit scores by fetching from credit assessment history if not available
          // Check cache first to avoid unnecessary API calls
          // Limit to first 20 customers per page to avoid performance issues
          
          const customersNeedingScores = transformedItems
            .filter(item => !item.credit_score || item.credit_score === 0)
            .slice(0, 20);
          
          // First, check cache for any customers needing scores
          const cachedScoreMap = new Map<string, number>();
          customersNeedingScores.forEach(customer => {
            const cachedScore = creditScoreCache.get(customer.customer_id);
            if (cachedScore !== null) {
              cachedScoreMap.set(customer.customer_id, cachedScore);
            }
          });
          
          // Filter out customers that have cached scores
          const customersToFetch = customersNeedingScores.filter(
            customer => !cachedScoreMap.has(customer.customer_id)
          );
          
          if (customersToFetch.length > 0) {
            try {
              const creditScorePromises = customersToFetch.map(async (customer) => {
                try {
                  // Try customer 360 endpoint first (most reliable source)
                  try {
                    const customer360Response = await this.client.get(
                      `/api/v1/customers/${customer.customer_id}/360`
                    );
                    const apiResponse = customer360Response.data;
                    const customer360 = apiResponse?.success && apiResponse?.data 
                      ? apiResponse.data 
                      : (apiResponse?.data || apiResponse);
                    
                    if (customer360?.credit?.score && customer360.credit.score > 0) {
                      // Cache the score
                      creditScoreCache.set(customer.customer_id, customer360.credit.score);
                      return { customer_id: customer.customer_id, credit_score: customer360.credit.score };
                    }
                    if (customer360?.credit?.history && Array.isArray(customer360.credit.history) && customer360.credit.history.length > 0) {
                      const latestScore = customer360.credit.history[0].credit_score;
                      if (latestScore && latestScore > 0) {
                        // Cache the score
                        creditScoreCache.set(customer.customer_id, latestScore);
                        return { customer_id: customer.customer_id, credit_score: latestScore };
                      }
                    }
                  } catch (e) {
                    // Ignore 360 endpoint errors, try history endpoint
                  }
                  
                  // Fallback: Try credit scoring history endpoint
                  try {
                    const creditHistoryResponse = await this.client.get(
                      "/api/intelligence/credit-scoring/history",
                      {
                        params: {
                          customer_id: customer.customer_id,
                          page_size: 1,
                          sort_by: "created_at",
                          sort_order: "desc"
                        }
                      }
                    );
                    
                    const apiResponse = creditHistoryResponse.data;
                    const creditHistory = apiResponse?.success && apiResponse?.data 
                      ? apiResponse.data 
                      : (apiResponse?.data || apiResponse);
                    
                    if (creditHistory?.items && Array.isArray(creditHistory.items) && creditHistory.items.length > 0) {
                      const latestScore = creditHistory.items[0].credit_score;
                      if (latestScore && latestScore > 0) {
                        // Cache the score
                        creditScoreCache.set(customer.customer_id, latestScore);
                        return { customer_id: customer.customer_id, credit_score: latestScore };
                      }
                    }
                  } catch (e) {
                    // Ignore history endpoint errors
                  }
                  
                  return null;
                } catch (error) {
                  return null;
                }
              });
              
              // Use Promise.allSettled to handle individual failures gracefully
              const creditScoreResults = await Promise.allSettled(creditScorePromises);
              
              // Merge fetched scores with cached scores
              const fetchedScoreMap = new Map(
                creditScoreResults
                  .filter((result): result is PromiseFulfilledResult<{ customer_id: string; credit_score: number } | null> => 
                    result.status === 'fulfilled' && result.value !== null
                  )
                  .map(result => {
                    const score = result.value!;
                    return [score.customer_id, score.credit_score] as [string, number];
                  })
              );
              
              // Combine cached and fetched scores
              const allScoresMap = new Map([...cachedScoreMap, ...fetchedScoreMap]);
              
              transformedItems = transformedItems.map(item => {
                const fetchedScore = allScoresMap.get(item.customer_id);
                if (fetchedScore && fetchedScore > 0) {
                  return { ...item, credit_score: fetchedScore };
                }
                return item;
              });
            } catch (error) {
              // If batch credit score fetch fails, use cached scores if available
              transformedItems = transformedItems.map(item => {
                const cachedScore = cachedScoreMap.get(item.customer_id);
                if (cachedScore && cachedScore > 0) {
                  return { ...item, credit_score: cachedScore };
                }
                return item;
              });
            }
          } else if (cachedScoreMap.size > 0) {
            // Only cached scores available, apply them
            transformedItems = transformedItems.map(item => {
              const cachedScore = cachedScoreMap.get(item.customer_id);
              if (cachedScore && cachedScore > 0) {
                return { ...item, credit_score: cachedScore };
              }
              return item;
            });
          }
          
          return {
            items: transformedItems,
            total: responseData.length,
            page: page,
            page_size: page_size,
            has_more: false,
          } as import("@/types/api").CustomersListResponse;
        }
      }
      
      // Fallback: return empty response
      return {
        items: [],
        total: 0,
        page: page,
        page_size: page_size,
        has_more: false,
      } as import("@/types/api").CustomersListResponse;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customers",
        normalizedError.correlationId
      );
    }
  }

  async getCustomer360(customerId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/360`
      );
      const data = normalizeApiResponse<any>(response.data);
      
      // Update credit score cache if available in 360 data
      if (data?.credit?.score && data.credit.score > 0) {
        creditScoreCache.set(customerId, data.credit.score);
      } else if (data?.credit?.history && Array.isArray(data.credit.history) && data.credit.history.length > 0) {
        const latestScore = data.credit.history[0].credit_score;
        if (latestScore && latestScore > 0) {
          creditScoreCache.set(customerId, latestScore);
        }
      }
      
      return data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customer 360 data",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Activate Customers
   */
  async bulkActivateCustomers(customerIds: string[]): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/customers/bulk/activate",
        customerIds
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to bulk activate customers",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Deactivate Customers
   */
  async bulkDeactivateCustomers(customerIds: string[]): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/customers/bulk/deactivate",
        customerIds
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to bulk deactivate customers",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Delete Customers
   */
  async bulkDeleteCustomers(customerIds: string[]): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/customers/bulk/delete",
        customerIds
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to bulk delete customers",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Export Customers
   */
  async bulkExportCustomers(customerIds: string[], format: string = "csv"): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/customers/bulk/export",
        { customer_ids: customerIds, format }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to bulk export customers",
        normalizedError.correlationId
      );
    }
  }

  async createCustomer(customerData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/customers",
        customerData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to create customer",
        normalizedError.correlationId
      );
    }
  }

  async updateCustomer(customerId: string, customerData: any): Promise<any> {
    try {
      const response = await this.client.put<ApiResponse<any>>(
        `/api/v1/customers/${customerId}`,
        customerData
      );
      const data = normalizeApiResponse<any>(response.data);
      
      // Invalidate credit score cache when customer is updated
      // Credit score may have changed due to profile updates
      creditScoreCache.delete(customerId);
      
      return data;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to update customer",
        normalizedError.correlationId
      );
    }
  }

  async exportCustomers(format: string = "csv", limit: number = 1000): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/customers/export",
        { params: { format, limit } }
      );
      if (response.data?.success && response.data) {
        return response.data;
      }
      if (response.data && typeof response.data === "object") {
        return response.data;
      }
      throw new APIServiceError(response.status || 500, "Failed to export customers");
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      throw new APIServiceError(500, error.message || "Failed to export customers");
    }
  }

  // Search customers using the search endpoint
  async searchCustomers(params: {
    query: string;
    limit?: number;
    offset?: number;
    sort_by?: string;
    sort_order?: "asc" | "desc";
    fields?: string;
    status?: string;
    region?: string;
    employment_status?: string;
    date_from?: string;
    date_to?: string;
    min_credit_score?: number;
    max_credit_score?: number;
  }): Promise<{ results: any[]; total: number; limit: number; offset: number }> {
    try {
      // Clean up params - remove empty query string, trim query
      const cleanParams: any = { ...params };
      if (cleanParams.query) {
        cleanParams.query = cleanParams.query.trim();
        if (!cleanParams.query) {
          delete cleanParams.query;
        }
      } else {
        delete cleanParams.query;
      }
      
      // Remove undefined values
      Object.keys(cleanParams).forEach(key => {
        if (cleanParams[key] === undefined || cleanParams[key] === null || cleanParams[key] === '') {
          delete cleanParams[key];
        }
      });
      
      // Check if we have at least query or one filter parameter
      const hasQuery = !!cleanParams.query;
      const hasFilters = !!(cleanParams.status || cleanParams.region || cleanParams.employment_status || 
                            cleanParams.date_from || cleanParams.date_to || 
                            cleanParams.min_credit_score || cleanParams.max_credit_score);
      
      if (!hasQuery && !hasFilters) {
        // Return empty results instead of throwing error to prevent console spam
        return { results: [], total: 0, limit: params.limit || 50, offset: params.offset || 0 };
      }
      
      const response = await this.client.get<ApiResponse<{
        results: any[];
        total: number;
        limit: number;
        offset: number;
      }>>(
        "/api/v1/customers/search/",
        { params: cleanParams }
      );

      // Normalize the response first
      const normalized = normalizeApiResponse(response.data);
      
      // Extract results from normalized response
      let results: any[] = [];
      let total = 0;
      let limit = params.limit || 50;
      let offset = params.offset || 0;

      // Handle different response formats
      if (normalized && typeof normalized === 'object') {
        // Check if results are directly in normalized data
        if (Array.isArray(normalized)) {
          results = normalized;
          total = normalized.length;
        }
        // Check if results are in a 'results' field
        else if ('results' in normalized && Array.isArray((normalized as any).results)) {
          results = (normalized as any).results;
          total = (normalized as any).total || results.length;
          limit = (normalized as any).limit || limit;
          offset = (normalized as any).offset || offset;
        }
        // Check if results are in a 'data' field
        else if ('data' in normalized) {
          const data = (normalized as any).data;
          if (Array.isArray(data)) {
            results = data;
            total = data.length;
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            results = data.results;
            total = data.total || results.length;
            limit = data.limit || limit;
            offset = data.offset || offset;
          }
        }
        // Check if results are in a 'customers' field (some endpoints return this)
        else if ('customers' in normalized && Array.isArray((normalized as any).customers)) {
          results = (normalized as any).customers;
          total = (normalized as any).total || results.length;
          limit = (normalized as any).limit || limit;
          offset = (normalized as any).offset || offset;
        }
      }

      // If still no results, check raw response.data
      if (results.length === 0 && response.data) {
        const rawData = response.data as any;
        if (rawData.success && rawData.data) {
          const data = rawData.data;
          if (Array.isArray(data)) {
            results = data;
            total = data.length;
          } else if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
            results = data.results;
            total = data.total || results.length;
            limit = data.limit || limit;
            offset = data.offset || offset;
          }
        } else if (rawData.results && Array.isArray(rawData.results)) {
          results = rawData.results;
          total = rawData.total || results.length;
          limit = rawData.limit || limit;
          offset = rawData.offset || offset;
        } else if (Array.isArray(rawData)) {
          results = rawData;
          total = rawData.length;
        }
      }

      return {
        results,
        total,
        limit,
        offset,
      };
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }

      // Handle 401/404 gracefully
      if (error.response?.status === 404 || error.response?.status === 401) {
        console.warn(`Customer search endpoint unavailable (${error.response?.status}), returning empty result`);
        return {
          results: [],
          total: 0,
          limit: params.limit || 50,
          offset: params.offset || 0,
        };
      }

      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to search customers",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Customer Intelligence Data
   * Fetches recommendations, insights, and life events for a customer
   */
  async getCustomerIntelligence(customerId: string): Promise<any> {
    try {
      // Try Customer 360 endpoint with include=intelligence first
      try {
        const response = await this.client.get<ApiResponse<any>>(
          `/api/v1/customers/${customerId}/360`,
          { params: { include: "intelligence" } }
        );
        const data = normalizeApiResponse<any>(response.data);
        
        if (data?.intelligence) {
          return data.intelligence;
        }
      } catch (error: any) {
        // If Customer 360 fails, fetch from individual endpoints
        console.warn("Customer 360 intelligence fetch failed, trying individual endpoints:", error);
      }
      
      // Fetch from individual intelligence endpoints
      const [recommendations, lifeEvents, insights] = await Promise.all([
        this.getProductRecommendations(customerId, 10).catch(() => []),
        this.getLifeEvents(customerId, 20).catch(() => ({ events: [], statistics: {} })),
        Promise.resolve([]), // Insights can be derived or fetched separately
      ]);
      
      return {
        recommendations: Array.isArray(recommendations) ? recommendations : [],
        life_events: lifeEvents?.events || lifeEvents || [],
        insights: insights || [],
        statistics: lifeEvents?.statistics || {},
      };
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customer intelligence",
        normalizedError.correlationId
      );
    }
  }

  // Product Intelligence methods
  async getProductRecommendations(customerId?: string, limit: number = 10): Promise<any[]> {
    try {
      // Handle undefined/null customerId - use general recommendations endpoint
      // The correct endpoint is /api/intelligence/products/recommendations (not /api/intelligence/recommendations)
      const endpoint = customerId 
        ? `/api/intelligence/recommendations/${customerId}`
        : `/api/intelligence/products/recommendations`;
      const response = await this.client.get<ApiResponse<any[] | { recommendations: any[]; total: number }>>(
        endpoint,
        { params: { limit, ...(customerId ? {} : { customer_id: undefined }) } }
      );
      const data = normalizeApiResponse<any[] | { recommendations: any[]; total: number }>(response.data);
      // Handle both array and object with recommendations property
      if (Array.isArray(data)) {
        return data;
      }
      if (data && typeof data === 'object' && 'recommendations' in data) {
        const typedData = data as { recommendations: any[]; total?: number };
        return Array.isArray(typedData.recommendations) ? typedData.recommendations : [];
      }
      return [];
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch product recommendations",
        normalizedError.correlationId
      );
    }
  }

  // Dashboard data methods with date range support
  async getDashboardData(dateParams?: { start_date: string; end_date: string }): Promise<any> {
    try {
      const params: any = { type: "dashboard" };
      if (dateParams) {
        params.start_date = dateParams.start_date;
        params.end_date = dateParams.end_date;
      }
      
      console.log("[APIGateway] Fetching dashboard data", { 
        endpoint: "/api/v1/analytics", 
        params,
        hasToken: !!this.accessToken 
      });
      
      const response = await this.client.get<import("@/types/api").ApiResponse<any>>(
        "/api/v1/analytics",
        { params }
      );
      
      const normalizedData = normalizeApiResponse(response.data);
      
      if (normalizedData) {
        console.log("[APIGateway] Dashboard data fetched successfully", {
          hasAnalytics: !!(normalizedData as any)?.analytics,
          hasDashboard: !!(normalizedData as any)?.dashboard,
          dataKeys: Object.keys(normalizedData || {})
        });
        return normalizedData;
      }
      
      console.warn("[APIGateway] Dashboard data response is empty or invalid", {
        responseStatus: response.status,
        responseData: response.data
      });
      
      throw new APIServiceError(
        response.status || 500,
        "Failed to fetch dashboard data - invalid response format"
      );
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        console.error("[APIGateway] Dashboard data fetch error", {
          errorType: error.constructor.name,
          message: error.message,
          statusCode: (error as any).statusCode
        });
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      console.error("[APIGateway] Dashboard data fetch error (normalized)", {
        statusCode: normalizedError.statusCode,
        message: normalizedError.message,
        originalError: error
      });
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch dashboard data",
        normalizedError.correlationId
      );
    }
  }

  async getExecutiveDashboardData(dateParams?: { start_date: string; end_date: string }): Promise<any> {
    try {
      const params: any = {};
      if (dateParams) {
        params.start_date = dateParams.start_date;
        params.end_date = dateParams.end_date;
      }
      
      console.log("[APIGateway] Fetching executive dashboard data", {
        endpoint: "/api/v1/analytics/dashboard/executive",
        params,
        hasToken: !!this.accessToken
      });
      
      const response = await this.client.get<import("@/types/api").ApiResponse<any>>(
        "/api/v1/analytics/dashboard/executive",
        params ? { params } : undefined
      );
      
      const normalizedData = normalizeApiResponse(response.data);
      
      console.log("[APIGateway] Executive dashboard data fetched successfully", {
        hasData: !!normalizedData,
        dataKeys: normalizedData ? Object.keys(normalizedData) : [],
        hasBankingKPIs: !!(normalizedData as any)?.banking_kpis,
        hasRevenueMetrics: !!(normalizedData as any)?.revenue_metrics
      });
      
      return normalizedData;
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        console.error("[APIGateway] Executive dashboard data fetch error", {
          errorType: error.constructor.name,
          message: error.message,
          statusCode: (error as any).statusCode
        });
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      console.error("[APIGateway] Executive dashboard data fetch error (normalized)", {
        statusCode: normalizedError.statusCode,
        message: normalizedError.message,
        originalError: error
      });
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch executive dashboard data",
        normalizedError.correlationId
      );
    }
  }

  async getCustomerStats(dateParams?: { start_date: string; end_date: string }): Promise<import("@/types/customer-intelligence").CustomerStats> {
    try {
      const params: any = {};
      if (dateParams) {
        params.start_date = dateParams.start_date;
        params.end_date = dateParams.end_date;
      }
      const response = await this.client.get<any>(
        "/api/v1/customers/stats/overview",
        params ? { params } : undefined
      );
      if (response.data?.success && response.data.overview) {
        return response.data.overview;
      }
      if (response.data?.success && response.data.data) {
        return response.data.data;
      }
      if (response.data?.overview) {
        return response.data.overview;
      }
      throw new APIServiceError(response.status || 500, "Failed to fetch customer statistics");
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      throw new APIServiceError(500, error.message || "Failed to fetch customer statistics");
    }
  }

  async getRecommendationStats(dateParams?: { start_date: string; end_date: string }): Promise<import("@/types/product-intelligence").RecommendationStatistics> {
    try {
      const params: any = {};
      if (dateParams) {
        params.start_date = dateParams.start_date;
        params.end_date = dateParams.end_date;
      }
      const response = await this.client.get<ApiResponse<import("@/types/product-intelligence").RecommendationStatistics>>(
        "/api/intelligence/recommendations/statistics",
        params ? { params } : undefined
      );
      
      // Handle different response formats
      const responseData = normalizeApiResponse<any>(response.data);
      
      // If response has success: true and data field, extract data
      if (responseData?.success && responseData.data) {
        return responseData.data;
      }
      
      // If response has success: true and fields directly, return the object (excluding success field)
      if (responseData?.success && typeof responseData === "object") {
        const { success, message, ...stats } = responseData;
        return stats as any;
      }
      
      // If response is the stats object directly
      if (responseData && typeof responseData === "object" && "total_recommendations" in responseData) {
        return responseData as any;
      }
      
      throw new APIServiceError(response.status || 500, "Failed to fetch recommendation statistics - invalid response format");
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch recommendation statistics",
        normalizedError.correlationId
      );
    }
  }

  // ML Operations methods
  async getModelPerformance(modelName?: string): Promise<any> {
    try {
      const endpoint = modelName 
        ? `/api/ml/model/${modelName}/performance`
        : "/api/ml/model/ensemble/performance";
      const response = await this.client.get<ApiResponse<any>>(endpoint);
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch model performance",
        normalizedError.correlationId
      );
    }
  }

  async getModelComparison(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/ml/model/comparison");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch model comparison",
        normalizedError.correlationId
      );
    }
  }

  async getDriftDetection(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/ml/drift");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch drift detection",
        normalizedError.correlationId
      );
    }
  }

  async getFeatureImportance(modelName?: string, topN: number = 20): Promise<any> {
    try {
      const params: any = { top_n: topN };
      if (modelName) {
        params.model_name = modelName;
      }
      const response = await this.client.get<ApiResponse<any>>("/api/ml/features/importance", { params });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch feature importance",
        normalizedError.correlationId
      );
    }
  }

  async getPerformanceTrends(timeRange: string = "30d", groupBy: string = "day"): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/ml/performance/trends", {
        params: { timeRange, groupBy }
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch performance trends",
        normalizedError.correlationId
      );
    }
  }

  // Real-time scoring methods
  async getRealtimeScoring(limit: number = 20): Promise<any[]> {
    try {
      const response = await this.client.get<ApiResponse<any[]>>("/api/scoring/realtime", {
        params: { limit }
      });
      const data = normalizeApiResponse<any[]>(response.data);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      // Return empty array on error for realtime feed
      return [];
    }
  }

  async getRealtimeScoringMetrics(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/scoring/realtime/metrics");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      // Return default structure on error
      return {
        total_scores_today: 0,
        average_score: 0,
        scores_per_minute: 0,
        active_customers: 0,
        score_trend: []
      };
    }
  }

  // Customer intelligence methods
  async getTopCustomers(limit: number = 10, sortBy: "credit_score" | "revenue" | "loan_amount" = "credit_score"): Promise<any[]> {
    try {
      const response = await this.client.get<ApiResponse<any[]>>("/api/v1/customers/top", {
        params: { limit, sort_by: sortBy }
      });
      const data = normalizeApiResponse<any[]>(response.data);
      return Array.isArray(data) ? data : [];
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      // Return empty array on error
      return [];
    }
  }

  async getWatchlist(limit: number = 50, offset: number = 0): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/risk/watchlist", {
        params: { limit, offset }
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch watchlist",
        normalizedError.correlationId
      );
    }
  }

  async getRiskAlerts(filters?: { severity?: string; status?: string; limit?: number; offset?: number }): Promise<any> {
    try {
      const params: any = {};
      if (filters?.severity) params.severity = filters.severity;
      if (filters?.status) params.status = filters.status;
      if (filters?.limit) params.limit = filters.limit;
      if (filters?.offset) params.offset = filters.offset;
      
      const response = await this.client.get<ApiResponse<any>>("/api/risk/alerts", { params });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch risk alerts",
        normalizedError.correlationId
      );
    }
  }

  async getCustomerJourneyInsights(filters?: any): Promise<any> {
    try {
      const params: any = {};
      if (filters?.from_date) params.from_date = filters.from_date;
      if (filters?.to_date) params.to_date = filters.to_date;
      if (filters?.product_type) params.product_type = filters.product_type;
      if (filters?.risk_band) params.risk_band = filters.risk_band;
      if (filters?.channel) params.channel = filters.channel;
      
      const response = await this.client.get<ApiResponse<any>>("/api/intelligence/journey/insights", { params });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customer journey insights",
        normalizedError.correlationId
      );
    }
  }

  async getCustomerJourneyTimeline(customerId: string, filters?: any): Promise<any[]> {
    try {
      const params: any = {};
      if (filters?.from_date) params.from_date = filters.from_date;
      if (filters?.to_date) params.to_date = filters.to_date;
      if (filters?.limit) params.limit = filters.limit;
      
      // Try the journey endpoint first: /api/v1/customer-journey/{customer_id}/timeline
      try {
        const response = await this.client.get<ApiResponse<any[]>>(
          `/api/v1/customer-journey/${customerId}/timeline`,
          { params }
        );
        const data = normalizeApiResponse<any>(response.data);
        
        // Handle different response formats
        if (Array.isArray(data)) {
          return data;
        }
        if (data?.timeline && Array.isArray(data.timeline)) {
          return data.timeline;
        }
        if (data?.events && Array.isArray(data.events)) {
          return data.events;
        }
        if (data?.data && Array.isArray(data.data)) {
          return data.data;
        }
        
        return [];
      } catch (journeyError: any) {
        // Fallback: Try Customer 360 endpoint with include=journey
        const response = await this.client.get<ApiResponse<any>>(
          `/api/v1/customers/${customerId}/360`,
          { params: { include: "journey", ...params } }
        );
        const data = normalizeApiResponse<any>(response.data);
        
        // Extract timeline from journey data
        if (data?.journey?.timeline && Array.isArray(data.journey.timeline)) {
          return data.journey.timeline;
        }
        if (data?.timeline && Array.isArray(data.timeline)) {
          return data.timeline;
        }
        if (data?.events && Array.isArray(data.events)) {
          return data.events;
        }
        
        return [];
      }
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      // Return empty array on error (don't throw to allow graceful fallback)
      console.warn("Failed to fetch journey timeline:", error);
      return [];
    }
  }

  async getMarketRiskAnalysis(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/risk/market-analysis");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch market risk analysis",
        normalizedError.correlationId
      );
    }
  }

  async getLifeEvents(customerId?: string, limit: number = 20): Promise<any> {
    try {
      const endpoint = customerId 
        ? `/api/intelligence/life-events/${customerId}`
        : "/api/intelligence/life-events/statistics";
      const params = customerId ? { limit } : {};
      const response = await this.client.get<ApiResponse<any>>(endpoint, { params });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch life events",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Apply Recommendation
   * Marks a recommendation as applied
   */
  async applyRecommendation(recommendationId: string | number, customerId: string): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/intelligence/recommendations/${recommendationId}/apply`,
        {
          customer_id: customerId,
          applied_at: new Date().toISOString()
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to apply recommendation",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Dismiss Recommendation
   * Marks a recommendation as dismissed
   */
  async dismissRecommendation(
    recommendationId: string | number,
    customerId: string,
    reason?: string
  ): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/intelligence/recommendations/${recommendationId}/dismiss`,
        {
          customer_id: customerId,
          dismissed_at: new Date().toISOString(),
          reason: reason
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to dismiss recommendation",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Recommendation History
   * Gets recommendation history for a customer with pagination
   */
  async getRecommendationHistory(
    customerId: string,
    params?: {
      page?: number;
      page_size?: number;
      action?: "applied" | "dismissed";
    }
  ): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.page !== undefined) queryParams.page = params.page;
      if (params?.page_size !== undefined) queryParams.page_size = params.page_size;
      if (params?.action) queryParams.action = params.action;

      const response = await this.client.get<ApiResponse<any>>(
        `/api/intelligence/recommendations/${customerId}/history`,
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch recommendation history",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Submit Recommendation Feedback
   * Submits feedback on a recommendation
   */
  async submitRecommendationFeedback(
    recommendationId: string | number,
    feedback: {
      feedback: string;
      rating?: number;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/intelligence/recommendations/${recommendationId}/feedback`,
        {
          feedback: feedback.feedback,
          rating: feedback.rating
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to submit feedback",
        normalizedError.correlationId
      );
    }
  }

  async getMarketRiskHistorical(days: number = 30): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/risk/market/historical", {
        params: { days }
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch market risk historical data",
        normalizedError.correlationId
      );
    }
  }

  async getMarketRiskSectors(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/risk/market/sectors");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch market risk sectors",
        normalizedError.correlationId
      );
    }
  }

  async getBenchmarks(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/analytics/benchmarks");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch benchmarks",
        normalizedError.correlationId
      );
    }
  }

  async getEnsembleWeights(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/ml/ensemble/weights");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch ensemble weights",
        normalizedError.correlationId
      );
    }
  }

  async getEnsembleAgreement(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/ml/ensemble/agreement");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch ensemble agreement",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Model Versions
   * Fetches version history for a model
   */
  async getModelVersions(modelId: string): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.get<ApiResponse<any>>(
        `/api/ml/model/${modelId}/versions`,
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] getModelVersions success (${duration}ms)`, {
          correlationId,
          modelId,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelId}/versions`,
        method: "GET",
        modelId,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
      };
      
      console.error("[ML API] getModelVersions failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch model versions",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Compare Model Versions
   * Compares two versions of a model
   */
  async compareModelVersions(modelId: string, versionId1: string, versionId2: string): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.get<ApiResponse<any>>(
        `/api/ml/model/${modelId}/versions/${versionId1}/compare`,
        {
          params: { version2: versionId2 },
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] compareModelVersions success (${duration}ms)`, {
          correlationId,
          modelId,
          versionId1,
          versionId2,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelId}/versions/${versionId1}/compare`,
        method: "GET",
        modelId,
        versionId1,
        versionId2,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
      };
      
      console.error("[ML API] compareModelVersions failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to compare model versions",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Rollback Model Version
   * Rolls back to a specific model version
   */
  async rollbackModelVersion(modelId: string, versionId: string): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.post<ApiResponse<any>>(
        `/api/ml/model/${modelId}/versions/${versionId}/rollback`,
        {},
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] rollbackModelVersion success (${duration}ms)`, {
          correlationId,
          modelId,
          versionId,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelId}/versions/${versionId}/rollback`,
        method: "POST",
        modelId,
        versionId,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
      };
      
      console.error("[ML API] rollbackModelVersion failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to rollback model version",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Get Feature Importance
   * Fetches feature importance data for a model
   */
  async getFeatureImportance(modelId: string): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.get<ApiResponse<any>>(
        `/api/ml/model/${modelId}/features/importance`,
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] getFeatureImportance success (${duration}ms)`, {
          correlationId,
          modelId,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelId}/features/importance`,
        method: "GET",
        modelId,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
      };
      
      console.error("[ML API] getFeatureImportance failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch feature importance",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Get Feature Correlation
   * Fetches feature correlation matrix for a model
   */
  async getFeatureCorrelation(modelId: string): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.get<ApiResponse<any>>(
        `/api/ml/model/${modelId}/features/correlation`,
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] getFeatureCorrelation success (${duration}ms)`, {
          correlationId,
          modelId,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelId}/features/correlation`,
        method: "GET",
        modelId,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
      };
      
      console.error("[ML API] getFeatureCorrelation failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch feature correlation",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Get Feature Drift
   * Fetches feature drift data for a model
   */
  async getFeatureDrift(modelId: string): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.get<ApiResponse<any>>(
        `/api/ml/model/${modelId}/features/drift`,
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] getFeatureDrift success (${duration}ms)`, {
          correlationId,
          modelId,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelId}/features/drift`,
        method: "GET",
        modelId,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
      };
      
      console.error("[ML API] getFeatureDrift failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch feature drift",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Get ML Center Dashboard Data
   * Fetches model performance metrics, training jobs, and ML operations data
   */
  async getMLDashboard(): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.get<ApiResponse<any>>("/api/ml/dashboard", {
        headers: {
          "X-Correlation-ID": correlationId,
        },
      });
      const duration = Date.now() - startTime;
      
      // Log successful request
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] getMLDashboard success (${duration}ms)`, {
          correlationId,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        correlationId,
        endpoint: "/api/ml/dashboard",
        method: "GET",
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
      
      console.error("[ML API] getMLDashboard failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch ML dashboard data",
        normalizedError.correlationId || correlationId
      );
    }
  }


  /**
   * Start Model Training
   * Initiates training for a specific model
   */
  async startModelTraining(modelName: string, params?: any): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.post<ApiResponse<any>>(
        `/api/ml/model/${modelName}/train`,
        params || {},
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      // Log successful request
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] startModelTraining success (${duration}ms)`, {
          correlationId,
          modelName,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelName}/train`,
        method: "POST",
        modelName,
        params,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
      
      console.error("[ML API] startModelTraining failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to start model training",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Get Data Drift Metrics
   * Fetches data drift monitoring metrics
   */
  async getDataDrift(modelName?: string, days: number = 30, threshold: number = 0.1): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      // Use v1 endpoint for drift detection
      const params: any = { days, threshold };
      if (modelName) {
        params.model_name = modelName;
      }
      
      const startTime = Date.now();
      const response = await this.client.get<ApiResponse<any>>("/api/v1/mlops/monitoring/drift", {
        params,
        headers: {
          "X-Correlation-ID": correlationId,
        },
      });
      const duration = Date.now() - startTime;
      
      // Log successful request
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] getDataDrift success (${duration}ms)`, {
          correlationId,
          modelName,
          days,
          threshold,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        correlationId,
        endpoint: "/api/v1/mlops/monitoring/drift",
        method: "GET",
        modelName,
        days,
        threshold,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
      
      console.error("[ML API] getDataDrift failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch data drift metrics",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Get Model Features
   * Fetches feature importance and details for a model
   */
  async getModelFeatures(modelName: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/api/ml/model/${modelName}/features`);
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch model features",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Cancel Training Job
   * Cancels a running or pending training job
   */
  async cancelTrainingJob(jobId: string): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.post<ApiResponse<any>>(
        `/api/ml/training/${jobId}/cancel`,
        {},
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      // Log successful request
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] cancelTrainingJob success (${duration}ms)`, {
          correlationId,
          jobId,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/training/${jobId}/cancel`,
        method: "POST",
        jobId,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
      
      console.error("[ML API] cancelTrainingJob failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to cancel training job",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Deploy Model
   * Deploys a model with specified deployment type and A/B allocation
   */
  async deployModel(
    modelId: string,
    deploymentConfig: {
      deployment_type: "production" | "canary" | "shadow";
      ab_allocation?: number;
      traffic_percentage?: number;
    }
  ): Promise<any> {
    const correlationId = getOrCreateCorrelationId();
    try {
      const startTime = Date.now();
      const response = await this.client.post<ApiResponse<any>>(
        `/api/ml/model/${modelId}/deploy`,
        deploymentConfig,
        {
          headers: {
            "X-Correlation-ID": correlationId,
          },
        }
      );
      const duration = Date.now() - startTime;
      
      // Log successful request
      if (process.env.NODE_ENV === 'development') {
        console.log(`[ML API] deployModel success (${duration}ms)`, {
          correlationId,
          modelId,
          deploymentConfig,
          status: response.status,
        });
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      // Enhanced error logging
      const errorDetails = {
        correlationId,
        endpoint: `/api/ml/model/${modelId}/deploy`,
        method: "POST",
        modelId,
        deploymentConfig,
        error: error.message,
        statusCode: error.response?.status || error.statusCode,
        responseData: error.response?.data,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      };
      
      console.error("[ML API] deployModel failed:", errorDetails);
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to deploy model",
        normalizedError.correlationId || correlationId
      );
    }
  }

  /**
   * Get Training Jobs
   * Fetches list of training jobs with optional filtering
   */
  async getTrainingJobs(params?: {
    model_name?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/ml/training-jobs", { params });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch training jobs",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Training Job Details
   * Fetches detailed information about a specific training job
   */
  async getTrainingJob(jobId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(`/api/ml/training-jobs/${jobId}`);
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch training job details",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Compliance Dashboard Data
   * Fetches compliance metrics, rules, and recent violations
   */
  async getComplianceDashboard(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/compliance/dashboard");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch compliance dashboard data",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Review Compliance Violation
   * Reviews a compliance violation with action and optional notes
   * Backend expects action and notes as query parameters
   */
  async reviewViolation(violationId: string, action: string, notes?: string): Promise<any> {
    try {
      const params = new URLSearchParams();
      params.append("action", action);
      if (notes) {
        params.append("notes", notes);
      }
      const response = await this.client.post<ApiResponse<any>>(
        `/api/compliance/violations/${violationId}/review?${params.toString()}`,
        {}
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to review violation",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Aggregated Dashboard Data (Phase 5 - OPTIMIZED)
   * Fetches all dashboard data in a single request to reduce connection pool usage
   * This replaces multiple separate API calls with one optimized call
   */
  async getAggregatedDashboardData(sections: string = "customers,analytics,revenue,portfolio,risk"): Promise<any> {
    try {
      if (typeof window !== 'undefined') {
        console.log('[getAggregatedDashboardData] Request (Phase 5 - OPTIMIZED):', { sections });
      }
      
      const response = await this.client.get<ApiResponse<any>>("/api/v1/dashboard/aggregated", { 
        params: { sections } 
      });
      const normalized = normalizeApiResponse<any>(response.data);
      
      if (typeof window !== 'undefined') {
        console.log('[getAggregatedDashboardData] Response (Phase 5):', {
          hasData: !!normalized,
          sections: normalized?.sections_loaded || [],
          dataKeys: normalized?.data ? Object.keys(normalized.data) : []
        });
      }
      
      return normalized;
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch aggregated dashboard data",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Analytics Data
   * Fetches analytics data for a specific type (dashboard, portfolio, risk, scoring, etc.)
   */
  async getAnalyticsData(type: string = "dashboard", params?: {
    customer_id?: string;
    time_range?: string;
    group_by?: string;
    format?: string;
  }): Promise<any> {
    try {
      const queryParams: any = { type };
      if (params) {
        if (params.customer_id) queryParams.customer_id = params.customer_id;
        if (params.time_range) queryParams.time_range = params.time_range;
        if (params.group_by) queryParams.group_by = params.group_by;
        if (params.format) queryParams.format = params.format;
      }
      
      // Safe logging for SSR
      if (typeof window !== 'undefined') {
        console.log('[getAnalyticsData] Request:', { type, queryParams });
      }
      
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics", { params: queryParams });
      const normalized = normalizeApiResponse<any>(response.data);
      
      // Safe logging for SSR - avoid deep object inspection during SSR
      if (typeof window !== 'undefined') {
        console.log('[getAnalyticsData] Response:', {
          hasData: !!normalized,
          hasAnalytics: !!normalized?.analytics,
          analyticsKeys: normalized?.analytics ? Object.keys(normalized.analytics) : [],
          portfolio: normalized?.analytics?.portfolio ? {
            hasCustomers: !!normalized.analytics.portfolio.customers,
            customersCount: normalized.analytics.portfolio.customers?.length || 0,
            hasTrends: !!normalized.analytics.portfolio.trends,
            trendsCount: normalized.analytics.portfolio.trends?.length || 0,
          } : null,
          risk: normalized?.analytics?.risk ? {
            hasCategories: !!normalized.analytics.risk.categories,
            categoriesCount: normalized.analytics.risk.categories?.length || 0,
            hasTrends: !!normalized.analytics.risk.trends,
            trendsCount: normalized.analytics.risk.trends?.length || 0,
          } : null,
        });
      }
      
      return normalized;
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch analytics data",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Risk Distribution
   * Fetches risk distribution analytics
   */
  async getRiskDistribution(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics", { 
        params: { type: "risk" } 
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch risk distribution",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Approval Rates
   * Fetches approval rates analytics for a specific timeframe
   */
  async getApprovalRates(timeframe: "daily" | "weekly" | "monthly" = "monthly"): Promise<any> {
    try {
      const groupBy = timeframe === "daily" ? "day" : timeframe === "weekly" ? "week" : "month";
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics", { 
        params: { type: "scoring", group_by: groupBy } 
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch approval rates",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Portfolio Metrics
   * Fetches portfolio-level analytics metrics
   */
  async getPortfolioMetrics(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics", { 
        params: { type: "portfolio" } 
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch portfolio metrics",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Revenue Breakdown
   * Fetches revenue breakdown analytics for a specific timeframe
   */
  async getRevenueBreakdown(
    timeframe: "daily" | "weekly" | "monthly" | "yearly" = "monthly",
    months: number = 12,
    dateParams?: { start_date: string; end_date: string }
  ): Promise<any> {
    try {
      const params: any = { timeframe, months };
      if (dateParams) {
        params.start_date = dateParams.start_date;
        params.end_date = dateParams.end_date;
      }
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics/revenue/breakdown", { 
        params 
      });
      const data = normalizeApiResponse<any>(response.data);
      // Return the data array directly
      return data?.data || data || [];
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch revenue breakdown",
        normalizedError.correlationId
      );
    }
  }

  async getRevenueTrends(
    timeframe: "daily" | "weekly" | "monthly" = "monthly",
    months: number = 12,
    startDate?: string,
    endDate?: string
  ): Promise<any> {
    try {
      const params: any = { period: timeframe };
      if (startDate) params.from_date = startDate;
      if (endDate) params.to_date = endDate;
      
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics/revenue/trends", { 
        params 
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch revenue trends",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Banking Ratios Targets
   * Fetches target, minimum, and maximum values for banking ratios
   */
  async getBankingRatiosTargets(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics/banking-ratios/targets");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch banking ratios targets",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Banking Ratios Stress Scenario
   * Fetches banking ratios under stress scenario
   */
  async getBankingRatiosStressScenario(
    scenario: string = "stress",
    defaultRateIncrease?: number,
    interestRateShock?: number,
    economicDownturn: boolean = true
  ): Promise<any> {
    try {
      const params: any = { scenario, economic_downturn: economicDownturn };
      if (defaultRateIncrease !== undefined) params.default_rate_increase = defaultRateIncrease;
      if (interestRateShock !== undefined) params.interest_rate_shock = interestRateShock;
      
      const response = await this.client.get<ApiResponse<any>>("/api/v1/analytics/banking-ratios/stress-scenario", {
        params
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch banking ratios stress scenario",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Previous Period Analytics
   * Fetches analytics data for the previous period for comparison
   */
  async getPreviousPeriodAnalytics(time_range: string = "30d"): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/analytics/previous-period", {
        params: { time_range }
      });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch previous period analytics",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get System Status
   * Fetches system health status and service metrics
   */
  async getSystemStatus(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/v1/system/status");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch system status",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get User Activity
   * Fetches activity log for a specific user
   */
  async getUserActivity(
    userId: string,
    params?: {
      page?: number;
      page_size?: number;
      start_date?: string;
      end_date?: string;
    }
  ): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.page !== undefined) queryParams.page = params.page;
        if (params.page_size !== undefined) queryParams.page_size = params.page_size;
        if (params.start_date) queryParams.start_date = params.start_date;
        if (params.end_date) queryParams.end_date = params.end_date;
      }
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/admin/users/${userId}/activity`,
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch user activity",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Settings
   * Fetches system settings configuration
   */
  async getSettings(): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>("/api/v1/admin/settings");
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch settings",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Update Settings
   * Updates system settings configuration
   */
  async updateSettings(settings: any): Promise<any> {
    try {
      const response = await this.client.put<ApiResponse<any>>("/api/v1/admin/settings", settings);
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to update settings",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Reset Settings
   * Resets system settings to default values
   */
  async resetSettings(): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>("/api/v1/admin/settings/reset", {});
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to reset settings",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Customer Trends
   * Fetches historical customer metrics and trends over time
   */
  async getCustomerTrends(
    customerId: string,
    timeRange: string = "90d"
  ): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/trends`,
        { params: { time_range: timeRange } }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customer trends",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Reset Settings
   * Resets system settings to default values
   */
  async resetSettings(): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>("/api/v1/admin/settings/reset", {});
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to reset settings",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Users
   * Fetches a list of users with pagination support
   */
  async getUsers(params?: {
    page?: number;
    page_size?: number;
    search?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.page !== undefined) queryParams.page = params.page;
        if (params.page_size !== undefined) queryParams.page_size = params.page_size;
        if (params.search) queryParams.search = params.search;
      }
      const response = await this.client.get<ApiResponse<any>>("/api/v1/admin/users", { params: queryParams });
      const data = normalizeApiResponse<any>(response.data);
      
      // Backend returns {users: [...], total: ..., page: ..., page_size: ...}
      // Frontend expects {items: [...], total: ..., page: ..., page_size: ..., has_more: ...}
      // Backend roles format: [{role_name: "...", role_id: ..., assigned_at: ...}]
      // Frontend expects: ["role1", "role2", ...]
      if (data && typeof data === "object") {
        let usersArray: any[] = [];
        
        // Extract users array
        if (Array.isArray(data.users)) {
          usersArray = data.users;
        } else if (Array.isArray(data.items)) {
          usersArray = data.items;
        } else if (Array.isArray(data)) {
          usersArray = data;
        }
        
        // Transform roles from objects to string array
        const transformedUsers = usersArray.map((user: any) => {
          if (user && user.roles && Array.isArray(user.roles)) {
            // Check if roles are objects or strings
            const transformedRoles = user.roles.map((role: any) => {
              if (typeof role === "string") {
                return role;
              } else if (role && typeof role === "object" && role.role_name) {
                return role.role_name;
              }
              return null;
            }).filter((role: any) => role !== null);
            
            return {
              ...user,
              roles: transformedRoles
            };
          }
          // Ensure roles is always an array
          return {
            ...user,
            roles: user.roles || []
          };
        });
        
        // Return in expected paginated format
        if (usersArray.length > 0 || Array.isArray(data.users) || Array.isArray(data.items)) {
          const total = data.total !== undefined ? data.total : transformedUsers.length;
          const page = data.page !== undefined ? data.page : (params?.page || 1);
          const page_size = data.page_size !== undefined ? data.page_size : (params?.page_size || 20);
          
          return {
            items: transformedUsers,
            total: total,
            page: page,
            page_size: page_size,
            has_more: data.has_more !== undefined 
              ? data.has_more 
              : (page * page_size) < total
          };
        }
      }
      
      // Fallback: return empty response
      return {
        items: [],
        total: 0,
        page: params?.page || 1,
        page_size: params?.page_size || 20,
        has_more: false
      };
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch users",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Activate Users
   * Activates multiple users at once
   */
  async bulkActivateUsers(userIds: string[]): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>("/api/v1/admin/users/bulk/activate", { user_ids: userIds });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to activate users",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Deactivate Users
   * Deactivates multiple users at once
   */
  async bulkDeactivateUsers(userIds: string[]): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>("/api/v1/admin/users/bulk/deactivate", { user_ids: userIds });
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to deactivate users",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Customer Notes
   * Fetches all notes for a specific customer with pagination and filtering
   */
  async getCustomerNotes(
    customerId: string,
    params?: {
      page?: number;
      page_size?: number;
      note_type?: string;
      tags?: string;
      is_archived?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/notes`,
        { params }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      // Log error for debugging
      console.warn(`[API Gateway] Failed to fetch customer notes for ${customerId}:`, error);
      
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customer notes",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Create Customer Note
   * Creates a new note for a customer
   */
  async createCustomerNote(
    customerId: string,
    noteData: {
      content: string;
      note_type?: string;
      tags?: string[];
      priority?: string;
      is_pinned?: boolean;
      related_loan_id?: string;
      related_assessment_id?: string;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/notes`,
        noteData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to create customer note",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Update Customer Note
   * Updates an existing customer note
   */
  async updateCustomerNote(
    customerId: string,
    noteId: string,
    noteData: {
      content?: string;
      note_type?: string;
      tags?: string[];
      priority?: string;
      is_pinned?: boolean;
      is_archived?: boolean;
    }
  ): Promise<any> {
    try {
      const response = await this.client.patch<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/notes/${noteId}`,
        noteData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to update customer note",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Delete Customer Note
   * Deletes or archives a customer note
   */
  async deleteCustomerNote(
    customerId: string,
    noteId: string,
    permanent: boolean = false
  ): Promise<void> {
    try {
      await this.client.delete(
        `/api/v1/customers/${customerId}/notes/${noteId}`,
        { params: { permanent } }
      );
    } catch (error: any) {
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to delete customer note",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Customer Trends
   * Fetches historical customer metrics and trends over time
   */
  async getCustomerTrends(
    customerId: string,
    timeRange: string = "90d"
  ): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/trends`,
        {
          params: { time_range: timeRange }
        }
      );
      
      const data = normalizeApiResponse<any>(response.data);
      
      return data;
    } catch (error: any) {
      // Log error for debugging
      console.warn(`[API Gateway] Failed to fetch customer trends for ${customerId}:`, error);
      
      if (
        error instanceof APIServiceError ||
        error instanceof APITimeoutError ||
        error instanceof APINetworkError
      ) {
        throw error;
      }
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customer trends",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Customer Activity Log
   */
  async getCustomerActivityLog(customerId: string, filters?: any): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/activity`,
        { params: filters }
      );
      const data = normalizeApiResponse<any>(response.data);
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.items && Array.isArray(data.items)) {
        return data.items;
      }
      if (data?.logs && Array.isArray(data.logs)) {
        return data.logs;
      }
      return [];
    } catch (error: any) {
      // Return empty array on 404 (endpoint not implemented yet)
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get Customer Documents
   */
  async getCustomerDocuments(customerId: string, filters?: any): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/documents`,
        { params: filters }
      );
      const data = normalizeApiResponse<any>(response.data);
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.documents && Array.isArray(data.documents)) {
        return data.documents;
      }
      if (data?.items && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (error: any) {
      // Return empty array on 404 (endpoint not implemented yet)
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return [];
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch customer documents",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Upload Customer Document
   */
  async uploadCustomerDocument(
    customerId: string,
    file: File,
    metadata?: { category?: string; document_type?: string; description?: string }
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      if (metadata?.category) formData.append("category", metadata.category);
      if (metadata?.document_type) formData.append("document_type", metadata.document_type);
      if (metadata?.description) formData.append("description", metadata.description);

      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/documents`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to upload document",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Delete Customer Document
   */
  async deleteCustomerDocument(customerId: string, documentId: string): Promise<any> {
    try {
      const response = await this.client.delete<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/documents/${documentId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to delete document",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Customer Communications
   */
  async getCustomerCommunications(customerId: string, filters?: any): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/communications`,
        { params: filters }
      );
      const data = normalizeApiResponse<any>(response.data);
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.communications && Array.isArray(data.communications)) {
        return data.communications;
      }
      if (data?.items && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return [];
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch communications",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Send Customer Communication
   */
  async sendCustomerCommunication(
    customerId: string,
    communication: {
      type: "email" | "sms";
      subject?: string;
      message: string;
      template_id?: string;
      scheduled_for?: string;
    }
  ): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/customers/${customerId}/communications`,
        communication
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to send communication",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Communication Templates
   */
  async getCommunicationTemplates(type?: "email" | "sms"): Promise<any> {
    try {
      const params = type ? { type } : {};
      const response = await this.client.get<ApiResponse<any>>("/api/communications/templates", {
        params,
      });
      const data = normalizeApiResponse<any>(response.data);
      if (Array.isArray(data)) {
        return data;
      }
      if (data?.templates && Array.isArray(data.templates)) {
        return data.templates;
      }
      if (data?.items && Array.isArray(data.items)) {
        return data.items;
      }
      return [];
    } catch (error: any) {
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return [];
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch templates",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Bulk Operation Status
   * API stub - returns status object until backend is implemented
   */
  async getBulkOperationStatus(operationId: string): Promise<any> {
    // TODO: Replace with actual API endpoint when backend is ready
    return {
      operation_id: operationId,
      status: "completed",
      progress: 100,
      total_items: 0,
      processed_items: 0,
      successful_items: 0,
      failed_items: 0,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      errors: [],
    };
  }


  /**
   * Get Batch Scoring Job Status
   * Fetches status and progress of a batch scoring job
   */
  async getBatchScoringJobStatus(jobId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/scoring/batch/${jobId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch batch job status",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Batch Scoring Results
   * Fetches results of a completed batch scoring job
   */
  async getBatchScoringResults(
    jobId: string,
    format: string = "json"
  ): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/scoring/batch/${jobId}/results`,
        { params: { format } }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch batch results",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Import Settings
   * Imports settings from JSON with validation
   */
  async importSettings(
    settings: any,
    options?: { validateOnly?: boolean; overwrite?: boolean }
  ): Promise<any> {
    try {
      const params: any = {};
      if (options?.validateOnly) params.validate_only = true;
      if (options?.overwrite) params.overwrite = true;
      
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/admin/settings/import",
        settings,
        { params }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to import settings",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Settings History
   * Fetches history of settings changes with version tracking
   */
  async getSettingsHistory(params?: {
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.limit !== undefined) queryParams.limit = params.limit;
        if (params.offset !== undefined) queryParams.offset = params.offset;
      }
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/admin/settings/history",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to fetch settings history",
        normalizedError.correlationId
      );
    }
  }

  // ========================================================================
  // LOAN MANAGEMENT METHODS
  // ========================================================================

  /**
   * Create Loan Application
   */
  async createLoanApplication(applicationData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/applications",
        applicationData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to create loan application",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Loan Application
   */
  async getLoanApplicationStatusHistory(applicationId: number, limit: number = 100): Promise<any> {
    try {
      console.log("[APIGateway] getLoanApplicationStatusHistory request:", {
        applicationId,
        limit,
      });
      const response = await this.get<any>(
        `/api/v1/loans/applications/${applicationId}/status-history`,
        { limit }
      );
      console.log("[APIGateway] getLoanApplicationStatusHistory response:", response);
      return response;
    } catch (error: any) {
      console.error("[APIGateway] getLoanApplicationStatusHistory error:", error);
      throw error;
    }
  }

  async getLoanApplication(applicationId: number): Promise<any> {
    try {
      console.log("[APIGateway] getLoanApplication request:", {
        applicationId,
        url: `/api/v1/loans/applications/${applicationId}`,
      });
      
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/applications/${applicationId}`
      );
      
      const responseDataString = response.data ? JSON.stringify(response.data, null, 2) : 'null';
      console.log("[APIGateway] getLoanApplication raw response:", {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataStructure: responseDataString ? responseDataString.substring(0, 1000) : 'null',
      });
      
      const normalized = normalizeApiResponse<any>(response.data);
      
      const normalizedString = normalized ? JSON.stringify(normalized, null, 2) : 'null';
      console.log("[APIGateway] getLoanApplication normalized:", {
        hasNormalized: !!normalized,
        normalizedKeys: normalized ? Object.keys(normalized) : [],
        normalizedStructure: normalizedString ? normalizedString.substring(0, 1000) : 'null',
      });
      
      return normalized;
    } catch (error: any) {
      console.error("[APIGateway] getLoanApplication error:", {
        applicationId,
        error: error.message || error,
        statusCode: error.response?.status,
        responseData: error.response?.data,
      });
      
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get loan application",
        normalizedError.correlationId
      );
    }
  }

  /**
   * List Loan Applications
   */
  async listLoanApplications(params?: {
    limit?: number;
    offset?: number;
    status?: string;
    loan_type?: string;
    customer_id?: string;
    customer_name?: string;
    application_number?: string;
    date_from?: string;
    date_to?: string;
    approval_date_from?: string;
    approval_date_to?: string;
    min_amount?: number;
    max_amount?: number;
    min_credit_score?: number;
    max_credit_score?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.limit !== undefined) queryParams.limit = params.limit;
        if (params.offset !== undefined) queryParams.offset = params.offset;
        if (params.status) queryParams.status_filter = params.status;
        if (params.loan_type) queryParams.loan_type = params.loan_type;
        if (params.customer_id) queryParams.customer_id = params.customer_id;
        if (params.customer_name) queryParams.customer_name = params.customer_name;
        if (params.application_number) queryParams.application_number = params.application_number;
        if (params.date_from) queryParams.date_from = params.date_from;
        if (params.date_to) queryParams.date_to = params.date_to;
        if (params.approval_date_from) queryParams.approval_date_from = params.approval_date_from;
        if (params.approval_date_to) queryParams.approval_date_to = params.approval_date_to;
        if (params.min_amount !== undefined) queryParams.min_amount = params.min_amount;
        if (params.max_amount !== undefined) queryParams.max_amount = params.max_amount;
        if (params.min_credit_score !== undefined) queryParams.min_credit_score = params.min_credit_score;
        if (params.max_credit_score !== undefined) queryParams.max_credit_score = params.max_credit_score;
      }
      console.log("[APIGateway] listLoanApplications request:", {
        url: "/api/v1/loans/applications",
        params: queryParams,
      });
      
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/applications",
        { params: queryParams }
      );
      
      const responseDataString = response.data ? JSON.stringify(response.data, null, 2) : 'null';
      console.log("[APIGateway] listLoanApplications raw response:", {
        status: response.status,
        hasData: !!response.data,
        dataKeys: response.data ? Object.keys(response.data) : [],
        dataStructure: responseDataString ? responseDataString.substring(0, 1000) : 'null',
      });
      
      const normalized = normalizeApiResponse<any>(response.data);
      
      const normalizedString = normalized ? JSON.stringify(normalized, null, 2) : 'null';
      console.log("[APIGateway] listLoanApplications normalized:", {
        hasNormalized: !!normalized,
        normalizedKeys: normalized ? Object.keys(normalized) : [],
        normalizedStructure: normalizedString ? normalizedString.substring(0, 1000) : 'null',
      });
      
      return normalized;
    } catch (error: any) {
      console.error("[APIGateway] listLoanApplications error:", error);
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to list loan applications",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Validate NBE Compliance (standalone - no application ID required)
   */
  async validateNBEComplianceStandalone(validationData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/compliance/validate`,
        validationData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to validate NBE compliance",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Validate NBE Compliance
   */
  async validateNBECompliance(applicationId: number, validationData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/applications/${applicationId}/validate-nbe`,
        validationData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to validate NBE compliance",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Evaluate Product Rules
   */
  async evaluateProductRules(request: {
    product_type: string;
    application_data: any;
    evaluation_scope?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/product-rules/rules/evaluate`,
        request
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to evaluate product rules",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Evaluate Workflow Rules
   */
  async evaluateWorkflowRules(request: {
    application_data: any;
    product_type: string;
    customer_segment?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/workflow/evaluate`,
        request
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to evaluate workflow rules",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Predict Default Risk
   */
  async predictDefaultRisk(predictionData: {
    customer_id: string;
    loan_amount: number;
    loan_term_months: number;
    monthly_income: number;
    employment_years?: number;
    credit_score?: number;
    age?: number;
    existing_loans?: number;
    total_debt?: number;
    payment_history_score?: number;
  }): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/default-prediction/predict`,
        predictionData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to predict default risk",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Initiate Approval Workflow
   */
  async initiateApprovalWorkflow(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/approval/workflows",
        { loan_application_id: loanApplicationId }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to initiate approval workflow",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Approve Loan Application
   */
  async approveLoanApplication(workflowId: string, decisionData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/approval/${workflowId}/approve`,
        decisionData,
        {
          timeout: 90000, // 90 seconds for approval operations
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      
      // Handle timeout errors specifically
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        throw new APITimeoutError("Approval process timed out - this may be due to complex processing. Please check the approval status and try again if needed.");
      }
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to approve loan application",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Reject Loan Application
   */
  async rejectLoanApplication(workflowId: string, decisionData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/approval/${workflowId}/reject`,
        decisionData,
        {
          timeout: 90000, // 90 seconds for rejection operations
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      
      // Handle timeout errors specifically
      if (error.code === "ECONNABORTED" || error.message.includes("timeout")) {
        throw new APITimeoutError("Rejection process timed out - this may be due to complex processing. Please check the approval status and try again if needed.");
      }
      
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to reject loan application",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Pending Approvals
   */
  async getPendingApprovals(params?: {
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.limit !== undefined) queryParams.limit = params.limit;
        if (params.offset !== undefined) queryParams.offset = params.offset;
      }
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/approval/pending",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get pending approvals",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Add conditional approval requirements
   */
  async addConditionalApproval(workflowId: string, conditions: Array<{
    id?: string;
    type: string;
    value: string;
    description: string;
    met?: boolean;
  }>): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/approval/${workflowId}/conditional-approval`,
        conditions
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to add conditional approval",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Mark condition as met
   */
  async markConditionMet(workflowId: string, conditionId: string): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/approval/${workflowId}/conditions/${conditionId}/met`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to mark condition as met",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Approval Analytics
   */
  async getApprovalAnalytics(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.date_from) queryParams.date_from = params.date_from;
        if (params.date_to) queryParams.date_to = params.date_to;
      }
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/approval/analytics",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get approval analytics",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Export Approval Data
   */
  async exportApprovalData(params: {
    format?: "csv" | "excel" | "json";
    date_from?: string;
    date_to?: string;
    stage?: string;
    status?: string;
  }): Promise<any> {
    try {
      const queryParams: any = { format: params.format || "csv" };
      if (params.date_from) queryParams.date_from = params.date_from;
      if (params.date_to) queryParams.date_to = params.date_to;
      if (params.stage) queryParams.stage = params.stage;
      if (params.status) queryParams.status = params.status;
      
      const response = await this.client.get(
        "/api/v1/loans/approval/export",
        { 
          params: queryParams,
          responseType: params.format === "csv" ? "blob" : "json"
        }
      );
      
      if (params.format === "csv") {
        // Handle CSV download
        const blob = new Blob([response.data], { type: "text/csv" });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `approval_export_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        return { success: true };
      }
      
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to export approval data",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Approval Workflow
   * Fetches approval workflow details
   */
  async getApprovalWorkflowByWorkflowId(workflowId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/approval/workflows/${workflowId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get approval workflow",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Approval History
   * Fetches approval decision history for a workflow
   */
  async getApprovalHistory(workflowId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/approval/${workflowId}/history`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get approval history",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Approve/Reject Applications
   * Process bulk approval operations
   */
  async bulkApproveApplications(bulkData: {
    application_ids: number[];
    decision: "approved" | "rejected";
    decision_reason: string;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/approval/bulk",
        bulkData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to process bulk approval",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Create Disbursement
   */
  async createDisbursement(disbursementData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/disbursements",
        disbursementData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to create disbursement",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Process Disbursement
   */
  async processDisbursement(disbursementId: string): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/disbursements/${disbursementId}/process`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to process disbursement",
        normalizedError.correlationId
      );
    }
  }

  /**
   * List Disbursements
   */
  async listDisbursements(filters?: {
    status?: string;
    payment_method?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (filters?.status) params.append("status", filters.status);
      if (filters?.payment_method) params.append("payment_method", filters.payment_method);
      if (filters?.date_from) params.append("date_from", filters.date_from);
      if (filters?.date_to) params.append("date_to", filters.date_to);
      if (filters?.limit) params.append("limit", filters.limit.toString());
      if (filters?.offset) params.append("offset", filters.offset.toString());

      const queryString = params.toString();
      const url = `/api/v1/loans/disbursements${queryString ? `?${queryString}` : ""}`;

      const response = await this.client.get<ApiResponse<any>>(url);
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to list disbursements",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Disbursement
   */
  async getDisbursement(disbursementId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/disbursements/${disbursementId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get disbursement",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Confirm Disbursement
   */
  async confirmDisbursement(disbursementId: string, confirmationData: {
    confirmation_code?: string;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/disbursements/${disbursementId}/confirm`,
        confirmationData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to confirm disbursement",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Retry Failed Disbursement
   */
  async retryDisbursement(disbursementId: string): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/disbursements/${disbursementId}/retry`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to retry disbursement",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Cancel Disbursement
   */
  async cancelDisbursement(disbursementId: string, reason: string): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/disbursements/${disbursementId}/cancel`,
        { reason }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to cancel disbursement",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Generate Repayment Schedule
   */
  async generateRepaymentSchedule(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/repayments/schedules",
        { loan_application_id: loanApplicationId }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to generate repayment schedule",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Repayment Schedule
   */
  async getRepaymentSchedule(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/repayments/schedules/${loanApplicationId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get repayment schedule",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Modify Repayment Schedule
   */
  async modifyRepaymentSchedule(scheduleId: string, modifications: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/repayments/schedules/${scheduleId}/modify`,
        modifications
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to modify repayment schedule",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Record Payment
   */
  async recordPayment(paymentData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/repayments/payments",
        paymentData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to record payment",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Payment History
   */
  async getPaymentHistory(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/repayments/payments/${loanApplicationId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get payment history",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Initiate Collection Workflow
   */
  async initiateCollectionWorkflow(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/collections/workflows",
        { loan_application_id: loanApplicationId }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to initiate collection workflow",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Record Collection Action
   */
  async recordCollectionAction(actionData: any): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/collections/actions",
        actionData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to record collection action",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Collection Workflow
   */
  async getCollectionWorkflow(collectionId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/collections/workflows/${collectionId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get collection workflow",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Overdue Loans
   */
  async getOverdueLoans(params?: {
    days_overdue_min?: number;
    days_overdue_max?: number;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.days_overdue_min !== undefined) queryParams.days_overdue_min = params.days_overdue_min;
        if (params.days_overdue_max !== undefined) queryParams.days_overdue_max = params.days_overdue_max;
        if (params.limit !== undefined) queryParams.limit = params.limit;
        if (params.offset !== undefined) queryParams.offset = params.offset;
      }
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/overdue/loans",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get overdue loans",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Portfolio Overview
   */
  async getPortfolioOverview(params?: {
    date_from?: string;
    date_to?: string;
    loan_type?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.date_from) queryParams.date_from = params.date_from;
        if (params.date_to) queryParams.date_to = params.date_to;
        if (params.loan_type) queryParams.loan_type = params.loan_type;
      }
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/overview",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get portfolio overview",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Product Performance
   */
  async getProductPerformance(params?: {
    product_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.product_type) queryParams.product_type = params.product_type;
        if (params.date_from) queryParams.date_from = params.date_from;
        if (params.date_to) queryParams.date_to = params.date_to;
      }
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/products",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get product performance",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Generate NBE Compliance Report
   */
  async generateNBEComplianceReport(params: {
    period_start: string;
    period_end: string;
  }): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/nbe-compliance-report",
        { 
          params: {
            period_start: params.period_start,
            period_end: params.period_end,
          }
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to generate NBE compliance report",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Upload Loan Document
   */
  async uploadLoanDocument(
    loanApplicationId: number,
    file: File,
    documentType: string,
    documentName: string,
    hasExpiry?: boolean,
    expiryDate?: string
  ): Promise<any> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("loan_application_id", loanApplicationId.toString());
      formData.append("document_type", documentType);
      formData.append("document_name", documentName);
      formData.append("has_expiry", (hasExpiry || false).toString());
      if (expiryDate) {
        formData.append("expiry_date", expiryDate);
      }

      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/documents/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to upload document",
        normalizedError.correlationId
      );
    }
  }

  /**
   * List Loan Documents
   */
  async listLoanDocuments(
    loanApplicationId: number,
    documentType?: string
  ): Promise<any> {
    try {
      const queryParams: any = {};
      if (documentType) queryParams.document_type = documentType;
      
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/documents/${loanApplicationId}`,
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to list loan documents",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Document
   */
  async getDocument(documentId: string): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/documents/${documentId}`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get document",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Verify Document
   */
  async verifyDocument(documentId: string, verificationNotes: string): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/documents/${documentId}/verify`,
        { verification_notes: verificationNotes }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to verify document",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Document Expiry Alerts
   */
  async getDocumentExpiryAlerts(loanApplicationId?: number): Promise<any> {
    try {
      const queryParams: any = {};
      if (loanApplicationId) queryParams.loan_application_id = loanApplicationId;
      
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/documents/expiry/alerts",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get document expiry alerts",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Calculate Penalties for Overdue Loan
   */
  async calculatePenalties(
    loanApplicationId: number,
    daysOverdue: number,
    overdueAmount: number
  ): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/overdue/penalties/${loanApplicationId}`,
        {
          params: {
            days_overdue: daysOverdue,
            overdue_amount: overdueAmount,
          }
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to calculate penalties",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Collection Effectiveness
   */
  async getCollectionEffectiveness(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params) {
        if (params.date_from) queryParams.date_from = params.date_from;
        if (params.date_to) queryParams.date_to = params.date_to;
      }
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/collections/effectiveness",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get collection effectiveness",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Collection Workload
   */
  async getCollectionWorkload(assignedTo?: string): Promise<any> {
    try {
      const queryParams: any = {};
      if (assignedTo) queryParams.assigned_to = assignedTo;
      
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/collections/workload",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get collection workload",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Bulk Loan Application Operations
   */
  async bulkLoanOperations(
    operation: "create" | "update" | "validate",
    applications: any[]
  ): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/applications/bulk",
        {
          operation,
          applications,
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to process bulk operations",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Update Loan Application Status
   */
  async updateLoanApplicationStatus(
    applicationId: number,
    newStatus: string,
    reason?: string
  ): Promise<any> {
    try {
      const response = await this.client.put<ApiResponse<any>>(
        `/api/v1/loans/applications/${applicationId}/status`,
        {
          new_status: newStatus,
          reason: reason,
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to update loan application status",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Approval Workflow for Loan Application
   */
  async getApprovalWorkflowByLoanApplicationId(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/applications/${loanApplicationId}/approval-workflow`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get approval workflow",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Disbursements for Loan Application
   */
  async getLoanDisbursements(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/applications/${loanApplicationId}/disbursements`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get disbursements",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Repayment Schedule for Loan Application
   */
  async getLoanRepaymentSchedule(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/applications/${loanApplicationId}/repayment-schedule`
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get repayment schedule",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Credit Score History for Loan Application
   */
  async getCreditScoreHistory(loanApplicationId: number, limit: number = 50): Promise<any> {
    try {
      const response = await this.client.get<ApiResponse<any>>(
        `/api/v1/loans/applications/${loanApplicationId}/credit-score-history`,
        {
          params: { limit },
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get credit score history",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Real-time KPIs
   */
  async getRealTimeKpis(params?: {
    date_from?: string;
    date_to?: string;
    loan_type?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;
      if (params?.loan_type) queryParams.loan_type = params.loan_type;

      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/kpis",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get real-time KPIs",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Enhanced PAR Analysis
   */
  async getEnhancedParAnalysis(params?: {
    date_from?: string;
    date_to?: string;
    loan_type?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;
      if (params?.loan_type) queryParams.loan_type = params.loan_type;

      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/par-analysis",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get PAR analysis",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Product Comparison Analytics
   */
  async getProductComparisonAnalytics(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;

      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/product-comparison",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get product comparison analytics",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Compliance Violations Tracking
   */
  async getComplianceViolationsTracking(params?: {
    date_from?: string;
    date_to?: string;
    violation_type?: string;
    severity?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;
      if (params?.violation_type) queryParams.violation_type = params.violation_type;
      if (params?.severity) queryParams.severity = params.severity;

      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/compliance-violations",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get compliance violations tracking",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Executive Dashboard Metrics
   */
  async getExecutiveDashboardMetrics(params?: {
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.date_from) queryParams.date_from = params.date_from;
      if (params?.date_to) queryParams.date_to = params.date_to;

      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/executive-dashboard",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get executive dashboard metrics",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Portfolio Trend Analysis
   */
  async getPortfolioTrendAnalysis(params?: {
    period_months?: number;
    loan_type?: string;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (params?.period_months) queryParams.period_months = params.period_months;
      if (params?.loan_type) queryParams.loan_type = params.loan_type;

      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/portfolio/trend-analysis",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get portfolio trend analysis",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Export Regulatory Data
   */
  async exportRegulatoryData(exportRequest: {
    format: string;
    date_from: string;
    date_to: string;
    data_type?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/portfolio/export-regulatory-data",
        exportRequest
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to export regulatory data",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Repayments with filters
   */
  async getRepayments(filters?: {
    status?: string;
    loan_application_id?: number;
    date_from?: string;
    date_to?: string;
    overdue_only?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (filters) {
        if (filters.status) queryParams.status = filters.status;
        if (filters.loan_application_id) queryParams.loan_application_id = filters.loan_application_id;
        if (filters.date_from) queryParams.date_from = filters.date_from;
        if (filters.date_to) queryParams.date_to = filters.date_to;
        if (filters.overdue_only !== undefined) queryParams.overdue_only = filters.overdue_only;
        if (filters.limit !== undefined) queryParams.limit = filters.limit;
        if (filters.offset !== undefined) queryParams.offset = filters.offset;
      }
      
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/repayments",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get repayments",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Generate Payment Reminder
   */
  async generatePaymentReminder(loanApplicationId: number): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/repayments/reminders",
        { loan_application_id: loanApplicationId }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to generate payment reminder",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Calculate Late Fees
   */
  async calculateLateFees(loanApplicationId: number, daysOverdue: number): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        "/api/v1/loans/repayments/late-fees",
        { 
          loan_application_id: loanApplicationId,
          days_overdue: daysOverdue
        }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to calculate late fees",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Get Collections with filters
   */
  async getCollections(filters?: {
    status?: string;
    stage?: string;
    loan_application_id?: number;
    assigned_collector?: string;
    date_from?: string;
    date_to?: string;
    limit?: number;
    offset?: number;
  }): Promise<any> {
    try {
      const queryParams: any = {};
      if (filters) {
        if (filters.status) queryParams.status = filters.status;
        if (filters.stage) queryParams.stage = filters.stage;
        if (filters.loan_application_id) queryParams.loan_application_id = filters.loan_application_id;
        if (filters.assigned_collector) queryParams.assigned_collector = filters.assigned_collector;
        if (filters.date_from) queryParams.date_from = filters.date_from;
        if (filters.date_to) queryParams.date_to = filters.date_to;
        if (filters.limit !== undefined) queryParams.limit = filters.limit;
        if (filters.offset !== undefined) queryParams.offset = filters.offset;
      }
      
      const response = await this.client.get<ApiResponse<any>>(
        "/api/v1/loans/collections",
        { params: queryParams }
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to get collections",
        normalizedError.correlationId
      );
    }
  }

  /**
   * Escalate Collection
   */
  async escalateCollection(collectionId: string, escalationData: {
    new_stage: string;
    reason: string;
    assigned_collector?: string;
    notes?: string;
  }): Promise<any> {
    try {
      const response = await this.client.post<ApiResponse<any>>(
        `/api/v1/loans/collections/${collectionId}/escalate`,
        escalationData
      );
      return normalizeApiResponse<any>(response.data);
    } catch (error: any) {
      if (error instanceof APIServiceError || error instanceof APITimeoutError || error instanceof APINetworkError) {
        throw error;
      }
      const normalizedError = normalizeErrorResponse(error);
      throw new APIServiceError(
        normalizedError.statusCode,
        normalizedError.message || "Failed to escalate collection",
        normalizedError.correlationId
      );
    }
  }

// Export singleton instance
}

export const apiGatewayClient = new APIGatewayClient();

// Export error classes for convenience
export { APIServiceError, APITimeoutError, APINetworkError } from "@/types/api";
