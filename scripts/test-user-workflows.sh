#!/bin/bash
# User Workflows Test Script
# Tests complete user workflows end-to-end

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
TEST_USERNAME="${TEST_USERNAME:-admin}"
TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

echo "=========================================="
echo "User Workflows Test"
echo "=========================================="
echo "API Gateway: $API_GATEWAY_URL"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Helper function
make_request() {
  local method=$1
  local endpoint=$2
  local token=$3
  local data=$4
  
  if [ "$method" = "GET" ]; then
    if [ -z "$token" ]; then
      curl -s -w "\n%{http_code}" -X GET "$API_GATEWAY_URL$endpoint" \
        -H "Content-Type: application/json"
    else
      curl -s -w "\n%{http_code}" -X GET "$API_GATEWAY_URL$endpoint" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json"
    fi
  else
    if [ -z "$token" ]; then
      curl -s -w "\n%{http_code}" -X POST "$API_GATEWAY_URL$endpoint" \
        -H "Content-Type: application/json" \
        -d "$data"
    else
      curl -s -w "\n%{http_code}" -X POST "$API_GATEWAY_URL$endpoint" \
        -H "Authorization: Bearer $token" \
        -H "Content-Type: application/json" \
        -d "$data"
    fi
  fi
}

# Workflow 1: Login Flow
echo "=== Workflow 1: Login Flow ==="
echo "Step 1: User login"
LOGIN_RESPONSE=$(make_request "POST" "/auth/login" "" "{\"username\": \"$TEST_USERNAME\", \"password\": \"$TEST_PASSWORD\"}")
HTTP_CODE=$(echo "$LOGIN_RESPONSE" | tail -n1)
BODY=$(echo "$LOGIN_RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Login successful${NC}"
  ACCESS_TOKEN=$(echo "$BODY" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)
  echo "Step 2: Access protected page"
  DASHBOARD_RESPONSE=$(make_request "GET" "/api/analytics?type=dashboard" "$ACCESS_TOKEN")
  DASHBOARD_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n1)
  if [ "$DASHBOARD_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Protected page accessible${NC}"
  else
    echo -e "${YELLOW}⚠ Dashboard returned: $DASHBOARD_CODE${NC}"
  fi
else
  echo -e "${RED}✗ Login failed: $HTTP_CODE${NC}"
  exit 1
fi
echo ""

# Workflow 2: Dashboard View
echo "=== Workflow 2: Dashboard View ==="
echo "Step 1: Load dashboard"
DASHBOARD_RESPONSE=$(make_request "GET" "/api/analytics?type=dashboard" "$ACCESS_TOKEN")
DASHBOARD_CODE=$(echo "$DASHBOARD_RESPONSE" | tail -n1)
if [ "$DASHBOARD_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Dashboard loaded${NC}"
  echo "Step 2: Fetch analytics"
  ANALYTICS_RESPONSE=$(make_request "GET" "/api/v1/analytics/models/performance?model_name=ensemble" "$ACCESS_TOKEN")
  ANALYTICS_CODE=$(echo "$ANALYTICS_RESPONSE" | tail -n1)
  if [ "$ANALYTICS_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Analytics fetched${NC}"
  else
    echo -e "${YELLOW}⚠ Analytics returned: $ANALYTICS_CODE${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Dashboard returned: $DASHBOARD_CODE${NC}"
fi
echo ""

# Workflow 3: Customer Management
echo "=== Workflow 3: Customer Management ==="
echo "Step 1: List customers"
CUSTOMERS_RESPONSE=$(make_request "GET" "/api/customers/?limit=10" "$ACCESS_TOKEN")
CUSTOMERS_CODE=$(echo "$CUSTOMERS_RESPONSE" | tail -n1)
if [ "$CUSTOMERS_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Customers listed${NC}"
  echo "Step 2: View customer 360"
  CUSTOMER360_RESPONSE=$(make_request "GET" "/api/intelligence/customer360/CUST_0001" "$ACCESS_TOKEN")
  CUSTOMER360_CODE=$(echo "$CUSTOMER360_RESPONSE" | tail -n1)
  if [ "$CUSTOMER360_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Customer 360 view accessible${NC}"
  else
    echo -e "${YELLOW}⚠ Customer 360 returned: $CUSTOMER360_CODE${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Customers list returned: $CUSTOMERS_CODE${NC}"
fi
echo ""

# Workflow 4: Admin Operations
echo "=== Workflow 4: Admin Operations ==="
echo "Step 1: List users"
USERS_RESPONSE=$(make_request "GET" "/api/v1/admin/users?page=1&page_size=20" "$ACCESS_TOKEN")
USERS_CODE=$(echo "$USERS_RESPONSE" | tail -n1)
if [ "$USERS_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Users listed${NC}"
  echo "Step 2: View audit logs"
  AUDIT_RESPONSE=$(make_request "GET" "/api/v1/audit/logs?page=1&page_size=20" "$ACCESS_TOKEN")
  AUDIT_CODE=$(echo "$AUDIT_RESPONSE" | tail -n1)
  if [ "$AUDIT_CODE" = "200" ]; then
    echo -e "${GREEN}✓ Audit logs accessible${NC}"
  else
    echo -e "${YELLOW}⚠ Audit logs returned: $AUDIT_CODE${NC}"
  fi
else
  echo -e "${YELLOW}⚠ Users list returned: $USERS_CODE${NC}"
fi
echo ""

# Workflow 5: Credit Scoring
echo "=== Workflow 5: Credit Scoring ==="
echo "Step 1: Get realtime scoring feed"
SCORING_RESPONSE=$(make_request "GET" "/api/scoring/realtime?limit=20" "$ACCESS_TOKEN")
SCORING_CODE=$(echo "$SCORING_RESPONSE" | tail -n1)
if [ "$SCORING_CODE" = "200" ]; then
  echo -e "${GREEN}✓ Realtime scoring feed accessible${NC}"
else
  echo -e "${YELLOW}⚠ Realtime scoring returned: $SCORING_CODE${NC}"
fi
echo ""

echo "=========================================="
echo "User Workflows Test Complete"
echo "=========================================="

