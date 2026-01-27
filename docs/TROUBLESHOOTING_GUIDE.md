# Decision PRO - Troubleshooting Guide

This guide helps you diagnose and resolve common issues with the Decision PRO admin dashboard.

## Table of Contents

1. [Authentication Issues](#authentication-issues)
2. [API Connection Problems](#api-connection-problems)
3. [Data Loading Issues](#data-loading-issues)
4. [Performance Problems](#performance-problems)
5. [Build and Deployment Issues](#build-and-deployment-issues)
6. [Browser-Specific Issues](#browser-specific-issues)
7. [WebSocket Connection Issues](#websocket-connection-issues)

---

## Authentication Issues

### Problem: 401 Unauthorized Errors

**Symptoms:**
- API requests return 401 status code
- User gets logged out unexpectedly
- "Authentication required" errors in console

**Solutions:**

1. **Check Token Expiration**
   ```bash
   # Check browser console for token expiration messages
   # Token should refresh automatically, but verify NextAuth config
   ```

2. **Verify Environment Variables**
   ```env
   NEXTAUTH_URL=http://196.188.249.48:4009
   NEXTAUTH_SECRET=your-secret-key-here
   ```

3. **Clear Browser Cache and Cookies**
   - Clear all cookies for the application domain
   - Clear browser cache
   - Restart browser

4. **Check API Gateway Authentication**
   - Verify API Gateway is running: `curl http://196.188.249.48:4000/health`
   - Check if authentication endpoint is accessible
   - Verify credentials are correct

5. **Token Refresh Issues**
   - Check browser console for refresh token errors
   - Verify `refreshToken` is stored in session
   - Check `lib/auth/config.ts` for refresh logic

### Problem: Login Page Not Loading

**Symptoms:**
- Login page shows blank or error
- Redirect loops
- "NextAuth configuration error"

**Solutions:**

1. **Check NextAuth Configuration**
   ```typescript
   // Verify lib/auth/config.ts has correct providers
   // Check NEXTAUTH_SECRET is set
   ```

2. **Verify API Gateway is Running**
   ```bash
   curl http://196.188.249.48:4000/health
   ```

3. **Check Environment Variables**
   ```bash
   # Ensure all required env vars are set
   cat .env.local | grep NEXTAUTH
   ```

---

## API Connection Problems

### Problem: API Requests Failing with Network Errors

**Symptoms:**
- "Network error" messages
- Requests timing out
- CORS errors in console

**Solutions:**

1. **Verify API Gateway is Running**
   ```bash
   # Check if API Gateway is accessible
   curl http://196.188.249.48:4000/health
   
   # Check if service is running
   docker ps | grep api-gateway
   ```

2. **Check Environment Variables**
   ```env
   NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
   NEXT_PUBLIC_CREDIT_SCORING_SERVICE_URL=http://196.188.249.48:4001
   ```

3. **Verify Network Connectivity**
   ```bash
   # Test connectivity to API Gateway
   ping 196.188.249.48
   
   # Test HTTP connectivity
   curl -v http://196.188.249.48:4000/health
   ```

4. **Check CORS Configuration**
   - Verify API Gateway CORS settings allow your origin
   - Check browser console for CORS error details
   - Ensure `NEXTAUTH_URL` matches your actual domain

### Problem: 404 Not Found Errors

**Symptoms:**
- API endpoints return 404
- "Endpoint not found" errors
- Data not loading

**Solutions:**

1. **Verify Endpoint URLs**
   ```typescript
   // Check lib/config/apiEndpoints.ts for correct endpoints
   // Verify endpoints match API Gateway routes
   ```

2. **Check API Gateway Routes**
   ```bash
   # Check API Gateway documentation
   curl http://196.188.249.48:4000/docs
   ```

3. **Verify Service is Running**
   ```bash
   # Check if required services are running
   docker ps | grep -E "(api-gateway|credit-scoring)"
   ```

### Problem: API Timeout Errors

**Symptoms:**
- Requests timing out
- "Request timeout" errors
- Slow API responses

**Solutions:**

1. **Increase Timeout Values**
   ```typescript
   // In lib/api/clients/api-gateway.ts
   timeout: 30000, // Increase from default
   ```

2. **Check Service Health**
   ```bash
   # Check service response times
   curl -w "@curl-format.txt" http://196.188.249.48:4000/health
   ```

3. **Verify Network Latency**
   ```bash
   # Test network speed
   ping -c 10 196.188.249.48
   ```

---

## Data Loading Issues

### Problem: Dashboard Not Loading Data

**Symptoms:**
- Dashboard shows loading spinner indefinitely
- Empty data displays
- "Failed to load" errors

**Solutions:**

1. **Check API Endpoints**
   ```bash
   # Verify dashboard endpoint exists
   curl -H "Authorization: Bearer <token>" \
     http://196.188.249.48:4000/api/analytics?type=dashboard
   ```

2. **Check Browser Console**
   - Look for API errors in Network tab
   - Check for CORS or authentication errors
   - Verify request/response format

3. **Verify Fallback Data**
   ```typescript
   // Check if fallback data is being used
   // In development mode, fallback data should be available
   console.log('Using fallback data:', process.env.NODE_ENV === 'development')
   ```

4. **Check React Query Cache**
   ```typescript
   // Clear React Query cache if needed
   queryClient.clear()
   ```

### Problem: Customer 360 Page Not Loading

**Symptoms:**
- "No customer data available" message
- 401 or 404 errors
- Customer ID not found

**Solutions:**

1. **Verify Customer ID**
   ```typescript
   // Check if customer ID is correctly decoded from URL
   const customerId = decodeURIComponent(params.id)
   ```

2. **Check API Endpoint**
   ```bash
   # Test customer 360 endpoint
   curl -H "Authorization: Bearer <token>" \
     http://196.188.249.48:4000/api/customers/{customerId}
   ```

3. **Verify Authentication Token**
   - Check if token is included in request headers
   - Verify token hasn't expired
   - Check token sync in `useAuthReady` hook

4. **Check URL Encoding**
   ```typescript
   // Ensure customer ID is properly encoded/decoded
   const encodedId = encodeURIComponent(customerId)
   const decodedId = decodeURIComponent(encodedId)
   ```

### Problem: Forms Not Submitting

**Symptoms:**
- Form submission does nothing
- Validation errors not showing
- API request not sent

**Solutions:**

1. **Check Form Validation**
   ```typescript
   // Verify Zod schema matches form fields
   // Check validation errors in browser console
   ```

2. **Check Network Tab**
   - Verify request is being sent
   - Check request payload format
   - Verify Content-Type headers

3. **Check Error Handling**
   ```typescript
   // Ensure error handlers are catching errors
   // Check onError callbacks in form handlers
   ```

---

## Performance Problems

### Problem: Slow Page Loads

**Symptoms:**
- Pages take long time to load
- Slow initial render
- Laggy interactions

**Solutions:**

1. **Check Bundle Size**
   ```bash
   # Analyze bundle size
   npm run build
   # Check .next/analyze for bundle breakdown
   ```

2. **Verify Code Splitting**
   ```typescript
   // Ensure dynamic imports are used for heavy components
   const Component = dynamic(() => import('./Component'), {
     ssr: false,
     loading: () => <Skeleton />
   })
   ```

3. **Check React Query Configuration**
   ```typescript
   // Verify staleTime and gcTime are set appropriately
   staleTime: 5 * 60 * 1000, // 5 minutes
   gcTime: 10 * 60 * 1000, // 10 minutes
   ```

4. **Check Network Requests**
   - Reduce number of simultaneous API calls
   - Implement request batching
   - Use React Query's parallel queries

### Problem: Memory Leaks

**Symptoms:**
- Browser becomes slow over time
- High memory usage
- Page crashes after extended use

**Solutions:**

1. **Check Event Listeners**
   ```typescript
   // Ensure event listeners are cleaned up
   useEffect(() => {
     const handler = () => {}
     window.addEventListener('event', handler)
     return () => window.removeEventListener('event', handler)
   }, [])
   ```

2. **Check WebSocket Connections**
   ```typescript
   // Ensure WebSocket connections are closed
   useEffect(() => {
     const ws = new WebSocket(url)
     return () => ws.close()
   }, [])
   ```

3. **Check React Query Cache**
   ```typescript
   // Clear old cache entries
   queryClient.removeQueries({ stale: true })
   ```

---

## Build and Deployment Issues

### Problem: Build Fails with TypeScript Errors

**Symptoms:**
- `npm run build` fails
- TypeScript compilation errors
- Type mismatches

**Solutions:**

1. **Check TypeScript Configuration**
   ```json
   // Verify tsconfig.json settings
   {
     "strict": true,
     "noUnusedLocals": true,
     "noUnusedParameters": true
   }
   ```

2. **Fix Type Errors**
   ```typescript
   // Add type assertions where needed
   const data = response.data as ExpectedType
   
   // Use proper type guards
   if (isValidType(data)) {
     // use data
   }
   ```

3. **Check Import Paths**
   ```typescript
   // Verify @/ aliases are working
   // Check tsconfig.json paths configuration
   ```

### Problem: Build Fails with Webpack Errors

**Symptoms:**
- Webpack compilation errors
- Module not found errors
- Dependency resolution issues

**Solutions:**

1. **Clear Build Cache**
   ```bash
   rm -rf .next
   rm -rf node_modules/.cache
   npm run build
   ```

2. **Reinstall Dependencies**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Check Next.js Version**
   ```bash
   # Verify Next.js version compatibility
   npm list next
   ```

### Problem: Production Build Issues

**Symptoms:**
- Build succeeds but app doesn't work in production
- Environment variables not loading
- Static generation errors

**Solutions:**

1. **Check Environment Variables**
   ```bash
   # Verify all NEXT_PUBLIC_* variables are set
   # Check .env.production file
   ```

2. **Verify Static Generation**
   ```typescript
   // Check for dynamic routes that need static generation
   // Use getStaticPaths for dynamic routes
   ```

3. **Check API Routes**
   ```typescript
   // Verify API routes are properly configured
   // Check middleware configuration
   ```

---

## Browser-Specific Issues

### Problem: Safari Compatibility Issues

**Symptoms:**
- Features not working in Safari
- Layout issues
- JavaScript errors

**Solutions:**

1. **Check Browser Support**
   - Verify Safari version (minimum Safari 14+)
   - Check for unsupported features
   - Use polyfills if needed

2. **Check CSS Compatibility**
   ```css
   /* Use vendor prefixes for Safari */
   -webkit-appearance: none;
   ```

### Problem: Chrome DevTools Errors

**Symptoms:**
- Console errors
- Network request failures
- React DevTools not working

**Solutions:**

1. **Clear Browser Data**
   - Clear cache and cookies
   - Disable extensions temporarily
   - Use incognito mode

2. **Check React DevTools**
   ```bash
   # Verify React DevTools extension is installed
   # Check for version compatibility
   ```

---

## WebSocket Connection Issues

### Problem: WebSocket Not Connecting

**Symptoms:**
- Real-time updates not working
- "WebSocket connection failed" errors
- Connection drops frequently

**Solutions:**

1. **Verify WebSocket URL**
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=ws://196.188.249.48:4000/ws
   # For production: wss://api.yourdomain.com/ws
   ```

2. **Check WebSocket Server**
   ```bash
   # Verify WebSocket server is running
   # Check API Gateway WebSocket configuration
   ```

3. **Check Firewall/Proxy**
   - Verify WebSocket connections aren't blocked
   - Check proxy configuration
   - Verify SSL/TLS for WSS connections

4. **Check Reconnection Logic**
   ```typescript
   // Verify WebSocketClient reconnection is working
   // Check exponential backoff configuration
   ```

### Problem: WebSocket Messages Not Received

**Symptoms:**
- WebSocket connected but no messages
- Real-time updates not appearing
- Message queue not processing

**Solutions:**

1. **Check Message Format**
   ```typescript
   // Verify message format matches expected structure
   // Check event types and payload format
   ```

2. **Check Subscriptions**
   ```typescript
   // Verify WebSocket subscriptions are active
   // Check channel names match server
   ```

3. **Check Message Handlers**
   ```typescript
   // Verify event handlers are registered
   // Check useWebSocket hook configuration
   ```

---

## Common Error Messages and Solutions

### "Request failed with status code 401"
- **Cause:** Authentication token expired or invalid
- **Solution:** Check token refresh mechanism, verify NextAuth configuration

### "Request failed with status code 404"
- **Cause:** API endpoint doesn't exist or URL is incorrect
- **Solution:** Verify endpoint URL in `apiEndpoints.ts`, check API Gateway routes

### "Request failed with status code 500"
- **Cause:** Server-side error in API Gateway or backend service
- **Solution:** Check API Gateway logs, verify backend services are running

### "Network Error"
- **Cause:** Cannot reach API Gateway or network connectivity issue
- **Solution:** Verify API Gateway is running, check network connectivity, verify firewall rules

### "Token refresh failed"
- **Cause:** Refresh token expired or invalid
- **Solution:** User needs to log in again, check refresh token endpoint

### "Customer data not found"
- **Cause:** Customer ID doesn't exist or user doesn't have permission
- **Solution:** Verify customer ID, check user permissions, verify API endpoint

---

## Getting Help

If you're unable to resolve an issue:

1. **Check Logs**
   - Browser console (F12)
   - Network tab for API requests
   - Server logs (if accessible)

2. **Collect Information**
   - Browser version and OS
   - Error messages and stack traces
   - Steps to reproduce
   - Network request/response details

3. **Contact Support**
   - Provide error details
   - Include relevant logs
   - Describe steps to reproduce

---

## Prevention Tips

1. **Keep Dependencies Updated**
   ```bash
   npm outdated
   npm update
   ```

2. **Monitor Performance**
   - Use React DevTools Profiler
   - Monitor API response times
   - Check bundle sizes regularly

3. **Test Regularly**
   - Run tests before deployment
   - Test in multiple browsers
   - Verify API integrations

4. **Monitor Errors**
   - Set up error tracking (e.g., Sentry)
   - Monitor API error rates
   - Track user-reported issues

---

**Last Updated:** December 2024



