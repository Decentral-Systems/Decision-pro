# Decision PRO - Browser Testing Guide

## Server Status
- **URL**: http://localhost:4009
- **Status**: Check with `curl http://localhost:4009` or open in browser

## Comprehensive Testing Checklist

### 1. Authentication & Login
- [ ] Navigate to `/login`
- [ ] Enter valid credentials
- [ ] Verify successful login redirect
- [ ] Check session persistence on page refresh
- [ ] Test logout functionality
- [ ] Verify token refresh works automatically

### 2. Dashboard Page (`/dashboard`)
- [ ] Page loads without errors
- [ ] KPI cards display data (revenue, loans, customers, risk score)
- [ ] Charts render correctly (Model Performance, Feature Importance, etc.)
- [ ] Real-time updates work (if WebSocket connected)
- [ ] Loading states show while fetching data
- [ ] Error states display gracefully if API fails
- [ ] No console errors

### 3. Analytics Page (`/analytics`)
- [ ] Portfolio metrics display correctly
- [ ] Risk distribution chart renders
- [ ] Approval rates chart shows data
- [ ] Revenue trends chart displays
- [ ] Customer segments data visible
- [ ] Filters and date ranges work
- [ ] Export functionality works (if implemented)

### 4. Customers List (`/customers`)
- [ ] Customer table loads with data
- [ ] Search functionality works
- [ ] Filters (region, risk level, status) work
- [ ] Pagination works correctly
- [ ] Clicking a customer opens Customer 360 view
- [ ] No 401 errors when loading customers
- [ ] Fallback data shows in development mode if API unavailable

### 5. Customer 360 View (`/customers/[id]`)
- [ ] All 9 tabs load correctly:
  - [ ] Overview
  - [ ] Profile
  - [ ] Credit History
  - [ ] Features (197 features)
  - [ ] Loans Portfolio
  - [ ] Risk Assessment
  - [ ] Payments
  - [ ] Journey
  - [ ] Intelligence
- [ ] Charts render in each tab
- [ ] No 401 authentication errors
- [ ] Data displays correctly
- [ ] Export functionality works
- [ ] Navigation between tabs is smooth

### 6. Credit Scoring (`/credit-scoring`)
- [ ] Form loads with all 168 fields
- [ ] Customer type selection (New/Existing) works
- [ ] Customer search and filtering works
- [ ] Form pre-population for existing customers works
- [ ] Form validation works (phone, ID number, etc.)
- [ ] Submit button triggers API request
- [ ] Response displays in advanced format
- [ ] Model predictions breakdown shows
- [ ] Explainability insights display
- [ ] Copy/download JSON works

### 7. Batch Processing (`/credit-scoring/batch`)
- [ ] File upload form works
- [ ] CSV validation works
- [ ] Progress tracking displays
- [ ] Results table shows data
- [ ] Sorting, filtering, search work
- [ ] Pagination works
- [ ] Export (CSV, Excel, PDF) works
- [ ] Retry mechanism for failed rows works

### 8. Default Prediction (`/default-prediction`)
- [ ] Form loads correctly
- [ ] Input validation works
- [ ] Submit triggers API request
- [ ] Results display correctly
- [ ] Charts/visualizations render
- [ ] No fallback data in production

### 9. Dynamic Pricing (`/dynamic-pricing`)
- [ ] Calculator form works
- [ ] Input validation works
- [ ] Submit triggers API request
- [ ] Results display correctly
- [ ] Pricing breakdown shows
- [ ] No fallback data in production

### 10. Real-time Scoring (`/realtime-scoring`)
- [ ] Dashboard loads
- [ ] Score feed displays
- [ ] Metrics update in real-time
- [ ] WebSocket connection works (check browser console)
- [ ] Filters work
- [ ] No console errors

### 11. ML Center (`/ml-center`)
- [ ] Model metrics display
- [ ] Active models list shows
- [ ] Training jobs display
- [ ] Performance data visualizes
- [ ] Drift detection data shows
- [ ] No fallback data in production

