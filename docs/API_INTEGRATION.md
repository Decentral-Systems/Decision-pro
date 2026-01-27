# API Integration Guide

**Date:** January 2025  
**Purpose:** Complete guide for integrating with the AIS Backend API Gateway

---

## Overview

This guide provides comprehensive information for integrating frontend applications with the AIS backend microservices through the API Gateway.

---

## Base URLs

### API Gateway
- **Development:** `http://196.188.249.48:4000`
- **Production:** `http://196.188.249.48:4000` (configure as needed)

### Credit Scoring Service
- **Direct Access:** `http://196.188.249.48:4001` (via API Gateway recommended)

### Default Prediction Service
- **Direct Access:** `http://196.188.249.48:4002` (via API Gateway recommended)

---

## Authentication

### Authentication Flow

1. **Login:**
   ```http
   POST /auth/login
   Content-Type: application/json
   
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

2. **Response:**
   ```json
   {
     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "token_type": "bearer",
     "expires_in": 3600
   }
   ```

3. **Use Token:**
   ```http
   GET /api/analytics
   Authorization: Bearer <access_token>
   ```

4. **Refresh Token:**
   ```http
   POST /auth/refresh
   Content-Type: application/json
   
   {
     "refresh_token": "<refresh_token>"
   }
   ```

### Token Management

- **Access Token:** Valid for 1 hour
- **Refresh Token:** Valid for 7 days
- **Token Refresh:** Automatic retry on 401 responses
- **Token Storage:** Store securely (httpOnly cookies recommended)

---

## Endpoint Categories

### 1. Authentication Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/auth/login` | POST | No | User login |
| `/auth/refresh` | POST | No | Refresh access token |
| `/auth/logout` | POST | Yes | User logout |

### 2. Dashboard & Analytics

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/analytics?type=dashboard` | GET | Yes | Dashboard analytics |
| `/api/v1/analytics/models/performance` | GET | Yes | Model performance metrics |
| `/api/v1/analytics/models/comparison` | GET | Yes | Model comparison data |
| `/api/intelligence/recommendations/statistics` | GET | Yes | Recommendation statistics |
| `/api/customers/stats/overview` | GET | Yes | Customer statistics overview |

### 3. Customer Management

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/customers/` | GET | Yes | List customers (paginated) |
| `/api/customers/{id}` | GET | Yes | Get customer details |
| `/api/customers` | POST | Yes | Create customer |
| `/api/customers/{id}` | PUT | Yes | Update customer |
| `/api/intelligence/customer360/{id}` | GET | Yes | Customer 360 view |

### 4. Credit Scoring

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/scoring/realtime` | GET | Yes | Recent realtime scoring feed |
| `/api/intelligence/credit-scoring/realtime` | POST | Yes | Real-time credit scoring |
| `/api/v1/credit-scoring/batch` | POST | Yes | Batch credit scoring |

### 5. Product Recommendations

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/intelligence/products/recommendations` | GET | Yes | Get product recommendations |
| `/api/intelligence/products/recommendations` | POST | Yes | Get personalized recommendations |

### 6. Admin Endpoints

| Endpoint | Method | Auth Required | Description |
|----------|--------|---------------|-------------|
| `/api/v1/admin/users` | GET | Yes (Admin) | List users |
| `/api/v1/admin/users/{id}` | GET | Yes (Admin) | Get user details |
| `/api/v1/admin/users/{id}/activity` | GET | Yes (Admin) | Get user activity log |
| `/api/v1/audit/logs` | GET | Yes (Admin/Auditor) | Get audit logs |

---

## Request/Response Formats

### Standard Request Headers

```http
Content-Type: application/json
Authorization: Bearer <access_token>
X-Correlation-ID: <optional_correlation_id>
```

### Standard Success Response

```json
{
  "success": true,
  "data": { ... },
  "total": 100,
  "page": 1,
  "page_size": 20,
  "has_more": true
}
```

### Standard Error Response

