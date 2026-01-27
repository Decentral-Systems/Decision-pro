#!/usr/bin/env ts-node
/**
 * Integration Test Runner
 * Checks backend availability and runs integration tests against real backend
 */

import { execSync } from 'child_process';
import axios from 'axios';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || 'http://196.188.249.48:4000';
const WS_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://196.188.249.48:4000/ws';

async function checkBackendHealth(): Promise<boolean> {
  try {
    const response = await axios.get(`${BACKEND_URL}/health`, {
      timeout: 5000,
      validateStatus: (status) => status < 500, // Accept any status < 500
    });
    console.log(`✅ Backend health check: ${response.status === 200 ? 'OK' : response.status}`);
    return response.status < 500;
  } catch (error: any) {
    console.error(`❌ Backend health check failed: ${error.message}`);
    return false;
  }
}

async function checkWebSocketAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const WebSocket = require('ws');
      const ws = new WebSocket(WS_URL);
      
      const timeout = setTimeout(() => {
        ws.close();
        console.warn('⚠️  WebSocket connection timeout');
        resolve(false);
      }, 5000);

      ws.on('open', () => {
        clearTimeout(timeout);
        ws.close();
        console.log('✅ WebSocket is available');
        resolve(true);
      });

      ws.on('error', (error: Error) => {
        clearTimeout(timeout);
        console.warn(`⚠️  WebSocket error: ${error.message}`);
        resolve(false);
      });
    } catch (error: any) {
      console.warn(`⚠️  WebSocket check failed: ${error.message}`);
      resolve(false);
    }
  });
}

async function main() {
  console.log('🔍 Checking backend availability...\n');
  
  const backendAvailable = await checkBackendHealth();
  const wsAvailable = await checkWebSocketAvailability();
  
  console.log('\n📊 Backend Status:');
  console.log(`   API Gateway: ${backendAvailable ? '✅ Available' : '❌ Unavailable'}`);
  console.log(`   WebSocket: ${wsAvailable ? '✅ Available' : '❌ Unavailable'}\n`);
  
  if (!backendAvailable) {
    console.log('⚠️  Warning: Backend is not available. Some tests may be skipped.\n');
  }
  
  console.log('🚀 Running integration tests...\n');
  
  try {
    // Run Jest with integration tests
    execSync('npm test -- --testPathPattern=integration', {
      stdio: 'inherit',
      env: {
        ...process.env,
        NEXT_PUBLIC_API_GATEWAY_URL: BACKEND_URL,
        NEXT_PUBLIC_WEBSOCKET_URL: WS_URL,
      },
    });
  } catch (error) {
    console.error('\n❌ Test execution failed');
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { checkBackendHealth, checkWebSocketAvailability };






