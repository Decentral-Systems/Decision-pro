# Deployment Guide

This guide provides instructions for deploying the Decision Pro admin dashboard.

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker (optional, for containerized deployment)
- Access to API Gateway and backend services

## Environment Setup

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# API Gateway
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000

# Credit Scoring Service
NEXT_PUBLIC_CREDIT_SCORING_SERVICE_URL=http://196.188.249.48:4001

# WebSocket (Required for real-time updates)
NEXT_PUBLIC_WEBSOCKET_URL=ws://196.188.249.48:4000/ws
# For production, use WSS (secure WebSocket):
# NEXT_PUBLIC_WEBSOCKET_URL=wss://api.yourdomain.com/ws

# NextAuth
NEXTAUTH_URL=http://196.188.249.48:4009
NEXTAUTH_SECRET=your-secret-key-here

# Database (if needed)
DATABASE_URL=postgresql://user:password@196.188.249.48:5432/ais_db
```

### Production Environment Variables

For production deployment, set:

```env
NEXT_PUBLIC_API_GATEWAY_URL=https://api.yourdomain.com
NEXT_PUBLIC_CREDIT_SCORING_SERVICE_URL=https://api.yourdomain.com
NEXT_PUBLIC_WEBSOCKET_URL=wss://api.yourdomain.com/ws
NEXTAUTH_URL=https://admin.yourdomain.com
```

## Local Development

### Install Dependencies

```bash
npm install
```

### Run Development Server

```bash
npm run dev
```

The application will be available at `http://196.188.249.48:4009`

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Production Build

### Build the Application

```bash
npm run build
```

This creates an optimized production build in the `.next` directory.

### Start Production Server

```bash
npm start
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t decision-pro-admin:latest .
```

### Run Docker Container

```bash
docker run -d \
  -p 4009:4009 \
  -e NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000 \
  -e NEXTAUTH_SECRET=your-secret-key \
  decision-pro-admin:latest
```

### Docker Compose

Create a `docker-compose.yml`:

```yaml
version: '3.8'

services:
  decision-pro-admin:
    build: .
    ports:
      - "4009:4009"
    environment:
      - NEXT_PUBLIC_API_GATEWAY_URL=http://api-gateway:4000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on:
      - api-gateway
    restart: unless-stopped
```

Run with:

```bash
docker-compose up -d
```

## Deployment Checklist

- [ ] Set all required environment variables
- [ ] Configure NextAuth secret
- [ ] Verify API Gateway connectivity
- [ ] Test authentication flow
- [ ] Verify WebSocket connection (if using real-time features)
- [ ] Run production build
- [ ] Test all critical user flows
- [ ] Configure reverse proxy (Nginx/Apache)
- [ ] Set up SSL/TLS certificates
- [ ] Configure CORS if needed
- [ ] Set up monitoring and logging
- [ ] Configure backup procedures

## Troubleshooting

### Build Errors

**Error: Module not found**
- Ensure all dependencies are installed: `npm install`
- Clear `.next` directory and rebuild: `rm -rf .next && npm run build`

**Error: Type errors**
- Run type checking: `npm run type-check`
- Fix TypeScript errors before building

### Runtime Errors

**401 Unauthorized Errors**
- Verify `NEXTAUTH_SECRET` is set
- Check that API Gateway is accessible
- Verify access token is being sent in requests

**WebSocket Connection Failures**
- Verify `NEXT_PUBLIC_WEBSOCKET_URL` is correct
- Check firewall settings
- Ensure WebSocket endpoint is available
- For production, ensure WSS (secure WebSocket) is configured
- Check reverse proxy configuration for WebSocket upgrade headers

**API Connection Errors**
- Verify `NEXT_PUBLIC_API_GATEWAY_URL` is correct
- Check network connectivity
- Verify API Gateway is running

## Monitoring

### Health Checks

The application exposes health check endpoints:

- `/api/health` - Application health
- `/health` - Basic health check

### Logging

Application logs include:
- Request/response logging with correlation IDs
- Error logging with stack traces
- Authentication events
- API call logging

### Performance Monitoring

Monitor:
- API response times
- Page load times
- WebSocket connection status
- Error rates
- User session metrics

## Security Considerations

1. **Environment Variables**: Never commit `.env.local` to version control
2. **NextAuth Secret**: Use a strong, random secret for production
3. **HTTPS**: Always use HTTPS in production
4. **CORS**: Configure CORS appropriately for your domain
5. **Rate Limiting**: Implement rate limiting at the reverse proxy level
6. **DDoS Protection**: Use a service like Cloudflare for DDoS protection

## Scaling

### Horizontal Scaling

The application is stateless and can be horizontally scaled:

1. Run multiple instances behind a load balancer
2. Ensure all instances use the same `NEXTAUTH_SECRET`
3. Configure session storage (Redis) if using server-side sessions

### Performance Optimization

- Enable Next.js Image Optimization
- Use CDN for static assets
- Implement caching strategies
- Use database connection pooling
- Enable API response caching where appropriate

### WebSocket Configuration

#### Nginx Reverse Proxy Configuration

For production deployments with Nginx, configure WebSocket support:

```nginx
location /ws {
    proxy_pass http://api-gateway:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    
    # WebSocket timeouts
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
    
    # Connection limits
    proxy_connect_timeout 60s;
}
```

#### SSL/TLS for WebSocket (WSS)

For secure WebSocket connections:

1. Obtain SSL certificate (Let's Encrypt, etc.)
2. Configure Nginx with SSL
3. Update `NEXT_PUBLIC_WEBSOCKET_URL` to use `wss://`
4. Ensure certificate includes WebSocket domain

#### Connection Limits

Configure connection limits based on expected load:

- **Development**: 10-50 concurrent connections
- **Production**: 100-1000+ concurrent connections
- Monitor connection count and adjust as needed

#### Performance Tuning Recommendations

1. **Request Debouncing**: Already implemented (300ms for search/filters)
2. **Caching Strategy**: 
   - Dashboard data: 5 minutes staleTime, 10 minutes gcTime
   - Customer list: 1 minute staleTime
   - Analytics: 2 minutes staleTime
3. **API Call Frequency**:
   - Real-time data: 3 seconds refetchInterval
   - Dashboard metrics: 60 seconds refetchInterval
   - Customer list: 60 seconds refetchInterval
4. **Virtual Scrolling**: Enabled for tables with >50 rows
5. **Chart Optimization**: React.memo and useMemo for chart components
6. **Bundle Size**: Target <500KB initial bundle
7. **Page Load Time**: Target <3 seconds
8. **API Response Time**: Target <200ms average
9. **WebSocket Latency**: Target <100ms

## Backup and Recovery

### Backup

- Database backups (if using local database)
- Environment variable backups (secure storage)
- Configuration backups

### Recovery

1. Restore database (if applicable)
2. Restore environment variables
3. Rebuild and redeploy application
4. Verify all services are running
5. Test critical workflows

## Support

For issues or questions:
- Check the troubleshooting section
- Review application logs
- Contact the development team



