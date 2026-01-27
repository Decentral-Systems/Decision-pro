# Testing Guide - Customer & Customer 360 Enhancements

This document provides a comprehensive testing guide for all the enhancements implemented.

## Prerequisites

1. Ensure the development server is running:
   ```bash
   cd /home/AIS/decision-pro-admin
   npm run dev
   ```

2. Access the application at: `http://localhost:3000`

3. Login with valid credentials

---

## 1. Filter Chips Enhancement

### Location: Customers Page (`/customers`)

### Test Steps:
1. Navigate to `/customers`
2. Open the "Filters" section (click "Show Filters" if hidden)
3. Apply multiple filters:
   - Select a Region (e.g., "Addis Ababa")
   - Select a Risk Level (e.g., "low")
   - Select a Status (e.g., "active")
   - Set a Min Score (e.g., "600")
   - Set a Date From (e.g., "2024-01-01")
4. **Expected Result:**
   - Filter chips should appear above the filter section showing all active filters
   - Each chip should display the filter name and value
   - Each chip should have an X button to remove that specific filter
   - A "Clear all" button should appear when multiple filters are active

5. Test Individual Removal:
   - Click the X button on any filter chip
   - **Expected:** That filter should be removed and the customer list should update
   - URL should update to reflect the change

6. Test Clear All:
   - Click "Clear all" button
   - **Expected:** All filters should be cleared and customer list should show all customers
   - URL should update to remove all filter parameters

---

## 2. Advanced Search Features (Search History & Saved Searches)

### Location: Customers Page (`/customers`)

### Test Steps:
1. Navigate to `/customers`
2. Look for the "History" button next to the search input
3. Click the "History" button
   - **Expected:** A dropdown should open showing recent searches and saved searches sections

4. Test Search History:
   - Perform several searches (e.g., search for customer IDs, names, phone numbers)
   - Click "History" button again
   - **Expected:** Recent searches should appear with timestamps (e.g., "Just now", "5m ago", "2h ago")
   - Each recent search should have:
     - Search icon
     - Search query text
     - Timestamp
     - Star icon (to save)
     - Trash icon (to remove)

5. Test Saving Searches:
   - Click the star icon on any recent search
   - **Expected:** Search should move to "Saved Searches" section at the top
   - Toast notification should appear confirming the save

6. Test Using Saved/Recent Searches:
   - Click on any search from the history dropdown
   - **Expected:** Search input should be populated and search should execute

7. Test Removing from History:
   - Click the trash icon on a search
   - **Expected:** Search should be removed from history
   - Toast notification should appear

8. Test Clear History:
   - Click "Clear" button in Recent Searches section
   - **Expected:** All recent searches should be cleared

---

## 3. Feature Extraction (197 Features)

### Location: Customer 360 Page → Features Tab

### Test Steps:
1. Navigate to `/customers`
2. Click on any customer to open Customer 360 view
3. Click on the "Features" tab
4. **Expected Result:**
   - Should see multiple feature categories:
     - Traditional Financial Features
     - Credit Features
     - Employment Features
     - Demographic Features
     - Risk Features
     - Alternative Data Features (NEW)
     - Behavioral Features (NEW)
     - Financial Metrics & Ratios (NEW)
     - Other Features
   - Total feature count should be significantly higher than before (~100+ features visible)
   - Each category should show multiple features with their values

5. Test Search Functionality:
   - Use the search bar to search for specific features (e.g., "telecom", "gig", "IoT")
   - **Expected:** Only matching features should be displayed

6. Test Category Filter:
   - Click on category badges to filter by category
   - **Expected:** Only features from that category should be displayed

---

## 4. Loan Details Modal

### Location: Customer 360 Page → Loans Tab

### Test Steps:
1. Navigate to a customer with loans (Customer 360 view)
2. Click on the "Loans" tab
3. Find the "Active Loans" table or "All Loans" table
4. **Expected Result:**
   - Each loan row should have an eye icon (👁️) button in the Status column
   - Loan rows should be clickable (hover should show cursor change)

5. Test Opening Modal:
   - Click on any loan row OR click the eye icon
   - **Expected:** A modal should open showing:
     - Loan Overview cards (Loan Amount, Outstanding Balance, Interest Rate, Monthly Payment)
     - Loan Progress bar showing paid vs remaining
     - Loan Information section (Loan ID, Type, Status, Term, Dates, etc.)
     - Payment Schedule table showing next 12 months of payments
     - Additional Information section (if available)

6. Test Payment Schedule:
   - Scroll down in the modal to see Payment Schedule
   - **Expected:** Should see a table with:
     - Payment # (1, 2, 3...)
     - Due Date
     - Amount
     - Status badges (Upcoming, Due Soon, Overdue)

7. Test Closing Modal:
   - Click the X button or outside the modal
   - **Expected:** Modal should close

