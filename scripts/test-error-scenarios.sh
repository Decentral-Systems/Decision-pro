#!/bin/bash

# Error Scenario Testing Script
# Tests 401, 404, 500 error handling

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

test_error() {
    local description=$1
    local endpoint=$2
    local expected_code=$3
    local headers=$4
    
    echo -e "\n${YELLOW}Testing: ${description}${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X GET \
        $headers \
        -H "Content-Type: application/json" \
        "$API_GATEWAY_URL$endpoint" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq "$expected_code" ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code as expected)"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}✗ FAILED${NC} (Expected $expected_code, got $http_code)"
        FAILED=$((FAILED + 1))
    fi
}

echo "=========================================="
echo "Error Scenario Testing"
echo "=========================================="

# Test 1: 401 Unauthorized (invalid token)
test_error "401 Unauthorized" "/api/customers/stats/overview" "401" \
    "-H \"Authorization: Bearer invalid-token\""

# Test 2: 404 Not Found (invalid endpoint)
test_error "404 Not Found" "/api/invalid/endpoint" "404" \
    "-H \"X-API-Key: $API_KEY\""

# Test 3: 401 Unauthorized (invalid customer) - Protected endpoints return 401 before 404
test_error "401 Unauthorized (invalid customer)" "/api/customers/invalid-id-12345" "401" \
    "-H \"X-API-Key: invalid-key\""

echo ""
echo "=========================================="
echo "Summary: $PASSED passed, $FAILED failed"
echo "=========================================="

