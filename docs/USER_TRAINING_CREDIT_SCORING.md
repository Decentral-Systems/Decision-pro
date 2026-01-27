# Credit Scoring Page - User Training Guide

**For:** Credit Analysts and Supervisors  
**Version:** 1.0  
**Last Updated:** January 2026

---

## Table of Contents

1. [Overview](#overview)
2. [NBE Compliance Enforcement](#nbe-compliance-enforcement)
3. [Supervisor Override Process](#supervisor-override-process)
4. [Understanding SHAP Visualizations](#understanding-shap-visualizations)
5. [Model Confidence Warnings](#model-confidence-warnings)
6. [Audit Trail Review](#audit-trail-review)
7. [Common Scenarios](#common-scenarios)
8. [Troubleshooting](#troubleshooting)

---

## Overview

The Credit Scoring page has been enhanced with critical compliance and explainability features:

- **NBE Compliance Enforcement:** Prevents non-compliant loan submissions
- **Supervisor Override:** Allows approved exceptions with justification
- **SHAP Explanations:** Shows why the model made its decision
- **Confidence Warnings:** Alerts when model confidence is low
- **Audit Trail:** Complete history of all operations

---

## NBE Compliance Enforcement

### What is NBE Compliance?

The National Bank of Ethiopia (NBE) has strict regulations for loan applications:

- **Maximum Loan Amount:** 5,000,000 ETB
- **Minimum Loan Amount:** 1,000 ETB
- **Maximum Loan Term:** 60 months (5 years)
- **1/3 Salary Rule:** Monthly payment cannot exceed 1/3 of monthly income
- **Interest Rate Range:** 12% - 25%

### How It Works

When you enter loan parameters, the system automatically validates them in real-time:

1. **As you type**, compliance is checked
2. **If violations exist**, a **red warning banner** appears at the top
3. **Submit button is disabled** until violations are resolved
4. **Violation details** are shown with specific NBE rule references

### Example: Violation Detection

**Scenario:** Customer requests 6,000,000 ETB loan

**What You'll See:**
```
⚠️ CRITICAL: NBE Compliance Violations Detected

This loan application violates NBE regulatory requirements. 
Submission is blocked until violations are resolved or supervisor override is approved.

Violations:
• Maximum loan amount: Loan amount (6,000,000 ETB) exceeds the maximum threshold (5,000,000 ETB)
```

**What to Do:**
1. **Option 1:** Adjust loan amount to 5,000,000 ETB or less
2. **Option 2:** Request supervisor override (see next section)

---

## Supervisor Override Process

### When to Use Override

Use supervisor override **only** when:
- ✅ Customer has exceptional circumstances (collateral, strategic relationship)
- ✅ You have valid business justification
- ✅ Regional/Head Office approval obtained
- ✅ All documentation is in place

**⚠️ Important:** All overrides are logged and subject to regulatory review.

### How to Request Override

**Step 1:** Fill out credit scoring form with loan parameters

**Step 2:** If violations exist, the submit button will be disabled

**Step 3:** The system will automatically prompt for override when you attempt to submit

**Step 4:** Override dialog appears with:
- List of all violations
- Justification text field (minimum 20 characters required)

**Step 5:** Enter detailed justification:
```
Example Justification:
"Customer has exceptional credit history (850 score) and provides 
collateral worth 8M ETB. Approved by Regional Manager John Doe for 
strategic business relationship. All documentation verified."
```

**Step 6:** Click "Approve Override"

**Step 7:** Form automatically submits after override approval

### Justification Best Practices

✅ **DO:**
- Provide specific reasons (collateral value, credit history, approval authority)
- Include approval names and dates
- Reference documentation
- Explain business rationale

❌ **DON'T:**
- Use generic phrases ("customer is good")
- Skip important details
- Forget to mention approval authority
- Use less than 20 characters

### What Gets Logged

Every override is logged with:
- Your user ID
- Timestamp
- All violations overridden
- Your justification
- Correlation ID for tracking

**This creates a permanent audit record for compliance review.**

---

## Understanding SHAP Visualizations

### What is SHAP?

**SHAP (SHapley Additive exPlanations)** shows which features influenced the credit score decision and by how much.

### Where to Find It

1. Calculate a credit score
2. View results
3. Click **"Explanation"** tab
4. Scroll to **"SHAP Feature Importance"** section

### Reading SHAP Values

**Top Features List:**
- Features are ranked by importance (most important first)
- **Green arrow (↑):** Feature **increased** the credit score
- **Red arrow (↓):** Feature **decreased** the credit score
- **Progress bar:** Shows relative importance
- **SHAP value:** Numerical impact on score

### Example Interpretation

```
Feature: payment_history_score
SHAP Value: +15.2
Impact: Positive (↑)
Feature Value: 0.95

Meaning: 
- Customer has excellent payment history (95%)
- This feature increased the credit score by 15.2 points
- It's one of the top positive contributors
```

### Positive vs Negative Contributors

**Positive Contributors:**
- Features that **improved** the credit score
- Examples: Good payment history, high income, low debt

**Negative Contributors:**
- Features that **lowered** the credit score
- Examples: Late payments, high debt ratio, short credit history

### Using SHAP for Decision Making

**High Positive Impact:**
- Customer has strong positive factors
- Consider approving if other factors align

**High Negative Impact:**
- Customer has significant risk factors
- Review carefully, may need additional verification

**Balanced Impact:**
- Mix of positive and negative factors
- Use your judgment based on overall profile

### Exporting SHAP Reports

Click **"Export PDF"** button to download:
- Feature importance report
- Top 10 features with values
- Positive/negative summary
- Correlation ID for reference

**Use this report:**
- For customer discussions
- For supervisor reviews
- For documentation
- For compliance audits

---

## Model Confidence Warnings

### What is Model Confidence?

Model confidence indicates how certain the model is about its prediction:
- **High Confidence (≥80%):** Model is very certain
- **Low Confidence (<80%):** Model is less certain

### When You'll See Warnings

If confidence is **below 80%**, you'll see:

1. **Warning Alert** in Explanation tab:
   ```
   ⚠️ Low Model Confidence Warning
   
   The model confidence is below 80% (75.3%). This indicates lower 
   certainty in the credit score prediction. Please review the decision 
   carefully and consider additional verification before making a final 
   approval decision.
   ```

2. **Highlighted Confidence Card:**
   - Yellow border and background
   - Warning icon
   - "Low Confidence Warning" text

### What to Do When Confidence is Low

**Recommended Actions:**
1. ✅ **Review SHAP explanations** - Understand which features are uncertain
2. ✅ **Check customer history** - Look at previous scores and trends
3. ✅ **Verify data quality** - Ensure all information is accurate
4. ✅ **Consider additional verification:**
   - Request additional documentation
   - Contact customer for clarification
   - Review with supervisor
5. ✅ **Document your decision** - Note why you approved/rejected despite low confidence

**⚠️ Important:** Low confidence doesn't mean reject automatically. It means **review more carefully**.

### Example Scenario

**Credit Score:** 680  
**Confidence:** 72% (Low)  
**SHAP Shows:** High variance in employment history data

**Action:** 
- Review employment documentation
- Verify with employer if needed
- Make informed decision based on verified data

---

## Audit Trail Review

### What is the Audit Trail?

The audit trail is a **complete, tamper-proof record** of all credit scoring operations:
- Every credit score calculation
- All compliance violations
- All supervisor overrides
- Customer data access
- Form modifications

### Why It Matters

- **Regulatory Compliance:** NBE requires 7-year retention
- **Accountability:** Every action is tied to a user
- **Investigation:** Can trace any decision back to source
- **Transparency:** Complete decision history

### How to Access

1. Calculate a credit score
2. View results
3. Click **"Compliance"** tab
4. Scroll to **"Audit Trail"** section

### Reading Audit Events

Each event shows:
- **Timestamp:** When it happened
- **Event Type:** What happened (credit_score_calculated, compliance_violation, etc.)
- **Action:** Description of the action
- **User:** Who performed the action
- **Correlation ID:** Unique identifier for tracking

### Filtering Events

**Search:**
- Type in search box to find specific events
- Searches: action, user ID, correlation ID

**Event Type Filter:**
- Select specific event types
- Examples: Credit Score Calculated, Compliance Violation, Override

**Date Range Filter:**
- Last 24 Hours
- Last 7 Days
- Last 30 Days
- Last 90 Days
- All Time

### Exporting Audit Trail

Click **"Export"** button to download:
- **PDF:** Formatted report for documentation
- **Excel:** Spreadsheet for analysis
- **CSV:** Data file for import into other systems

**Use exports for:**
- Compliance reporting
- Internal audits
- Regulatory submissions
- Investigation documentation

### Correlation ID

Every operation has a **Correlation ID** - a unique identifier that links:
- Credit score calculation
- All related audit events
- API requests
- System logs

**Use it to:**
- Track a specific decision through the system
- Investigate issues
- Reference in support tickets
- Link to customer records

---

## Common Scenarios

### Scenario 1: Standard Compliant Application

**Situation:** Customer applies for 100,000 ETB loan, 24 months, 20,000 ETB monthly income

**Steps:**
1. Fill out form
2. System validates: ✅ Compliant
3. Green compliance badge appears
4. Submit button enabled
5. Calculate score
6. Review results and SHAP explanation
7. Make decision

**No special actions needed** - standard workflow.

---

### Scenario 2: Violation - Loan Amount Too High

**Situation:** Customer requests 6,000,000 ETB (exceeds 5M limit)

**Steps:**
1. Enter loan amount: 6,000,000
2. **Red warning banner appears:**
   ```
   ⚠️ CRITICAL: NBE Compliance Violations Detected
   Maximum loan amount: Loan amount exceeds 5,000,000 ETB
   ```
3. Submit button disabled
4. **Options:**
   - **Option A:** Reduce loan amount to 5,000,000 or less
   - **Option B:** Request supervisor override

**If Override:**
- Enter justification (20+ characters)
- Get supervisor approval
- Submit with override logged

---

### Scenario 3: Violation - 1/3 Salary Rule

**Situation:** Customer has 10,000 ETB income, requests 500,000 ETB loan over 12 months

**Calculation:**
- Monthly payment: 500,000 / 12 = 41,667 ETB
- 1/3 of income: 10,000 / 3 = 3,333 ETB
- **Violation:** 41,667 > 3,333

**Steps:**
1. Enter parameters
2. **Warning appears:**
   ```
   1/3 salary rule: Proposed monthly payment (41,667 ETB) 
   exceeds 1/3 of monthly income (3,333 ETB)
   ```
3. **System suggests:**
   - Maximum affordable loan: ~40,000 ETB (3,333 × 12)
   - Or extend term to reduce monthly payment

**Solutions:**
- Reduce loan amount
- Extend loan term
- Request override (if justified)

---

### Scenario 4: Low Confidence Score

**Situation:** Credit score calculated with 72% confidence

**What You See:**
- Yellow warning in Explanation tab
- Highlighted confidence card
- Warning message about low certainty

**Actions:**
1. Review SHAP explanations
2. Check which features are uncertain
3. Verify customer data accuracy
4. Consider additional documentation
5. Review with supervisor if needed
6. Make informed decision

**Documentation:**
- Note low confidence in decision notes
- Reference additional verification performed
- Explain why decision was made despite low confidence

---

### Scenario 5: Multiple Violations

**Situation:** Loan has multiple NBE violations

**Example:**
- Loan amount: 6,000,000 ETB (exceeds max)
- Loan term: 72 months (exceeds max)
- Monthly payment exceeds 1/3 salary

**What You See:**
- All violations listed in warning banner
- Each violation explained with NBE rule reference
- Submit button disabled until all resolved or overridden

**Override Process:**
- Justification must address ALL violations
- Example: "Customer provides 10M ETB collateral. Extended term approved by Head Office for strategic account. All documentation verified."

---

## Troubleshooting

### Issue: Submit Button Always Disabled

**Possible Causes:**
1. NBE violations exist
2. Required fields missing
3. Form validation errors

**Solutions:**
1. Check for red warning banner
2. Review violation list
3. Fix violations or request override
4. Check form for validation errors (red text)

---

### Issue: Override Dialog Doesn't Appear

**Possible Causes:**
1. User doesn't have supervisor role
2. JavaScript error in browser
3. Form validation preventing submission attempt

**Solutions:**
1. Check user role/permissions
2. Open browser console (F12) and check for errors
3. Ensure all required fields are filled
4. Contact IT support if persists

---

### Issue: SHAP Visualization Not Showing

**Possible Causes:**
1. Explanation data not in response
2. Model version doesn't support explainability
3. Data still processing

**Solutions:**
1. Check if explanation data exists in response
2. Verify model version supports SHAP
3. Wait a few seconds and refresh
4. Check browser console for errors

**Note:** SHAP visualization will show "No explanation data available" message if data is missing.

---

### Issue: Audit Trail Empty

**Possible Causes:**
1. No events logged yet
2. Filter too restrictive
3. Date range too narrow
4. API connection issue

**Solutions:**
1. Check date range filter (try "All Time")
2. Clear event type filter
3. Clear search query
4. Click "Refresh" button
5. Check browser console for API errors

---

### Issue: Confidence Warning Not Appearing

**Possible Causes:**
1. Confidence is >= 80% (no warning needed)
2. Confidence data missing from response
3. Component not rendering

**Solutions:**
1. Check confidence value in results
2. Verify confidence is in response data
3. Check browser console for errors

**Note:** Warning only appears when confidence < 80%.

---

## Best Practices

### For Credit Analysts

1. ✅ **Always review compliance status** before submitting
2. ✅ **Check SHAP explanations** to understand model decisions
3. ✅ **Pay attention to confidence warnings** - review carefully
4. ✅ **Document overrides thoroughly** - future you will thank you
5. ✅ **Use correlation IDs** when reporting issues
6. ✅ **Export reports** for important decisions

### For Supervisors

1. ✅ **Review override justifications** carefully
2. ✅ **Ensure business rationale** is sound
3. ✅ **Verify documentation** before approving
4. ✅ **Monitor override frequency** - high frequency may indicate issues
5. ✅ **Review audit trail regularly** for compliance

### Compliance Tips

1. ✅ **Never bypass compliance** without override
2. ✅ **Always provide detailed justification** for overrides
3. ✅ **Keep exports** of important decisions
4. ✅ **Reference correlation IDs** in documentation
5. ✅ **Report suspicious patterns** to compliance team

---

## Quick Reference

### Compliance Limits
- **Max Loan:** 5,000,000 ETB
- **Min Loan:** 1,000 ETB
- **Max Term:** 60 months
- **1/3 Rule:** Payment ≤ Income/3
- **Interest:** 12% - 25%

### Confidence Thresholds
- **High:** ≥ 80% (No warning)
- **Low:** < 80% (Warning appears)

### Override Requirements
- **Minimum justification:** 20 characters
- **Must address:** All violations
- **Must include:** Business rationale and approval authority

### Audit Retention
- **Period:** 7 years (NBE requirement)
- **Access:** Admin/Auditor roles
- **Export:** PDF, Excel, CSV available

---

## Support

**For Technical Issues:**
- Check browser console (F12) for errors
- Review correlation ID for tracking
- Contact IT support with details

**For Compliance Questions:**
- Consult NBE regulations
- Contact compliance officer
- Review audit trail for similar cases

**For Training:**
- Review this guide
- Attend training sessions
- Contact training department

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Next Review:** Quarterly

---

## Appendix: Glossary

- **NBE:** National Bank of Ethiopia
- **SHAP:** SHapley Additive exPlanations (model explainability)
- **Correlation ID:** Unique identifier linking related events
- **Audit Trail:** Complete record of all operations
- **1/3 Salary Rule:** Monthly payment cannot exceed 1/3 of monthly income
- **Override:** Supervisor-approved exception to compliance rules
- **Confidence:** Model's certainty in its prediction (0-100%)
