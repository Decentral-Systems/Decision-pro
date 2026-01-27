#!/bin/bash
# Core Endpoints Test Script
# Tests all core API endpoints

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
TEST_USERNAME="${TEST_USERNAME:-admin}"
TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

echo "=========================================="
echo "Core Endpoints Test"
echo "=========================================="
echo "API Gateway: $API_GATEWAY_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Get access token
echo "Authenticating..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_GATEWAY_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$TEST_USERNAME\", \"password\": \"$TEST_PASSWORD\"}")

ACCESS_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo -e "${RED}✗ Authentication failed${NC}"
  exit 1
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Test endpoints
test_endpoint() {
  local name=$1
  local method=$2
  local endpoint=$3
  local data=$4
  
  echo "Testing: $name"
  echo "$method $API_GATEWAY_URL$endpoint"
  
  if [ "$method" = "GET" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_GATEWAY_URL$endpoint" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json")
  else
    RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_GATEWAY_URL$endpoint" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" \
      -d "$data")
  fi
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  BODY=$(echo "$RESPONSE" | sed '$d')
  
  if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}✓ Status: $HTTP_CODE${NC}"
  elif [ "$HTTP_CODE" = "401" ]; then
    echo -e "${RED}✗ Status: $HTTP_CODE (Unauthorized)${NC}"
  elif [ "$HTTP_CODE" = "404" ]; then
    echo -e "${YELLOW}⚠ Status: $HTTP_CODE (Not Found)${NC}"
  elif [ "$HTTP_CODE" = "405" ]; then
    echo -e "${YELLOW}⚠ Status: $HTTP_CODE (Method Not Allowed)${NC}"
  else
    echo -e "${YELLOW}⚠ Status: $HTTP_CODE${NC}"
  fi
  
  echo "Response: ${BODY:0:200}..."
  echo ""
}

# Dashboard Endpoints
test_endpoint "Dashboard Analytics" "GET" "/api/analytics?type=dashboard"
test_endpoint "Model Performance" "GET" "/api/v1/analytics/models/performance?model_name=ensemble"
test_endpoint "Model Comparison" "GET" "/api/v1/analytics/models/comparison"

# Customer Endpoints
test_endpoint "Customers List" "GET" "/api/customers/?limit=10"
test_endpoint "Customer 360" "GET" "/api/intelligence/customer360/CUST_0001"

# Admin Endpoints
test_endpoint "Admin Users" "GET" "/api/v1/admin/users?page=1&page_size=20"
test_endpoint "Audit Logs" "GET" "/api/v1/audit/logs?page=1&page_size=20"
test_endpoint "User Activity" "GET" "/api/v1/admin/users/1/activity?page=1&page_size=20"

# Credit Scoring Endpoints
test_endpoint "Realtime Scoring Feed" "GET" "/api/scoring/realtime?limit=20"

# Product Recommendations
test_endpoint "Product Recommendations" "GET" "/api/intelligence/products/recommendations?limit=10"

# Recommendations Statistics
test_endpoint "Recommendations Statistics" "GET" "/api/intelligence/recommendations/statistics"

# Customer Stats
test_endpoint "Customer Stats Overview" "GET" "/api/customers/stats/overview"

echo "=========================================="
echo "Core Endpoints Test Complete"
echo "=========================================="

