# API Endpoint Mapping Reference

**Date:** January 2025  
**Purpose:** Complete reference of frontend-to-backend endpoint mappings

---

## Overview

This document provides a complete mapping of frontend API endpoint expectations to backend actual routes, including HTTP methods, authentication requirements, and response formats.

---

## Authentication Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/auth/login` | `/auth/login` | POST | None | ✅ Working |
| `/auth/refresh` | `/auth/refresh` | POST | None | ✅ Working |
| `/auth/logout` | `/auth/logout` | POST | Required | ✅ Working |

---

## Dashboard & Analytics Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/api/analytics?type=dashboard` | `/api/analytics?type=dashboard` | GET | Required | ✅ Fixed |
| `/api/v1/analytics/models/performance` | `/api/v1/analytics/models/performance` | GET | Required | ✅ Working |
| `/api/v1/analytics/models/comparison` | `/api/v1/analytics/models/comparison` | GET | Required | ✅ Working |
| `/api/v1/analytics/predictions/trends` | `/api/v1/analytics/predictions/trends` | GET | Required | ✅ Working |
| `/api/intelligence/recommendations/statistics` | `/api/intelligence/recommendations/statistics` | GET | Required | ✅ Fixed |
| `/api/customers/stats/overview` | `/api/customers/stats/overview` | GET | Required | ✅ Fixed |

---

## Customer Management Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/api/customers/` | `/api/customers/` | GET | Required | ✅ Created |
| `/api/customers/{id}` | `/api/customers/{id}` | GET | Required | ✅ Working |
| `/api/customers` | `/api/customers` | POST | Required | ✅ Working |
| `/api/customers/{id}` | `/api/customers/{id}` | PUT | Required | ✅ Working |
| `/api/intelligence/customer360/{id}` | `/api/intelligence/customer360/{id}` | GET | Required | ✅ Working |

---

## Admin Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/api/v1/admin/users` | `/api/v1/admin/users` | GET | Admin | ✅ Created |
| `/api/admin/users/{id}` | `/api/admin/users/{id}` | GET | Admin | ✅ Working |
| `/api/v1/admin/users/{id}/activity` | `/api/v1/admin/users/{id}/activity` | GET | Admin | ✅ Created |
| `/api/v1/audit/logs` | `/api/v1/audit/logs` | GET | Audit Read | ✅ Enhanced |
| `/api/admin/settings` | `/api/admin/settings` | GET | Admin | ✅ Working |
| `/api/admin/settings` | `/api/admin/settings` | PUT | Admin | ✅ Working |
| `/api/admin/settings/reset` | `/api/admin/settings/reset` | POST | Admin | ✅ Working |

---

## Credit Scoring Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/api/scoring/realtime?limit=20` | `/api/scoring/realtime?limit=20` | GET | Required | ✅ Created |
| `/api/intelligence/credit-scoring/realtime` | `/api/intelligence/credit-scoring/realtime` | POST | Required | ✅ Working |
| `/api/v1/credit-scoring/batch` | `/api/v1/credit-scoring/batch` | POST | Required | ✅ Working |

---

## Product Intelligence Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/api/intelligence/products/recommendations?limit=10` | `/api/intelligence/products/recommendations?limit=10` | GET | Required | ✅ Created |
| `/api/intelligence/products/recommendations` | `/api/intelligence/products/recommendations` | POST | Required | ✅ Working |
| `/api/intelligence/products/{type}/quote` | `/api/intelligence/products/{type}/quote` | POST | Required | ✅ Working |

---

## ML Operations Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/api/v1/mlops/feature-importance` | `/api/v1/mlops/feature-importance` | GET | Required | ✅ Working |
| `/api/v1/mlops/monitoring/drift` | `/api/v1/mlops/monitoring/drift` | GET | Required | ⚠️ 404 (Optional) |

---

## Compliance Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/api/compliance/metrics` | `/api/compliance/metrics` | GET | Required | ⚠️ 404 (Optional) |
| `/api/compliance/violations` | `/api/compliance/violations` | GET | Required | ⚠️ 404 (Optional) |
| `/api/compliance/reports/generate` | `/api/compliance/reports/generate` | POST | Required | ⚠️ 404 (Optional) |

---

## System Endpoints

| Frontend | Backend | Method | Auth | Status |
|----------|---------|--------|------|--------|
| `/health` | `/health` | GET | None | ✅ Working |
| `/api/system/status` | `/api/v1/system/status` | GET | Admin | ✅ Working |

---

## Endpoint Status Legend

- ✅ **Working** - Endpoint exists and is functional
- ✅ **Fixed** - Endpoint was fixed during integration
- ✅ **Created** - Endpoint was created during integration
- ✅ **Enhanced** - Endpoint was enhanced during integration
- ⚠️ **404 (Optional)** - Endpoint not found but frontend handles gracefully

---

## Authentication Requirements

### No Authentication Required
- `/health`
- `/auth/login`
- `/auth/refresh`

### Authentication Required (Any User)
- Most business endpoints
- Analytics endpoints
- Customer management endpoints

### Admin Role Required
- `/api/v1/admin/users`
- `/api/v1/admin/users/{id}/activity`
- `/api/admin/settings`
- `/api/v1/system/status`

### Audit Read Permission Required
- `/api/v1/audit/logs`

---

## Response Format Standards

### Success Response
```json
{
  "success": true,
  "data": {...},
  "correlation_id": "uuid",
  "timestamp": "ISO-8601"
}
```

### Paginated Response
```json
{
  "data": [...],
  "total": 100,
  "page": 1,
  "page_size": 20,
  "total_pages": 5,
  "has_more": true
}
```

### Error Response
```json
{
  "error_code": "ERROR_CODE",
  "message": "Human-readable message",
  "correlation_id": "uuid",
  "timestamp": "ISO-8601",
  "status_code": 400
}
```

---

## Changes Made During Integration

### Endpoint Path Updates
1. Admin users: `/api/admin/users` → `/api/v1/admin/users`
2. Audit logs: `/api/admin/audit-logs` → `/api/v1/audit/logs`
3. User activity: `/api/admin/users/{id}/activity` → `/api/v1/admin/users/{id}/activity`

### Authentication Fixes
1. Analytics endpoint: Changed from permission-based to authentication-only
2. Recommendations statistics: Changed from permission-based to authentication-only
3. Customer stats: Changed from permission-based to authentication-only

### New Endpoints Created
1. `GET /api/scoring/realtime` - Realtime scoring feed
2. `GET /api/customers/` - Customers list
3. `GET /api/intelligence/products/recommendations` - Product recommendations (GET version)
4. `GET /api/v1/admin/users` - Admin users with pagination
5. `GET /api/v1/admin/users/{id}/activity` - User activity log

---

## Notes

- All endpoints now use consistent authentication (JWT Bearer tokens)
- Pagination is standardized across list endpoints
- Error responses follow consistent format
- Frontend gracefully handles missing optional endpoints
- All critical endpoints are functional

---

**Last Updated:** January 2025  
**Status:** ✅ Complete

