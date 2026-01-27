# Testing Guide

This document provides guidance on writing and running tests for the Decision Pro admin dashboard.

## Test Structure

```
decision-pro-admin/
├── __tests__/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── apiResponseNormalizer.test.ts
│   │   │   ├── csvValidator.test.ts
│   │   │   ├── validation.test.ts
│   │   │   └── exportHelpers.test.ts
│   │   └── api/
│   │       └── clients/
│   │           └── api-gateway.test.ts
│   └── integration/
│       ├── api-hooks.test.tsx
│       └── form-validation.test.tsx
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

## Writing Tests

### Unit Tests

Unit tests focus on testing individual functions and utilities in isolation.

**Example:**
```typescript
import { normalizeApiResponse } from '@/lib/utils/apiResponseNormalizer';

describe('normalizeApiResponse', () => {
  it('should extract data from wrapped response', () => {
    const response = { success: true, data: { id: '123' } };
    const result = normalizeApiResponse(response);
    expect(result).toEqual({ id: '123' });
  });
});
```

### Integration Tests

Integration tests verify that multiple components work together correctly.

**Example:**
```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

describe('API Hooks Integration', () => {
  it('should fetch and return data', async () => {
    // Test hook with mocked API
  });
});
```

## Testing Utilities

### Mocking Next.js Router

The `jest.setup.js` file includes mocks for Next.js router:

```typescript
import { useRouter } from 'next/navigation';

// Router is automatically mocked
```

### Mocking NextAuth

NextAuth is mocked in `jest.setup.js`:

```typescript
import { useSession } from 'next-auth/react';

// Session is automatically mocked
```

### Mocking API Clients

Mock API clients in your tests:

```typescript
jest.mock('@/lib/api/clients/api-gateway', () => ({
  apiGatewayClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));
```

## Best Practices

1. **Isolate Tests**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Mock API calls, router, and other external dependencies
3. **Test Edge Cases**: Test both happy paths and error conditions
4. **Use Descriptive Names**: Test names should clearly describe what is being tested
5. **Keep Tests Simple**: Each test should verify one specific behavior
6. **Clean Up**: Reset mocks and state between tests

## Coverage Goals

- **Branches**: 60%+
- **Functions**: 60%+
- **Lines**: 60%+
- **Statements**: 60%+

Focus on testing critical business logic, utilities, and API integrations.

## Common Patterns

### Testing Form Validation

```typescript
import { renderHook, act } from '@testing-library/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

it('should validate form data', async () => {
  const { result } = renderHook(() =>
    useForm({
      resolver: zodResolver(schema),
    })
  );
  
  await act(async () => {
    result.current.setValue('email', 'invalid');
    const isValid = await result.current.trigger();
    expect(isValid).toBe(false);
  });
});
```

### Testing API Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

it('should fetch data', async () => {
  const queryClient = new QueryClient();
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  const { result } = renderHook(() => useCustomersList(), { wrapper });
  
  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

## Troubleshooting

### Tests Fail with Module Resolution Errors

- Ensure `tsconfig.json` paths are correctly configured
- Check that `jest.config.js` moduleNameMapper matches tsconfig paths

### Tests Fail with "Cannot find module"

- Clear Jest cache: `npm test -- --clearCache`
- Ensure all dependencies are installed: `npm install`

### Async Tests Timing Out

- Increase timeout: `jest.setTimeout(10000)`
- Use `waitFor` for async operations
- Ensure all promises are properly awaited



