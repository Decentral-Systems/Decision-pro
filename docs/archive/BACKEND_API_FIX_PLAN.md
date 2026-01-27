# Backend API Fix Plan
**Date:** December 31, 2025  
**Status:** Ready for Implementation

---

## 📋 Executive Summary

### Failing Endpoints Identified

1. **`/api/v1/health`** - Returns 404
   - **Current Status:** Endpoint doesn't exist
   - **Impact:** Low (health check at `/health` works)
   - **Priority:** Low

2. **`/api/predictions/default/history`** - Returns 404
   - **Current Status:** Endpoint exists but at different path
   - **Impact:** Medium (frontend may be calling wrong path)
   - **Priority:** Medium

3. **`/api/customers/invalid-id-12345`** - Returns 401 instead of 404
   - **Current Status:** Authentication middleware runs before resource check
   - **Impact:** Low (expected behavior for protected endpoints)
   - **Priority:** Low

---

## 🔍 Detailed Analysis

### Issue 1: `/api/v1/health` Endpoint Missing

#### Current State
- ✅ `/health` endpoint exists and works (HTTP 200)
- ❌ `/api/v1/health` endpoint doesn't exist (HTTP 404)

#### Root Cause
- The health endpoint is registered at `/health` in `main.py` (line 703-704)
- No `/api/v1/health` endpoint is defined
- Tests are expecting a versioned health endpoint

#### Location
- **File:** `/home/AIS/api_gateway/app/main.py`
- **Line:** 703-780 (health endpoint definition)

#### Solution Options

**Option A: Add `/api/v1/health` endpoint (Recommended)**
- Add a new endpoint that mirrors `/health`
- Maintains backward compatibility
- Provides versioned API endpoint

**Option B: Update tests to use `/health`**
- Change test expectations
- Simpler but less flexible

**Recommendation:** Option A - Add the endpoint for API versioning consistency

---

### Issue 2: `/api/predictions/default/history` Endpoint Path Mismatch

#### Current State
- ✅ Endpoint exists at: `/api/intelligence/predictions/default/history`
- ❌ Tests are calling: `/api/predictions/default/history`
- **Path Mismatch:** Missing `/intelligence` in the path

#### Root Cause
- History router has prefix: `/api/intelligence` (line 17 in `history.py`)
- Endpoint defined as: `/predictions/default/history` (line 454)
- Full path: `/api/intelligence/predictions/default/history`
- Test is calling: `/api/predictions/default/history`

#### Location
- **File:** `/home/AIS/api_gateway/app/routers/history.py`
- **Line:** 17 (router prefix), 454 (endpoint definition)

#### Solution Options

**Option A: Add alias endpoint (Recommended)**
- Add `/api/predictions/default/history` that forwards to main endpoint
- Maintains backward compatibility
- Supports both paths

**Option B: Update frontend/tests to use correct path**
- Change all references to `/api/intelligence/predictions/default/history`
- More accurate but requires frontend changes

**Option C: Change router prefix**
- Change prefix from `/api/intelligence` to `/api`
- Simpler but may break other endpoints

**Recommendation:** Option A - Add alias for backward compatibility

---

### Issue 3: Authentication Order (401 vs 404)

#### Current State
- Request to `/api/customers/invalid-id-12345` returns 401
- Test expects 404 (resource not found)
- Authentication middleware runs before resource validation

#### Root Cause
- FastAPI middleware order: Authentication runs first
- Resource validation happens after authentication
- This is standard behavior for protected endpoints

#### Location
- **File:** `/home/AIS/api_gateway/app/middleware.py` or authentication dependencies

#### Solution Options

**Option A: Keep current behavior (Recommended)**
- 401 before 404 is standard for protected endpoints
- Prevents information leakage about resource existence
- Standard REST API behavior

**Option B: Check resource existence before authentication**
- More complex implementation
- May leak information about resource existence
- Not recommended for security

**Recommendation:** Option A - Update test expectations (this is correct behavior)

---

## 🛠️ Implementation Plan

### Phase 1: Fix Health Endpoint (Low Priority)

#### Step 1.1: Add `/api/v1/health` endpoint
**File:** `/home/AIS/api_gateway/app/main.py`

