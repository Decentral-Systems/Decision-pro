# Environment Configuration Guide

**Date:** January 2025  
**Purpose:** Complete guide for configuring environment variables for Decision PRO Admin Dashboard

---

## Overview

This document provides comprehensive information about all environment variables required for the Decision PRO Admin Dashboard frontend application.

---

## Required Environment Variables

### API Configuration

```bash
# API Gateway Base URL (Required)
# This is the main API endpoint for authentication and all API requests
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000

# Credit Scoring Service Base URL (Optional, defaults to API Gateway)
NEXT_PUBLIC_CREDIT_SCORING_API_URL=http://196.188.249.48:4001

# Default Prediction Service Base URL (Optional)
NEXT_PUBLIC_DEFAULT_PREDICTION_API_URL=http://196.188.249.48:4002

# API Key (Optional - not required for login, but helpful for other requests)
# Login endpoint works without API key, but other endpoints may require it
NEXT_PUBLIC_API_KEY=your-api-key-here
```

**Important Notes:**
- `NEXT_PUBLIC_API_GATEWAY_URL` is **REQUIRED** - login will fail without it
- `NEXT_PUBLIC_API_KEY` is **OPTIONAL** - login works without it, but some API endpoints may require it
- All `NEXT_PUBLIC_*` variables are exposed to the browser and must be prefixed with `NEXT_PUBLIC_`

### Authentication Configuration

```bash
# NextAuth.js Secret (Required - generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-nextauth-secret-key-here

# NextAuth.js URL (Required - use your domain for production)
NEXTAUTH_URL=http://localhost:3000

# JWT Secret (Optional - should match backend if using custom JWT)
JWT_SECRET=your-jwt-secret-key-here
```

---

## Optional Environment Variables

### Application Configuration

```bash
# Application Environment
NODE_ENV=development

# Application Port (default: 3000)
PORT=3000

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Feature Flags

```bash
# Enable WebSocket (requires WebSocket server)
NEXT_PUBLIC_ENABLE_WEBSOCKET=false

# Enable Real-time Updates
NEXT_PUBLIC_ENABLE_REALTIME=true

# Enable Analytics
NEXT_PUBLIC_ENABLE_ANALYTICS=true

# Enable Debug Mode
NEXT_PUBLIC_DEBUG=false
```

### Testing Configuration

```bash
# Test Username (for test scripts)
TEST_USERNAME=admin

# Test Password (for test scripts)
TEST_PASSWORD=admin123
```

### Monitoring & Logging

```bash
# Enable Sentry (optional)
NEXT_PUBLIC_SENTRY_DSN=

# Enable Logging
NEXT_PUBLIC_ENABLE_LOGGING=true

# Log Level (debug, info, warn, error)
NEXT_PUBLIC_LOG_LEVEL=info
```

### Performance Configuration

```bash
# API Request Timeout (milliseconds)
NEXT_PUBLIC_API_TIMEOUT=30000

# Enable API Caching
NEXT_PUBLIC_ENABLE_CACHE=true

# Cache TTL (seconds)
NEXT_PUBLIC_CACHE_TTL=300
```

### Security Configuration

```bash
# Enable HTTPS (production only)
NEXT_PUBLIC_FORCE_HTTPS=false

# Allowed CORS Origins (comma-separated)
NEXT_PUBLIC_CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

---

## Environment File Setup

### Development

1. **Create `.env.local` file:**
   ```bash
   cd /home/AIS/decision-pro-admin
   cp .env.example .env.local  # If .env.example exists
   # Or create .env.local manually
   ```

2. **Add required variables:**
   ```bash
   NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
   NEXTAUTH_SECRET=your-secret-here
   NEXTAUTH_URL=http://localhost:3000
   ```

3. **Never commit `.env.local` to version control**

### Production

1. **Set environment variables in your hosting platform:**
   - Vercel: Project Settings → Environment Variables
   - AWS: Use Parameter Store or Secrets Manager
   - Docker: Use environment file or docker-compose.yml

