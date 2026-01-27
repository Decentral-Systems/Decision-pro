#!/bin/bash

# Decision PRO Admin Dashboard - Quick Setup & Test Script

set -e

echo "🚀 Decision PRO Admin Dashboard - Setup & Test"
echo "=============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

echo ""

# Check if .env.local exists
if [ ! -f .env.local ]; then
    echo "⚙️  Creating .env.local file..."
    
    # Generate a secret key
    SECRET_KEY=$(openssl rand -base64 32 2>/dev/null || python3 -c "import secrets; print(secrets.token_urlsafe(32))" 2>/dev/null || echo "change-this-secret-key-in-production")
    
    cat > .env.local << EOF
# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=${SECRET_KEY}

# API Gateway URL
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000

# Credit Scoring Service URL
NEXT_PUBLIC_CREDIT_SCORING_API_URL=http://196.188.249.48:4001

# Environment
NODE_ENV=development
EOF
    
    echo "✅ Created .env.local with generated secret key"
else
    echo "✅ .env.local already exists"
fi

echo ""

# Test backend connectivity
echo "🔍 Testing backend connectivity..."

API_GATEWAY_URL="http://196.188.249.48:4000"
CREDIT_SCORING_URL="http://196.188.249.48:4001"

if curl -s -f "${API_GATEWAY_URL}/health" > /dev/null 2>&1; then
    echo "✅ API Gateway is accessible at ${API_GATEWAY_URL}"
else
    echo "⚠️  API Gateway is not accessible at ${API_GATEWAY_URL}"
    echo "   Make sure the API Gateway service is running"
fi

if curl -s -f "${CREDIT_SCORING_URL}/health" > /dev/null 2>&1; then
    echo "✅ Credit Scoring Service is accessible at ${CREDIT_SCORING_URL}"
else
    echo "⚠️  Credit Scoring Service is not accessible at ${CREDIT_SCORING_URL}"
    echo "   Make sure the Credit Scoring service is running"
fi

echo ""

# Run build test
echo "🏗️  Testing build..."
if npm run build > /dev/null 2>&1; then
    echo "✅ Build successful"
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Start the development server:"
echo "      npm run dev"
echo ""
echo "   2. Open your browser and navigate to:"
echo "      http://localhost:3000"
echo ""
echo "   3. Login with your credentials (e.g., admin/admin123)"
echo ""
echo "📚 For detailed testing guide, see: docs/guides/TESTING_GUIDE.md"
echo "🚀 For quick start, see: docs/guides/QUICK_START.md"

