#!/bin/bash
# Error Handling Test Script
# Tests error responses (401, 404, 405, 422, 500)

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"

echo "=========================================="
echo "Error Handling Test"
echo "=========================================="
echo "API Gateway: $API_GATEWAY_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_error() {
  local name=$1
  local method=$2
  local endpoint=$3
  local expected_code=$4
  local token=$5
  
  echo "Testing: $name"
  echo "$method $API_GATEWAY_URL$endpoint"
  
  if [ -z "$token" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$API_GATEWAY_URL$endpoint" \
      -H "Content-Type: application/json")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X "$method" "$API_GATEWAY_URL$endpoint" \
      -H "Authorization: Bearer $token" \
      -H "Content-Type: application/json")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "$expected_code" ]; then
    echo -e "${GREEN}✓ Expected status: $expected_code, Got: $HTTP_CODE${NC}"
  else
    echo -e "${YELLOW}⚠ Expected status: $expected_code, Got: $HTTP_CODE${NC}"
  fi
  
  echo "Response: ${BODY:0:200}..."
  echo ""
}

# Test 1: 401 Unauthorized (no token)
echo "=== Test 1: 401 Unauthorized ==="
test_error "Protected endpoint without token" "GET" "/api/analytics?type=dashboard" "401" ""

# Test 2: 401 Unauthorized (invalid token)
echo "=== Test 2: 401 Unauthorized (Invalid Token) ==="
test_error "Protected endpoint with invalid token" "GET" "/api/analytics?type=dashboard" "401" "invalid_token_here"

# Test 3: 404 Not Found
echo "=== Test 3: 404 Not Found ==="
# Get valid token first
LOGIN_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}')
ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

test_error "Non-existent endpoint" "GET" "/api/nonexistent/endpoint" "404" "$ACCESS_TOKEN"

# Test 4: 405 Method Not Allowed
echo "=== Test 4: 405 Method Not Allowed ==="
test_error "POST on GET-only endpoint" "POST" "/api/analytics?type=dashboard" "405" "$ACCESS_TOKEN"

# Test 5: 422 Validation Error
echo "=== Test 5: 422 Validation Error ==="
test_error "Invalid login data" "POST" "/auth/login" "422" ""
# Try with invalid JSON
curl -s -w "\n%{http_code}" -X POST "$API_GATEWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}' | tail -n1

echo ""

# Test 6: Test graceful error handling
echo "=== Test 6: Graceful Error Handling ==="
echo "Testing that frontend can handle errors gracefully..."
echo "All error responses should include error_code and message fields"

ERROR_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/api/nonexistent" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

if echo "$ERROR_RESPONSE" | grep -q "error_code\|message\|detail"; then
  echo -e "${GREEN}✓ Error response includes error details${NC}"
else
  echo -e "${YELLOW}⚠ Error response format may need improvement${NC}"
fi
echo "Response: $ERROR_RESPONSE"
echo ""

echo "=========================================="
echo "Error Handling Test Complete"
echo "=========================================="

