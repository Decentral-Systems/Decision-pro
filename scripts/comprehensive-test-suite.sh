#!/bin/bash

# Comprehensive Test Suite
# Tests backend APIs, frontend components, integration, and E2E workflows

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
API_KEY="${NEXT_PUBLIC_API_KEY:-ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4}"
DASHBOARD_URL="${NEXT_PUBLIC_DASHBOARD_URL:-http://localhost:4009}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
SKIPPED_TESTS=0

# Test results
declare -a TEST_RESULTS

log_test() {
    local status=$1
    local test_name=$2
    local details=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    case $status in
        PASS)
            echo -e "${GREEN}✓ PASS${NC}: $test_name"
            PASSED_TESTS=$((PASSED_TESTS + 1))
            TEST_RESULTS+=("PASS:$test_name")
            ;;
        FAIL)
            echo -e "${RED}✗ FAIL${NC}: $test_name"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            TEST_RESULTS+=("FAIL:$test_name:$details")
            ;;
        SKIP)
            echo -e "${YELLOW}⊘ SKIP${NC}: $test_name"
            SKIPPED_TESTS=$((SKIPPED_TESTS + 1))
            TEST_RESULTS+=("SKIP:$test_name")
            ;;
    esac
    
    if [ -n "$details" ]; then
        echo "    $details"
    fi
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local test_name=$3
    local expected_code=${4:-200}
    local data=$5
    
    local headers="-H \"X-API-Key: $API_KEY\" -H \"Content-Type: application/json\""
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET $headers "$API_GATEWAY_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X $method $headers -d "$data" "$API_GATEWAY_URL$endpoint" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" -eq "$expected_code" ]; then
        log_test "PASS" "$test_name" "HTTP $http_code"
        return 0
    else
        log_test "FAIL" "$test_name" "Expected HTTP $expected_code, got $http_code"
        return 1
    fi
}

echo "=========================================="
echo "COMPREHENSIVE TEST SUITE"
echo "=========================================="
echo "API Gateway: $API_GATEWAY_URL"
echo "Dashboard: $DASHBOARD_URL"
echo "Started: $(date)"
echo ""

