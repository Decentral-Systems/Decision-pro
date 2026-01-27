# Browser Testing Guide - WebSocket, Placeholder Endpoints, Analytics

**Date:** December 29, 2025  
**Status:** Ready for Testing

---

## Prerequisites

✅ All services running:
- API Gateway: `http://196.188.249.48:4000`
- Decision Pro Admin: `http://localhost:4009`
- Credit Scoring Service: Port 4001
- Default Prediction Service: Port 4002
- Explainability Service: Port 4003
- Streamlit Dashboard: Port 4005

---

## 1. WebSocket Testing

### Test WebSocket Connection

1. **Open Browser Console** (F12)
2. **Navigate to:** `http://localhost:4009/dashboard`
3. **Login:** `admin` / `admin123`
4. **Test WebSocket Connection:**

```javascript
// Test WebSocket connection
const ws = new WebSocket('ws://196.188.249.48:4000/ws');

ws.onopen = () => {
  console.log('✅ WebSocket connected');
  
  // Subscribe to dashboard metrics
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'dashboard_metrics'
  }));
  
  // Subscribe to executive metrics
  ws.send(JSON.stringify({
    type: 'subscribe',
    channel: 'executive_metrics'
  }));
  
  // Test heartbeat
  ws.send('ping');
};

ws.onmessage = (event) => {
  console.log('📨 WebSocket message received:', JSON.parse(event.data));
};

ws.onerror = (error) => {
  console.error('❌ WebSocket error:', error);
};

ws.onclose = () => {
  console.log('🔌 WebSocket closed');
};
```

### Test WebSocket with Authentication

```javascript
// First, get JWT token
const loginResponse = await fetch('http://196.188.249.48:4000/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'admin123' })
});

const { access_token } = await loginResponse.json();

// Connect with token
const ws = new WebSocket(`ws://196.188.249.48:4000/ws?token=${access_token}`);

ws.onopen = () => {
  console.log('✅ WebSocket connected with authentication');
};
```

**Expected Results:**
- ✅ WebSocket connects successfully
- ✅ Can subscribe to channels
- ✅ Receives real-time updates every 10 seconds
- ✅ Heartbeat (ping/pong) works
- ✅ Authentication works (optional)

---

## 2. Placeholder Endpoints Testing

### A. Test `/api/scoring/realtime`

**Browser Console:**
```javascript
// Test realtime scoring endpoint
const response = await fetch('http://196.188.249.48:4000/api/scoring/realtime?limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Realtime Scoring:', data);
```

**Expected Results:**
- ✅ Returns recent scoring results (last 90 days)
- ✅ Includes: prediction_id, customer_id, credit_score, risk_level, created_at
- ✅ Includes: loan_amount, loan_term_months (extracted from JSON fields)
- ✅ Returns array of results

**Or via Browser:**
1. Navigate to: `http://localhost:4009/realtime-scoring`
2. Verify feed shows recent scores
3. Check that data is populated

---

### B. Test `/api/intelligence/products/recommendations`

**Browser Console:**
```javascript
// Test product recommendations
const response = await fetch('http://196.188.249.48:4000/api/intelligence/products/recommendations?limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Product Recommendations:', data);
```

**Expected Results:**
- ✅ Returns recommendations based on recent predictions (last 90 days)
- ✅ Product types: personal-loan, emergency-loan, collateral-loan
- ✅ Includes: recommendation_score, confidence, reason
- ✅ Based on credit score and risk level

**Or via Browser:**
1. Navigate to: `http://localhost:4009/dashboard`
2. Check "Product Recommendations" section
3. Verify recommendations are displayed

---

### C. Test `/api/customers/`

**Browser Console:**
```javascript
// Test customers list
const response = await fetch('http://196.188.249.48:4000/api/customers/?limit=10&offset=0', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Customers List:', data);
```

**Expected Results:**
- ✅ Returns customer list with pagination
- ✅ Includes: customer_id, full_name, email, phone_number, credit_score
- ✅ Supports sorting and filtering
- ✅ Returns accurate total count

**Or via Browser:**
1. Navigate to: `http://localhost:4009/customers`
2. Verify customer list loads
3. Test pagination, sorting, filtering

---

## 3. Analytics Endpoints Testing

### A. Test `/api/risk/early-warning/alerts`

**Browser Console:**
```javascript
const response = await fetch('http://196.188.249.48:4000/api/risk/early-warning/alerts?limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Early Warning Alerts:', data);
```

**Expected Results:**
- ✅ Returns risk alerts
- ✅ Includes: alerts array, total_count, critical_count, high_count
- ✅ Supports filtering by severity and status

---

### B. Test `/api/risk/early-warning/watchlist`

**Browser Console:**
```javascript
const response = await fetch('http://196.188.249.48:4000/api/risk/early-warning/watchlist?limit=10', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Early Warning Watchlist:', data);
```

**Expected Results:**
- ✅ Returns customers on watchlist
- ✅ Includes: customer_id, credit_score, risk_level, watchlist_reason
- ✅ Filters by high risk or low credit score

---

### C. Test `/api/risk/market-analysis`

**Browser Console:**
```javascript
const response = await fetch('http://196.188.249.48:4000/api/risk/market-analysis', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Market Analysis:', data);
```

**Expected Results:**
- ✅ Returns market risk analysis
- ✅ Includes: market_conditions, portfolio_impact, economic_factors

---

### D. Test `/api/intelligence/journey/statistics`

**Browser Console:**
```javascript
const response = await fetch('http://196.188.249.48:4000/api/intelligence/journey/statistics', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Journey Statistics:', data);
```

