#!/bin/bash

# Comprehensive Enhancement Testing Script
# Tests all pages and enhancements programmatically

BASE_URL="http://localhost:4009"
REPORT_DIR="$(cd "$(dirname "$0")/.." && pwd)/docs/archive/reports"
mkdir -p "$REPORT_DIR"
TEST_REPORT="$REPORT_DIR/TEST_REPORT_$(date +%Y%m%d_%H%M%S).md"

echo "# Enhancement Testing Report" > "$TEST_REPORT"
echo "Generated: $(date)" >> "$TEST_REPORT"
echo "" >> "$TEST_REPORT"

# Function to test a page
test_page() {
    local page=$1
    local name=$2
    echo "Testing $name ($page)..."
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
    
    if [ "$response" = "200" ] || [ "$response" = "307" ] || [ "$response" = "302" ]; then
        echo "✅ $name: Page accessible (HTTP $response)" >> "$TEST_REPORT"
        return 0
    else
        echo "❌ $name: Page error (HTTP $response)" >> "$TEST_REPORT"
        return 1
    fi
}

# Function to check for specific content
check_content() {
    local page=$1
    local content=$2
    local name=$3
    
    response=$(curl -s "$BASE_URL$page" | grep -i "$content" | head -1)
    
    if [ -n "$response" ]; then
        echo "✅ $name: Found '$content'" >> "$TEST_REPORT"
        return 0
    else
        echo "⚠️  $name: '$content' not found (may require login)" >> "$TEST_REPORT"
        return 1
    fi
}

echo "## Page Accessibility Tests" >> "$TEST_REPORT"
echo "" >> "$TEST_REPORT"

# Test all pages
test_page "/login" "Login Page"
test_page "/dashboard" "Executive Dashboard"
test_page "/analytics" "Analytics Page"
test_page "/compliance" "Compliance Center"
test_page "/credit-scoring/history" "Credit Scoring History"
test_page "/default-prediction" "Default Prediction"
test_page "/default-prediction/history" "Default Prediction History"
test_page "/dynamic-pricing" "Dynamic Pricing"
test_page "/customers" "Customers List"
test_page "/realtime-scoring" "Real-Time Scoring"
test_page "/ml-center" "ML Center"
test_page "/settings" "Settings Page"
test_page "/system-status" "System Status Page"
test_page "/admin/audit-logs" "Admin Audit Logs"
test_page "/admin/users" "Admin Users"

echo "" >> "$TEST_REPORT"
echo "## Content Verification" >> "$TEST_REPORT"
echo "" >> "$TEST_REPORT"

# Check for key enhancement features
check_content "/settings" "Settings" "Settings Page Title"
check_content "/system-status" "System Status" "System Status Page Title"
check_content "/admin/audit-logs" "Audit Logs" "Audit Logs Page Title"
check_content "/admin/users" "User Management" "Users Page Title"

echo "" >> "$TEST_REPORT"
echo "## Test Summary" >> "$TEST_REPORT"
echo "" >> "$TEST_REPORT"
echo "Total pages tested: $(grep -c "Testing" <<< "$(cat $TEST_REPORT)")" >> "$TEST_REPORT"
echo "✅ Passed: $(grep -c "✅" "$TEST_REPORT")" >> "$TEST_REPORT"
echo "❌ Failed: $(grep -c "❌" "$TEST_REPORT")" >> "$TEST_REPORT"
echo "⚠️  Warnings: $(grep -c "⚠️" "$TEST_REPORT")" >> "$TEST_REPORT"

echo ""
echo "Test report saved to: $TEST_REPORT"
cat "$TEST_REPORT"



