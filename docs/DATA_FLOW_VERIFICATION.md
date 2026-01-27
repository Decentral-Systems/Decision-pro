# Data Flow Verification Guide

**Date:** January 2025  
**Purpose:** Verify data format matches between frontend and backend

---

## Overview

This document provides procedures for verifying that data flows correctly between the frontend and backend, including response format validation, pagination, filtering, and sorting.

---

## Response Format Verification

### Standardized Response Format

Backend endpoints should return responses in this format:

```json
{
  "success": true,
  "data": {...},
  "correlation_id": "uuid",
  "timestamp": "ISO-8601",
  "metadata": {...}
}
```

### Error Response Format

```json
{
  "error_code": "ERROR_CODE",
  "message": "Human-readable message",
  "details": {...},
  "correlation_id": "uuid",
  "timestamp": "ISO-8601",
  "service": "api_gateway",
  "status_code": 400
}
```

---

## Endpoint-Specific Verification

### 1. Dashboard Analytics

**Endpoint:** `GET /api/analytics?type=dashboard`

**Expected Response:**
```json
{
  "success": true,
  "analytics": {
    "dashboard": {
      "summary": {
        "total_customers": 1000,
        "average_score": 720
      }
    }
  },
  "timestamp": "2025-01-XX..."
}
```

**Verification:**
- [ ] Response has `success` field
- [ ] Response has `analytics.dashboard` object
- [ ] Summary data is present
- [ ] Timestamp is ISO-8601 format

---

### 2. Admin Users List

**Endpoint:** `GET /api/v1/admin/users?page=1&page_size=20`

**Expected Response:**
```json
{
  "users": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5,
  "has_more": true
}
```

**Verification:**
- [ ] Response includes pagination fields
- [ ] `users` is an array
- [ ] `total` matches actual count
- [ ] Pagination calculations are correct

---

### 3. Audit Logs

**Endpoint:** `GET /api/v1/audit/logs?page=1&page_size=20`

**Expected Response:**
```json
{
  "logs": [...],
  "total": 500,
  "page": 1,
  "page_size": 20,
  "total_pages": 25,
  "has_more": true
}
```

**Verification:**
- [ ] Response includes pagination
- [ ] Log entries have required fields
- [ ] Timestamps are ISO-8601 format
- [ ] Pagination works correctly

---

### 4. User Activity

**Endpoint:** `GET /api/v1/admin/users/{id}/activity`

**Expected Response:**
```json
{
  "logs": [...],
  "total": 50,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "has_more": true
}
```

**Verification:**
- [ ] Response filtered by user_id
- [ ] Date filtering works (start_date, end_date)
- [ ] Pagination works
- [ ] Log entries are user-specific

---

## Pagination Testing

### Test Cases

1. **First Page:**
   ```bash
   curl "$API_GATEWAY_URL/api/v1/admin/users?page=1&page_size=20"
   ```
   - Verify: Returns first 20 items
   - Verify: `has_more` is true if total > 20

2. **Last Page:**
   ```bash
   curl "$API_GATEWAY_URL/api/v1/admin/users?page=5&page_size=20"
   ```
   - Verify: Returns remaining items
   - Verify: `has_more` is false

3. **Invalid Page:**
   ```bash
   curl "$API_GATEWAY_URL/api/v1/admin/users?page=0&page_size=20"
   ```
   - Verify: Returns 400 or 422 error

4. **Large Page Size:**
   ```bash
   curl "$API_GATEWAY_URL/api/v1/admin/users?page=1&page_size=1000"
   ```
   - Verify: Returns max allowed items (e.g., 100)
   - Verify: Error if exceeds max

---

## Filtering Testing

### Date Range Filtering

**User Activity with Date Range:**
```bash
curl "$API_GATEWAY_URL/api/v1/admin/users/1/activity?start_date=2025-01-01&end_date=2025-01-31"
```

**Verification:**
- [ ] Only logs within date range returned
- [ ] Date format is ISO-8601
- [ ] Invalid dates return error

---

## Sorting Testing

### Customers List Sorting

**Test Cases:**
1. Sort by credit_score descending
2. Sort by credit_score ascending
3. Sort by name
4. Invalid sort field

**Verification:**
- [ ] Results sorted correctly
- [ ] Invalid sort fields handled gracefully
- [ ] Default sort works

---

## Data Validation

### Frontend Response Normalization

The frontend uses `apiResponseNormalizer.ts` to normalize responses. Verify:

1. **Wrapped Responses:**
   ```json
   {
     "success": true,
     "data": {...}
   }
   ```
   Should extract `data` field

2. **Unwrapped Responses:**
   ```json
   {
     "users": [...],
     "total": 100
   }
   ```
   Should use as-is

3. **Error Responses:**
   ```json
   {
     "error_code": "ERROR",
     "message": "Error message"
   }
   ```
   Should normalize to standard error format

---

## Test Script

Create a data flow verification script:

```bash
#!/bin/bash
# Data Flow Verification Script

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"

# Get token
TOKEN=$(curl -s -X POST "$API_GATEWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}' \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

# Test pagination
echo "Testing pagination..."
curl -s "$API_GATEWAY_URL/api/v1/admin/users?page=1&page_size=20" \
  -H "Authorization: Bearer $TOKEN" | jq '.page, .page_size, .total_pages'

# Test filtering
echo "Testing date filtering..."
curl -s "$API_GATEWAY_URL/api/v1/admin/users/1/activity?start_date=2025-01-01" \
  -H "Authorization: Bearer $TOKEN" | jq '.logs | length'

# Test response format
echo "Testing response format..."
RESPONSE=$(curl -s "$API_GATEWAY_URL/api/analytics?type=dashboard" \
  -H "Authorization: Bearer $TOKEN")
echo "$RESPONSE" | jq 'has("success"), has("analytics")'
```

---

## Verification Checklist

- [ ] All responses match expected format
- [ ] Pagination works correctly
- [ ] Filtering works correctly
- [ ] Sorting works correctly
- [ ] Error responses are properly formatted
- [ ] Frontend can parse all response types
- [ ] Data types match (strings, numbers, dates)
- [ ] Timestamps are ISO-8601 format
- [ ] Null values handled correctly
- [ ] Empty arrays/objects handled correctly

---

## Common Issues

### Issue: Response format mismatch
**Solution:** Check `apiResponseNormalizer.ts` handles the response format

### Issue: Pagination not working
**Solution:** Verify backend calculates `total_pages` and `has_more` correctly

### Issue: Date filtering not working
**Solution:** Check date format (should be ISO-8601) and SQL query

### Issue: Sorting not working
**Solution:** Verify sort field exists and SQL ORDER BY clause

---

**Status:** ✅ Verification procedures documented  
**Next:** Execute verification when services are running

