#!/bin/bash
# Performance Testing Script
# Tests API response times and concurrent request handling

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
TEST_USERNAME="${TEST_USERNAME:-admin}"
TEST_PASSWORD="${TEST_PASSWORD:-admin123}"

echo "=========================================="
echo "Performance Testing"
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

# Test response time for a single request
test_response_time() {
  local name=$1
  local endpoint=$2
  local target_ms=$3
  
  echo "Testing: $name"
  echo "Endpoint: $endpoint"
  
  START_TIME=$(date +%s%N)
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_GATEWAY_URL$endpoint" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json")
  END_TIME=$(date +%s%N)
  
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  ELAPSED_MS=$((($END_TIME - $START_TIME) / 1000000))
  
  if [ "$HTTP_CODE" = "200" ]; then
    if [ "$ELAPSED_MS" -lt "$target_ms" ]; then
      echo -e "${GREEN}✓ Response time: ${ELAPSED_MS}ms (target: <${target_ms}ms)${NC}"
    else
      echo -e "${YELLOW}⚠ Response time: ${ELAPSED_MS}ms (target: <${target_ms}ms)${NC}"
    fi
  else
    echo -e "${RED}✗ Status: $HTTP_CODE${NC}"
  fi
  echo ""
}

# Test concurrent requests
test_concurrent() {
  local name=$1
  local endpoint=$2
  local concurrent=$3
  
  echo "Testing: $name (Concurrent: $concurrent)"
  echo "Endpoint: $endpoint"
  
  START_TIME=$(date +%s%N)
  for i in $(seq 1 $concurrent); do
    curl -s -X GET "$API_GATEWAY_URL$endpoint" \
      -H "Authorization: Bearer $ACCESS_TOKEN" \
      -H "Content-Type: application/json" > /dev/null &
  done
  wait
  END_TIME=$(date +%s%N)
  
  ELAPSED_MS=$((($END_TIME - $START_TIME) / 1000000))
  AVG_MS=$((ELAPSED_MS / concurrent))
  
  echo -e "${GREEN}Total time: ${ELAPSED_MS}ms, Average: ${AVG_MS}ms per request${NC}"
  echo ""
}

# Critical endpoints (target: < 200ms)
echo "=== Critical Endpoints (Target: < 200ms) ==="
test_response_time "Dashboard Analytics" "/api/analytics?type=dashboard" 200
test_response_time "Model Performance" "/api/v1/analytics/models/performance?model_name=ensemble" 200
test_response_time "Admin Users" "/api/v1/admin/users?page=1&page_size=20" 200

# Standard endpoints (target: < 500ms)
echo "=== Standard Endpoints (Target: < 500ms) ==="
test_response_time "Audit Logs" "/api/v1/audit/logs?page=1&page_size=20" 500
test_response_time "Customer Stats" "/api/customers/stats/overview" 500
test_response_time "Recommendations Stats" "/api/intelligence/recommendations/statistics" 500

# Concurrent request testing
echo "=== Concurrent Request Testing ==="
test_concurrent "Dashboard Analytics (10 concurrent)" "/api/analytics?type=dashboard" 10
test_concurrent "Admin Users (5 concurrent)" "/api/v1/admin/users?page=1&page_size=20" 5

# Rate limiting test
echo "=== Rate Limiting Test ==="
echo "Sending 100 requests rapidly..."
SUCCESS_COUNT=0
RATE_LIMIT_COUNT=0

for i in $(seq 1 100); do
  RESPONSE=$(curl -s -w "\n%{http_code}" -X GET "$API_GATEWAY_URL/api/analytics?type=dashboard" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Content-Type: application/json")
  HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
  
  if [ "$HTTP_CODE" = "200" ]; then
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
  elif [ "$HTTP_CODE" = "429" ]; then
    RATE_LIMIT_COUNT=$((RATE_LIMIT_COUNT + 1))
  fi
done

echo "Successful: $SUCCESS_COUNT"
echo "Rate limited: $RATE_LIMIT_COUNT"

if [ "$RATE_LIMIT_COUNT" -gt 0 ]; then
  echo -e "${GREEN}✓ Rate limiting is working${NC}"
else
  echo -e "${YELLOW}⚠ No rate limiting detected (may be configured higher)${NC}"
fi

echo ""
echo "=========================================="
echo "Performance Testing Complete"
echo "=========================================="

