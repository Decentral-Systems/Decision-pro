# Enhanced Loan Application Detail View

## Implementation Plan

This document outlines the enhancements needed for the loan application detail view page.

### Current Status
- Basic detail view exists with tabs for Overview, NBE Compliance, Status History, Documents
- Status history tab exists but needs timeline visualization
- Documents tab is placeholder
- Missing: Related records, activity log, quick actions

### Required Enhancements

1. **Status History Timeline Visualization**
   - Use `useLoanApplicationStatusHistory` hook
   - Display timeline with vertical line showing status changes
   - Show user, timestamp, reason, and metadata for each change
   - Color-code by status type

2. **Related Records Section**
   - Approval Workflows: Link to workflow detail, show current stage
   - Disbursements: Show disbursement status and amount
   - Repayment Schedules: Show schedule status and next payment
   - Payment History: Show recent payments
   - Collection Workflows: Show if in collection

3. **Activity Log/Audit Trail**
   - Complete activity log with all operations
   - Filter by operation type
   - Search functionality
   - Export capability

4. **Quick Actions**
   - "Initiate Approval" (if status is 'draft')
   - "Create Disbursement" (if status is 'approved')
   - "Record Payment" (if status is 'active')
   - Status change dropdown

5. **Document Management**
   - Upload documents interface
   - View uploaded documents
   - Document verification status
   - Document expiry monitoring

### Implementation Notes

- Status history API endpoint: `/api/v1/loans/applications/{id}/status-history`
- Need to add API endpoints for related records (approval workflows, disbursements, etc.)
- Use existing UI components from shadcn/ui
- Follow existing design patterns in the codebase
