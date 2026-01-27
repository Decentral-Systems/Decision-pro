// Complete Puppeteer automation script to fill all 168+ customer registration fields
const puppeteer = require('puppeteer');

// Helper function to find element by text content
async function findElementByText(page, tagName, text) {
  const elements = await page.$$(tagName);
  for (const el of elements) {
    const textContent = await page.evaluate(el => el.textContent?.trim(), el);
    if (textContent === text || textContent?.includes(text)) {
      return el;
    }
  }
  return null;
}

// Helper function to wait and click by text
async function clickByText(page, tagName, text, timeout = 5000) {
  const element = await page.evaluateHandle(async (tagName, text) => {
    const elements = Array.from(document.querySelectorAll(tagName));
    for (const el of elements) {
      if (el.textContent?.trim() === text || el.textContent?.trim().includes(text)) {
        return el;
      }
    }
    return null;
  }, tagName, text);
  
  const elementValue = await element.jsonValue();
  if (elementValue) {
    await elementValue.click();
    return true;
  }
  return false;
}

const FIELD_VALUES = {
  // Step 3 Main Fields
  monthly_expenses: '20000',
  debt_to_income_ratio: '0.3',
  scheduled_monthly_debt_service: '5000',
  total_outstanding_balance_etb: '100000',
  total_credit_limit_etb: '200000',
  existing_loan_count_open: '1',
  cash_buffer_days: '30',
  savings_balance: '50000',
  income_stability_cv_6m: '0.15',
  health_insurance_coverage: 'Private Insurance',
  
  // Detailed Bank Data
  bank_avg_balance_1m: '15000',
  bank_avg_balance_3m: '18000',
  average_daily_balance_90d: '16000',
  min_balance_90d: '5000',
  max_balance_90d: '30000',
  salary_deposit_count_3m: '3',
  salary_deposit_count_6m: '6',
  salary_deposit_count_12m: '12',
  salary_regular_day_match_rate: '0.85',
  salary_amount_avg: '35000',
  salary_amount_std: '2000',
  salary_inflow_consistency_score: '85',
  net_inflow_volatility_90d: '0.2',
  net_inflow_volatility_6m: '0.15',
  monthly_inflow_avg: '35000',
  monthly_outflow_avg: '28000',
  monthly_net_flow_avg: '7000',
  number_of_negative_balance_days_90d: '2',
  number_of_negative_balance_days_6m: '5',
  overdraft_usage_days_90d: '0',
  overdraft_usage_days_6m: '1',
  utility_bill_payment_count_6m: '6',
  utility_bill_payment_count_12m: '12',
  utility_bill_on_time_rate: '0.95',
  utility_on_time_rate_12m: '0.90',
  telecom_payment_count_12m: '12',
  telecom_on_time_rate_12m: '0.98',
  merchant_spend_ratio: '0.6',
  cash_deposit_count_6m: '5',
  cash_deposit_amount_avg: '1000',
  nsf_count_6m: '0',
  nsf_count_12m: '1',
  nsf_frequency_6m: '0.0',
  returned_payment_count_6m: '0',
  returned_payment_count_12m: '0',
  recurring_payment_count: '8',
  recurring_payment_amount_avg: '2500',
  subscription_payment_count: '3',
  
  // Mobile Money
  mobile_money_provider: 'M-Pesa',
  mobile_money_account_number: '0912345678',
  mobile_money_transaction_count_90d: '50',
  mobile_money_txn_volume_90d: '15000',
  mobile_money_inflow_outflow_ratio: '1.2',
  mobile_money_avg_balance_90d: '2000',
  momo_cash_out_velocity_48hr: '0.5',
  momo_cash_out_count_90d: '10',
  momo_cash_in_count_90d: '15',
  momo_transfer_count_90d: '20',
  airtime_purchase_pattern_score: '75',
  airtime_purchase_count_90d: '30',
  airtime_purchase_amount_avg: '25',
  telecom_spend_ratio: '0.1',
  
  // Digital Behavioral - App Data
  app_count_total: '100',
  app_count_finance: '5',
  app_count_shopping: '10',
  app_count_social: '15',
  app_engagement_frequency_30d: '3.5',
  app_engagement_frequency_7d: '4.0',
  app_engagement_frequency_90d: '3.2',
  push_notification_interaction_rate: '0.2',
  push_notification_sent_count_30d: '20',
  push_notification_opened_count_30d: '4',
  last_app_open_date: '2024-12-15',
  app_install_date: '2024-01-01',
  
  // SMS Logs
  sms_active_lenders_count_90d: '2',
  sms_active_lenders_count_30d: '1',
  sms_loan_rejection_count_90d: '0',
  sms_loan_approval_count_90d: '1',
  sms_transaction_count_90d: '150',
  sms_financial_message_count_90d: '30',
  
  // Social Graph
  social_graph_connections: '50',
  phone_book_size: '300',
  call_log_io_ratio: '0.8',
  call_log_incoming_count_30d: '60',
  call_log_outgoing_count_30d: '75',
  peer_vouching_count: '3',
  
  // Behavioral Scores
  savings_behavior_score: '70',
  spending_habit_consistency_score: '65',
  discretionary_spend_ratio_90d: '0.3',
  discretionary_spend_ratio_30d: '0.35',
  essential_spend_ratio_90d: '0.7',
  income_source_count_180d: '2',
  income_source_count_90d: '1',
  monthly_spending_avg: '25000',
  monthly_spending_std: '3000',
  post_payday_spending_spike_ratio: '1.5',
  weekend_social_spending_volatility: '0.8',
  weekend_spending_avg: '5000',
  weekday_spending_avg: '20000',
  anonymized_peer_default_rate: '0.05',
  network_risk_score: '40',
  social_network_centrality_score: '60',
  
  // KYC & Verification
  address_verification_status: 'Verified',
  document_expiry_days: '365',
  id_expiry_date: '2029-12-31',
  device_compromise_status: 'None',
  session_behavior_anomaly_score: '10',
  device_id_consistency_score: '90',
  phone_tenure_months: '24',
  application_velocity_user_30d: '1',
  biometric_liveness_check_status: 'Passed',
  
  // Credit History
  prior_loans_count: '2',
  prior_rollover_count: '0',
  credit_history_length_months: '36',
  delinquency_30d_count_12m: '0',
  delinquency_60d_count_12m: '0',
  delinquency_90d_count_12m: '0',
  
  // Additional Features
  age: '30',
  location_stability_score: '80',
  community_involvement_score: '70',
  digital_adoption_index: '75',
  agricultural_dependency_score: '20',
  remittance_dependency_score: '10',
  informal_credit_usage_score: '5',
  local_economic_resilience_score: '60',
  regional_unemployment_rate: '0.08',
  inflation_rate_recent: '0.12',
  sector_cyclicality_index: '0.7',
  exchange_rate_12m_change: '0.05',
  conflict_risk_index: '0.1',
  drought_flood_index: '0.02',
  energy_blackout_days_90d: '3',
  financial_literacy_score: '70',
  risk_tolerance_score: '50',
  cognitive_proficiency_score: '80',
  behavioral_consistency_score: '75',
  online_reputation_score: '60',
  microfinance_engagement_score: '40',
  conscientiousness_score: '85',
  subscription_lapse_count_12m: '0',
};

