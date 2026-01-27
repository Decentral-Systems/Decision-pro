# Integration & End-to-End Testing Guide

## Overview

This guide covers running integration tests and end-to-end tests for the Executive Dashboard against the **real backend** at `http://196.188.249.48:4000`.

## Test Structure

### Integration Tests
Located in `__tests__/integration/`:
- `dashboard-api.test.ts` - API hooks with real backend
- `websocket.test.ts` - WebSocket connection and subscriptions
- `dashboard-data-aggregation.test.ts` - Data aggregation logic
- `error-handling.test.ts` - Error handling scenarios
- `realtime-updates.test.ts` - Real-time update flows

### End-to-End Tests
Located in `__tests__/e2e/`:
- `dashboard-page.test.tsx` - Complete dashboard page workflows

## Prerequisites

1. **Backend Services Must Be Running**
   - API Gateway: `http://196.188.249.48:4000`
   - WebSocket endpoint: `ws://196.188.249.48:4000/ws`
   - Credit Scoring Service: `http://196.188.249.48:4001`

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
   NEXT_PUBLIC_WEBSOCKET_URL=ws://196.188.249.48:4000/ws
   ```

3. **Authentication**
   - Tests mock authentication, but real backend may require valid tokens
   - Update mocks in test files if backend enforces authentication

## Running Tests

### Run All Integration Tests
```bash
npm run test:integration
```

### Run End-to-End Tests
```bash
npm run test:e2e
```

### Run All Tests
```bash
npm run test:all
```

### Run with Real Backend Check
```bash
npm run test:integration:real
# or
bash scripts/run-integration-tests.sh
```

### Run Specific Test File
```bash
npm test -- dashboard-api.test.ts
npm test -- websocket.test.ts
```

### Run Tests in Watch Mode
```bash
npm run test:watch -- --testPathPattern=integration
```

## Test Categories

### 1. Dashboard API Integration Tests

Tests all API hooks with real backend:
- ✅ `useDashboardData()` - Fetches dashboard metrics
- ✅ `useExecutiveDashboardData()` - Fetches executive dashboard
- ✅ `useCustomerStats()` - Fetches customer statistics
- ✅ `useRecommendationStats()` - Fetches recommendation stats
- ✅ Date range parameter passing
- ✅ Error handling (404, 401, network errors)

**Expected Results:**
- All hooks should connect to backend
- Data should be fetched successfully or errors handled gracefully
- Date range parameters should be passed correctly

### 2. WebSocket Integration Tests

Tests WebSocket real-time features:
- ✅ Connection to WebSocket endpoint
- ✅ Ping/pong heartbeat
- ✅ Channel subscription (`dashboard_metrics`, `risk_alert`, `executive_metrics`)
- ✅ Message reception
- ✅ Unsubscription

**Expected Results:**
- WebSocket should connect successfully
- Subscriptions should be confirmed
- Messages should be received (may take up to 10 seconds for broadcaster)

### 3. Data Aggregation Tests

Tests data aggregation logic:
- ✅ Priority: realtime > primary > fallback
- ✅ Multiple data sources
- ✅ Missing data handling
- ✅ Growth rate transformations

**Expected Results:**
- All aggregation scenarios should work correctly
- No type errors
- Correct data priority

### 4. Error Handling Tests

Tests unified error handling:
- ✅ 404 errors return null
- ✅ 401 errors return null
- ✅ Network errors handled
- ✅ Timeout errors handled
- ✅ Multiple error sources consolidated

**Expected Results:**
- Errors should be handled gracefully
- No uncaught exceptions
- Error states should be manageable

### 5. Real-time Updates Tests

Tests real-time update flows:
- ✅ WebSocket connection
- ✅ Channel subscriptions
- ✅ Data updates
- ✅ Connection status tracking

**Expected Results:**
- WebSocket should connect
- Subscriptions should work
- Data updates should be received

### 6. End-to-End Tests

Tests complete user workflows:
- ✅ Dashboard page renders
- ✅ Date range filter integration
- ✅ Error handling UI
- ✅ Real-time status display
- ✅ Export functionality

**Expected Results:**
- All UI components should render
- Interactions should work
- Data should display correctly

## Test Execution Flow

1. **Pre-test Checks**
   - Backend health check
   - WebSocket availability check
   - Environment variable validation

2. **Test Execution**
   - Sequential test execution
   - Timeout handling (10-20 seconds per test)
   - Error capture and reporting

3. **Post-test Cleanup**
   - WebSocket connection cleanup
   - Query cache cleanup
   - Resource deallocation

## Troubleshooting

### Backend Not Available

If backend is not running:
```
❌ API Gateway is not available
⚠️  Warning: Backend is not available. Some tests may be skipped.
```

**Solution:**
1. Ensure backend services are running:
   ```bash
   # Check API Gateway
   curl http://196.188.249.48:4000/health
   
   # Check WebSocket (manual test)
   wscat -c ws://196.188.249.48:4000/ws
   ```

2. Update backend URL in `.env.local` if different

### WebSocket Connection Failures

If WebSocket tests fail:
- Check WebSocket endpoint is accessible
- Verify backend WebSocket service is running
- Check firewall/network restrictions

### Authentication Errors

If tests fail with 401 errors:
- Update authentication mocks in test files
- Ensure test tokens are valid (if backend requires)
- Check API key configuration

### Timeout Errors

If tests timeout:
- Increase timeout values in test files
- Check backend response times
- Verify network connectivity

## Manual Testing Checklist

For features that need human verification:

### Date Range Filter
- [ ] Filter appears in dashboard header
- [ ] Preset buttons work (7d, 30d, 90d, 1y)
- [ ] Custom date range works
- [ ] Changing filter updates all dashboard metrics
- [ ] URL reflects date range selection

### WebSocket Real-time Updates
- [ ] Connection status shows "Real-time" when connected
- [ ] Connection status shows "Polling" when disconnected
- [ ] Dashboard updates automatically (every 10 seconds)
- [ ] Risk alerts appear as toast notifications
- [ ] No console errors

### Error Handling
- [ ] Single unified error alert displays
- [ ] Multiple errors show collapsible details
- [ ] Retry button refetches all failed queries
- [ ] Error messages are clear and actionable

### Data Aggregation
- [ ] Dashboard displays data correctly
- [ ] Real-time updates override static data
- [ ] Fallback data displays when primary fails
- [ ] No data conflicts or inconsistencies

### Toast Notifications
- [ ] Risk alerts appear as toasts
- [ ] Critical alerts stay longer (10 seconds)
- [ ] Toast styling matches severity
- [ ] Toasts can be dismissed

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Run Integration Tests
  run: |
    npm run test:integration
  env:
    NEXT_PUBLIC_API_GATEWAY_URL: ${{ secrets.BACKEND_URL }}
    NEXT_PUBLIC_WEBSOCKET_URL: ${{ secrets.WS_URL }}
```

## Test Coverage Goals

- **Integration Tests**: 80%+ coverage of API hooks
- **E2E Tests**: All critical user workflows
- **Error Scenarios**: All error types handled

## Next Steps

1. ✅ Run integration tests against real backend
2. ✅ Verify all critical features work
3. ✅ Fix any issues found
4. ✅ Document test results
5. ✅ Set up CI/CD integration

## Notes

- Tests are designed to be **non-destructive**
- Tests should **not modify** backend data
- Some tests may be **skipped** if backend is unavailable
- Timeout values are set to **accommodate slow networks**