```json
{
  "error_code": "VALIDATION_ERROR",
  "message": "Invalid input data",
  "details": {
    "field": "email",
    "error": "Invalid email format"
  },
  "correlation_id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2025-01-15T10:30:00Z",
  "service": "api_gateway",
  "status_code": 422
}
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid request data |
| 401 | Unauthorized | Authentication required or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 405 | Method Not Allowed | HTTP method not supported |
| 422 | Unprocessable Entity | Validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 502 | Bad Gateway | Backend service error |
| 503 | Service Unavailable | Service temporarily unavailable |
| 504 | Gateway Timeout | Backend service timeout |

### Error Code Values

| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| `VALIDATION_ERROR` | 422 | Request validation failed |
| `AUTHENTICATION_REQUIRED` | 401 | Authentication required |
| `INVALID_TOKEN` | 401 | Token invalid or expired |
| `INSUFFICIENT_PERMISSIONS` | 403 | User lacks required permissions |
| `RESOURCE_NOT_FOUND` | 404 | Requested resource not found |
| `METHOD_NOT_ALLOWED` | 405 | HTTP method not supported |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `SERVICE_UNAVAILABLE` | 503 | Backend service unavailable |
| `INTERNAL_SERVER_ERROR` | 500 | Internal server error |

---

## Pagination

### Pagination Parameters

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 20, max: 100)
- `limit`: Alternative to page_size (for offset-based pagination)
- `offset`: Number of items to skip (for offset-based pagination)

### Pagination Response

```json
{
  "data": [ ... ],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5,
  "has_more": true
}
```

---

## Rate Limiting

### Rate Limits

- **Default:** 100 requests per hour per IP/user
- **Authentication:** 10 login attempts per 15 minutes
- **Admin Endpoints:** 50 requests per hour

### Rate Limit Headers

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642233600
```

### Rate Limit Exceeded Response

```json
{
  "error_code": "RATE_LIMIT_EXCEEDED",
  "message": "Rate limit exceeded",
  "retry_after": 3600
}
```

---

## CORS Configuration

### Allowed Origins

- Frontend applications from configured origins
- Development: `http://localhost:3000`, `http://localhost:3001`
- Production: Configure as needed

### CORS Headers

```http
Access-Control-Allow-Origin: <origin>
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Correlation-ID
Access-Control-Allow-Credentials: true
```

---

## Best Practices

### 1. Error Handling

- Always check response status codes
- Handle 401 errors with automatic token refresh
- Implement retry logic for transient errors (502, 503, 504)
- Log errors with correlation IDs for debugging

### 2. Authentication

- Store tokens securely (httpOnly cookies recommended)
- Implement automatic token refresh before expiration
- Handle token expiration gracefully
- Clear tokens on logout

### 3. Performance

- Use pagination for large datasets
- Implement request caching where appropriate
- Batch requests when possible
- Monitor response times

### 4. Security

- Never expose tokens in logs or URLs
- Use HTTPS in production
- Validate all input data
- Implement proper error messages (don't expose sensitive info)

### 5. Monitoring

- Include correlation IDs in requests
- Log all API calls
- Monitor error rates
- Track response times

---

## Example Integration

### TypeScript/JavaScript Example

```typescript
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://196.188.249.48:4000';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken,
          });
          localStorage.setItem('access_token', data.access_token);
          // Retry original request
          error.config.headers.Authorization = `Bearer ${data.access_token}`;
          return apiClient.request(error.config);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// Example API call
export async function getDashboardAnalytics() {
  const { data } = await apiClient.get('/api/analytics', {
    params: { type: 'dashboard' },
  });
  return data;
}
```

---

## Testing

### Test Scripts

Test scripts are available in `/scripts/` directory:

- `test-auth-flow.sh` - Authentication flow testing
- `test-core-endpoints.sh` - Core endpoints testing
- `test-error-handling.sh` - Error handling testing
- `test-user-workflows.sh` - User workflow testing
- `test-performance.sh` - Performance testing

### Running Tests

```bash
cd /home/AIS/decision-pro-admin
./scripts/test-auth-flow.sh
./scripts/test-core-endpoints.sh
```

---

## Support & Documentation

### Additional Resources

- **Endpoint Mapping:** See `docs/ENDPOINT_MAPPING.md`
- **Testing Procedures:** See `docs/TESTING_PROCEDURES.md`
- **Data Flow:** See `docs/DATA_FLOW_VERIFICATION.md`
- **Troubleshooting:** See `docs/TROUBLESHOOTING_GUIDE.md`

### Contact

For API support or questions, contact the development team.

---

**Last Updated:** January 2025  
**Version:** 1.0

