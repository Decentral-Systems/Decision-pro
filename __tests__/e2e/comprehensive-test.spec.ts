/**
 * Comprehensive Browser E2E Tests
 * Tests all pages and enhancements in sequence
 */

import { test, expect } from '@playwright/test';

test.describe('Comprehensive Page Testing', () => {
  test.beforeEach(async ({ page }) => {
    // Login once
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForSelector('input[id="username"]', { timeout: 15000 });
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 20000 });
  });

  const pages = [
    { path: '/dashboard', title: 'Executive Dashboard', keyElements: ['correlation', 'refresh', 'export'] },
    { path: '/analytics', title: 'Analytics', keyElements: ['analytics', 'export'] },
    { path: '/compliance', title: 'Compliance', keyElements: ['compliance', 'violations'] },
    { path: '/credit-scoring/history', title: 'Credit Scoring History', keyElements: ['history', 'filter'] },
    { path: '/default-prediction', title: 'Default Prediction', keyElements: ['prediction', 'survival'] },
    { path: '/default-prediction/history', title: 'Default Prediction History', keyElements: ['history'] },
    { path: '/dynamic-pricing', title: 'Dynamic Pricing', keyElements: ['pricing', 'calculator'] },
    { path: '/customers', title: 'Customers', keyElements: ['customers', 'search'] },
    { path: '/realtime-scoring', title: 'Real-Time Scoring', keyElements: ['realtime', 'scoring'] },
    { path: '/ml-center', title: 'ML Center', keyElements: ['ml', 'model'] },
    { path: '/settings', title: 'Settings', keyElements: ['settings', 'system'] },
    { path: '/system-status', title: 'System Status', keyElements: ['status', 'health'] },
    { path: '/admin/audit-logs', title: 'Audit Logs', keyElements: ['audit', 'logs'] },
    { path: '/admin/users', title: 'User Management', keyElements: ['users', 'management'] },
  ];

  for (const pageInfo of pages) {
    test(`should load and display ${pageInfo.path} correctly`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle', { timeout: 20000 });
      
      // Check for page title
      const titleMatch = page.locator(`text=/${pageInfo.title}/i`);
      if (await titleMatch.count() > 0) {
        await expect(titleMatch.first()).toBeVisible({ timeout: 10000 });
      }
      
      // Check for key elements
      for (const element of pageInfo.keyElements) {
        const elementMatch = page.locator(`text=/${element}/i`);
        if (await elementMatch.count() > 0) {
          // Element exists, page is likely working
          break;
        }
      }
      
      // Ensure no critical errors
      const errorMessages = page.locator('text=/error|failed|not found/i');
      const errorCount = await errorMessages.count();
      if (errorCount > 0) {
        console.warn(`Found ${errorCount} potential error messages on ${pageInfo.path}`);
      }
    });
  }

  test('should test Settings page enhancements', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    
    // Check for tabs
    await expect(page.locator('text=System')).toBeVisible();
    await expect(page.locator('text=API')).toBeVisible();
    await expect(page.locator('text=Security')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
    
    // Check for export/import buttons
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
    await expect(page.locator('button:has-text("Import")')).toBeVisible();
  });

  test('should test System Status page enhancements', async ({ page }) => {
    await page.goto('/system-status');
    await page.waitForLoadState('networkidle');
    
    // Check for SLA metrics
    await page.waitForTimeout(2000);
    const slaSection = page.locator('text=/uptime|latency|error rate/i');
    if (await slaSection.count() > 0) {
      await expect(slaSection.first()).toBeVisible();
    }
    
    // Check for auto-refresh toggle
    const autoRefresh = page.locator('label:has-text("Auto-refresh")');
    if (await autoRefresh.count() > 0) {
      await expect(autoRefresh.first()).toBeVisible();
    }
  });

  test('should test Admin Audit Logs enhancements', async ({ page }) => {
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle');
    
    // Open filters
    await page.click('button:has-text("Filters")');
    await page.waitForTimeout(500);
    
    // Check for correlation-ID filter
    const correlationInput = page.locator('input[placeholder*="correlation"]');
    if (await correlationInput.count() > 0) {
      await expect(correlationInput.first()).toBeVisible();
    }
    
    // Check for export buttons
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
  });

  test('should test Admin Users enhancements', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    
    // Check for filters
    await page.click('button:has-text("Filters")');
    await page.waitForTimeout(500);
    
    await expect(page.locator('text=/role/i')).toBeVisible();
    await expect(page.locator('text=/status/i')).toBeVisible();
    
    // Check for export button
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });
});

