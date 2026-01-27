# Test Suite Documentation

## Overview

This directory contains comprehensive integration and end-to-end tests for the Executive Dashboard.

## Test Structure

```
__tests__/
├── integration/          # Integration tests against real backend
│   ├── dashboard-api.test.tsx           # API hooks with real backend
│   ├── websocket.test.ts                # WebSocket connection tests
│   ├── date-range-filter.test.ts        # Date range filtering tests
│   ├── error-handling.test.ts           # Error handling scenarios
│   ├── realtime-updates.test.ts         # Real-time update flows
│   └── dashboard-data-aggregation.test.ts # Data aggregation logic
├── e2e/                  # End-to-end tests
│   └── dashboard-page.test.tsx          # Complete dashboard workflows
├── components/           # Component unit tests
├── lib/                  # Library unit tests
└── INTEGRATION_TESTING_GUIDE.md  # Complete testing guide
```

## Quick Start

### Run All Tests
```bash
npm test
```

### Run Integration Tests Only
```bash
npm run test:integration
```

### Run End-to-End Tests Only
```bash
npm run test:e2e
```

### Run Tests with Real Backend Check
```bash
npm run test:integration:real
```

### Run Specific Test File
```bash
npm test -- dashboard-api.test.tsx
npm test -- websocket.test.ts
```

## Prerequisites

1. **Backend Services**
   - API Gateway: `http://196.188.249.48:4000`
   - WebSocket: `ws://196.188.249.48:4000/ws`

2. **Environment Variables**
   ```bash
   NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
   NEXT_PUBLIC_WEBSOCKET_URL=ws://196.188.249.48:4000/ws
   ```

3. **Dependencies**
   ```bash
   npm install
   # WebSocket tests require 'ws' package (installed as dev dependency)
   ```

## Test Coverage

### Integration Tests ✅
- Dashboard API hooks with real backend
- WebSocket connection and subscriptions
- Date range filtering
- Error handling scenarios
- Real-time update flows
- Data aggregation logic

### End-to-End Tests ✅
- Complete dashboard page workflows
- User interactions
- Error scenarios
- Real-time updates

## Test Execution Flow

1. **Pre-test Checks**
   - Backend availability verification
   - Environment setup validation

2. **Test Execution**
   - Sequential test execution
   - Timeout handling (10-20 seconds)
   - Error capture and reporting

3. **Post-test Cleanup**
   - Resource deallocation
   - Connection cleanup

## Troubleshooting

### Backend Not Available
If backend is unavailable, some tests will be skipped. Ensure:
- Backend services are running
- Network connectivity is available
- Firewall allows connections

### WebSocket Connection Failures
- Check WebSocket endpoint is accessible
- Verify backend WebSocket service is running
- Check firewall/network restrictions

### Test Timeouts
- Increase timeout values in test files if needed
- Check backend response times
- Verify network connectivity

## Manual Testing

See [MANUAL_TEST_CHECKLIST.md](./MANUAL_TEST_CHECKLIST.md) for comprehensive manual testing procedures.

## Test Documentation

- [Integration Testing Guide](./INTEGRATION_TESTING_GUIDE.md) - Complete integration testing documentation
- [Manual Test Checklist](./MANUAL_TEST_CHECKLIST.md) - Manual testing procedures
- [Test Execution Summary](../scripts/test-execution-summary.md) - Test results template

## Continuous Integration

Tests are designed to run in CI/CD pipelines:
```yaml
- name: Run Integration Tests
  run: npm run test:integration
  env:
    NEXT_PUBLIC_API_GATEWAY_URL: ${{ secrets.BACKEND_URL }}
    NEXT_PUBLIC_WEBSOCKET_URL: ${{ secrets.WS_URL }}
```

## Notes

- Tests are **non-destructive** - they don't modify backend data
- Tests may be **skipped** if backend is unavailable
- Timeout values accommodate **slow networks**
- WebSocket tests use `ws` package for Node.js compatibility






