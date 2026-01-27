# Decision PRO - Monitoring Setup Guide

This guide explains how to set up monitoring and observability for the Decision PRO admin dashboard.

## Table of Contents

1. [Overview](#overview)
2. [Application Metrics](#application-metrics)
3. [Performance Monitoring](#performance-monitoring)
4. [Error Tracking](#error-tracking)
5. [User Analytics](#user-analytics)
6. [API Monitoring](#api-monitoring)
7. [Alerting](#alerting)
8. [Dashboard Setup](#dashboard-setup)

---

## Overview

Decision PRO includes built-in monitoring capabilities through:
- **Prometheus Metrics** - Exposed on `/metrics` endpoint
- **Structured Logging** - JSON-formatted logs with correlation IDs
- **Health Checks** - Service and dependency health monitoring
- **Performance Metrics** - Request latency, throughput, error rates

---

## Application Metrics

### Prometheus Metrics Endpoint

The application exposes Prometheus-compatible metrics on `/metrics`:

```bash
# Access metrics endpoint
curl http://localhost:4009/metrics
```

### Available Metrics

#### HTTP Metrics
- `http_requests_total` - Total number of HTTP requests
- `http_request_duration_seconds` - Request duration histogram
- `http_request_size_bytes` - Request size histogram
- `http_response_size_bytes` - Response size histogram

#### Application Metrics
- `api_requests_total` - Total API requests by endpoint
- `api_request_duration_seconds` - API request duration
- `api_errors_total` - Total API errors by type
- `websocket_connections_total` - Active WebSocket connections
- `websocket_messages_total` - WebSocket messages sent/received

#### Business Metrics
- `credit_scores_calculated_total` - Total credit scores calculated
- `batch_processing_jobs_total` - Batch processing jobs
- `batch_processing_success_rate` - Batch processing success rate
- `user_sessions_active` - Active user sessions

### Prometheus Configuration

Add to `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'decision-pro-admin'
    scrape_interval: 15s
    static_configs:
      - targets: ['localhost:4009']
    metrics_path: '/metrics'
```

---

## Performance Monitoring

### Key Performance Indicators (KPIs)

Monitor these metrics for optimal performance:

1. **API Response Time**
   - Target: <200ms average
   - Alert threshold: >500ms p95

2. **Page Load Time**
   - Target: <3s initial load
   - Alert threshold: >5s

3. **Error Rate**
   - Target: <0.1%
   - Alert threshold: >1%

4. **API Success Rate**
   - Target: >99.9%
   - Alert threshold: <99%

### Performance Monitoring Tools

#### 1. Browser Performance API

```typescript
// Monitor page load performance
const perfData = performance.getEntriesByType('navigation')[0]
console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart)
```

#### 2. React Query DevTools

```typescript
// Enable in development
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

<ReactQueryDevtools initialIsOpen={false} />
```

#### 3. Web Vitals

Monitor Core Web Vitals:
- **LCP (Largest Contentful Paint)** - Target: <2.5s
- **FID (First Input Delay)** - Target: <100ms
- **CLS (Cumulative Layout Shift)** - Target: <0.1

---

## Error Tracking

### Built-in Error Logging

The application uses structured logging for errors:

```typescript
// Errors are automatically logged with:
// - Timestamp
// - Error message
// - Stack trace
// - Correlation ID
// - User context
```

### Error Tracking Services

#### Option 1: Sentry Integration

```typescript
// Install Sentry
npm install @sentry/nextjs

// Configure in next.config.js
const { withSentryConfig } = require('@sentry/nextjs')

module.exports = withSentryConfig(nextConfig, {
  // Sentry configuration
})
```

#### Option 2: Custom Error Tracking

```typescript
// In ErrorBoundary component
const handleError = (error: Error, errorInfo: ErrorInfo) => {
  // Send to error tracking service
  errorTrackingService.captureException(error, {
    extra: errorInfo,
    tags: { component: 'ErrorBoundary' }
  })
}
```

### Error Categories

Monitor errors by category:

1. **API Errors** - Failed API requests
2. **Authentication Errors** - Token/authentication failures
3. **Validation Errors** - Form/data validation failures
4. **Network Errors** - Connection/timeout errors
5. **Runtime Errors** - JavaScript runtime errors

---

## User Analytics

### Track User Actions

```typescript
// Track user interactions
const trackEvent = (eventName: string, properties?: Record<string, any>) => {
  // Send to analytics service
  analytics.track(eventName, {
    userId: session.user.id,
    timestamp: new Date().toISOString(),
    ...properties
  })
}

// Usage
trackEvent('credit_score_calculated', {
  customer_id: customerId,
  score: creditScore
})
```

### Key User Events

Track these important user actions:

1. **Authentication**
   - Login success/failure
   - Logout
   - Token refresh

2. **Credit Scoring**
   - Credit score calculated
   - Batch processing started/completed
   - Export actions

3. **Customer Management**
   - Customer viewed
   - Customer 360 accessed
   - Customer search performed

4. **Admin Actions**
   - User created/updated/deleted
   - Settings changed
   - Audit logs viewed

---

## API Monitoring

### Monitor API Health

```bash
# Health check endpoint
curl http://localhost:4009/api/health

# Response:
{
  "status": "healthy",
  "timestamp": "2024-12-01T12:00:00Z",
  "services": {
    "api_gateway": "healthy",
    "credit_scoring": "healthy"
  }
}
```

### API Metrics to Monitor

1. **Request Rate**
   - Requests per second
   - Peak request rate
   - Request rate by endpoint

2. **Response Times**
   - Average response time
   - P50, P95, P99 percentiles
   - Slowest endpoints

3. **Error Rates**
   - Error rate by endpoint
   - Error rate by status code
   - Error rate trends

4. **Success Rate**
   - Overall success rate
   - Success rate by endpoint
   - Success rate trends

---

## Alerting

### Alert Configuration

Set up alerts for critical issues:

#### 1. High Error Rate Alert

```yaml
# Prometheus Alert Rule
- alert: HighErrorRate
  expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
  for: 5m
  annotations:
    summary: "High error rate detected"
    description: "Error rate is {{ $value }} errors/second"
```

#### 2. Slow Response Time Alert

```yaml
- alert: SlowResponseTime
  expr: histogram_quantile(0.95, http_request_duration_seconds) > 1
  for: 10m
  annotations:
    summary: "Slow API response times"
    description: "P95 response time is {{ $value }}s"
```

#### 3. Service Down Alert

```yaml
- alert: ServiceDown
  expr: up{job="decision-pro-admin"} == 0
  for: 1m
  annotations:
    summary: "Decision PRO service is down"
```

### Alert Channels

Configure alert notifications:

1. **Email Alerts**
   - Critical errors
   - Service outages
   - Performance degradation

2. **Slack/Teams Notifications**
   - Real-time alerts
   - Error summaries
   - Performance reports

3. **PagerDuty Integration**
   - Critical incidents
   - On-call escalation
   - Incident management

---

## Dashboard Setup

### Grafana Dashboard

Create a Grafana dashboard to visualize metrics:

#### Key Panels

1. **Request Rate**
   ```promql
   rate(http_requests_total[5m])
   ```

2. **Error Rate**
   ```promql
   rate(http_requests_total{status=~"5.."}[5m])
   ```

3. **Response Time (P95)**
   ```promql
   histogram_quantile(0.95, http_request_duration_seconds)
   ```

4. **Active Users**
   ```promql
   user_sessions_active
   ```

5. **API Success Rate**
   ```promql
   sum(rate(api_requests_total{status="success"}[5m])) / 
   sum(rate(api_requests_total[5m])) * 100
   ```

### Dashboard JSON

Import this dashboard configuration:

```json
{
  "dashboard": {
    "title": "Decision PRO Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])"
          }
        ]
      },
      {
        "title": "Response Time (P95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, http_request_duration_seconds)"
          }
        ]
      }
    ]
  }
}
```

---

## Log Aggregation

### Structured Logging

All logs are in JSON format:

```json
{
  "timestamp": "2024-12-01T12:00:00Z",
  "level": "info",
  "service": "decision-pro-admin",
  "correlation_id": "abc123",
  "message": "API request completed",
  "method": "GET",
  "path": "/api/customers",
  "status": 200,
  "duration_ms": 150
}
```

### Log Collection

#### Option 1: ELK Stack

```yaml
# Filebeat configuration
filebeat.inputs:
  - type: log
    paths:
      - /var/log/decision-pro-admin/*.log
    json.keys_under_root: true
    json.add_error_key: true
```

#### Option 2: Cloud Logging

- **AWS CloudWatch** - For AWS deployments
- **Google Cloud Logging** - For GCP deployments
- **Azure Monitor** - For Azure deployments

---

## Health Checks

### Application Health Endpoint

```bash
# Check application health
curl http://localhost:4009/api/health

# Response includes:
{
  "status": "healthy",
  "timestamp": "2024-12-01T12:00:00Z",
  "version": "1.0.0",
  "uptime_seconds": 86400,
  "services": {
    "api_gateway": {
      "status": "healthy",
      "response_time_ms": 50
    },
    "credit_scoring": {
      "status": "healthy",
      "response_time_ms": 100
    }
  },
  "dependencies": {
    "database": "healthy",
    "redis": "healthy",
    "websocket": "healthy"
  }
}
```

### Dependency Health Checks

Monitor dependencies:

1. **API Gateway**
   ```bash
   curl http://196.188.249.48:4000/health
   ```

2. **Credit Scoring Service**
   ```bash
   curl http://196.188.249.48:4001/health
   ```

3. **Database** (if applicable)
   ```bash
   # Check database connectivity
   ```

4. **Redis** (if applicable)
   ```bash
   # Check Redis connectivity
   ```

---

## Monitoring Best Practices

### 1. Set Appropriate Thresholds

- **Warning Thresholds** - Alert before critical issues
- **Critical Thresholds** - Immediate action required
- **Baseline Metrics** - Understand normal behavior

### 2. Monitor Trends

- Track metrics over time
- Identify patterns and anomalies
- Compare current vs. historical data

### 3. Correlate Metrics

- Link application metrics with business metrics
- Correlate errors with performance
- Track user impact of issues

### 4. Regular Reviews

- Weekly metric reviews
- Monthly performance reports
- Quarterly capacity planning

---

## Monitoring Tools Integration

### Recommended Tools

1. **Prometheus + Grafana**
   - Metrics collection and visualization
   - Alerting capabilities
   - Open source

2. **Sentry**
   - Error tracking
   - Performance monitoring
   - Release tracking

3. **Datadog / New Relic**
   - Full-stack observability
   - APM (Application Performance Monitoring)
   - Infrastructure monitoring

4. **LogRocket**
   - Session replay
   - User behavior tracking
   - Error reproduction

---

## Example Monitoring Setup

### Complete Setup Script

```bash
#!/bin/bash

# Install Prometheus
wget https://github.com/prometheus/prometheus/releases/download/v2.45.0/prometheus-2.45.0.linux-amd64.tar.gz
tar xvfz prometheus-*.tar.gz
cd prometheus-*

# Configure Prometheus
cat > prometheus.yml <<EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'decision-pro-admin'
    static_configs:
      - targets: ['localhost:4009']
EOF

# Start Prometheus
./prometheus --config.file=prometheus.yml
```

---

## Troubleshooting Monitoring Issues

### Metrics Not Appearing

1. **Check Metrics Endpoint**
   ```bash
   curl http://localhost:4009/metrics
   ```

2. **Verify Prometheus Configuration**
   - Check scrape configuration
   - Verify target is reachable
   - Check firewall rules

3. **Check Application Logs**
   - Look for metric collection errors
   - Verify metric names are correct

### Alerts Not Firing

1. **Verify Alert Rules**
   - Check Prometheus alert rules
   - Verify alert expressions
   - Test alert queries

2. **Check Alert Manager**
   - Verify Alertmanager is running
   - Check alert routing configuration
   - Test notification channels

---

**Last Updated:** December 2024



