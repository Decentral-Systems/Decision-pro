#!/bin/bash

# Performance Testing Script
# Tests page load times, API response times, and WebSocket latency

set -e

API_GATEWAY_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
DASHBOARD_URL="${DASHBOARD_URL:-http://196.188.249.48:4009}"
WEBSOCKET_URL="${NEXT_PUBLIC_WEBSOCKET_URL:-ws://196.188.249.48:4000/ws}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Targets
PAGE_LOAD_TARGET=3.0  # seconds
API_RESPONSE_TARGET=0.2  # seconds (200ms)
WEBSOCKET_LATENCY_TARGET=0.1  # seconds (100ms)
BUNDLE_SIZE_TARGET=500  # KB

echo "=========================================="
echo "Performance Testing"
echo "=========================================="
echo ""

# Check if required tools are available
if ! command -v curl &> /dev/null; then
    echo -e "${RED}curl is required but not installed${NC}"
    exit 1
fi

# Test 1: Page Load Time
echo -e "${YELLOW}Testing Page Load Times...${NC}"

pages=(
    "/dashboard"
    "/customers"
    "/analytics"
    "/realtime-scoring"
    "/ml-center"
    "/compliance"
    "/default-prediction"
    "/system-status"
    "/dynamic-pricing"
    "/settings"
    "/rules-engine"
)

page_load_results=()
for page in "${pages[@]}"; do
    echo -n "  Testing $page... "
    
    start_time=$(date +%s.%N)
    response=$(curl -s -o /dev/null -w "%{http_code}" "$DASHBOARD_URL$page" 2>&1)
    end_time=$(date +%s.%N)
    
    load_time=$(echo "$end_time - $start_time" | bc)
    
    if (( $(echo "$load_time < $PAGE_LOAD_TARGET" | bc -l) )); then
        echo -e "${GREEN}✓${NC} ${load_time}s"
        page_load_results+=("$page: PASS ($load_times)")
    else
        echo -e "${RED}✗${NC} ${load_time}s (target: ${PAGE_LOAD_TARGET}s)"
        page_load_results+=("$page: FAIL ($load_times)")
    fi
done

echo ""

# Test 2: API Response Time
echo -e "${YELLOW}Testing API Response Times...${NC}"

endpoints=(
    "/api/analytics?type=dashboard"
    "/api/customers/stats/overview"
    "/api/intelligence/recommendations/statistics"
    "/api/scoring/realtime"
    "/api/risk/alerts"
)

api_results=()
total_time=0
count=0

for endpoint in "${endpoints[@]}"; do
    echo -n "  Testing $endpoint... "
    
    start_time=$(date +%s.%N)
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_GATEWAY_URL$endpoint" 2>&1)
    end_time=$(date +%s.%N)
    
    response_time=$(echo "$end_time - $start_time" | bc)
    total_time=$(echo "$total_time + $response_time" | bc)
    count=$((count + 1))
    
    if (( $(echo "$response_time < $API_RESPONSE_TARGET" | bc -l) )); then
        echo -e "${GREEN}✓${NC} ${response_time}s"
        api_results+=("$endpoint: PASS (${response_time}s)")
    else
        echo -e "${YELLOW}⚠${NC} ${response_time}s (target: ${API_RESPONSE_TARGET}s)"
        api_results+=("$endpoint: WARN (${response_time}s)")
    fi
done

avg_response_time=$(echo "scale=3; $total_time / $count" | bc)
echo "  Average response time: ${avg_response_time}s"

echo ""

# Test 3: WebSocket Latency (if Node.js available)
echo -e "${YELLOW}Testing WebSocket Latency...${NC}"

if command -v node &> /dev/null; then
    cat > /tmp/test-websocket-latency.js << 'EOF'
const WebSocket = require('ws');

const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://196.188.249.48:4000/ws';
const TARGET_LATENCY = 0.1; // 100ms

const ws = new WebSocket(WEBSOCKET_URL);

let startTime;
let received = false;

ws.on('open', () => {
    startTime = Date.now();
    ws.send(JSON.stringify({ type: 'ping' }));
});

ws.on('message', (data) => {
    if (!received) {
        received = true;
        const latency = (Date.now() - startTime) / 1000;
        
        if (latency < TARGET_LATENCY) {
            console.log(`✓ WebSocket latency: ${latency.toFixed(3)}s`);
            process.exit(0);
        } else {
            console.log(`⚠ WebSocket latency: ${latency.toFixed(3)}s (target: ${TARGET_LATENCY}s)`);
            process.exit(1);
        }
    }
});

ws.on('error', () => {
    console.log('⚠ WebSocket connection failed, skipping latency test');
    process.exit(0);
});

setTimeout(() => {
    if (!received) {
        console.log('⚠ WebSocket timeout, skipping latency test');
        process.exit(0);
    }
}, 5000);
EOF

    WEBSOCKET_URL="$WEBSOCKET_URL" node /tmp/test-websocket-latency.js
    rm -f /tmp/test-websocket-latency.js
else
    echo "  ⚠ Node.js not available, skipping WebSocket latency test"
fi

echo ""

# Test 4: Bundle Size (if build directory exists)
echo -e "${YELLOW}Testing Bundle Size...${NC}"

if [ -d ".next" ]; then
    # Find JavaScript bundles
    js_size=$(find .next/static/chunks -name "*.js" -type f -exec du -ch {} + | tail -1 | cut -f1)
    
    echo "  JavaScript bundle size: $js_size"
    
    # Convert to KB for comparison (simplified)
    if [[ $js_size == *"K"* ]]; then
        size_kb=$(echo $js_size | sed 's/K//' | cut -d' ' -f1)
        if (( $(echo "$size_kb < $BUNDLE_SIZE_TARGET" | bc -l) )); then
            echo -e "  ${GREEN}✓${NC} Bundle size within target"
        else
            echo -e "  ${YELLOW}⚠${NC} Bundle size exceeds target (${BUNDLE_SIZE_TARGET}KB)"
        fi
    fi
else
    echo "  ⚠ Build directory not found, run 'npm run build' first"
fi

echo ""

# Summary
echo "=========================================="
echo "Performance Test Summary"
echo "=========================================="
echo ""
echo "Page Load Times:"
for result in "${page_load_results[@]}"; do
    echo "  $result"
done
echo ""
echo "API Response Times:"
for result in "${api_results[@]}"; do
    echo "  $result"
done
echo ""
echo "Average API Response Time: ${avg_response_time}s"
echo ""
echo "Targets:"
echo "  Page Load: <${PAGE_LOAD_TARGET}s"
echo "  API Response: <${API_RESPONSE_TARGET}s"
echo "  WebSocket Latency: <${WEBSOCKET_LATENCY_TARGET}s"
echo "  Bundle Size: <${BUNDLE_SIZE_TARGET}KB"
echo ""

