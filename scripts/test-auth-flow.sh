#!/bin/bash
# Authentication Flow Test Script
# Tests login, token refresh, and protected endpoint access

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
TEST_USERNAME="${TEST_USERNAME:-admin}"
TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

echo "=========================================="
echo "Authentication Flow Test"
echo "=========================================="
echo "API Gateway: $API_GATEWAY_URL"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Login
echo "Test 1: Login"
echo "POST $API_GATEWAY_URL/auth/login"
LOGIN_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USERNAME\", \"password\": \"$TEST_PASSWORD\"}")

if echo "$LOGIN_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✓ Login successful${NC}"
  ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  REFRESH_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"refresh_token":"[^"]*' | cut -d'"' -f4)
  echo "Access Token: ${ACCESS_TOKEN:0:50}..."
  echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo ""

# Test 2: Access Protected Endpoint
echo "Test 2: Access Protected Endpoint"
echo "GET $API_GATEWAY_URL/api/analytics?type=dashboard"
PROTECTED_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/api/analytics?type=dashboard" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json")

if echo "$PROTECTED_RESPONSE" | grep -q "success\|analytics\|dashboard"; then
  echo -e "${GREEN}✓ Protected endpoint accessible${NC}"
else
  if echo "$PROTECTED_RESPONSE" | grep -q "401\|Unauthorized"; then
    echo -e "${RED}✗ 401 Unauthorized - Token may be invalid${NC}"
  else
    echo -e "${YELLOW}⚠ Unexpected response${NC}"
  fi
  echo "Response: $PROTECTED_RESPONSE"
fi

echo ""

# Test 3: Token Refresh
echo "Test 3: Token Refresh"
echo "POST $API_GATEWAY_URL/auth/refresh"
REFRESH_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/auth/refresh" \
  -H "Content-Type: application/json" \
  -d "{\"refresh_token\": \"$REFRESH_TOKEN\"}")

if echo "$REFRESH_RESPONSE" | grep -q "access_token"; then
  echo -e "${GREEN}✓ Token refresh successful${NC}"
  NEW_ACCESS_TOKEN=$(echo "$REFRESH_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "New Access Token: ${NEW_ACCESS_TOKEN:0:50}..."
else
  echo -e "${RED}✗ Token refresh failed${NC}"
  echo "Response: $REFRESH_RESPONSE"
fi

echo ""

# Test 4: Access with Refreshed Token
echo "Test 4: Access with Refreshed Token"
if [ ! -z "$NEW_ACCESS_TOKEN" ]; then
  REFRESHED_RESPONSE=$(curl -s -X GET "$API_GATEWAY_URL/api/analytics?type=dashboard" \
    -H "Authorization: Bearer $NEW_ACCESS_TOKEN" \
    -H "Content-Type: application/json")
  
  if echo "$REFRESHED_RESPONSE" | grep -q "success\|analytics\|dashboard"; then
    echo -e "${GREEN}✓ Refreshed token works${NC}"
  else
    echo -e "${YELLOW}⚠ Refreshed token response: $REFRESHED_RESPONSE${NC}"
  fi
fi

echo ""
echo "=========================================="
echo "Authentication Flow Test Complete"
echo "=========================================="

