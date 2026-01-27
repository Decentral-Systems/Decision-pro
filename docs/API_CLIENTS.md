# API Clients Documentation

This document describes the API client implementations used in the Decision Pro admin dashboard.

## Table of Contents

- [API Gateway Client](#api-gateway-client)
- [Credit Scoring Client](#credit-scoring-client)
- [Error Handling](#error-handling)
- [Response Normalization](#response-normalization)

## API Gateway Client

**Location:** `lib/api/clients/api-gateway.ts`

The API Gateway client handles all requests routed through the API Gateway service.

### Initialization

```typescript
import { apiGatewayClient } from '@/lib/api/clients/api-gateway';

// Set access token (automatically done by useAuthReady hook)
apiGatewayClient.setAccessToken('your-access-token');
```

### Methods

#### `get<T>(url, params?)`

Performs a GET request.

```typescript
const data = await apiGatewayClient.get<Customer>('/api/customers/123');
```

#### `post<T>(url, data?)`

Performs a POST request.

```typescript
const newUser = await apiGatewayClient.post<User>('/api/admin/users', {
  username: 'john',
  email: 'john@example.com',
});
```

#### `put<T>(url, data?)`

Performs a PUT request.

```typescript
const updatedUser = await apiGatewayClient.put<User>('/api/admin/users/123', {
  email: 'newemail@example.com',
});
```

#### `delete(url)`

Performs a DELETE request.

```typescript
await apiGatewayClient.delete('/api/admin/users/123');
```

### Customer Methods

#### `getCustomers(params?)`

Fetches a list of customers with pagination and filtering.

```typescript
const customers = await apiGatewayClient.getCustomers({
  page: 1,
  page_size: 20,
  search: 'john',
});
```

#### `getCustomer360(customerId)`

Fetches comprehensive customer 360 data.

```typescript
const customer360 = await apiGatewayClient.getCustomer360('CUST123');
```

### Analytics Methods

#### `getAnalyticsData(params?)`

Fetches general analytics data.

```typescript
const analytics = await apiGatewayClient.getAnalyticsData({
  type: 'dashboard',
  time_range: '30d',
});
```

#### `getPortfolioMetrics()`

Fetches portfolio metrics.

```typescript
const metrics = await apiGatewayClient.getPortfolioMetrics();
```

#### `getRiskDistribution()`

Fetches risk distribution data.

```typescript
const distribution = await apiGatewayClient.getRiskDistribution();
```

#### `getApprovalRates()`

Fetches approval rates data.

```typescript
const rates = await apiGatewayClient.getApprovalRates();
```

#### `getRevenueTrend()`

Fetches revenue trend data.

```typescript
const trend = await apiGatewayClient.getRevenueTrend();
```

### Settings Methods

#### `getSettings()`

Fetches system settings.

```typescript
const settings = await apiGatewayClient.getSettings();
```

#### `updateSettings(settings)`

Updates system settings.

```typescript
const updated = await apiGatewayClient.updateSettings({
  system: {
    notification_email: 'admin@example.com',
  },
});
```

#### `resetSettings()`

Resets settings to defaults.

```typescript
const defaults = await apiGatewayClient.resetSettings();
```

## Credit Scoring Client

**Location:** `lib/api/clients/credit-scoring.ts`

The Credit Scoring client handles requests to the Credit Scoring Service.

### Methods

#### `submitCreditScore(request)`

Submits a credit scoring request with 168 features.

```typescript
const response = await creditScoringClient.submitCreditScore({
  customer_profile: { /* ... */ },
  financial_information: { /* ... */ },
  // ... 168 features
});
```

#### `submitBatchCreditScore(batchRequest)`

Submits a batch credit scoring request.

```typescript
const response = await creditScoringClient.submitBatchCreditScore({
  items: [
    { /* customer 1 data */ },
    { /* customer 2 data */ },
  ],
});
```

#### `submitBatchCreditScoreFromFile(file)`

Processes a CSV file and submits batch credit scoring.

```typescript
const file = new File([csvContent], 'customers.csv', { type: 'text/csv' });
const response = await creditScoringClient.submitBatchCreditScoreFromFile(file);
```

## Error Handling

The API clients use custom error classes for consistent error handling:

### `APIServiceError`

Thrown for HTTP errors (4xx, 5xx).

```typescript
try {
  await apiGatewayClient.get('/api/customers/123');
} catch (error) {
  if (error instanceof APIServiceError) {
    console.error(`Status: ${error.statusCode}`);
    console.error(`Message: ${error.message}`);
    console.error(`Correlation ID: ${error.correlationId}`);
  }
}
```

### `APITimeoutError`

Thrown when a request times out.

```typescript
try {
  await apiGatewayClient.get('/api/customers/123');
} catch (error) {
  if (error instanceof APITimeoutError) {
    console.error('Request timed out');
  }
}
```

### `APINetworkError`

Thrown for network errors (no response from server).

```typescript
try {
  await apiGatewayClient.get('/api/customers/123');
} catch (error) {
  if (error instanceof APINetworkError) {
    console.error('Network error - server unreachable');
  }
}
```

## Response Normalization

All API responses are normalized using the `normalizeApiResponse` utility to handle different response structures:

1. **Direct data**: `{ id: '123', name: 'Test' }`
2. **Wrapped with success**: `{ success: true, data: { id: '123' } }`
3. **Wrapped without success**: `{ data: { id: '123' } }`

The normalizer ensures consistent data structures regardless of API response format.

## Token Management

Access tokens are automatically included in all requests via Axios interceptors. The token is set using:

```typescript
apiGatewayClient.setAccessToken('your-access-token');
```

This is typically handled automatically by the `useAuthReady` hook which syncs the NextAuth session token to the API clients.

## Retry Logic

API clients implement automatic retry logic for transient errors:

- **401/404 errors**: No retry (returns null to allow fallback UI)
- **Network errors**: Retries up to 2 times with exponential backoff
- **Timeout errors**: Retries up to 2 times
- **5xx errors**: Retries up to 2 times

## Request Interceptors

The API Gateway client includes request interceptors that:

1. Add Authorization header with access token
2. Add correlation ID for request tracing
3. Add Content-Type header for POST/PUT requests

## Response Interceptors

Response interceptors:

1. Normalize response data structure
2. Extract correlation IDs from responses
3. Handle error responses consistently



