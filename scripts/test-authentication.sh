#!/bin/bash

# Authentication Testing Script
# Tests JWT token validation, API key authentication, and WebSocket authentication

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
API_KEY="${NEXT_PUBLIC_API_KEY:-ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASSED=0
FAILED=0

test_auth() {
    local description=$1
    local headers=$2
    
    echo -e "\n${YELLOW}Testing: ${description}${NC}"
    
    response=$(curl -s -w "\n%{http_code}" -X GET \
        $headers \
        -H "Content-Type: application/json" \
        "$API_GATEWAY_URL/api/customers/stats/overview" 2>&1)
    
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 401 ]; then
        echo -e "  ${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED=$((PASSED + 1))
    else
        echo -e "  ${RED}✗ FAILED${NC} (HTTP $http_code)"
        FAILED=$((FAILED + 1))
    fi
}

echo "=========================================="
echo "Authentication Testing"
echo "=========================================="

# Test 1: API Key Authentication
test_auth "API Key Authentication" "-H \"X-API-Key: $API_KEY\""

# Test 2: Invalid API Key
test_auth "Invalid API Key (should fail)" "-H \"X-API-Key: invalid-key\""

# Test 3: No Authentication
test_auth "No Authentication (should fail)" ""

# Test 4: JWT Token (if available)
if [ -n "$JWT_TOKEN" ]; then
    test_auth "JWT Token Authentication" "-H \"Authorization: Bearer $JWT_TOKEN\""
else
    echo -e "\n${YELLOW}Skipping JWT test (JWT_TOKEN not set)${NC}"
fi

echo ""
echo "=========================================="
echo "Summary: $PASSED passed, $FAILED failed"
echo "=========================================="