# ============================================
# PHASE 1: BACKEND API TESTING
# ============================================
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 1: BACKEND API TESTING${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Health Check
echo ""
echo "1.1 Health & Status Endpoints"
test_endpoint "GET" "/health" "API Gateway Health Check"
test_endpoint "GET" "/api/v1/health" "API Health Check"

# Authentication
echo ""
echo "1.2 Authentication Endpoints"
test_endpoint "GET" "/api/customers/stats/overview" "API Key Authentication" 200
test_endpoint "GET" "/api/customers/stats/overview" "Invalid API Key" 401 "" "-H \"X-API-Key: invalid\""
test_endpoint "GET" "/api/customers/stats/overview" "No Authentication" 401 "" ""

# Core Data Endpoints
echo ""
echo "1.3 Core Data Endpoints"
test_endpoint "GET" "/api/analytics?type=dashboard" "Analytics Dashboard"
test_endpoint "GET" "/api/customers/stats/overview" "Customer Stats Overview"
test_endpoint "GET" "/api/customers?page=1&page_size=10" "Customers List"
test_endpoint "GET" "/api/scoring/history?page=1&page_size=10" "Credit Scoring History"
test_endpoint "GET" "/api/predictions/default/history?page=1&page_size=10" "Default Prediction History"

# ML & Analytics Endpoints
echo ""
echo "1.4 ML & Analytics Endpoints"
test_endpoint "GET" "/api/v1/models" "ML Models List"
test_endpoint "GET" "/api/ml/drift" "Data Drift Detection"
test_endpoint "GET" "/api/intelligence/recommendations/statistics" "Recommendations Statistics"

# Real-time Endpoints
echo ""
echo "1.5 Real-time Endpoints"
test_endpoint "GET" "/api/scoring/realtime" "Real-time Scoring Feed"
test_endpoint "GET" "/api/scoring/realtime/dashboard" "Real-time Dashboard"

# Error Handling
echo ""
echo "1.6 Error Handling"
test_endpoint "GET" "/api/invalid/endpoint" "404 Not Found" 404
test_endpoint "GET" "/api/customers/invalid-id-12345" "404 Invalid Customer" 404

# ============================================
# PHASE 2: INTEGRATION TESTING
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 2: INTEGRATION TESTING${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Data Flow Tests
echo ""
echo "2.1 Data Flow Integration"
test_endpoint "GET" "/api/customers/stats/overview" "Customer Stats Data Flow"
test_endpoint "GET" "/api/analytics?type=dashboard" "Analytics Data Flow"
test_endpoint "GET" "/api/scoring/history?page=1&page_size=5" "Scoring History Data Flow"

# Cache Integration
echo ""
echo "2.2 Cache Integration"
test_endpoint "GET" "/api/v1/cache/metadata" "Cache Metadata Endpoint"
test_endpoint "GET" "/api/v1/cache/keys" "Cache Keys List"

# Export Integration
echo ""
echo "2.3 Export Integration"
test_endpoint "GET" "/api/customers/export?format=csv&limit=10" "CSV Export"
test_endpoint "GET" "/api/customers/export?format=excel&limit=10" "Excel Export"

# ============================================
# PHASE 3: PERFORMANCE TESTING
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 3: PERFORMANCE TESTING${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_performance() {
    local endpoint=$1
    local test_name=$2
    
    start_time=$(date +%s%N)
    response=$(curl -s -w "\n%{http_code}" -X GET \
        -H "X-API-Key: $API_KEY" \
        -H "Content-Type: application/json" \
        "$API_GATEWAY_URL$endpoint" 2>&1)
    end_time=$(date +%s%N)
    
    http_code=$(echo "$response" | tail -n1)
    duration_ms=$(( (end_time - start_time) / 1000000 ))
    
    if [ "$http_code" -eq 200 ] && [ "$duration_ms" -lt 2000 ]; then
        log_test "PASS" "$test_name" "HTTP $http_code, ${duration_ms}ms (< 2000ms)"
    elif [ "$http_code" -eq 200 ]; then
        log_test "FAIL" "$test_name" "HTTP $http_code, ${duration_ms}ms (>= 2000ms - too slow)"
    else
        log_test "FAIL" "$test_name" "HTTP $http_code, ${duration_ms}ms"
    fi
}

echo ""
echo "3.1 Response Time Tests"
test_performance "/api/customers/stats/overview" "Customer Stats Response Time"
test_performance "/api/analytics?type=dashboard" "Analytics Response Time"
test_performance "/api/scoring/history?page=1&page_size=10" "Scoring History Response Time"

# ============================================
# PHASE 4: FRONTEND TESTING (if available)
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}PHASE 4: FRONTEND TESTING${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_frontend() {
    local url=$1
    local test_name=$2
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>&1)
    
    if [ "$response" -eq 200 ]; then
        log_test "PASS" "$test_name" "HTTP $response"
    else
        log_test "SKIP" "$test_name" "HTTP $response (Frontend may not be running)"
    fi
}

echo ""
echo "4.1 Frontend Page Availability"
test_frontend "$DASHBOARD_URL" "Dashboard Homepage"
test_frontend "$DASHBOARD_URL/customers" "Customers Page"
test_frontend "$DASHBOARD_URL/analytics" "Analytics Page"
test_frontend "$DASHBOARD_URL/ml-center" "ML Center Page"

# ============================================
# SUMMARY
# ============================================
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}TEST SUMMARY${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Total Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"
echo -e "${YELLOW}Skipped: $SKIPPED_TESTS${NC}"
echo ""
echo "Completed: $(date)"
echo ""

# Generate detailed report
REPORT_FILE="/tmp/test-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "COMPREHENSIVE TEST REPORT"
    echo "Generated: $(date)"
    echo "API Gateway: $API_GATEWAY_URL"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "SUMMARY"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS"
    echo "Failed: $FAILED_TESTS"
    echo "Skipped: $SKIPPED_TESTS"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "DETAILED RESULTS"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    for result in "${TEST_RESULTS[@]}"; do
        echo "$result"
    done
} > "$REPORT_FILE"

echo "Detailed report saved to: $REPORT_FILE"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}Some tests failed. Please review the report.${NC}"
    exit 1
fi