```python
# Add after line 780 (after existing /health endpoint)

@app.get(
    "/api/v1/health",
    tags=["Administration"],
    summary="Service health (v1)",
    response_model=dict,
    responses={
        200: {
            "description": "Aggregated health response",
            "content": {
                "application/json": {
                    "examples": {
                        "healthy": {
                            "summary": "Healthy response",
                            "value": {
                                "status": "healthy",
                                "service": "api_gateway",
                                "version": "2.0.0",
                                "timestamp": "2025-11-16T12:34:56.000000",
                            }
                        }
                    }
                }
            }
        }
    }
)
async def health_check_v1():
    """Versioned health check endpoint"""
    # Reuse the same logic as /health endpoint
    return await health_check()
```

**Estimated Time:** 15 minutes

#### Step 1.2: Test the endpoint
```bash
curl -X GET "http://196.188.249.48:4000/api/v1/health" \
  -H "accept: application/json"
```

**Expected Result:** HTTP 200 with health status

---

### Phase 2: Fix Default Prediction History Endpoint (Medium Priority)

#### Step 2.1: Add alias endpoint in history router
**File:** `/home/AIS/api_gateway/app/routers/history.py`

```python
# Add after line 477 (after existing alias endpoint)

# Additional alias for frontend compatibility: /api/predictions/default/history
@router.get("/../predictions/default/history", response_model=DefaultPredictionHistoryResponse, include_in_schema=False)
async def get_default_prediction_history_alias_v2(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    min_probability: Optional[float] = Query(None, ge=0, le=1, description="Minimum default probability"),
    max_probability: Optional[float] = Query(None, ge=0, le=1, description="Maximum default probability"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
):
    """Alias for /api/intelligence/predictions/default/history - supports /api/predictions/default/history path"""
    return await get_default_prediction_history(
        customer_id=customer_id,
        start_date=start_date,
        end_date=end_date,
        min_probability=min_probability,
        max_probability=max_probability,
        risk_level=risk_level,
        page=page,
        page_size=page_size,
    )
```

**Better Approach:** Add a separate router with different prefix

**File:** `/home/AIS/api_gateway/app/routers/history.py`

Add at the end of the file:

```python
# Create a separate router for alias endpoints
alias_router = APIRouter(prefix="/api", tags=["History"])

@alias_router.get("/predictions/default/history", response_model=DefaultPredictionHistoryResponse)
async def get_default_prediction_history_alias_v2(
    customer_id: Optional[str] = Query(None, description="Filter by customer ID"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    min_probability: Optional[float] = Query(None, ge=0, le=1, description="Minimum default probability"),
    max_probability: Optional[float] = Query(None, ge=0, le=1, description="Maximum default probability"),
    risk_level: Optional[str] = Query(None, description="Filter by risk level"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Items per page"),
):
    """Alias for /api/intelligence/predictions/default/history - supports /api/predictions/default/history path"""
    return await get_default_prediction_history(
        customer_id=customer_id,
        start_date=start_date,
        end_date=end_date,
        min_probability=min_probability,
        max_probability=max_probability,
        risk_level=risk_level,
        page=page,
        page_size=page_size,
    )
```

**File:** `/home/AIS/api_gateway/app/main.py`

Add after line 1084 (where history router is included):

```python
# Include alias router for backward compatibility
from .routers.history import alias_router
app.include_router(alias_router)
```

**Estimated Time:** 30 minutes

#### Step 2.2: Test the endpoint
```bash
curl -X GET "http://196.188.249.48:4000/api/predictions/default/history?page=1&page_size=10" \
  -H "X-API-Key: ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4" \
  -H "accept: application/json"
```

**Expected Result:** HTTP 200 with prediction history data

---

### Phase 3: Update Test Expectations (Low Priority)

#### Step 3.1: Update error scenario test
**File:** `/home/AIS/decision-pro-admin/scripts/test-error-scenarios.sh`

Update the test to expect 401 instead of 404 for protected endpoints:

```bash
# Test 3: 404 Not Found (invalid customer) - Should return 401 first (authentication required)
test_error "401 Unauthorized (invalid customer)" "/api/customers/invalid-id-12345" "401" \
    "-H \"X-API-Key: invalid-key\""
```

**Estimated Time:** 5 minutes

---

## 🧪 Testing Plan

### Test 1: Health Endpoint
```bash
# Test /api/v1/health
curl -X GET "http://196.188.249.48:4000/api/v1/health" \
  -H "accept: application/json"

# Expected: HTTP 200
```

