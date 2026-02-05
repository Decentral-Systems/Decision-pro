#!/bin/bash

# Decision PRO - Production Startup Script
# This script properly sets up and starts the Next.js standalone server

set -e

echo "🚀 Starting Decision PRO Production Server..."

# Navigate to project directory
cd "$(dirname "$0")"

# Copy public assets to standalone directory if needed
if [ -d ".next/standalone" ]; then
  echo "📦 Copying public assets to standalone directory..."
  
  # Create public directory in standalone if it doesn't exist
  mkdir -p .next/standalone/public
  
  # Copy all public files
  cp -r public/* .next/standalone/public/ 2>/dev/null || true
  
  # Copy static files
  mkdir -p .next/standalone/.next
  cp -r .next/static .next/standalone/.next/ 2>/dev/null || true
  
  echo "✅ Assets copied successfully"
fi

# Set environment variables
export PORT=${PORT:-4009}
export NODE_ENV=production
export HOSTNAME=${HOSTNAME:-0.0.0.0}

# Function to safely load environment variables from a file
load_env_file() {
  local file="$1"
  if [ ! -f "$file" ]; then
    return 0
  fi
  
  echo "📋 Loading environment variables from $file..."
  while IFS= read -r line || [ -n "$line" ]; do
    # Skip comments and empty lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    
    # Skip lines without = sign
    [[ ! "$line" =~ = ]] && continue
    
    # Extract key and value
    key="${line%%=*}"
    value="${line#*=}"
    
    # Remove leading/trailing whitespace from key
    key=$(echo "$key" | xargs)
    
    # Remove leading/trailing quotes from value if present
    value=$(echo "$value" | sed -e 's/^["'\'']//' -e 's/["'\'']$//')
    
    # Export the variable
    export "$key=$value" 2>/dev/null || true
  done < "$file"
}

# Load environment variables from .env.production if it exists
if [ -f ".env.production" ]; then
  load_env_file ".env.production"
fi

# Also load from standalone .env.production if it exists
if [ -f ".next/standalone/.env.production" ]; then
  load_env_file ".next/standalone/.env.production"
fi

echo "🌐 Server will run on http://${HOSTNAME}:${PORT}"
echo "🔗 API Gateway URL: ${NEXT_PUBLIC_API_GATEWAY_URL:-not set}"

# Start the server: prefer standalone if available and working, else use next start
if [ -f ".next/standalone/server.js" ]; then
  echo "🎯 Starting standalone server..."
  cd .next/standalone
  exec env PORT=${PORT} NODE_ENV=production HOSTNAME=${HOSTNAME} \
    NEXT_PUBLIC_API_GATEWAY_URL=${NEXT_PUBLIC_API_GATEWAY_URL:-http://196.188.249.48:4000} \
    NEXT_PUBLIC_CREDIT_SCORING_API_URL=${NEXT_PUBLIC_CREDIT_SCORING_API_URL:-http://196.188.249.48:4001} \
    NEXT_PUBLIC_API_KEY=${NEXT_PUBLIC_API_KEY:-} \
    node server.js
elif [ -f "server-standalone.js" ]; then
  echo "🎯 Starting custom standalone server..."
  exec node server-standalone.js
elif [ -d ".next" ]; then
  echo "🎯 Starting with next start (standalone disabled or not built)..."
  exec npx next start -p ${PORT} -H ${HOSTNAME}
else
  echo "❌ No build found. Run 'pnpm build' first."
  exit 1
fi
