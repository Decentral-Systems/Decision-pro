# Decision PRO — Complete Documentation

**Decision PRO Admin Dashboard** is the modern Next.js admin frontend for the AIS (Akafay Intelligent Services) platform. This document is the single source of truth for setup, configuration, API integration, deployment, testing, and troubleshooting.

---

## Table of Contents

1. [Overview & Features](#1-overview--features)
2. [Tech Stack](#2-tech-stack)
3. [Getting Started](#3-getting-started)
4. [Project Structure](#4-project-structure)
5. [Environment Variables](#5-environment-variables)
6. [Authentication](#6-authentication)
7. [API Integration](#7-api-integration)
8. [Deployment](#8-deployment)
9. [Testing](#9-testing)
10. [Troubleshooting](#10-troubleshooting)
11. [Performance & Monitoring](#11-performance--monitoring)
12. [Security](#12-security)
13. [Support & License](#13-support--license)

---

## 1. Overview & Features

- **Modern UI**: Next.js 14, TypeScript, Tailwind CSS, shadcn/ui
- **Authentication**: NextAuth.js with JWT; 6 roles with granular permissions
- **API Integration**: API Gateway, Credit Scoring Service, Default Prediction Service
- **Real-time**: React Query caching; WebSocket for live updates
- **Responsive**: Desktop, tablet, mobile

---

## 2. Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI | shadcn/ui |
| State | Zustand, React Query |
| Forms | React Hook Form + Zod |
| Charts | Recharts |
| Auth | NextAuth.js |

---

## 3. Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- API Gateway (e.g. port 4000), Credit Scoring Service (e.g. 4001), Default Prediction (e.g. 4002)

### Install & Run (3 steps)

```bash
# 1. Install
cd /path/to/decision-pro-admin
npm install

# 2. Environment: create .env.local (see Environment Variables section)
cp .env.local.example .env.local   # if available, or create manually

# 3. Start
npm run dev
```

Default dev URL: **http://localhost:4009** (or the port in your config).

### Quick environment (.env.local)

```env
NEXTAUTH_URL=http://localhost:4009
NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
NEXT_PUBLIC_WEBSOCKET_URL=ws://196.188.249.48:4000/ws
NEXT_PUBLIC_CREDIT_SCORING_API_URL=http://196.188.249.48:4001
NEXT_PUBLIC_DEFAULT_PREDICTION_API_URL=http://196.188.249.48:4002
NODE_ENV=development
```

### Test login

- **URL**: `/login`
- **Example credentials**: `admin` / `admin123` (must exist in API Gateway).

### Quick checklist

- [ ] App loads and redirects to login when unauthenticated
- [ ] Login works; dashboard loads after login
- [ ] Sidebar navigation works
- [ ] Credit Scoring and Customer 360 (e.g. `/customers/CUST_001`) work

---

## 4. Project Structure

```
decision-pro-admin/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Login, auth layout
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes (e.g. health)
├── components/            # React components
│   ├── ui/               # shadcn/ui
│   ├── layout/           # Header, Sidebar, etc.
│   ├── forms/            # Forms
│   └── dashboard/        # Dashboard widgets
├── lib/                   # Utilities & config
│   ├── api/              # API clients, hooks
│   ├── auth/             # Auth config, stores
│   └── utils/            # Helpers
├── types/                 # TypeScript types
├── __tests__/             # Jest & Playwright tests
├── scripts/               # Test and automation scripts
├── docs/                  # Additional documentation
│   ├── guides/           # Living guides
│   └── archive/          # Historical reports
├── public/                # Static assets
├── next.config.js
├── package.json
├── start-production.sh    # Used by npm start
└── server-standalone.js   # Optional standalone server
```

---

## 5. Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXTAUTH_URL` | App URL for NextAuth | `http://localhost:4009` |
| `NEXTAUTH_SECRET` | NextAuth signing secret | Generate: `openssl rand -base64 32` |
| `NEXT_PUBLIC_API_GATEWAY_URL` | API Gateway base URL | `http://196.188.249.48:4000` |

### Optional but common

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket URL | `ws://196.188.249.48:4000/ws` |
| `NEXT_PUBLIC_CREDIT_SCORING_API_URL` | Credit Scoring API | `http://196.188.249.48:4001` |
| `NEXT_PUBLIC_DEFAULT_PREDICTION_API_URL` | Default Prediction API | `http://196.188.249.48:4002` |
| `NEXT_PUBLIC_API_KEY` | API key (if required by backend) | — |
| `NODE_ENV` | Environment | `development` / `production` |
| `PORT` | Dev server port | `4009` |

### Feature / ops (optional)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_ENABLE_WEBSOCKET` | Enable WebSocket |
| `NEXT_PUBLIC_ENABLE_REALTIME` | Enable real-time features |
| `NEXT_PUBLIC_DEBUG` | Debug mode |
| `NEXT_PUBLIC_API_TIMEOUT` | API timeout (ms) |
| `NEXT_PUBLIC_CACHE_TTL` | Cache TTL (seconds) |
| `NEXT_PUBLIC_CORS_ORIGINS` | Allowed CORS origins (comma-separated) |
| `NEXT_PUBLIC_FORCE_HTTPS` | Force HTTPS (production) |

- All client-visible config must use the `NEXT_PUBLIC_` prefix.
- Never commit `.env.local` or real secrets. Use different secrets per environment.

---

## 6. Authentication

### Flow

1. **Login**: `POST /auth/login` with `{ "username", "password" }`.
2. **Response**: `access_token`, `refresh_token`, `token_type`, `expires_in`.
3. **API calls**: `Authorization: Bearer <access_token>`.
4. **Refresh**: `POST /auth/refresh` with `{ "refresh_token" }` when access token expires.

Tokens: access ~1 hour, refresh ~7 days. NextAuth + app logic handle refresh and session.

### User roles

| Role | Scope |
|------|--------|
| `admin` | Full access |
| `credit_analyst` | Credit scoring |
| `risk_manager` | Risk management |
| `compliance_officer` | Compliance |
| `customer_service` | Customer support |
| `read_only` | View only |

### Developer quick reference

- **Auth state**: `useAuth()` from `@/lib/auth/auth-context` (or equivalent).
- **Protection**: Wrap UI with `PermissionGuard` + `Permission.*`.
- **Logout**: Call app logout (clears session and redirects to login).

---

## 7. API Integration

### Base URLs

| Service | Development (example) |
|---------|------------------------|
| API Gateway | `http://196.188.249.48:4000` |
| Credit Scoring | `http://196.188.249.48:4001` |
| Default Prediction | `http://196.188.249.48:4002` |

Use env vars in code (e.g. `NEXT_PUBLIC_API_GATEWAY_URL`).

### Endpoint categories (high level)

| Category | Examples |
|-----------|----------|
| **Auth** | `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` |
| **Dashboard / analytics** | `GET /api/analytics?type=dashboard`, `GET /api/v1/analytics/models/performance`, `GET /api/v1/analytics/models/comparison`, `GET /api/intelligence/recommendations/statistics`, `GET /api/customers/stats/overview` |
| **Customers** | `GET/POST /api/customers`, `GET/PUT /api/customers/{id}`, `GET /api/intelligence/customer360/{id}` |
| **Credit scoring** | `GET /api/scoring/realtime`, `POST /api/intelligence/credit-scoring/realtime`, `POST /api/v1/credit-scoring/batch` |
| **Products** | `GET/POST /api/intelligence/products/recommendations` |
| **Admin** | `GET /api/v1/admin/users`, `GET /api/v1/admin/users/{id}/activity`, `GET /api/v1/audit/logs` |

### Request / response

- **Headers**: `Content-Type: application/json`, `Authorization: Bearer <token>`, optional `X-Correlation-ID`.
- **Success**: e.g. `{ "success": true, "data", "total", "page", "page_size", "has_more" }`.
- **Error**: `{ "error_code", "message", "details?", "correlation_id?", "status_code" }`.

### HTTP and error codes

| Code | Meaning |
|------|---------|
| 200/201 | Success |
| 400 | Bad request |
| 401 | Unauthorized / invalid token |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Validation error |
| 429 | Rate limit |
| 500/502/503/504 | Server / gateway errors |

Handle 401 with token refresh or redirect to login; retry transient 5xx where appropriate.

### Pagination

- Query: `page`, `page_size` (default 20, max 100), or `limit`/`offset`.
- Response: `data`, `total`, `page`, `page_size`, `total_pages`, `has_more`.

### Rate limiting

- Typical: 100 req/h per IP/user; login 10/15 min; admin endpoints may be stricter.
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.

### WebSocket

- **URL**: From `NEXT_PUBLIC_WEBSOCKET_URL` (e.g. `ws://host:4000/ws`, production `wss://...`).
- **Use**: Real-time credit scores, risk alerts, system status.
- **Client**: Reconnect with backoff; subscribe to channels (e.g. dashboard, executive, alerts).

### Best practices

- Use correlation IDs for tracing.
- Refresh token before expiry; store tokens securely (e.g. httpOnly cookies).
- Validate and sanitize inputs; do not expose internal errors to users.
- Use pagination and caching to limit load and improve UX.

---

## 8. Deployment

### Local dev

```bash
npm install
# Set .env.local
npm run dev
```

### Production build & run

```bash
npm run build
npm start   # runs start-production.sh
```

### Docker

```bash
docker build -t decision-pro-admin:latest .
docker run -d -p 4009:4009 \
  -e NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000 \
  -e NEXTAUTH_SECRET=your-secret \
  decision-pro-admin:latest
```

### Docker Compose (example)

```yaml
services:
  decision-pro-admin:
    build: .
    ports: ["4009:4009"]
    environment:
      - NEXT_PUBLIC_API_GATEWAY_URL=http://api-gateway:4000
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
    depends_on: [api-gateway]
    restart: unless-stopped
```

### Deployment checklist

- [ ] All required env vars set; strong `NEXTAUTH_SECRET`
- [ ] API Gateway reachable; auth and WebSocket tested
- [ ] `npm run build` succeeds; critical user flows tested
- [ ] HTTPS and CORS configured for production
- [ ] Reverse proxy (e.g. Nginx) set up with WebSocket support for `/ws`

### WebSocket behind Nginx

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
    proxy_read_timeout 86400;
    proxy_send_timeout 86400;
}
```

Use **wss://** in production and ensure the certificate covers the WebSocket host.

---

## 9. Testing

### NPM scripts

```bash
npm run lint          # ESLint
npm run type-check    # tsc --noEmit
npm test              # Jest
npm run test:watch    # Jest watch
npm run test:coverage # Coverage
npm run test:integration        # Integration tests
npm run test:browser            # Playwright
npm run test:browser:ui         # Playwright UI
npm run test:browser:headed     # Playwright headed
```

### Backend integration scripts (in `scripts/`)

| Script | Purpose |
|--------|---------|
| `test-auth-flow.sh` | Login, token, protected access, refresh |
| `test-core-endpoints.sh` | Dashboard, analytics, customers, admin, scoring |
| `test-error-handling.sh` | 401, 404, 405, 422 behaviour |
| `test-user-workflows.sh` | Login → dashboard → customer → admin flows |
| `test-performance.sh` | Response times |
| `test-enhancements.sh` | Page reachability; writes to `docs/archive/reports/` |

Run from project root, e.g. `./scripts/test-auth-flow.sh`. Ensure API Gateway and backends are up and env vars (or `TEST_USERNAME`/`TEST_PASSWORD`) are set.

### Manual testing (high level)

- **Auth**: Valid/invalid login, protected routes, token refresh, logout.
- **Dashboard**: Analytics, model performance, comparisons load.
- **Customers**: List, search, filters, Customer 360, pagination.
- **Admin**: Users, activity, audit logs, roles.
- **Credit scoring**: Realtime feed, submit score, batch flow, results.
- **Errors**: 401 → re-login/refresh; 404/422/5xx show clear, non-sensitive messages.

### Performance targets (guidance)

- Critical APIs: &lt; 200 ms
- Standard APIs: &lt; 500 ms
- Heavier queries: &lt; 1 s
- Initial bundle: aim &lt; 500 KB; &lt; 3 s load where possible

---

## 10. Troubleshooting

### 401 Unauthorized

- Confirm `NEXTAUTH_SECRET` and `NEXTAUTH_URL` are set and correct.
- Check token refresh and that the API Gateway login/refresh URLs are reachable.
- Clear site data/cookies for the app origin and try again.

### Login page blank / redirect loops

- Verify NextAuth config and that `NEXTAUTH_SECRET` is set.
- Ensure API Gateway is up: `curl http://196.188.249.48:4000/health`.

### API requests failing / network errors

- Confirm `NEXT_PUBLIC_API_GATEWAY_URL` and, if used, `NEXT_PUBLIC_WEBSOCKET_URL`.
- Check CORS and that the request origin is allowed by the gateway.
- Test from the same host: `curl -v $NEXT_PUBLIC_API_GATEWAY_URL/health`.

### 404 on API calls

- Check endpoint path and method against API docs or `docs/ENDPOINT_MAPPING.md`.
- Ensure the backend route exists and the correct service is running.

### Dashboard / Customer 360 not loading

- Verify token is sent (`Authorization: Bearer ...`) and not expired.
- In Network tab, confirm the analytics/customer API URLs and responses.
- Check backend health and that customer/analytics services are up.

### WebSocket not connecting

- Ensure `NEXT_PUBLIC_WEBSOCKET_URL` is correct (e.g. `ws://` vs `wss://`).
- In production, use **wss** and that the reverse proxy upgrades WebSocket.
- Check firewall/proxy and backend WebSocket config.

### Build / TypeScript errors

- `rm -rf .next && npm run build`; run `npm run type-check`.
- Fix type/import issues; ensure `tsconfig.json` paths (e.g. `@/`) match your layout.

### Slow loads / high memory

- Use dynamic imports for heavy routes/components; keep React Query `staleTime`/`gcTime` reasonable.
- Ensure WebSocket and other global listeners are closed on unmount.
- Check for unnecessary re-renders and large lists (virtualize if needed).

---

## 11. Performance & Monitoring

### Frontend optimizations (already in use)

- **Code splitting**: Heavy widgets/charts loaded with `next/dynamic` and loading fallbacks.
- **React Query**: Caching (e.g. 5 min stale, 10 min cache), limited refetch-on-window-focus, retries mainly on server errors.
- **Memoization**: React.memo / useMemo for expensive components (e.g. charts).
- **Virtual scrolling**: For large tables.
- **Request discipline**: Debounce (e.g. 300 ms) on search/filters; cancellation of stale requests.

### Monitoring (when enabled)

- **Health**: `/api/health` (and any service-specific health routes).
- **Metrics**: If you expose Prometheus-style metrics (e.g. `/metrics`), track request count, latency, errors, WebSocket connections.
- **Logs**: Use correlation IDs and structured logging for API and auth events.

### Tuning tips

- **Caching**: Dashboard ~5 min stale; customer list ~1 min; analytics ~2 min (adjust to your SLA).
- **Bundle**: Target &lt; 500 KB initial; use `npm run build` and analyzer if configured.
- **APIs**: Aim &lt; 200 ms for critical paths; monitor P95/P99.

---

## 12. Security

- **Secrets**: Never commit `.env.local` or production secrets; rotate periodically.
- **HTTPS**: Use TLS in production; set `NEXT_PUBLIC_FORCE_HTTPS` if the app checks it.
- **CORS**: Restrict origins in production; avoid `*` with credentials.
- **Tokens**: Prefer httpOnly cookies; do not log or send tokens in URLs.
- **Input**: Validate and sanitize on client and server; use Zod (or similar) for API boundaries.
- **Rate limiting**: Rely on gateway/backend limits; keep login attempts and admin endpoints strict.

---

## 13. Support & License

- **Docs**: `README.md` (overview), `docs/README.md` (index), `docs/guides/` (testing, auth, UI, etc.), `docs/archive/` (historical reports).
- **Codebase**: ESLint, Prettier, TypeScript for quality and consistency.
- **License**: Copyright © 2025 Akafay Intelligent Services. All rights reserved.

For persistent issues, collect browser/OS, error messages, steps to reproduce, and relevant request/response details before contacting the development team.

---

*Last updated: January 2025. Single-doc version of Decision PRO documentation.*
