/**
 * Enhancement Verification Script
 * Programmatically verifies all enhancements are present in the codebase
 */

const fs = require('fs');
const path = require('path');

const report = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { total: 0, passed: 0, failed: 0 }
};

function checkFile(filePath, patterns, testName) {
  const fullPath = path.join(__dirname, '..', filePath);
  
  if (!fs.existsSync(fullPath)) {
    report.tests.push({
      name: testName,
      status: 'failed',
      message: `File not found: ${filePath}`
    });
    report.summary.failed++;
    return false;
  }

  const content = fs.readFileSync(fullPath, 'utf8');
  const missing = patterns.filter(pattern => !content.includes(pattern));

  if (missing.length === 0) {
    report.tests.push({
      name: testName,
      status: 'passed',
      message: `All patterns found in ${filePath}`
    });
    report.summary.passed++;
    return true;
  } else {
    report.tests.push({
      name: testName,
      status: 'failed',
      message: `Missing patterns in ${filePath}: ${missing.join(', ')}`
    });
    report.summary.failed++;
    return false;
  }
}

console.log('🔍 Verifying Enhancements...\n');

// Settings Page Enhancements
checkFile(
  'app/(dashboard)/settings/page.tsx',
  [
    'role-based',
    'require_mfa',
    'MFA',
    'version',
    'import',
    'export',
    'quiet_hours',
    'Test Email',
    'Test SMS',
    'configVersion',
    'settingsHistory'
  ],
  'Settings Page - All Enhancements'
);

// System Status Page Enhancements
checkFile(
  'app/(dashboard)/system-status/page.tsx',
  [
    'SLA',
    'uptime',
    'latency',
    'error rate',
    'autoRefresh',
    'refreshInterval',
    'LineChart',
    'dependency',
    'synthetic',
    'incident'
  ],
  'System Status Page - All Enhancements'
);

// Admin Audit Logs Enhancements
checkFile(
  'app/(dashboard)/admin/audit-logs/page.tsx',
  [
    'correlation_id',
    'correlationId',
    'sortable',
    'pagination',
    'exportToCSV',
    'exportToPDF',
    'savedFilters',
    'spike',
    'autoRefresh'
  ],
  'Admin Audit Logs - All Enhancements'
);

// Admin Users Enhancements
checkFile(
  'app/(dashboard)/admin/users/page.tsx',
  [
    'isCurrentUser',
    'canModifyUser',
    'mfa_enabled',
    'password_set',
    'last_login',
    'bulkActivate',
    'bulkDeactivate',
    'exportUsers',
    'maskPii',
    'role',
    'status',
    'org_unit'
  ],
  'Admin Users - All Enhancements'
);

// Backend API Endpoints
checkFile(
  'api_gateway/app/routers/cache_management.py',
  [
    'get_cache_metadata',
    'clear_cache',
    'list_cache_keys',
    'correlation_id'
  ],
  'Backend - Cache Management API'
);

checkFile(
  'api_gateway/app/routers/export_management.py',
  [
    'generate_export_signature',
    'verify_export_signature',
    'HMAC',
    'SHA256'
  ],
  'Backend - Export Management API'
);

// Export Helpers
checkFile(
  'lib/utils/exportHelpers.ts',
  [
    'exportToCSV',
    'exportToPDF',
    'generateExportSignature',
    'correlationId'
  ],
  'Frontend - Export Helpers'
);

report.summary.total = report.tests.length;

// Generate Report
console.log('\n📊 Test Results:\n');
report.tests.forEach(test => {
  const icon = test.status === 'passed' ? '✅' : '❌';
  console.log(`${icon} ${test.name}`);
  if (test.status === 'failed') {
    console.log(`   ${test.message}`);
  }
});

console.log(`\n📈 Summary:`);
console.log(`   Total: ${report.summary.total}`);
console.log(`   ✅ Passed: ${report.summary.passed}`);
console.log(`   ❌ Failed: ${report.summary.failed}`);

// Save report
const reportPath = path.join(__dirname, '..', `ENHANCEMENT_VERIFICATION_${Date.now()}.json`);
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
console.log(`\n📄 Report saved to: ${reportPath}`);

process.exit(report.summary.failed > 0 ? 1 : 0);