**Expected Results:**
- ✅ Returns journey statistics
- ✅ Includes: stage distribution, conversion funnel, bottlenecks
- ✅ Based on customer_journey_events table

---

### E. Test `/api/v1/mlops/monitoring/drift`

**Browser Console:**
```javascript
const response = await fetch('http://196.188.249.48:4000/api/v1/mlops/monitoring/drift', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token') || 'your_token_here'}`
  }
});

const data = await response.json();
console.log('✅ Drift Monitoring:', data);
```

**Expected Results:**
- ✅ Returns drift detection metrics
- ✅ Includes: data_drift_score, concept_drift_score, prediction_drift_score
- ✅ Includes: overall_drift_status, drift_alerts, feature_drift

---

## 4. Browser UI Testing

### Test Real-Time Scoring Page

1. Navigate to: `http://localhost:4009/realtime-scoring`
2. **Verify:**
   - ✅ Page loads without errors
   - ✅ WebSocket connection indicator shows "Connected"
   - ✅ Real-time score feed displays recent scores
   - ✅ Scores update automatically (every 10 seconds)
   - ✅ Correlation-ID is displayed for each score

### Test Dashboard Page

1. Navigate to: `http://localhost:4009/dashboard`
2. **Verify:**
   - ✅ Executive dashboard loads
   - ✅ Real-time metrics update via WebSocket
   - ✅ Product recommendations section shows data
   - ✅ No console errors

### Test Customers Page

1. Navigate to: `http://localhost:4009/customers`
2. **Verify:**
   - ✅ Customer list loads
   - ✅ Pagination works
   - ✅ Sorting works
   - ✅ Filtering works
   - ✅ Data is accurate

### Test ML Center Page

1. Navigate to: `http://localhost:4009/ml-center`
2. **Verify:**
   - ✅ Drift monitoring shows data
   - ✅ Model comparison works
   - ✅ Feature importance displays
   - ✅ No 404 errors

---

## 5. Quick Test Script

**Copy and paste into browser console (after login):**

```javascript
(async () => {
  console.log('🧪 Starting Comprehensive Tests...\n');
  
  const token = localStorage.getItem('token') || 'your_token_here';
  const baseUrl = 'http://196.188.249.48:4000';
  
  const tests = [
    { name: 'Realtime Scoring', url: `${baseUrl}/api/scoring/realtime?limit=5` },
    { name: 'Product Recommendations', url: `${baseUrl}/api/intelligence/products/recommendations?limit=5` },
    { name: 'Customers List', url: `${baseUrl}/api/customers/?limit=5` },
    { name: 'Early Warning Alerts', url: `${baseUrl}/api/risk/early-warning/alerts?limit=5` },
    { name: 'Early Warning Watchlist', url: `${baseUrl}/api/risk/early-warning/watchlist?limit=5` },
    { name: 'Market Analysis', url: `${baseUrl}/api/risk/market-analysis` },
    { name: 'Journey Statistics', url: `${baseUrl}/api/intelligence/journey/statistics` },
    { name: 'Drift Monitoring', url: `${baseUrl}/api/v1/mlops/monitoring/drift` }
  ];
  
  for (const test of tests) {
    try {
      const response = await fetch(test.url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log(`✅ ${test.name}:`, response.status === 200 ? 'SUCCESS' : 'FAILED', data);
    } catch (error) {
      console.error(`❌ ${test.name}:`, error);
    }
  }
  
  // Test WebSocket
  console.log('\n🔌 Testing WebSocket...');
  const ws = new WebSocket('ws://196.188.249.48:4000/ws');
  ws.onopen = () => {
    console.log('✅ WebSocket: Connected');
    ws.send(JSON.stringify({ type: 'subscribe', channel: 'dashboard_metrics' }));
    setTimeout(() => {
      ws.close();
      console.log('✅ All tests complete!');
    }, 5000);
  };
  ws.onmessage = (event) => {
    console.log('✅ WebSocket: Message received', JSON.parse(event.data));
  };
  ws.onerror = (error) => {
    console.error('❌ WebSocket: Error', error);
  };
})();
```

---

## Expected Results Summary

| Test | Expected Status | Notes |
|------|----------------|-------|
| WebSocket Connection | ✅ 200 OK | Connects without auth (optional) |
| WebSocket with Auth | ✅ 200 OK | Connects with JWT token |
| Realtime Scoring | ✅ 200 OK | Returns recent scores |
| Product Recommendations | ✅ 200 OK | Returns recommendations |
| Customers List | ✅ 200 OK | Returns customer data |
| Early Warning Alerts | ✅ 200 OK | Returns alerts |
| Early Warning Watchlist | ✅ 200 OK | Returns watchlist |
| Market Analysis | ✅ 200 OK | Returns market data |
| Journey Statistics | ✅ 200 OK | Returns journey stats |
| Drift Monitoring | ✅ 200 OK | Returns drift metrics |

---

## Troubleshooting

### WebSocket Connection Issues
- Check firewall settings
- Verify WebSocket URL: `ws://196.188.249.48:4000/ws`
- Check browser console for errors
- Try with authentication token

### Endpoint 401 Errors
- Login first: `POST /auth/login`
- Use JWT token in Authorization header
- Check token expiration

### Endpoint 404 Errors
- Verify API Gateway is running
- Check endpoint URL is correct
- Verify router is registered

### No Data Returned
- Check database connection
- Verify predictions table has data
- Check database pool is initialized

---

**Status:** ✅ Ready for Testing  
**Last Updated:** December 29, 2025

