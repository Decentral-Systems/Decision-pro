# API Gateway Refactor Plan — Domain-Specific by Decision PRO Features

This document is the **complete plan** to simplify `lib/api/clients/api-gateway.ts` by splitting it into domain-specific clients aligned with Decision PRO product features (menu, routes, and hooks).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State](#2-current-state)
3. [Decision PRO Features (Source of Truth)](#3-decision-pro-features-source-of-truth)
4. [Method-to-Feature Mapping](#4-method-to-feature-mapping)
5. [Target Architecture](#5-target-architecture)
6. [Option A: One Client Per Menu Feature](#6-option-a-one-client-per-menu-feature)
7. [Option B: Grouped by Product Area](#7-option-b-grouped-by-product-area)
8. [Shared Core Design](#8-shared-core-design)
9. [Recommended File Structure](#9-recommended-file-structure)
10. [Migration Steps](#10-migration-steps)
11. [Backward Compatibility](#11-backward-compatibility)

---

## 1. Executive Summary

| Item | Detail |
|------|--------|
| **Goal** | Simplify the monolithic `api-gateway.ts` (~6,072 lines, 159+ methods) by making it domain-specific and aligned with Decision PRO features. |
| **Approach** | Extract a **shared core** (Axios + interceptors + generic HTTP), then split methods into **feature clients** that consume the core. |
| **Source of truth** | Decision PRO menu (`lib/constants/menu-config.ts`), routes (`app/(dashboard)/`), and existing API hooks (`lib/api/hooks/`). |
| **Outcome** | Smaller, maintainable client modules; one place per feature; same public API during migration via a facade. |

---

## 2. Current State

- **File:** `lib/api/clients/api-gateway.ts`
- **Size:** ~6,072 lines
- **Structure:** Single class `APIGatewayClient` with:
  - One Axios instance, request/response interceptors (auth, token refresh, network, correlation ID)
  - Generic methods: `get`, `post`, `put`, `delete`
  - Token: `setAccessToken`, `login`, `refreshToken`
  - **159+ domain methods** (customers, loans, ML, analytics, admin, etc.)
- **Consumers:** Auth context, 40+ hooks under `lib/api/hooks/`, services (`explainability.ts`, `rules-engine.ts`), and some components.

---

## 3. Decision PRO Features (Source of Truth)

From `lib/constants/menu-config.ts` and `app/(dashboard)/`:

| # | Feature | Route(s) | Hooks (examples) |
|---|---------|----------|--------------------|
| 1 | Dashboard | `/dashboard` | `useDashboard`, `useExecutiveDashboard` |
| 2 | Credit Scoring | `/credit-scoring`, `/credit-scoring/batch`, `/credit-scoring/history` | `useCreditScore`, `useBatchScoring`, `useCreditScoringHistory` |
| 3 | Default Prediction | `/default-prediction` | `useDefaultPrediction`, `useDefaultPredictionHistory` |
| 4 | Dynamic Pricing | `/dynamic-pricing` | `usePricing` |
| 5 | Real-Time Scoring | `/realtime-scoring` | `useRealtimeScoring` |
| 6 | Customers | `/customers`, `/customers/[id]` | `useCustomers`, `useCustomerIntelligence`, `useCustomerJourney`, `useCustomerDocuments`, `useCustomerCommunications`, `useCustomerActivity`, `useCustomerTrends`, `useCustomerStats`, `useProductIntelligence`, `useRecommendationActions` |
| 7 | Loan Applications | `/loans/applications` | `useLoans` |
| 8 | Approvals | `/loans/approvals` | (in `useLoans` / approval flows) |
| 9 | Disbursements | `/loans/disbursements` | `useDisbursements` |
| 10 | Repayments | `/loans/repayments` | `useRepayments` |
| 11 | Collections | `/loans/collections` | `useCollections` |
| 12 | Portfolio Analytics | `/loans/portfolio` | (portfolio + analytics hooks) |
| 13 | Regulatory Reporting | `/loans/regulatory` | NBE/compliance endpoints |
| 14 | Loan Documents | `/loans/documents` | (documents in api-gateway) |
| 15 | ML Center | `/ml-center` | `useML`, `useDriftDetection`, `useModelVersionHistory`, `useFeatureImportance`, `useModelPerformance`, `usePerformanceTrends`, `useBenchmarks`, `useEnsemble`, etc. |
| 16 | Compliance | `/compliance` | `useCompliance` |
| 17 | Rules Engine | `/rules-engine` | `useRules`, `useRulesEngine` |
| 18 | Analytics | `/analytics` | `useAnalytics` |
| 19 | System Status | `/system-status` | `useSystemStatus`, `useSystemHealth` |
| 20 | User Management | `/admin/users` | `useUsers` |
| 21 | Audit Logs | `/admin/audit-logs` | `useAuditLogs` |
| 22 | Settings | `/settings` | `useSettings` |
| — | **Auth** (no menu item) | Login flow | `useAuth`, token refresh |

---

## 4. Method-to-Feature Mapping

Every current `APIGatewayClient` method assigned to a Decision PRO feature (or shared core).

### Auth
- `login`, `refreshToken`, `setAccessToken`  
- *(Keep on core for token; auth client can re-export or wrap.)*

### Dashboard
- `getDashboardData`, `getExecutiveDashboardData`, `getAggregatedDashboardData`

### Credit Scoring / Default Prediction / Dynamic Pricing / Real-Time (Scoring domain)
- `getRealtimeScoring`, `getRealtimeScoringMetrics`
- `getCustomerStats`, `getRecommendationStats` (can stay under Customers or Scoring by choice)
- *(Direct credit scoring / default / pricing may call Credit Scoring Service or gateway; keep in one scoring client or split by feature.)*

### Customers
- `getCustomers`, `getCustomer360`, `bulkActivateCustomers`, `bulkDeactivateCustomers`, `bulkDeleteCustomers`, `bulkExportCustomers`
- `createCustomer`, `updateCustomer`, `exportCustomers`, `searchCustomers`
- `getCustomerIntelligence`, `getProductRecommendations`, `getCustomerJourneyInsights`, `getCustomerJourneyTimeline`
- `getTopCustomers`, `getLifeEvents`, `applyRecommendation`, `dismissRecommendation`, `getRecommendationHistory`, `submitRecommendationFeedback`
- `getCustomerNotes`, `createCustomerNote`, `updateCustomerNote`, `deleteCustomerNote`
- `getCustomerTrends` (both overloads), `getCustomerActivityLog`, `getCustomerDocuments`, `uploadCustomerDocument`, `deleteCustomerDocument`
- `getCustomerCommunications`, `sendCustomerCommunication`, `getCommunicationTemplates`
- `getCustomerStats`, `getRecommendationStats` (if not under Scoring)

### Risk (can be separate or under Analytics)
- `getWatchlist`, `getRiskAlerts`, `getMarketRiskAnalysis`, `getMarketRiskHistorical`, `getMarketRiskSectors`

### ML Center
- `getModelPerformance`, `getModelComparison`, `getDriftDetection`, `getFeatureImportance` (by modelName), `getPerformanceTrends`
- `getModelVersions`, `compareModelVersions`, `rollbackModelVersion`, `getFeatureImportance` (by modelId), `getFeatureCorrelation`, `getFeatureDrift`
- `getMLDashboard`, `startModelTraining`, `getDataDrift`, `getModelFeatures`, `cancelTrainingJob`, `deployModel`
- `getTrainingJobs`, `getTrainingJob`, `getBenchmarks`, `getEnsembleWeights`, `getEnsembleAgreement`

### Compliance
- `getComplianceDashboard`, `reviewViolation`

### Analytics
- `getAnalyticsData`, `getRiskDistribution`, `getApprovalRates`, `getPortfolioMetrics`, `getRevenueBreakdown`, `getRevenueTrends`
- `getBankingRatiosTargets`, `getBankingRatiosStressScenario`, `getPreviousPeriodAnalytics`

### System Status
- `getSystemStatus`

### Admin (Users, Settings, Audit, Bulk/Batch status)
- `getUserActivity`, `getSettings`, `updateSettings`, `resetSettings` (both), `getCustomerTrends` (admin context if any), `getUsers`
- `bulkActivateUsers`, `bulkDeactivateUsers`, `getBulkOperationStatus`, `getBatchScoringJobStatus`, `getBatchScoringResults`
- `importSettings`, `getSettingsHistory`

### Loans (full lifecycle)
- **Applications:** `createLoanApplication`, `getLoanApplicationStatusHistory`, `getLoanApplication`, `listLoanApplications`, `updateLoanApplicationStatus`, `bulkLoanOperations`
- **NBE / rules:** `validateNBEComplianceStandalone`, `validateNBECompliance`, `evaluateProductRules`, `evaluateWorkflowRules`, `predictDefaultRisk`
- **Approvals:** `initiateApprovalWorkflow`, `approveLoanApplication`, `rejectLoanApplication`, `getPendingApprovals`, `addConditionalApproval`, `markConditionMet`, `getApprovalAnalytics`, `exportApprovalData`, `getApprovalWorkflowByWorkflowId`, `getApprovalHistory`, `bulkApproveApplications`, `getApprovalWorkflowByLoanApplicationId`
- **Disbursements:** `createDisbursement`, `processDisbursement`, `listDisbursements`, `getDisbursement`, `confirmDisbursement`, `retryDisbursement`, `cancelDisbursement`, `getLoanDisbursements`
- **Repayments:** `generateRepaymentSchedule`, `getRepaymentSchedule`, `modifyRepaymentSchedule`, `recordPayment`, `getPaymentHistory`, `getRepayments`, `generatePaymentReminder`, `calculateLateFees`, `getLoanRepaymentSchedule`, `getOverdueLoans`
- **Collections:** `initiateCollectionWorkflow`, `recordCollectionAction`, `getCollectionWorkflow`, `getCollectionEffectiveness`, `getCollectionWorkload`, `getCollections`, `escalateCollection`
- **Portfolio / reporting:** `getPortfolioOverview`, `getProductPerformance`, `generateNBEComplianceReport`, `getRealTimeKpis`, `getEnhancedParAnalysis`, `getProductComparisonAnalytics`, `getComplianceViolationsTracking`, `getExecutiveDashboardMetrics`, `getPortfolioTrendAnalysis`, `exportRegulatoryData`
- **Documents:** `uploadLoanDocument`, `listLoanDocuments`, `getDocument`, `verifyDocument`, `getDocumentExpiryAlerts`, `calculatePenalties`
- **Credit score history (loan context):** `getCreditScoreHistory` (loanApplicationId)

### Rules Engine
- *(Currently `lib/api/services/rules-engine.ts` uses `apiGatewayClient.client`; can move to a dedicated rules-client that uses core.)*

### Generic (stay on core only)
- `get`, `post`, `put`, `delete` — low-level HTTP; used by feature clients and some hooks.

---

## 5. Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Consumers: Auth, Hooks, Services, Components                     │
└──────────────────────────────┬──────────────────────────────────┘
                               │
         ┌─────────────────────┴─────────────────────┐
         │  Optional: api-gateway.ts (facade)          │
         │  Re-exports core + all feature clients      │
         │  Preserves apiGatewayClient.* for migration│
         └─────────────────────┬──────────────────────┘
                               │
    ┌──────────────────────────┼──────────────────────────┐
    │                          │                          │
    ▼                          ▼                          ▼
┌───────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│ api-client-   │    │ dashboard-client    │    │ customers-client     │
│ core.ts       │    │ loans-client        │    │ ml-center-client     │
│               │    │ analytics-client    │    │ compliance-client    │
│ • Axios       │    │ admin-client        │    │ ...                  │
│ • Interceptors│    │ auth-client         │    │                      │
│ • get/post/   │    │ (each uses core)    │    │                      │
│   put/delete  │    │                     │    │                      │
│ • setAccess   │    │                     │    │                      │
│   Token       │    │                     │    │                      │
└───────────────┘    └─────────────────────┘    └─────────────────────┘
```

- **Core:** Single Axios instance, all interceptors, network/offline handling, correlation ID, token refresh, and generic `get`/`post`/`put`/`delete`. Exposes `setAccessToken` (and optionally `login`/`refreshToken` or they live in auth-client that uses core).
- **Feature clients:** Stateless modules that receive the core client (or its interface) and implement only their domain methods. No duplicate Axios or interceptor logic.
- **Facade (optional):** One `api-gateway.ts` that composes core + all feature clients and exposes the same surface as today so call sites can stay unchanged during migration.

---

## 6. Option A: One Client Per Menu Feature

| # | Client File | Decision PRO Feature | Methods / Responsibility |
|---|-------------|----------------------|---------------------------|
| 1 | `auth-client.ts` | Auth | `login`, `refreshToken`, `setAccessToken` (or on core) |
| 2 | `dashboard-client.ts` | Dashboard | `getDashboardData`, `getExecutiveDashboardData`, `getAggregatedDashboardData` |
| 3 | `credit-scoring-client.ts` | Credit Scoring | Scoring, batch, history; optional: default prediction & pricing if via gateway |
| 4 | `realtime-scoring-client.ts` | Real-Time Scoring | `getRealtimeScoring`, `getRealtimeScoringMetrics` |
| 5 | `customers-client.ts` | Customers | All customer CRUD, 360, search, bulk, notes, activity, documents, communications, intelligence, journey, recommendations, trends, stats, templates |
| 6 | `loans-client.ts` | Loan Applications, Approvals, Disbursements, Repayments, Collections, Portfolio, Regulatory, Documents | All loan lifecycle methods listed in §4 |
| 7 | `ml-center-client.ts` | ML Center | All ML/MLOps methods in §4 |
| 8 | `compliance-client.ts` | Compliance | `getComplianceDashboard`, `reviewViolation` |
| 9 | `rules-engine-client.ts` | Rules Engine | Rules endpoints (used by `rules-engine.ts`) |
| 10 | `analytics-client.ts` | Analytics | All analytics methods in §4; optionally risk (watchlist, alerts, market) |
| 11 | `risk-client.ts` | (Risk) | `getWatchlist`, `getRiskAlerts`, `getMarketRisk*` — or merge into analytics-client |
| 12 | `system-status-client.ts` | System Status | `getSystemStatus` |
| 13 | `admin-client.ts` | User Management, Audit Logs, Settings | Users, settings, reset, import, history, user activity, bulk/batch status |

**Total: 12–14 feature clients** (depending on whether Risk and Rules are separate).

---

## 7. Option B: Grouped by Product Area

Fewer files; each file still maps to Decision PRO “product areas.”

| # | Client File | Decision PRO Features Covered | Methods |
|---|-------------|-------------------------------|---------|
| 1 | `auth-client.ts` | Auth | login, refresh, setAccessToken |
| 2 | `dashboard-client.ts` | Dashboard | getDashboardData, getExecutiveDashboardData, getAggregatedDashboardData |
| 3 | `scoring-client.ts` | Credit Scoring, Default Prediction, Dynamic Pricing, Real-Time Scoring | All scoring/realtime/pricing/prediction methods |
| 4 | `customers-client.ts` | Customers | All customer + intelligence/journey/recommendations methods |
| 5 | `loans-client.ts` | Loan Applications, Approvals, Disbursements, Repayments, Collections, Portfolio, Regulatory, Documents | All loan lifecycle methods |
| 6 | `ml-center-client.ts` | ML Center | All ML/MLOps methods |
| 7 | `compliance-client.ts` | Compliance (optional: Rules Engine) | getComplianceDashboard, reviewViolation; rules if merged |
| 8 | `rules-engine-client.ts` | Rules Engine | Rules endpoints (if not merged into compliance) |
| 9 | `analytics-client.ts` | Analytics + Risk | Analytics + watchlist, risk alerts, market risk |
| 10 | `admin-client.ts` | System Status, User Management, Audit Logs, Settings | getSystemStatus, users, settings, audit, bulk/batch status |

**Total: 9–10 client files** (excluding core).

---

## 8. Shared Core Design

**File:** `lib/api/clients/api-client-core.ts` (or `api-gateway-core.ts`)

**Responsibilities:**

1. Create single Axios instance with `baseURL`, `timeout`, default headers.
2. Request interceptor:
   - Network offline check (skip for auth/health).
   - Add `Authorization: Bearer <accessToken>` for non-public endpoints.
   - Add `X-API-Key` when configured and no valid token.
   - Add `X-Correlation-ID` (e.g. from `getOrCreateCorrelationId()`).
   - Optional dev logging.
3. Response interceptor:
   - Store `x-correlation-id` from response (e.g. sessionStorage).
   - On 401: attempt token refresh (with retry limit and network check), then retry request or redirect to login.
   - Map errors to `APIServiceError` / `APITimeoutError` / `APINetworkError`.
4. Request deduplication: `pendingRequests` map by `url + params` (keep current behavior).
5. Expose:
   - `get<T>(url, params?, config?)`
   - `post<T>(url, data?, config?)`
   - `put<T>(url, data?, config?)`
   - `delete<T>(url, config?)`
   - `setAccessToken(token: string | null)`
   - `client`: AxiosInstance (for legacy or low-level use)
6. Optionally expose `login` and `refreshToken` here so auth-client only wraps them; or move them into auth-client and have auth-client call core `post` with the same URLs/body.

**What moves out of core:** All 159+ domain methods → feature clients.

---

## 9. Recommended File Structure

```
lib/api/clients/
├── api-client-core.ts          # Axios + interceptors + get/post/put/delete + setAccessToken
├── auth-client.ts              # login, refreshToken (uses core)
├── dashboard-client.ts
├── scoring-client.ts           # Credit + Default Prediction + Dynamic Pricing + Real-Time (Option B)
│   # OR: credit-scoring-client.ts, default-prediction-client.ts, dynamic-pricing-client.ts, realtime-scoring-client.ts (Option A)
├── customers-client.ts
├── loans-client.ts
├── ml-center-client.ts
├── compliance-client.ts
├── rules-engine-client.ts      # if separate from compliance
├── analytics-client.ts          # includes risk (Option B) or separate risk-client.ts (Option A)
├── admin-client.ts             # system status, users, settings, audit, bulk/batch status
├── api-gateway.ts              # FACADE: composes core + all clients, exposes same API as current APIGatewayClient
└── index.ts                    # Re-export facade + core + clients for direct imports
```

**Recommendation:** Start with **Option B** (9–10 clients) for fewer files and clearer “product area” boundaries; split further (Option A) later if a domain (e.g. Loans or ML) needs more than one file.

---

## 10. Migration Steps

1. **Create core**
   - New file `api-client-core.ts`.
   - Move Axios creation, interceptors, network/offline logic, deduplication, and `get`/`post`/`put`/`delete` + `setAccessToken` from current `api-gateway.ts`.
   - Export core instance (e.g. `apiClientCore`) and types.

2. **Create auth-client**
   - `auth-client.ts` that takes core (or uses singleton core), implements `login`, `refreshToken`; `setAccessToken` can stay on core and be re-exported from facade.
   - Update auth context to use auth-client (or keep using facade that delegates to auth-client).

3. **Extract feature clients one by one**
   - Pick one domain (e.g. Dashboard or System Status).
   - Create `dashboard-client.ts` / `system-status-client.ts` that receives core and implements only that domain’s methods (same signatures as current).
   - In facade, instantiate the new client and delegate `getDashboardData` / `getSystemStatus` to it.
   - Run tests and smoke checks; no consumer changes yet.

4. **Repeat for all domains**
   - Customers → `customers-client.ts`
   - Loans → `loans-client.ts`
   - ML Center → `ml-center-client.ts`
   - Compliance → `compliance-client.ts`
   - Analytics (and Risk) → `analytics-client.ts`
   - Admin (system status, users, settings, audit, bulk/batch) → `admin-client.ts`
   - Rules → `rules-engine-client.ts` (and optionally update `lib/api/services/rules-engine.ts` to use it).
   - Scoring (credit, default prediction, pricing, realtime) → `scoring-client.ts` or separate clients.

5. **Facade**
   - Keep `api-gateway.ts` as a thin facade: create/import core and all feature clients, then expose a single object that has every method (core + auth + dashboard + …). Export `apiGatewayClient` as today so all existing imports and `apiGatewayClient.*` calls continue to work.

6. **Optional: direct imports**
   - Gradually change hooks to import from `dashboard-client`, `loans-client`, etc., instead of `api-gateway`. Eventually the facade can become a re-export only or be removed if everything uses direct clients.

7. **Cleanup**
   - Remove duplicated code from old monolith; ensure no logic remains in facade except delegation. Add unit tests per client where useful.

---

## 11. Backward Compatibility

- **During migration:** The facade `api-gateway.ts` preserves the current public API. All existing code that does `import { apiGatewayClient } from '@/lib/api/clients/api-gateway'` and calls `apiGatewayClient.getDashboardData()`, `apiGatewayClient.getCustomers()`, etc., keeps working without changes.
- **After migration:** New code can import specific clients, e.g. `import { dashboardClient } from '@/lib/api/clients/dashboard-client'`. The facade can remain indefinitely for legacy call sites or be deprecated once all consumers are updated.
- **Re-exports:** Use `lib/api/clients/index.ts` to re-export `apiGatewayClient`, `apiClientCore`, and each feature client so both “single gateway” and “domain clients” styles are supported.

---

## Document Info

- **Created:** 2025-02-03  
- **Source:** Decision PRO menu (`lib/constants/menu-config.ts`), routes (`app/(dashboard)/`), hooks (`lib/api/hooks/`), and current `lib/api/clients/api-gateway.ts` method list.  
- **Status:** Plan only; implementation to follow per migration steps above.