2. **Use secure secret management:**
   - Generate strong secrets
   - Rotate secrets regularly
   - Use different secrets for each environment

---

## CORS Configuration

### Backend CORS Settings

The API Gateway is configured with CORS middleware:

```python
# api_gateway/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Production CORS

For production, update `allow_origins` in `api_gateway/app/main.py`:

```python
allow_origins=[
    "https://admin.yourdomain.com",
    "https://dashboard.yourdomain.com"
]
```

### Frontend CORS

Frontend should configure allowed origins in environment variables:

```bash
NEXT_PUBLIC_CORS_ORIGINS=https://admin.yourdomain.com,https://dashboard.yourdomain.com
```

---

## Security Best Practices

### 1. Secret Management

- **Never commit secrets to version control**
- **Use different secrets for each environment**
- **Rotate secrets regularly**
- **Use secure secret generation:**
  ```bash
  openssl rand -base64 32  # For NEXTAUTH_SECRET
  ```

### 2. Environment Separation

- **Development:** Use `.env.local`
- **Staging:** Use environment variables in hosting platform
- **Production:** Use secure secret management service

### 3. HTTPS in Production

- **Always use HTTPS in production**
- **Set `NEXT_PUBLIC_FORCE_HTTPS=true` in production**
- **Configure SSL certificates properly**

### 4. CORS Security

- **Restrict CORS origins in production**
- **Don't use `allow_origins=["*"]` in production**
- **Configure specific allowed origins**

---

## Verification

### Check Environment Variables

```bash
# Check if variables are loaded
node -e "console.log(process.env.NEXT_PUBLIC_API_GATEWAY_URL)"

# Or in Next.js app
console.log(process.env.NEXT_PUBLIC_API_GATEWAY_URL)
```

### Test API Connection

```bash
# Test API Gateway connection
curl http://196.188.249.48:4000/health

# Test with authentication
curl -X POST http://196.188.249.48:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## Troubleshooting

### Common Issues

1. **API calls failing:**
   - Check `NEXT_PUBLIC_API_GATEWAY_URL` is set correctly
   - Verify API Gateway is running
   - Check network connectivity

2. **Authentication not working:**
   - Verify `NEXTAUTH_SECRET` is set
   - Check `NEXTAUTH_URL` matches your application URL
   - Ensure JWT secret matches backend (if using custom JWT)

3. **CORS errors:**
   - Verify CORS origins are configured correctly
   - Check backend CORS settings
   - Ensure credentials are allowed

4. **Environment variables not loading:**
   - Restart Next.js development server
   - Check `.env.local` file exists and is in correct location
   - Verify variable names start with `NEXT_PUBLIC_` for client-side access

---

## Example Configuration Files

### Development (.env.local)

```bash
# API Configuration
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
NEXT_PUBLIC_CREDIT_SCORING_API_URL=http://196.188.249.48:4001

# Authentication
NEXTAUTH_SECRET=dev-secret-key-change-in-production
NEXTAUTH_URL=http://localhost:3000

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Features
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_DEBUG=true
```

### Production (Environment Variables)

```bash
# API Configuration
NEXT_PUBLIC_API_GATEWAY_URL=https://api.yourdomain.com
NEXT_PUBLIC_CREDIT_SCORING_API_URL=https://api.yourdomain.com

# Authentication
NEXTAUTH_SECRET=<strong-secret-from-secure-storage>
NEXTAUTH_URL=https://admin.yourdomain.com

# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://admin.yourdomain.com

# Features
NEXT_PUBLIC_ENABLE_REALTIME=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_FORCE_HTTPS=true
```

---

## Additional Resources

- **API Integration Guide:** See `docs/API_INTEGRATION.md`
- **Endpoint Mapping:** See `docs/ENDPOINT_MAPPING.md`
- **Troubleshooting:** See `docs/TROUBLESHOOTING_GUIDE.md`

---

**Last Updated:** January 2025  
**Version:** 1.0

