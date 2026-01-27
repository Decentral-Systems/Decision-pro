# API Hooks Documentation

This document provides comprehensive documentation for all API hooks used in the Decision Pro admin dashboard.

## Table of Contents

- [Authentication Hooks](#authentication-hooks)
- [Customer Hooks](#customer-hooks)
- [Credit Scoring Hooks](#credit-scoring-hooks)
- [Dashboard Hooks](#dashboard-hooks)
- [Analytics Hooks](#analytics-hooks)
- [Admin Hooks](#admin-hooks)
- [Error Handling](#error-handling)

## Authentication Hooks

### `useAuthReady()`

Provides authentication state and ensures API clients have the access token.

**Location:** `lib/api/hooks/useAuth.ts`

**Returns:**
```typescript
{
  isAuthenticated: boolean;
  session: Session | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  tokenSynced: boolean;
}
```

**Usage:**
```typescript
import { useAuthReady } from '@/lib/api/hooks/useAuth';

function MyComponent() {
  const { isAuthenticated, tokenSynced } = useAuthReady();
  
  if (!isAuthenticated || !tokenSynced) {
    return <div>Loading...</div>;
  }
  
  return <div>Authenticated content</div>;
}
```

**Notes:**
- The hook automatically syncs the access token to API clients
- Use `tokenSynced` to ensure queries don't run before the token is available
- Prevents race conditions in data fetching

## Customer Hooks

### `useCustomersList(params?)`

Fetches a paginated list of customers.

**Location:** `lib/api/hooks/useCustomers.ts`

**Parameters:**
```typescript
{
  page?: number;
  page_size?: number;
  search?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}
```

**Returns:**
```typescript
{
  data: PaginatedResponse<Customer> | null;
  isLoading: boolean;
  error: Error | null;
  isError: boolean;
}
```

**Usage:**
```typescript
import { useCustomersList } from '@/lib/api/hooks/useCustomers';

function CustomersPage() {
  const { data, isLoading, error } = useCustomersList({
    page: 1,
    page_size: 20,
    search: 'john',
  });
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {data?.items.map(customer => (
        <div key={customer.customer_id}>{customer.full_name}</div>
      ))}
    </div>
  );
}
```

**Error Handling:**
- Returns `null` for 401/404 errors to allow graceful fallback
- Automatically retries on transient errors
- Does not retry on 401/404 errors

### `useCustomer360(customerId)`

Fetches comprehensive customer 360 data.

**Location:** `lib/api/hooks/useCustomers.ts`

**Parameters:**
- `customerId: string` - The customer ID

**Returns:**
```typescript
{
  data: Customer360Data | null;
  isLoading: boolean;
  error: Error | null;
}
```

**Usage:**
```typescript
import { useCustomer360 } from '@/lib/api/hooks/useCustomers';

function CustomerDetailPage({ customerId }: { customerId: string }) {
  const { data, isLoading } = useCustomer360(customerId);
  
  if (isLoading) return <div>Loading customer data...</div>;
  if (!data) return <div>Customer not found</div>;
  
  return <Customer360View data={data} />;
}
```

## Credit Scoring Hooks

### `useSubmitCreditScore()`

Submits a credit scoring request.

**Location:** `lib/api/hooks/useCreditScore.ts`

**Returns:**
```typescript
{
  mutate: (data: CreditScoreRequest) => void;
  mutateAsync: (data: CreditScoreRequest) => Promise<CreditScoreResponse>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: CreditScoreResponse | undefined;
}
```

**Usage:**
```typescript
import { useSubmitCreditScore } from '@/lib/api/hooks/useCreditScore';

function CreditScoringForm() {
  const submitMutation = useSubmitCreditScore();
  
  const handleSubmit = async (formData: CreditScoringFormData) => {
    try {
      const response = await submitMutation.mutateAsync(
        transformFormDataTo168Features(formData)
      );
      console.log('Credit Score:', response.credit_score);
    } catch (error) {
      console.error('Submission failed:', error);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
    </form>
  );
}
```

### `useBatchCreditScore()`

Submits a batch credit scoring request from a CSV file.

**Location:** `lib/api/hooks/useCreditScore.ts`

**Returns:**
```typescript
{
  mutate: (file: File) => void;
  mutateAsync: (file: File) => Promise<BatchCreditScoreResponse>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  data: BatchCreditScoreResponse | undefined;
}
```

**Usage:**
```typescript
import { useBatchCreditScore } from '@/lib/api/hooks/useCreditScore';

function BatchProcessingPage() {
  const batchMutation = useBatchCreditScore();
  
  const handleFileUpload = async (file: File) => {
    try {
      const response = await batchMutation.mutateAsync(file);
      console.log(`Processed ${response.total} customers`);
      console.log(`Successful: ${response.successful}, Failed: ${response.failed}`);
    } catch (error) {
      console.error('Batch processing failed:', error);
    }
  };
  
  return <BatchUploadForm onUpload={handleFileUpload} />;
}
```

## Dashboard Hooks

### `useDashboardData()`

Fetches dashboard KPIs and metrics.

**Location:** `lib/api/hooks/useDashboard.ts`

**Returns:**
```typescript
{
  data: DashboardData | null;
  isLoading: boolean;
  error: Error | null;
}
```

**Usage:**
```typescript
import { useDashboardData } from '@/lib/api/hooks/useDashboard';

function DashboardPage() {
  const { data, isLoading } = useDashboardData();
  
  if (isLoading) return <div>Loading dashboard...</div>;
  
  return (
    <div>
      <KPICard metric={data?.revenue} />
      <KPICard metric={data?.loans} />
      <KPICard metric={data?.customers} />
    </div>
  );
}
```

## Analytics Hooks

### `useAnalyticsData(params?)`

Fetches general analytics data.

**Location:** `lib/api/hooks/useAnalytics.ts`

**Parameters:**
```typescript
{
  type?: string;
  customer_id?: string;
  time_range?: string;
  group_by?: string;
}
```

**Returns:**
```typescript
{
  data: any | null;
  isLoading: boolean;
  error: Error | null;
}
```

### `usePortfolioMetrics()`

Fetches portfolio metrics.

**Location:** `lib/api/hooks/useAnalytics.ts`

**Returns:**
```typescript
{
  data: PortfolioMetrics | null;
  isLoading: boolean;
  error: Error | null;
}
```

### `useRiskDistribution()`

Fetches risk distribution data.

**Location:** `lib/api/hooks/useAnalytics.ts`

**Returns:**
```typescript
{
  data: RiskDistribution | null;
  isLoading: boolean;
  error: Error | null;
}
```

## Admin Hooks

### `useUsers(params?)`

Fetches a paginated list of users.

**Location:** `lib/api/hooks/useUsers.ts`

**Parameters:**
```typescript
{
  page?: number;
  page_size?: number;
  search?: string;
}
```

**Returns:**
```typescript
{
  data: PaginatedResponse<User> | null;
  isLoading: boolean;
  error: Error | null;
}
```

### `useCreateUser()`

Creates a new user.

**Location:** `lib/api/hooks/useUsers.ts`

**Returns:**
```typescript
{
  mutate: (data: CreateUserRequest) => void;
  mutateAsync: (data: CreateUserRequest) => Promise<User>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

**Usage:**
```typescript
import { useCreateUser } from '@/lib/api/hooks/useUsers';

function UserManagementPage() {
  const createUser = useCreateUser();
  
  const handleCreate = async (userData: CreateUserRequest) => {
    try {
      const newUser = await createUser.mutateAsync(userData);
      toast.success(`User ${newUser.username} created successfully`);
    } catch (error) {
      toast.error('Failed to create user');
    }
  };
  
  return <UserForm onSubmit={handleCreate} />;
}
```

### `useUpdateUser()`

Updates an existing user.

**Location:** `lib/api/hooks/useUsers.ts`

**Returns:**
```typescript
{
  mutate: ({ userId, data }: { userId: string; data: UpdateUserRequest }) => void;
  mutateAsync: ({ userId, data }: { userId: string; data: UpdateUserRequest }) => Promise<User>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

### `useDeleteUser()`

Deletes a user.

**Location:** `lib/api/hooks/useUsers.ts`

**Returns:**
```typescript
{
  mutate: (userId: string) => void;
  mutateAsync: (userId: string) => Promise<void>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

### `useSettings()`

Fetches system settings.

**Location:** `lib/api/hooks/useSettings.ts`

**Returns:**
```typescript
{
  data: SettingsData | null;
  isLoading: boolean;
  error: Error | null;
}
```

### `useUpdateSettings()`

Updates system settings.

**Location:** `lib/api/hooks/useSettings.ts`

**Returns:**
```typescript
{
  mutate: (settings: Partial<SettingsData>) => void;
  mutateAsync: (settings: Partial<SettingsData>) => Promise<SettingsData>;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

## Error Handling

All hooks follow a consistent error handling pattern:

1. **401 Unauthorized**: Returns `null` data to allow graceful fallback UI
2. **404 Not Found**: Returns `null` data (treated as resource not available)
3. **Network Errors**: Retries up to 2 times with exponential backoff
4. **Other Errors**: Thrown and can be caught by error boundaries

**Example Error Handling:**
```typescript
function MyComponent() {
  const { data, error, isError } = useCustomersList();
  
  if (isError) {
    if (error?.statusCode === 401) {
      return <div>Please log in</div>;
    }
    if (error?.statusCode === 404) {
      return <div>No customers found</div>;
    }
    return <div>Error: {error.message}</div>;
  }
  
  // Use data...
}
```

## Best Practices

1. **Always check `tokenSynced`** before using authenticated hooks
2. **Use `mutateAsync`** for mutations when you need to await the result
3. **Handle null data** gracefully - APIs may return null for 401/404 errors
4. **Use loading states** to improve UX
5. **Invalidate queries** after mutations to refetch data
6. **Use error boundaries** for global error handling

## Testing

See `__tests__/integration/api-hooks.test.tsx` for examples of testing API hooks with React Query.



