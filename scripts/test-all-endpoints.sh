#!/bin/bash

# Test All Endpoints Script
# Tests all 10 endpoints from Phase 1 integration fix plan

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
API_KEY="${NEXT_PUBLIC_API_KEY:-ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4}"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASSED=0
FAILED=0
TOTAL=0

# Function to test an endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    TOTAL=$((TOTAL + 1))
    echo -e "\n${YELLOW}Testing: ${description}${NC}"
    echo "  Method: $method"
    echo "  Endpoint: $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            "$API_GATEWAY_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "X-API-Key: $API_KEY" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$API_GATEWAY_URL$endpoint" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        echo "  Response: $(echo "$body" | head -c 200)..."
        PASSED=$((PASSED + 1))
        return 0
    elif [ "$http_code" -eq 401 ]; then
        echo -e "  ${YELLOW}⚠ UNAUTHORIZED${NC} (HTTP $http_code) - Authentication required"
        FAILED=$((FAILED + 1))
        return 1
    elif [ "$http_code" -eq 404 ]; then
        echo -e "  ${RED}✗ NOT FOUND${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
        return 1
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
        echo "  Response: $(echo "$body" | head -c 200)..."
        FAILED=$((FAILED + 1))
        return 1
    fi
}

echo "=========================================="
echo "Endpoint Testing Script"
echo "=========================================="
echo "API Gateway URL: $API_GATEWAY_URL"
echo ""

# Test 1: Analytics Dashboard
test_endpoint "GET" "/api/analytics?type=dashboard" \
    "Analytics Dashboard Data"

# Test 2: Customer Stats Overview
test_endpoint "GET" "/api/customers/stats/overview" \
    "Customer Stats Overview"

# Test 3: Recommendations Statistics
test_endpoint "GET" "/api/intelligence/recommendations/statistics" \
    "Recommendations Statistics"

# Test 4: Real-time Scoring
test_endpoint "GET" "/api/scoring/realtime" \
    "Real-time Scoring"

# Test 5: Risk Alerts
test_endpoint "GET" "/api/risk/alerts" \
    "Risk Alerts"

# Test 6: Customer Journey Statistics
test_endpoint "GET" "/api/intelligence/journey/statistics" \
    "Customer Journey Statistics"

# Test 7: Data Drift Detection
test_endpoint "GET" "/api/ml/drift" \
    "Data Drift Detection"

# Test 8: Pricing History (requires customer_id - using test ID)
test_endpoint "GET" "/api/risk/pricing/history/test-customer-123" \
    "Pricing History"

# Test 9: Default Prediction History
test_endpoint "GET" "/api/predictions/default/history?page=1&page_size=10" \
    "Default Prediction History"

# Test 10: Scoring History
test_endpoint "GET" "/api/scoring/history?page=1&page_size=10" \
    "Scoring History"

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo "Total Tests: $TOTAL"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed.${NC}"
    exit 1
fi

