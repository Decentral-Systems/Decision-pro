#!/bin/bash
# Integration Test Runner Script
# Runs integration tests against real backend with health checks

set -e

BACKEND_URL="${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000}"
WS_URL="${NEXT_PUBLIC_WEBSOCKET_URL:-ws://196.188.249.48:4000/ws}"

echo "🔍 Checking backend availability..."
echo "   API Gateway: $BACKEND_URL"
echo "   WebSocket: $WS_URL"
echo ""

# Check API Gateway health
if curl -s -f --max-time 5 "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo "✅ API Gateway is available"
    BACKEND_AVAILABLE=true
else
    echo "❌ API Gateway is not available"
    BACKEND_AVAILABLE=false
fi

# Check WebSocket (basic check - may not be perfect)
echo ""
echo "📊 Backend Status:"
echo "   API Gateway: $([ "$BACKEND_AVAILABLE" = true ] && echo '✅ Available' || echo '❌ Unavailable')"
echo ""

if [ "$BACKEND_AVAILABLE" = false ]; then
    echo "⚠️  Warning: Backend is not available."
    echo "   Some tests may be skipped or fail."
    echo "   Make sure the backend is running at $BACKEND_URL"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

echo ""
echo "🚀 Running integration tests..."
echo ""

# Set environment variables for tests
export NEXT_PUBLIC_API_GATEWAY_URL="$BACKEND_URL"
export NEXT_PUBLIC_WEBSOCKET_URL="$WS_URL"

# Run Jest with integration test pattern
pnpm test -- --testPathPattern=integration --verbose

echo ""
echo "✅ Integration tests completed"