---

## 5. Payment Schedule Calendar

### Location: Customer 360 Page → Payments Tab

### Test Steps:
1. Navigate to a customer with payment history (Customer 360 view)
2. Click on the "Payments" tab
3. Scroll down to the "Upcoming Payments" section
4. **Expected Result:**
   - Should see a tabbed interface with:
     - "Upcoming Payments Table" tab (default)
     - "Calendar View" tab

5. Test Calendar View:
   - Click on "Calendar View" tab
   - **Expected:** Should see:
     - Calendar header with month/week navigation
     - Summary cards showing:
       - Total Due This Period
       - Overdue Payments
       - Upcoming Payments count
     - Calendar grid (month view) or list (week view) showing payments
     - Payments displayed with status badges and amounts

6. Test Month/Week Toggle:
   - Click "Week View" or "Month View" button
   - **Expected:** Calendar should switch between month grid and week list views

7. Test Navigation:
   - Click previous/next arrows to navigate months/weeks
   - **Expected:** Calendar should update to show different time periods
   - Summary cards should update based on selected period

8. Test Payment Display:
   - Look at calendar grid/list for payment entries
   - **Expected:** Should see:
     - Payment dates
     - Payment amounts
     - Status indicators (overdue, due soon, upcoming)
     - Loan IDs or Payment IDs

---

## 6. Data Completeness Validation

### Location: Customer 360 Page → Profile Tab

### Test Steps:
1. Navigate to a customer (Customer 360 view)
2. Click on the "Profile" tab
3. **Expected Result:**
   - At the top, should see "Data Completeness Score" card showing:
     - Overall completeness percentage (e.g., "85%")
     - Badge indicating quality (Excellent/Good/Fair/Poor)
     - Progress bar
     - Required vs Optional fields breakdown

4. Test Missing Fields Alert:
   - If customer has missing required fields:
     - **Expected:** Red alert should appear showing which required fields are missing

5. Test Category Breakdown:
   - Scroll down to "Field Completeness by Category" card
   - **Expected:** Should see sections for:
     - Personal Information
     - Location Information
     - Financial Information
     - Employment Information
   - Each section should show:
     - Completion percentage
     - Count of completed vs total fields
     - Progress bar
     - Field-by-field status (✓ or ✗)

6. Test Recommendations:
   - Scroll to "Data Quality Recommendations" card
   - **Expected:** Should see contextual recommendations based on completeness score:
     - Critical alerts if <50%
     - Action required if <70%
     - Good progress if 70-90%
     - Excellent if >90%

7. Test Tabbed Interface:
   - Should see tabs: "Personal Information", "Employment", "Financial"
   - Click each tab to see organized information
   - **Expected:** Data should be organized into relevant sections

---

## Verification Checklist

- [ ] Filter chips appear and work correctly on Customers page
- [ ] Search history dropdown works and saves searches
- [ ] Saved searches functionality works
- [ ] Features tab shows 100+ features across multiple categories
- [ ] Loan details modal opens and displays correctly
- [ ] Payment schedule calendar displays in month and week views
- [ ] Data completeness indicator shows accurate scores
- [ ] All enhancements are visually consistent with the design system
- [ ] No console errors appear in browser developer tools
- [ ] All interactions are responsive and smooth

---

## Common Issues & Troubleshooting

### Issue: Filter chips not appearing
- **Check:** Are filters actually applied? (not set to "all" or empty)
- **Check:** Browser console for JavaScript errors
- **Fix:** Clear browser cache and refresh

### Issue: Search history not saving
- **Check:** Browser localStorage is enabled
- **Check:** Console for errors related to localStorage
- **Fix:** Check browser permissions for localStorage

### Issue: Loan modal not opening
- **Check:** Customer has loans in the database
- **Check:** Click event is properly bound
- **Fix:** Verify loan data structure matches expected format

### Issue: Calendar view empty
- **Check:** Customer has upcoming payments
- **Check:** Payment/loan data includes due dates
- **Fix:** Verify data format includes `due_date` or `date` fields

### Issue: Data completeness shows 0%
- **Check:** Customer profile data exists
- **Check:** Data structure matches expected format
- **Fix:** Verify customer data structure in browser dev tools

---

## Browser Testing Checklist

Test in the following browsers:
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (if on Mac)

Test on different screen sizes:
- [ ] Desktop (1920x1080)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## Performance Testing

- [ ] Page load time < 3 seconds
- [ ] Filter application < 500ms
- [ ] Modal opening < 200ms
- [ ] Calendar rendering < 1 second
- [ ] No memory leaks during extended use

---

## Notes

- All enhancements use localStorage for client-side persistence (search history)
- Filter state is persisted in URL parameters
- Data completeness calculation runs client-side
- Payment schedule generation uses JavaScript date calculations
- Feature extraction uses client-side data transformation