### Test 2: Default Prediction History
```bash
# Test /api/predictions/default/history
curl -X GET "http://196.188.249.48:4000/api/predictions/default/history?page=1&page_size=10" \
  -H "X-API-Key: ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4" \
  -H "accept: application/json"

# Expected: HTTP 200 with prediction history
```

### Test 3: Run Full Test Suite
```bash
cd /home/AIS/decision-pro-admin
./scripts/comprehensive-test-suite.sh
./scripts/test-all-endpoints.sh
```

**Expected:** All tests pass (100% success rate)

---

## 🚀 Enhancements

### Enhancement 1: API Versioning Strategy

#### Current State
- Mixed versioning: Some endpoints use `/api/v1/`, others use `/api/`
- No consistent versioning strategy

#### Proposed Enhancement
1. **Standardize API versioning:**
   - All endpoints under `/api/v1/` for version 1
   - Health endpoint: `/api/v1/health`
   - History endpoints: `/api/v1/predictions/default/history`
   - Maintain backward compatibility with aliases

2. **Add version header support:**
   - Support `Accept: application/vnd.ais.v1+json`
   - Allow version negotiation

3. **Document versioning policy:**
   - Add to API documentation
   - Include deprecation notices

**Estimated Time:** 2 hours

---

### Enhancement 2: Enhanced Error Responses

#### Current State
- Basic error responses
- No detailed error context

#### Proposed Enhancement
1. **Structured error responses:**
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Customer not found",
    "resource": "customer",
    "resource_id": "invalid-id-12345",
    "timestamp": "2025-12-31T17:00:00Z",
    "correlation_id": "abc123"
  }
}
```

2. **Error code standardization:**
   - `RESOURCE_NOT_FOUND` - 404
   - `UNAUTHORIZED` - 401
   - `FORBIDDEN` - 403
   - `VALIDATION_ERROR` - 422

**Estimated Time:** 1 hour

---

### Enhancement 3: Endpoint Discovery

#### Current State
- No endpoint discovery mechanism
- Developers must read documentation

#### Proposed Enhancement
1. **Add `/api/v1/endpoints` endpoint:**
```json
{
  "version": "1.0",
  "endpoints": {
    "health": "/api/v1/health",
    "predictions": {
      "default_history": "/api/v1/predictions/default/history",
      "aliases": [
        "/api/predictions/default/history",
        "/api/intelligence/predictions/default/history"
      ]
    }
  }
}
```

**Estimated Time:** 30 minutes

---

## 📊 Implementation Timeline

| Phase | Task | Priority | Estimated Time | Status |
|-------|------|----------|----------------|--------|
| 1 | Add `/api/v1/health` endpoint | Low | 15 min | ⏳ Pending |
| 2 | Add `/api/predictions/default/history` alias | Medium | 30 min | ⏳ Pending |
| 3 | Update test expectations | Low | 5 min | ⏳ Pending |
| 4 | Run comprehensive tests | High | 10 min | ⏳ Pending |
| 5 | API versioning strategy | Low | 2 hours | ⏳ Optional |
| 6 | Enhanced error responses | Low | 1 hour | ⏳ Optional |
| 7 | Endpoint discovery | Low | 30 min | ⏳ Optional |

**Total Core Fix Time:** ~1 hour  
**Total with Enhancements:** ~4 hours

---

## ✅ Success Criteria

### Core Fixes
- ✅ `/api/v1/health` returns HTTP 200
- ✅ `/api/predictions/default/history` returns HTTP 200
- ✅ All existing endpoints continue to work
- ✅ Test suite passes at 100%

### Enhancements (Optional)
- ✅ Consistent API versioning
- ✅ Enhanced error responses
- ✅ Endpoint discovery mechanism

---

## 🔄 Rollback Plan

If issues occur:

1. **Revert code changes:**
   ```bash
   cd /home/AIS/api_gateway
   git checkout app/main.py app/routers/history.py
   ```

2. **Restart services:**
   ```bash
   docker-compose restart api-gateway
   ```

3. **Verify health:**
   ```bash
   curl http://196.188.249.48:4000/health
   ```

---

## 📝 Notes

- All changes maintain backward compatibility
- No breaking changes to existing endpoints
- Tests can be updated incrementally
- Enhancements are optional and can be done separately

---

**Next Steps:**
1. Review and approve this plan
2. Implement Phase 1 (Health endpoint)
3. Implement Phase 2 (History endpoint alias)
4. Run comprehensive tests
5. Deploy to production

