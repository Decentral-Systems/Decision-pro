# Decision PRO Admin Dashboard

Modern Next.js 14+ admin dashboard for the AIS (Akafay Intelligent Services) platform.

## Features

- **Modern UI**: Built with Next.js 14, TypeScript, Tailwind CSS, and shadcn/ui
- **Authentication**: NextAuth.js with JWT token management
- **Role-Based Access Control**: 6 user roles with granular permissions
- **API Integration**: Seamless integration with API Gateway and Credit Scoring Service
- **Real-time Data**: React Query for efficient data fetching and caching
- **Responsive Design**: Works on desktop, tablet, and mobile devices

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **Authentication**: NextAuth.js

## Getting Started

### Prerequisites

- Node.js 18+ and npm 9+
- API Gateway running on port 4000
- Credit Scoring Service running on port 4001

### Installation

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your configuration:
```env
NEXTAUTH_URL=http://196.188.249.48:4009
NEXTAUTH_SECRET=your-secret-key
NEXT_PUBLIC_API_GATEWAY_URL=http://196.188.249.48:4000
NEXT_PUBLIC_WEBSOCKET_URL=ws://196.188.249.48:4000/ws
NEXT_PUBLIC_CREDIT_SCORING_API_URL=http://196.188.249.48:4001
NEXT_PUBLIC_DEFAULT_PREDICTION_API_URL=http://196.188.249.48:4002
```

4. Run development server:
```bash
npm run dev
```

5. Open [http://196.188.249.48:4009](http://196.188.249.48:4009)

## Building for Production

```bash
npm run build
npm start
```

## Docker Deployment

Build and run with Docker:

```bash
docker build -t decision-pro-admin .
docker run -p 3000:3000 decision-pro-admin
```

Or use docker-compose:

```bash
docker-compose up decision-pro-admin
```

## Project Structure

```
decision-pro-admin/
├── app/                    # Next.js app router pages
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   └── api/               # API routes
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── layout/           # Layout components
│   ├── forms/            # Form components
│   └── charts/           # Chart components
├── lib/                  # Utilities and configurations
│   ├── api/              # API clients and hooks
│   ├── auth/             # Authentication config
│   └── utils/            # Utility functions
└── types/                # TypeScript types
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXTAUTH_URL` | Base URL for NextAuth | `http://196.188.249.48:4009` |
| `NEXTAUTH_SECRET` | Secret for JWT signing | Required |
| `NEXT_PUBLIC_API_GATEWAY_URL` | API Gateway URL | `http://196.188.249.48:4000` |
| `NEXT_PUBLIC_WEBSOCKET_URL` | WebSocket URL for real-time updates | `ws://196.188.249.48:4000/ws` |
| `NEXT_PUBLIC_CREDIT_SCORING_API_URL` | Credit Scoring Service URL | `http://196.188.249.48:4001` |
| `NEXT_PUBLIC_DEFAULT_PREDICTION_API_URL` | Default Prediction Service URL | `http://196.188.249.48:4002` |

## Authentication

The dashboard uses NextAuth.js with Credentials provider. Users authenticate against the API Gateway `/auth/login` endpoint.

### User Roles

- **admin**: Full system access
- **credit_analyst**: Credit scoring operations
- **risk_manager**: Risk management
- **compliance_officer**: Regulatory compliance
- **customer_service**: Customer support
- **read_only**: View-only access

## API Integration

The dashboard integrates with multiple services:

1. **API Gateway** (`http://196.188.249.48:4000`)
   - Authentication
   - User management
   - Admin operations
   - WebSocket server for real-time updates

2. **Credit Scoring Service** (`http://196.188.249.48:4001`)
   - Credit scoring
   - Customer 360 views
   - ML model operations

3. **Default Prediction Service** (`http://196.188.249.48:4002`)
   - Default prediction models
   - Survival analysis

### WebSocket Integration

The dashboard uses WebSocket for real-time updates:

- **Real-time Credit Score Updates**: Instant updates when credit scores are calculated
- **Risk Alerts**: Real-time notifications for new risk alerts
- **System Status Changes**: Live system health monitoring
- **Automatic Reconnection**: Exponential backoff with polling fallback
- **Channel Subscriptions**: Subscribe to specific channels (dashboard, executive, alerts)

### Performance Optimizations

- **Request Debouncing**: Search and filter inputs debounced (300ms) to reduce API calls
- **Request Cancellation**: Automatic cancellation of stale requests using AbortController
- **Request Deduplication**: Duplicate concurrent requests automatically deduplicated
- **Aggressive Caching**: Dashboard data cached for 5 minutes with 10-minute retention
- **Optimized Chart Rendering**: Charts use React.memo and useMemo for performance
- **Virtual Scrolling**: Large tables use virtual scrolling for better performance

## Documentation

- **Single complete doc**: [DECISION_PRO_DOCUMENTATION.md](DECISION_PRO_DOCUMENTATION.md) — one-file reference for setup, API, deployment, testing, troubleshooting
- **Guides** (testing, auth, UI, quick start): [docs/guides/](docs/guides/)
- **Core docs** (API, deployment, env, troubleshooting): [docs/](docs/)
- **Doc index**: [docs/README.md](docs/README.md)

## Development

### Code Quality

- ESLint for linting
- Prettier for formatting
- TypeScript for type safety

### Testing

```bash
npm run lint
npm run type-check
```

## License

Copyright © 2025 Akafay Intelligent Services. All rights reserved.