const SWITCH_FIELDS = {
  'end_of_month_cash_crunch_indicator': true,
  'utility_recent_missed_bills_3m_flag': false,
  'cash_deposit_anomaly_flag': false,
  'sms_financial_logs_available': true,
  'shared_household_expense_flag': true,
  'source_of_income_verified_flag': true,
  'pep_or_sanctions_hit_flag': false,
  'is_device_emulator': false,
  'shared_device_fraud_link': false,
  'sim_swap_recent_flag': false,
  'shared_contact_link_flag': false,
  'gambling_registration_flag': false,
  'recent_delinquency_flag': false,
  'prior_default_flag': false,
  'continuous_learning_engagement': true,
  'cooperative_membership_score': true,
};

(async () => {
  console.log('🚀 Starting complete form automation...');
  
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    defaultViewport: { width: 1920, height: 1080 }
  });
  
  const page = await browser.newPage();
  
  // Set a longer timeout for page operations
  page.setDefaultTimeout(30000);
  
  // ============================================
  // NETWORK MONITORING AND ERROR CAPTURE
  // ============================================
  const networkLogs = [];
  const consoleLogs = [];
  const pageErrors = [];
  const testReport = {
    timestamp: new Date().toISOString(),
    networkLogs: [],
    consoleLogs: [],
    pageErrors: [],
    formData: {},
    apiResponse: null,
    submissionStatus: null,
    databaseVerification: null
  };
  
  // Network request monitoring - capture ALL requests for debugging
  page.on('request', request => {
    const url = request.url();
    const method = request.method();
    
    // Log all POST requests and API-related requests
    if (method === 'POST' || url.includes('/api/') || url.includes('/customers') || url.includes('/auth/')) {
      const logEntry = {
        type: 'request',
        timestamp: new Date().toISOString(),
        url: url,
        method: method,
        headers: request.headers(),
        postData: request.postData() || null
      };
      networkLogs.push(logEntry);
      testReport.networkLogs.push(logEntry);
      
      // Special handling for customer creation
      if ((url.includes('/customers') || url.includes('/register')) && method === 'POST') {
        console.log(`🌐 API Request: ${method} ${url}`);
        if (request.postData()) {
          try {
            const payload = JSON.parse(request.postData());
            console.log(`   Payload keys: ${Object.keys(payload).length} fields`);
            console.log(`   Customer ID: ${payload.customer_id || 'not provided'}`);
            testReport.formData = payload;
          } catch (e) {
            console.log(`   Payload: ${request.postData().substring(0, 200)}...`);
          }
        } else {
          console.log(`   ⚠️ No POST data in request`);
        }
      }
      
      // Log all POST requests for debugging
      if (method === 'POST') {
        console.log(`📤 POST Request: ${url}`);
      }
    }
  });
  
  // Network response monitoring
  page.on('response', async response => {
    const url = response.url();
    const requestMethod = response.request().method();
    
    // Capture all API-related responses and POST responses
    if (url.includes('/api/') || url.includes('/customers') || url.includes('/auth/') || requestMethod === 'POST') {
      let body = '';
      try {
        body = await response.text();
      } catch (e) {
        // Response body might not be available (e.g., already consumed or connection closed)
        body = `[Could not read response body: ${e.message}]`;
      }
      
      const logEntry = {
        type: 'response',
        timestamp: new Date().toISOString(),
        url: url,
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        body: body,
        method: requestMethod
      };
      networkLogs.push(logEntry);
      testReport.networkLogs.push(logEntry);
      
      // Check for customer creation response
      if ((url.includes('/customers') || url.includes('/register')) && requestMethod === 'POST') {
        console.log(`📡 API Response: ${response.status()} ${response.statusText()} - ${url}`);
        if (response.status() === 201 || response.status() === 200) {
          try {
            if (body && !body.includes('Could not read')) {
              const responseData = JSON.parse(body);
              testReport.apiResponse = responseData;
              console.log(`   Response data keys: ${Object.keys(responseData).join(', ')}`);
              
              // Try multiple ways to extract customer_id
              const customerId = responseData.customer_id || 
                               responseData.customer?.customer_id ||
                               responseData.data?.customer_id ||
                               responseData.result?.customer_id;
              
              if (customerId) {
                console.log(`   ✅ Customer created: ${customerId}`);
                testReport.submissionStatus = 'success';
                testReport.customerId = customerId;
              } else {
                console.log(`   ⚠️ Customer ID not found in response`);
                console.log(`   Response structure: ${JSON.stringify(responseData, null, 2).substring(0, 500)}`);
              }
            }
          } catch (e) {
            console.log(`   Response body (not JSON): ${body.substring(0, 500)}...`);
          }
        } else {
          console.log(`   ❌ Error response: ${response.status()} ${response.statusText()}`);
          if (body && !body.includes('Could not read')) {
            console.log(`   Error body: ${body.substring(0, 500)}`);
            testReport.submissionStatus = 'error';
            testReport.apiError = {
              status: response.status(),
              statusText: response.statusText(),
              body: body
            };
          }
        }
      }
      
      // Log all POST responses for debugging
      if (requestMethod === 'POST') {
        console.log(`📥 POST Response: ${response.status()} - ${url}`);
      }
    }
  });
  
  // Console log capture
  page.on('console', msg => {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    };
    consoleLogs.push(logEntry);
    testReport.consoleLogs.push(logEntry);
    
    if (msg.type() === 'error') {
      console.log(`❌ Console Error: ${msg.text()}`);
    } else if (msg.type() === 'warning') {
      console.log(`⚠️ Console Warning: ${msg.text()}`);
    }
  });
  
  // Page error capture
  page.on('pageerror', error => {
    const errorEntry = {
      timestamp: new Date().toISOString(),
      message: error.message,
      stack: error.stack
    };
    pageErrors.push(errorEntry);
    testReport.pageErrors.push(errorEntry);
    console.log(`💥 Page Error: ${error.message}`);
  });
  
  // Start at login page or customers page
  await page.goto('http://localhost:4009/login', { waitUntil: 'networkidle2' });
  
  console.log('📄 Page loaded');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check if we need to login and handle authentication
  const needsLogin = await page.evaluate(() => {
    const signInButton = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.trim() === 'Sign In'
    );
    const isLoginPage = window.location.pathname === '/login' || window.location.pathname.includes('login');
    return signInButton !== undefined || isLoginPage;
  });
  
  if (needsLogin) {
    console.log('🔐 Authentication required. Logging in...');
    
    // Default credentials from docs/guides/ADMIN_CREDENTIALS.md
    const username = 'admin';
    const password = 'admin123';
    
    try {
      // Wait for login form to be ready
      await page.waitForSelector('form', { timeout: 10000 });
      await page.waitForSelector('#username, input[id="username"]', { timeout: 5000 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Fill username field by ID
      const usernameField = await page.$('#username');
      if (usernameField) {
        await usernameField.click({ clickCount: 3 });
        await usernameField.type(username, { delay: 50 });
        console.log('  ✓ Entered username');
      } else {
        console.log('  ⚠ Username field not found');
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Fill password field by ID
      const passwordField = await page.$('#password');
      if (passwordField) {
        await passwordField.click({ clickCount: 3 });
        await passwordField.type(password, { delay: 50 });
        console.log('  ✓ Entered password');
      } else {
        console.log('  ⚠ Password field not found');
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Submit the form instead of just clicking button
      const formSubmitted = await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          // Trigger form submit
          form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          // Also try clicking submit button
          const submitBtn = form.querySelector('button[type="submit"]');
          if (submitBtn && !submitBtn.disabled) {
            submitBtn.click();
            return true;
          }
          return true; // Form event dispatched
        }
        return false;
      });
      
      if (formSubmitted) {
        console.log('  ✓ Submitted login form');
      } else {
        // Fallback: click button
        const clicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const btn = buttons.find(b => {
            const text = b.textContent?.trim() || '';
            return (text === 'Sign In' || text.includes('Sign In')) && !b.disabled;
          });
          if (btn) {
            btn.click();
            return true;
          }
          return false;
        });
        if (clicked) {
          console.log('  ✓ Clicked Sign In button (fallback)');
        }
      }
      
      if (clicked) {
        console.log('  ✓ Clicked Sign In button');
        
        // Wait for navigation/redirect after login - wait longer
        await Promise.race([
          page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
          page.waitForFunction(() => {
            return !document.querySelector('button:has-text("Sign In")') && 
                   (window.location.pathname !== '/login' || document.querySelector('[role="dialog"]'));
          }, { timeout: 15000 }),
          new Promise(resolve => setTimeout(resolve, 8000))
        ]).catch(() => {
          console.log('  ⚠ Navigation timeout, checking status...');
        });
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Verify login was successful by checking URL and page content
        const loginStatus = await page.evaluate(() => {
          const signInButton = Array.from(document.querySelectorAll('button')).find(
            btn => btn.textContent?.trim() === 'Sign In'
          );
          const isLoginPage = window.location.pathname === '/login';
          return {
            hasSignInButton: signInButton !== undefined,
            isLoginPage: isLoginPage,
            currentPath: window.location.pathname
          };
        });
        
        if (!loginStatus.hasSignInButton && !loginStatus.isLoginPage) {
          console.log('✅ Login successful');
        } else {
          console.log(`⚠️ Login verification: hasSignIn=${loginStatus.hasSignInButton}, isLoginPage=${loginStatus.isLoginPage}, path=${loginStatus.currentPath}`);
          console.log('   Attempting to continue...');
        }
      } else {
        console.log('  ⚠ Sign In button not found or disabled');
      }
    } catch (e) {
      console.log('⚠️ Login error:', e.message);
      console.log('   Attempting to continue anyway...');
    }
  } else {
    console.log('✓ Already authenticated');
  }
  
  // Wait a bit more after login to ensure page is fully loaded
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Navigate to customers page if not already there
  const currentUrl = page.url();
  console.log(`📍 Current URL: ${currentUrl}`);
  
  if (!currentUrl.includes('/customers')) {
    console.log('📂 Navigating to customers page...');
    await page.goto('http://localhost:4009/customers', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  // Debug: Check what buttons are on the page
  const allButtons = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    return buttons.map(btn => ({
      text: btn.textContent?.trim() || '',
      disabled: btn.disabled,
      visible: btn.offsetParent !== null,
      id: btn.id || '',
      className: btn.className || ''
    })).filter(btn => btn.visible && btn.text.length > 0).slice(0, 15);
  });
  console.log('🔍 Found buttons on page:', JSON.stringify(allButtons, null, 2));
  
  // Check if form is already open, if not, open it
  try {
    // Wait for page to be fully loaded
    await page.waitForSelector('body', { timeout: 5000 });
    
    // Use page.evaluate to find and click the button in one go
    const clicked = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => {
        const text = b.textContent?.trim() || '';
        const isVisible = b.offsetParent !== null;
        return isVisible && !b.disabled && (
          text === 'Add Customer' ||
          text.includes('Add Customer') ||
          text.includes('Create New Customer') || 
          text.includes('New Customer')
        );
      });
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (clicked) {
      console.log('✓ Opened customer creation form');
      await new Promise(resolve => setTimeout(resolve, 3000));
    } else {
      console.log('⚠ Create button not found, checking if dialog already exists...');
      // Check if dialog is already open
      const dialogExists = await page.$('[role="dialog"]');
      if (dialogExists) {
        console.log('✓ Dialog is already open');
      } else {
        console.log('⚠ No dialog found. Page might still be loading...');
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  } catch (e) {
    console.log('⚠ Error opening form:', e.message);
  }
  
  // Wait for dialog to be visible - with longer timeout
  console.log('⏳ Waiting for dialog to appear...');
  let dialogVisible = false;
  for (let i = 0; i < 10; i++) {
    dialogVisible = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      if (dialog) {
        // Check if dialog is actually visible (not hidden)
        const style = window.getComputedStyle(dialog);
        return style.display !== 'none' && style.visibility !== 'hidden' && dialog.offsetParent !== null;
      }
      return false;
    });
    if (dialogVisible) {
      console.log('✓ Dialog is visible');
      await new Promise(resolve => setTimeout(resolve, 2000));
      break;
    }
    if (i === 0) {
      console.log('   Waiting for dialog...');
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!dialogVisible) {
    console.log('⚠ Dialog not found after waiting');
    // Try to open it again
    const clickedAgain = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const btn = buttons.find(b => {
        const text = b.textContent?.trim() || '';
        return text === 'Add Customer' || text.includes('Add Customer');
      });
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    if (clickedAgain) {
      console.log('   ✓ Clicked Add Customer button again');
      await new Promise(resolve => setTimeout(resolve, 3000));
      dialogVisible = await page.evaluate(() => {
        return document.querySelector('[role="dialog"]') !== null;
      });
      if (dialogVisible) {
        console.log('✓ Dialog is now visible');
      }
    }
  }
  
  // Fill Step 1 fields first
  console.log('📝 Filling Step 1 (Basic Information)...');
  const timestamp = Date.now();
  const step1Fields = {
    customer_id: 'AUTO_TEST_' + timestamp,
    full_name: 'Test Customer Automation',
    phone_number: '+251911234567',
    email: 'test@automation.com',
    id_number: '1234567890123456',
    date_of_birth: '1990-01-15',
    number_of_dependents: '2',
    region: 'Addis Ababa',
    city: 'Addis Ababa',
    sub_city: 'Bole',
    postal_code: '1000',
    address: 'Test Street 123'
  };
  
  for (const [fieldId, value] of Object.entries(step1Fields)) {
    try {
      // Try multiple methods to find the field
      let field = await page.$(`[role="dialog"] #${fieldId}`);
      if (!field) {
        field = await page.$(`#${fieldId}`);
      }
      if (!field) {
        // Try by name attribute
        field = await page.$(`input[name="${fieldId}"], textarea[name="${fieldId}"]`);
      }
      
      if (field) {
        await field.evaluate(el => el.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        await new Promise(resolve => setTimeout(resolve, 100));
        await field.click({ clickCount: 3 });
        await field.type(String(value), { delay: 30 });
        console.log(`  ✓ Filled ${fieldId}`);
      } else {
        console.log(`  ⚠ Field not found: ${fieldId}`);
      }
    } catch (e) {
      console.log(`  ⚠ Error filling ${fieldId}: ${e.message}`);
    }
  }
  
  // Select gender and marital status
  await page.evaluate(() => {
    const selects = Array.from(document.querySelectorAll('[role="combobox"]'));
    selects.forEach(select => {
      const label = select.closest('div')?.querySelector('label')?.textContent || '';
      if (label.includes('Gender')) {
        select.click();
        setTimeout(() => {
          const options = Array.from(document.querySelectorAll('[role="option"]'));
          const maleOption = options.find(opt => opt.textContent?.trim() === 'Male');
          if (maleOption) maleOption.click();
        }, 500);
      }
    });
  });
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Navigate to Step 2
  console.log('➡️ Navigating to Step 2...');
  const next1 = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const buttons = Array.from((dialog || document).querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.trim() === 'Next' && !b.disabled);
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (next1) {
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('  ✓ Moved to Step 2');
  }
  
  // Fill Step 2 fields (Employment & Income)
  console.log('📝 Filling Step 2 (Employment & Income)...');
  const step2Fields = {
    'cards.0.employer.employer_name': 'Test Company Ltd',
    'cards.0.employer.employment_sector': 'Technology',
    'cards.0.employer.job_title': 'Software Engineer',
    'cards.0.employer.employment_years': '5',
    'cards.0.employer.current_job_months': '24',
    'cards.0.employer.monthly_income': '35000',
    'cards.0.bank.bank_name': 'Commercial Bank of Ethiopia',
    'cards.0.bank.bank_account_number': '1234567890',
    'cards.0.bank.bank_account_age_months': '36',
    'cards.0.bank.bank_avg_balance_6m': '50000'
  };
  
  // Try to fill Step 2 fields by name or by finding inputs near labels
  for (const [fieldPath, value] of Object.entries(step2Fields)) {
    try {
      // Try by name attribute
      const field = await page.$(`input[name="${fieldPath}"], input[name*="${fieldPath.split('.').pop()}"]`);
      if (field) {
        await field.click({ clickCount: 3 });
        await field.type(String(value), { delay: 30 });
        console.log(`  ✓ Filled ${fieldPath}`);
      }
    } catch (e) {
      // Continue
    }
  }
  
  // Navigate to Step 3
  console.log('➡️ Navigating to Step 3...');
  const next2 = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const buttons = Array.from((dialog || document).querySelectorAll('button'));
    const btn = buttons.find(b => b.textContent?.trim() === 'Next' && !b.disabled);
    if (btn) { btn.click(); return true; }
    return false;
  });
  if (next2) {
    await new Promise(resolve => setTimeout(resolve, 2500));
    console.log('  ✓ Moved to Step 3');
  }
  
  // Expand all collapsible sections
  console.log('📂 Expanding all collapsible sections...');
  const sectionNames = [
    'Detailed Bank Data',
    'Mobile Money',
    'KYC & Verification',
    'Digital Behavioral Intelligence',
    'Credit History',
    'Additional Features'
  ];
  
  for (const sectionName of sectionNames) {
    try {
      const expanded = await page.evaluate((name) => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const btn = buttons.find(b => {
          const text = b.textContent?.trim() || '';
          return text.includes(name) || text === name;
        });
        if (btn) {
          const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        if (!isExpanded) {
            btn.click();
            return true;
          }
          return false; // Already expanded
        }
        return false; // Button not found
      }, sectionName);
      
      if (expanded) {
        await new Promise(resolve => setTimeout(resolve, 500));
          console.log(`  ✓ Expanded: ${sectionName}`);
      } else {
        // Check if it was already expanded or try to find it differently
        const exists = await page.evaluate((name) => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.some(b => {
            const text = b.textContent?.trim() || '';
            return text.includes(name);
          });
        }, sectionName);
        if (exists) {
          console.log(`  ✓ Already expanded or found: ${sectionName}`);
        }
      }
    } catch (e) {
      console.log(`  ⚠ Could not expand: ${sectionName} - ${e.message}`);
    }
  }
  
  // Fill all input fields by ID (within dialog)
  console.log('✍️ Filling all input fields...');
  let filledCount = 0;
  
  for (const [fieldId, value] of Object.entries(FIELD_VALUES)) {
    try {
      // Try multiple methods to find the field
      let field = null;
      
      // Method 1: By ID
      field = await page.$(`[role="dialog"] #${fieldId}, #${fieldId}`);
      
      // Method 2: By name attribute
      if (!field) {
        field = await page.$(`[role="dialog"] input[name="${fieldId}"], [role="dialog"] textarea[name="${fieldId}"], input[name="${fieldId}"], textarea[name="${fieldId}"]`);
      }
      
      // Method 3: Find by label text and get associated input
      if (!field) {
        field = await page.evaluateHandle((id) => {
          const labels = Array.from(document.querySelectorAll('label'));
          const label = labels.find(l => {
            const text = l.textContent?.trim() || '';
            const forAttr = l.getAttribute('for') || '';
            return forAttr === id || text.toLowerCase().includes(id.toLowerCase().replace(/_/g, ' '));
          });
          if (label) {
            const inputId = label.getAttribute('for');
            if (inputId) {
              return document.getElementById(inputId);
            }
            // Try to find input near the label
            const input = label.parentElement?.querySelector('input, textarea');
            return input;
          }
          return null;
        }, fieldId);
        const fieldValue = await field.jsonValue();
        if (fieldValue) {
          field = await page.evaluateHandle(() => {
            const labels = Array.from(document.querySelectorAll('label'));
            const label = labels.find(l => {
              const text = l.textContent?.trim() || '';
              return text.toLowerCase().includes(fieldId.toLowerCase().replace(/_/g, ' '));
            });
            if (label) {
              const inputId = label.getAttribute('for');
              if (inputId) return document.getElementById(inputId);
              return label.parentElement?.querySelector('input, textarea');
            }
            return null;
          });
        } else {
          field = null;
        }
      }
      
      if (field) {
        // Scroll into view
        await field.evaluate(el => el?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
        await new Promise(resolve => setTimeout(resolve, 50));
        
        // Clear and fill the field
        await field.click({ clickCount: 3 });
        await field.type(String(value), { delay: 10 });
        filledCount++;
        if (filledCount % 20 === 0) {
          console.log(`  ✓ Filled ${filledCount} fields...`);
        }
      }
    } catch (e) {
      // Field might not exist or be visible - continue
    }
  }
  
  console.log(`✅ Filled ${filledCount} input fields`);
  
  // Toggle switches
  console.log('🔄 Toggling switches...');
  let switchCount = 0;
  for (const [fieldId, value] of Object.entries(SWITCH_FIELDS)) {
    try {
      // Find the label associated with this field
      const switchElement = await page.evaluateHandle((id) => {
        // Try to find by ID first
        const label = document.querySelector(`label[for="${id}"]`);
        if (label) {
          // Find the switch near the label
          const switchEl = label.parentElement?.querySelector('[role="switch"]') ||
                          label.closest('div')?.querySelector('[role="switch"]');
          return switchEl;
        }
        return null;
      }, fieldId);
      
      const switchValue = await switchElement.jsonValue();
      if (switchValue) {
        const isChecked = await page.evaluate(el => {
          return el.getAttribute('aria-checked') === 'true' || el.getAttribute('data-state') === 'checked';
        }, switchValue);
        
        if ((isChecked && !value) || (!isChecked && value)) {
          await switchValue.click();
          await new Promise(resolve => setTimeout(resolve, 100));
          switchCount++;
        }
      }
    } catch (e) {
      // Switch might not exist
    }
  }
  
  console.log(`✅ Toggled ${switchCount} switches`);
  console.log('✅ All fields filled!');
  
  // Navigate to Review step and submit
  console.log('📤 Navigating to Review step...');
  const nextClicked = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const searchArea = dialog || document;
    const buttons = Array.from(searchArea.querySelectorAll('button'));
    const btn = buttons.find(b => {
      const text = b.textContent?.trim() || '';
      return text === 'Next' && !b.disabled && b.offsetParent !== null;
    });
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });
  
  if (nextClicked) {
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('  ✓ Navigated to Review step');
    
    // Wait for Review step to fully render
    await page.waitForFunction(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      return buttons.some(b => {
        const text = b.textContent?.trim() || '';
        return text === 'Submit' || text.includes('Submit');
      });
    }, { timeout: 5000 }).catch(() => {
      console.log('  ⚠ Submit button not found after navigation');
    });
  } else {
    console.log('  ⚠ Next button not found, might already be on Review step');
  }
  
  // Click Submit
  console.log('📤 Submitting form...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check form state before submission
  const preSubmitState = await page.evaluate(() => {
    const form = document.querySelector('form');
    const submitButton = Array.from(document.querySelectorAll('button')).find(b => 
      b.textContent?.trim().includes('Submit')
    );
    
    return {
      hasForm: form !== null,
      formAction: form?.action || 'none',
      formMethod: form?.method || 'none',
      submitButtonDisabled: submitButton?.disabled || false,
      submitButtonType: submitButton?.type || 'none',
      validationErrors: form ? Array.from(form.querySelectorAll(':invalid')).length : 0
    };
  });
  
  console.log(`   Form state: hasForm=${preSubmitState.hasForm}, validationErrors=${preSubmitState.validationErrors}, submitDisabled=${preSubmitState.submitButtonDisabled}`);
  
  const submitClicked = await page.evaluate(() => {
    const dialog = document.querySelector('[role="dialog"]');
    const searchArea = dialog || document;
    
    // Try to find and submit the form directly
    const form = searchArea.querySelector('form');
    if (form) {
      // Check if form is valid
      if (form.checkValidity()) {
        // Try form submission
        try {
          form.requestSubmit();
          return { method: 'form_submit', success: true };
        } catch (e) {
          console.log('Form submit failed:', e);
        }
      } else {
        return { method: 'form_invalid', success: false, errors: form.querySelectorAll(':invalid').length };
      }
    }
    
    // Fallback: click submit button - try multiple methods and selectors
    let btn = null;
    
    // Try multiple ways to find the submit button
    const allButtons = Array.from(searchArea.querySelectorAll('button'));
    
    // Method 1: Exact text match
    btn = allButtons.find(b => {
      const text = b.textContent?.trim() || '';
      return text === 'Submit' && !b.disabled && b.offsetParent !== null;
    });
    
    // Method 2: Contains "Submit"
    if (!btn) {
      btn = allButtons.find(b => {
        const text = b.textContent?.trim() || '';
        return text.includes('Submit') && !b.disabled && b.offsetParent !== null;
      });
    }
    
    // Method 3: Button with type="button" that's not disabled
    if (!btn) {
      btn = allButtons.find(b => {
        return b.type === 'button' && !b.disabled && b.offsetParent !== null && 
               (b.textContent?.trim().includes('Submit') || b.getAttribute('aria-label')?.includes('Submit'));
      });
    }
    
    // Method 4: Last button in dialog (often the submit button)
    if (!btn && searchArea === dialog) {
      const visibleButtons = allButtons.filter(b => b.offsetParent !== null && !b.disabled);
      if (visibleButtons.length > 0) {
        btn = visibleButtons[visibleButtons.length - 1]; // Last visible button
      }
    }
    
    if (btn) {
      // Try multiple click methods
      try {
        // Scroll into view
        btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // Method 1: Direct click
        btn.click();
        
        // Method 2: Mouse events
        const mouseDown = new MouseEvent('mousedown', { bubbles: true, cancelable: true, view: window });
        const mouseUp = new MouseEvent('mouseup', { bubbles: true, cancelable: true, view: window });
        const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true, view: window });
        btn.dispatchEvent(mouseDown);
        btn.dispatchEvent(mouseUp);
        btn.dispatchEvent(clickEvent);
        
        // Method 3: Focus and Enter key
        btn.focus();
        const enterKey = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, view: window });
        btn.dispatchEvent(enterKey);
        
        return { method: 'button_click_multiple', success: true, buttonText: btn.textContent?.trim() };
      } catch (e) {
        return { method: 'button_click_error', success: false, error: e.message };
      }
    }
    return { method: 'none', success: false, availableButtons: allButtons.filter(b => b.offsetParent !== null).map(b => b.textContent?.trim()).slice(0, 5) };
  });
  
  if (submitClicked.success) {
    console.log(`  ✓ Submit triggered via ${submitClicked.method}`);
  } else {
    console.log(`  ⚠ Submit failed: ${submitClicked.method}`);
    if (submitClicked.errors) {
      console.log(`   Form has ${submitClicked.errors} validation errors`);
    }
  }
  
  if (submitClicked && submitClicked.success) {
    console.log(`  ✓ Submit triggered via ${submitClicked.method}`);
    
    // Wait a bit for React to process the click
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Wait for API response with timeout
    console.log('⏳ Waiting for API response...');
    const startTime = Date.now();
    const maxWaitTime = 20000; // 20 seconds - increased for React mutation
    
    // Wait for either success response or error
    // Also check for any POST response to customers endpoint
    while (Date.now() - startTime < maxWaitTime) {
      // Check for customer creation response (POST to /customers)
      const customerResponse = testReport.networkLogs.find(log => 
        log.type === 'response' && 
        (log.url.includes('/customers') || log.url.includes('/register')) &&
        log.method === 'POST' &&
        log.status >= 200 && 
        log.status < 300
      );
      
      if (customerResponse) {
        console.log(`✅ API Response received: ${customerResponse.status} ${customerResponse.statusText}`);
        console.log(`   URL: ${customerResponse.url}`);
        
        // Try to parse response
        if (customerResponse.body && !customerResponse.body.includes('Could not read')) {
          try {
            const responseData = JSON.parse(customerResponse.body);
            testReport.apiResponse = responseData;
            
            const customerId = responseData.customer_id || 
                             responseData.customer?.customer_id ||
                             responseData.data?.customer_id ||
                             responseData.result?.customer_id;
            
            if (customerId) {
              console.log(`   ✅ Customer created: ${customerId}`);
              testReport.submissionStatus = 'success';
              testReport.customerId = customerId;
            } else {
              console.log(`   ⚠️ Response received but customer_id not found`);
              console.log(`   Response keys: ${Object.keys(responseData).join(', ')}`);
            }
          } catch (e) {
            console.log(`   Response body: ${customerResponse.body.substring(0, 300)}`);
          }
        }
        break;
      }
      
      // Check for error response
      const errorResponse = testReport.networkLogs.find(log => 
        log.type === 'response' && 
        (log.url.includes('/customers') || log.url.includes('/register')) &&
        log.method === 'POST' &&
        log.status >= 400
      );
      
      if (errorResponse) {
        console.log(`❌ API Error Response: ${errorResponse.status} ${errorResponse.statusText}`);
        console.log(`   URL: ${errorResponse.url}`);
        if (errorResponse.body && !errorResponse.body.includes('Could not read')) {
          try {
            const errorBody = JSON.parse(errorResponse.body);
            console.log(`   Error details: ${JSON.stringify(errorBody, null, 2)}`);
            testReport.apiError = {
              status: errorResponse.status,
              body: errorBody
            };
          } catch (e) {
            console.log(`   Error body: ${errorResponse.body.substring(0, 500)}`);
            testReport.apiError = {
              status: errorResponse.status,
              body: errorResponse.body
            };
          }
        }
        testReport.submissionStatus = 'error';
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Final check - look for any POST request to customers that we might have missed
    const postRequests = testReport.networkLogs.filter(log => 
      log.type === 'request' && 
      log.method === 'POST' && 
      (log.url.includes('/customers') || log.url.includes('/register'))
    );
    
    if (postRequests.length > 0 && !testReport.apiResponse) {
      console.log(`⚠️ Found ${postRequests.length} POST request(s) to customers endpoint but no response captured yet`);
      postRequests.forEach(req => {
        console.log(`   POST Request: ${req.url}`);
        if (req.postData) {
          try {
            const payload = JSON.parse(req.postData);
            console.log(`   Payload customer_id: ${payload.customer_id || 'not provided'}`);
            testReport.formData = payload;
          } catch (e) {
            console.log(`   Payload: ${req.postData.substring(0, 200)}`);
          }
        }
      });
    }
    
    // Additional wait for any async operations
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for success/error messages on page and form validation errors
    const pageMessages = await page.evaluate(() => {
      const alerts = Array.from(document.querySelectorAll('[role="alert"], .alert, [class*="toast"], [class*="error"]'));
      const messages = alerts.map(alert => ({
        text: alert.textContent?.trim() || '',
        type: alert.className || ''
      })).filter(m => m.text.length > 0);
      
      // Check for form validation errors
      const errorFields = Array.from(document.querySelectorAll('input:invalid, textarea:invalid, select:invalid'));
      const validationErrors = errorFields.map(field => ({
        field: field.id || field.name || 'unknown',
        message: field.validationMessage || 'Invalid',
        value: field.value || ''
      }));
      
      // Check for error text in the form
      const errorTexts = Array.from(document.querySelectorAll('[class*="error"], [class*="destructive"], .text-destructive, p.text-destructive'));
      const errorMessages = errorTexts.map(el => el.textContent?.trim()).filter(t => t && t.length > 0);
      
      // Check if dialog is still open (might indicate error)
      const dialog = document.querySelector('[role="dialog"]');
      const isDialogOpen = dialog !== null && dialog.getAttribute('aria-hidden') !== 'true';
      
      // Check if submit button is disabled
      const submitButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent?.trim().includes('Submit')
      );
      const isSubmitDisabled = submitButton ? submitButton.disabled : false;
      
      return { 
        messages, 
        isDialogOpen, 
        validationErrors,
        errorMessages,
        isSubmitDisabled,
        submitButtonText: submitButton?.textContent?.trim() || 'not found'
      };
    });
    
    if (pageMessages.messages.length > 0) {
      console.log('📋 Page messages after submission:');
      pageMessages.messages.forEach(msg => {
        console.log(`   - ${msg.text}`);
      });
    }
    
    if (pageMessages.validationErrors.length > 0) {
      console.log(`⚠️ Form validation errors (${pageMessages.validationErrors.length}):`);
      pageMessages.validationErrors.forEach(err => {
        console.log(`   - ${err.field}: ${err.message}`);
      });
      testReport.validationErrors = pageMessages.validationErrors;
    }
    
    if (pageMessages.errorMessages.length > 0) {
      console.log(`⚠️ Error messages on page (${pageMessages.errorMessages.length}):`);
      pageMessages.errorMessages.forEach(msg => {
        console.log(`   - ${msg}`);
      });
    }
    
    if (pageMessages.isSubmitDisabled) {
      console.log('⚠️ Submit button is disabled - form may have validation errors');
    }
    
    console.log(`   Submit button text: ${pageMessages.submitButtonText}`);
    
    if (pageMessages.isDialogOpen) {
      console.log('⚠️ Dialog is still open - might indicate an error or validation issue');
      testReport.dialogStillOpen = true;
    } else {
      console.log('✅ Dialog closed - likely successful');
      testReport.dialogStillOpen = false;
    }
    
    // Store page state in test report
    testReport.pageState = pageMessages;
    
    // Take screenshot for debugging
    try {
      const screenshotPath = `/tmp/submission_screenshot_${Date.now()}.png`;
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved: ${screenshotPath}`);
      testReport.screenshotPath = screenshotPath;
    } catch (e) {
      console.log(`⚠️ Could not take screenshot: ${e.message}`);
    }
    
    // Final status check
    if (testReport.submissionStatus === 'success') {
  console.log('✅ Form submitted successfully!');
    } else if (testReport.submissionStatus === 'error') {
      console.log('❌ Form submission failed - check API error details above');
    } else {
      console.log('⚠️ Submission status unclear - no API response captured');
    }
  } else {
    console.log('  ⚠ Submit button not found');
    testReport.submissionStatus = 'submit_button_not_found';
  }
  
  console.log('⏳ Waiting 2 seconds before closing...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Generate and save test report
  const fs = require('fs');
  const pathModule = require('path');
  const reportPath = pathModule.join(__dirname, `test_results_${Date.now()}.json`);
  
  try {
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    console.log(`📊 Test report saved: ${reportPath}`);
  } catch (e) {
    console.log(`⚠️ Could not save test report: ${e.message}`);
  }
  
  await browser.close();
  console.log('🎉 Automation complete!');
  
  // Run database verification if customer was created
  console.log('');
  console.log('🔍 Running database verification...');
  const { execSync } = require('child_process');
  const scriptPath = pathModule.join(__dirname, 'verify_submission.py');
  
  try {
    let verifyOutput;
    if (testReport.customerId) {
      verifyOutput = execSync(
        `python3 "${scriptPath}" "${testReport.customerId}"`,
        { encoding: 'utf-8', timeout: 10000, cwd: __dirname }
      );
    } else {
      verifyOutput = execSync(
        `python3 "${scriptPath}"`,
        { encoding: 'utf-8', timeout: 10000, cwd: __dirname }
      );
    }
    console.log(verifyOutput);
    testReport.databaseVerification = 'completed';
  } catch (e) {
    const errorMsg = e.stderr?.toString() || e.message || 'Unknown error';
    console.log(`⚠️ Database verification failed: ${errorMsg}`);
    testReport.databaseVerification = 'failed';
    testReport.databaseVerificationError = errorMsg;
  }
  
  // Print summary
  console.log('');
  console.log('============================================================');
  console.log('📊 TEST SUMMARY');
  console.log('============================================================');
  console.log(`Network Requests: ${testReport.networkLogs.filter(l => l.type === 'request').length}`);
  console.log(`Network Responses: ${testReport.networkLogs.filter(l => l.type === 'response').length}`);
  console.log(`Console Logs: ${testReport.consoleLogs.length}`);
  console.log(`Page Errors: ${testReport.pageErrors.length}`);
  console.log(`Submission Status: ${testReport.submissionStatus || 'unknown'}`);
  if (testReport.customerId) {
    console.log(`Customer ID: ${testReport.customerId}`);
  }
  if (testReport.apiError) {
    console.log(`API Error: ${testReport.apiError.status} - ${testReport.apiError.body.substring(0, 100)}`);
  }
  console.log(`Database Verification: ${testReport.databaseVerification || 'not_run'}`);
  console.log('============================================================');
  console.log('');
  console.log(`📄 Full test report saved to: ${reportPath}`);
  console.log('   Review the report for detailed network logs, errors, and API responses.');
})().catch(error => {
  console.error('❌ Error during automation:', error);
  process.exit(1);
});
