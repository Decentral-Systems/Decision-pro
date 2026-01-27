#!/bin/bash

# Test Script for Critical Credit Scoring Features
# This script helps verify backend endpoints and basic functionality

set -e

API_BASE="http://196.188.249.48:4000"
COLOR_GREEN='\033[0;32m'
COLOR_RED='\033[0;31m'
COLOR_YELLOW='\033[1;33m'
COLOR_NC='\033[0m' # No Color

echo "=========================================="
echo "Critical Features Testing Script"
echo "=========================================="
echo ""

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo -e "${COLOR_YELLOW}Warning: jq not installed. JSON parsing will be limited.${COLOR_NC}"
    JQ_AVAILABLE=false
else
    JQ_AVAILABLE=true
fi

# Test 1: Check Audit Events Endpoint
echo "Test 1: POST /api/v1/audit/events"
echo "-----------------------------------"
TEST_EVENT='{
  "event_type": "test_event",
  "action": "Test audit event",
  "details": {
    "test": true,
    "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"
  },
  "user_id": "test_user",
  "correlation_id": "test_corr_'$(date +%s)'"
}'

RESPONSE=$(curl -s -X POST "${API_BASE}/api/v1/audit/events" \
  -H "Content-Type: application/json" \
  -d "${TEST_EVENT}" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 201 ] || [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${COLOR_GREEN}✓ Endpoint exists and responds${COLOR_NC}"
    if [ "$JQ_AVAILABLE" = true ]; then
        SUCCESS=$(echo "$BODY" | jq -r '.success // false')
        if [ "$SUCCESS" = "true" ]; then
            echo -e "${COLOR_GREEN}✓ Event logged successfully${COLOR_NC}"
            LOG_ID=$(echo "$BODY" | jq -r '.log_id // "N/A"')
            echo "  Log ID: $LOG_ID"
        else
            echo -e "${COLOR_YELLOW}⚠ Event may not have been logged (check database)${COLOR_NC}"
        fi
    fi
else
    echo -e "${COLOR_RED}✗ Endpoint returned HTTP $HTTP_CODE${COLOR_NC}"
    echo "Response: $BODY"
fi
echo ""

# Test 2: Check Audit Logs Endpoint
echo "Test 2: GET /api/v1/audit/logs"
echo "-----------------------------------"
RESPONSE=$(curl -s -X GET "${API_BASE}/api/v1/audit/logs?page=1&page_size=5" \
  -H "Content-Type: application/json" \
  -w "\n%{http_code}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | head -n-1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${COLOR_GREEN}✓ Endpoint exists and responds${COLOR_NC}"
    if [ "$JQ_AVAILABLE" = true ]; then
        TOTAL=$(echo "$BODY" | jq -r '.total // .items | length // 0')
        echo "  Total logs: $TOTAL"
    fi
else
    echo -e "${COLOR_RED}✗ Endpoint returned HTTP $HTTP_CODE${COLOR_NC}"
    echo "Note: This may require authentication"
fi
echo ""

# Test 3: Check Credit Scoring Endpoint
echo "Test 3: Credit Scoring Service Health"
echo "-----------------------------------"
CREDIT_SCORING_BASE="http://196.188.249.48:4001"
RESPONSE=$(curl -s -X GET "${CREDIT_SCORING_BASE}/health" \
  -w "\n%{http_code}" || echo "Connection failed\n000")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${COLOR_GREEN}✓ Credit Scoring Service is healthy${COLOR_NC}"
else
    echo -e "${COLOR_YELLOW}⚠ Credit Scoring Service may be unavailable (HTTP $HTTP_CODE)${COLOR_NC}"
fi
echo ""

# Test 4: Check API Gateway Health
echo "Test 4: API Gateway Health"
echo "-----------------------------------"
RESPONSE=$(curl -s -X GET "${API_BASE}/health" \
  -w "\n%{http_code}" || echo "Connection failed\n000")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

if [ "$HTTP_CODE" -eq 200 ]; then
    echo -e "${COLOR_GREEN}✓ API Gateway is healthy${COLOR_NC}"
else
    echo -e "${COLOR_RED}✗ API Gateway returned HTTP $HTTP_CODE${COLOR_NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "Testing Summary"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Test frontend features manually (see docs/guides/TESTING_GUIDE.md)"
echo "2. Verify database connection for audit logs"
echo "3. Test with authenticated user (JWT token)"
echo "4. Run full test suite from docs/guides/TESTING_GUIDE.md"
echo ""
echo "For detailed testing instructions, see:"
echo "  - docs/guides/TESTING_GUIDE.md (comprehensive test scenarios)"
echo "  - docs/USER_TRAINING_CREDIT_SCORING.md (user guide)"
echo ""