### 12. Compliance (`/compliance`)
- [ ] Compliance metrics display
- [ ] Recent violations list shows
- [ ] Rules display correctly
- [ ] Report generation works
- [ ] No fallback data in production

### 13. System Status (`/system-status`)
- [ ] Overall status displays
- [ ] Service health shows
- [ ] Dependency status shows
- [ ] Metrics display
- [ ] Auto-refresh works
- [ ] No fallback data in production

### 14. Admin Users (`/admin/users`)
- [ ] Users table loads
- [ ] Create user functionality works
- [ ] Edit user works
- [ ] Delete user with confirmation works
- [ ] Role assignment works
- [ ] Bulk operations work
- [ ] View Activity dialog works
- [ ] Search and filtering work

### 15. Admin Audit Logs (`/admin/audit-logs`)
- [ ] Audit logs table loads
- [ ] Advanced filtering works (date range, user, action, status)
- [ ] Export to CSV works
- [ ] Export to PDF works
- [ ] Detail view modal works
- [ ] Auto-refresh works
- [ ] Pagination works

### 16. Settings (`/settings`)
- [ ] All tabs load:
  - [ ] System settings
  - [ ] API configuration
  - [ ] Security settings
  - [ ] Notifications preferences
- [ ] Form validation works
- [ ] Save functionality works
- [ ] Reset to defaults works
- [ ] Success/error toasts display
- [ ] Settings persist after refresh

## Performance Testing

### Page Load Times
- [ ] Dashboard loads in < 3 seconds
- [ ] Customer list loads in < 2 seconds
- [ ] Customer 360 loads in < 3 seconds
- [ ] Credit scoring form loads in < 2 seconds

### Bundle Size
- [ ] Check browser DevTools Network tab
- [ ] Initial bundle < 500KB (gzipped)
- [ ] Lazy-loaded chunks load on demand

### React Query Caching
- [ ] Data persists across page navigations
- [ ] Stale data refetches appropriately
- [ ] Cache invalidation works on mutations

## Error Handling

### Network Errors
- [ ] Graceful fallback when API unavailable
- [ ] User-friendly error messages
- [ ] Retry buttons work
- [ ] No white screen of death

### Authentication Errors
- [ ] 401 errors trigger re-login
- [ ] Token refresh works automatically
- [ ] Session expiry handled gracefully

### Validation Errors
- [ ] Form validation errors display clearly
- [ ] Field-level error messages show
- [ ] Submit blocked until valid

## Browser Compatibility

Test in:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if available)

## Console Checks

Open browser DevTools Console and verify:
- [ ] No JavaScript errors
- [ ] No React warnings
- [ ] No network errors (except expected 404s for missing APIs)
- [ ] WebSocket connection logs (if applicable)
- [ ] API request/response logs (in development)

## Network Tab Checks

- [ ] API requests include Authorization headers
- [ ] CORS headers present (if needed)
- [ ] Response times reasonable (< 500ms for most)
- [ ] Failed requests show proper error responses

## Accessibility

- [ ] Keyboard navigation works
- [ ] Screen reader compatibility (if applicable)
- [ ] Focus states visible
- [ ] ARIA labels present (if applicable)

## Mobile Responsiveness

- [ ] Dashboard responsive on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Forms usable on mobile
- [ ] Navigation menu works on mobile

## Notes

- **Development Mode**: Fallback data is enabled for demonstration
- **Production Mode**: All fallback data should be disabled
- **API Availability**: Some features require backend services running
- **WebSocket**: Real-time features require WebSocket server running

## Common Issues & Solutions

1. **401 Errors**: Check token sync in `useAuthReady` hook
2. **Slow Loading**: Check React Query cache configuration
3. **Missing Data**: Verify API endpoints are correct
4. **Build Errors**: Run `npm run build` to check for TypeScript errors
5. **Hot Reload Issues**: Clear `.next` folder and restart dev server



