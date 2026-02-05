#!/bin/bash

# WebSocket Testing Script
# Tests WebSocket connection, authentication, and message broadcasting

set -e

WEBSOCKET_URL="${NEXT_PUBLIC_WEBSOCKET_URL:-ws://196.188.249.48:4000/ws}"
API_KEY="${NEXT_PUBLIC_API_KEY:-ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4}"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "WebSocket Testing"
echo "=========================================="
echo "WebSocket URL: $WEBSOCKET_URL"
echo ""
echo -e "${YELLOW}Note: This script requires Node.js and ws package${NC}"
echo "Install: pnpm add -D ws"
echo ""

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Skipping WebSocket tests.${NC}"
    exit 0
fi

# Create a temporary Node.js script to test WebSocket
cat > /tmp/test-websocket.js << 'EOF'
const WebSocket = require('ws');

const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'ws://196.188.249.48:4000/ws';
const API_KEY = process.env.API_KEY || 'ugQue9i_Qp5cfB94IuqrmdsHxD3PLBGOA7ehu5VH21mixlRh4ZfYUJ38Yy_H0CZ4';

let passed = 0;
let failed = 0;

function test(name, testFn) {
    return new Promise((resolve) => {
        console.log(`\nTesting: ${name}`);
        testFn()
            .then(() => {
                console.log(`  ✓ PASSED`);
                passed++;
                resolve(true);
            })
            .catch((error) => {
                console.log(`  ✗ FAILED: ${error.message}`);
                failed++;
                resolve(false);
            });
    });
}

async function testConnection() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WEBSOCKET_URL, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Connection timeout'));
        }, 5000);

        ws.on('open', () => {
            clearTimeout(timeout);
            console.log('  WebSocket connected');
            ws.close();
            resolve();
        });

        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

async function testAuthentication() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WEBSOCKET_URL, {
            headers: {
                'X-API-Key': 'invalid-key'
            }
        });

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Authentication timeout'));
        }, 5000);

        ws.on('error', (error) => {
            clearTimeout(timeout);
            // Error is expected for invalid auth
            if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                resolve();
            } else {
                reject(error);
            }
        });

        ws.on('open', () => {
            clearTimeout(timeout);
            ws.close();
            reject(new Error('Should have failed authentication'));
        });
    });
}

async function testMessageSubscription() {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket(WEBSOCKET_URL, {
            headers: {
                'X-API-Key': API_KEY
            }
        });

        const timeout = setTimeout(() => {
            ws.close();
            reject(new Error('Subscription timeout'));
        }, 10000);

        ws.on('open', () => {
            // Subscribe to dashboard channel
            ws.send(JSON.stringify({
                type: 'subscribe',
                channel: 'dashboard'
            }));
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'subscribed' || message.channel === 'dashboard') {
                    clearTimeout(timeout);
                    ws.close();
                    resolve();
                }
            } catch (e) {
                // Ignore parse errors
            }
        });

        ws.on('error', (error) => {
            clearTimeout(timeout);
            reject(error);
        });
    });
}

async function runTests() {
    await test('WebSocket Connection', testConnection);
    await test('WebSocket Authentication', testAuthentication);
    await test('Message Subscription', testMessageSubscription);

    console.log('\n==========================================');
    console.log(`Summary: ${passed} passed, ${failed} failed`);
    console.log('==========================================');

    process.exit(failed > 0 ? 1 : 0);
}

runTests();
EOF

# Run the test script
if [ -f "node_modules/ws/package.json" ] || pnpm list ws &> /dev/null; then
    WEBSOCKET_URL="$WEBSOCKET_URL" API_KEY="$API_KEY" node /tmp/test-websocket.js
else
    echo -e "${YELLOW}ws package not found. Installing...${NC}"
    cd "$(dirname "$0")/.." && pnpm add -D ws
    WEBSOCKET_URL="$WEBSOCKET_URL" API_KEY="$API_KEY" node /tmp/test-websocket.js
fi

# Cleanup
rm -f /tmp/test-websocket.js

