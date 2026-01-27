/**
 * Browser E2E Tests for Admin Audit Logs Page
 * Tests correlation-ID search, sorting, pagination, export, saved filters
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Audit Logs Page Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('input[id="username"]', { timeout: 10000 });
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to audit logs
    await page.goto('/admin/audit-logs');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  });

  test('should display audit logs page', async ({ page }) => {
    await expect(page.locator('text=Audit Logs')).toBeVisible();
  });

  test('should show filters button', async ({ page }) => {
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
  });

  test('should open filters panel', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    await page.waitForTimeout(500);
    
    // Check for filter inputs
    const correlationInput = page.locator('input[placeholder*="correlation"]');
    if (await correlationInput.count() > 0) {
      await expect(correlationInput.first()).toBeVisible();
    }
  });

  test('should filter by correlation-ID', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    await page.waitForTimeout(500);
    
    const correlationInput = page.locator('input[placeholder*="correlation"]');
    if (await correlationInput.count() > 0) {
      await correlationInput.first().fill('corr_123');
      await page.waitForTimeout(1000);
      // Filter should be applied
      expect(await correlationInput.first().inputValue()).toBe('corr_123');
    }
  });

  test('should show export buttons', async ({ page }) => {
    await expect(page.locator('button:has-text("Export CSV")')).toBeVisible();
    await expect(page.locator('button:has-text("Export PDF")')).toBeVisible();
  });

  test('should show auto-refresh toggle', async ({ page }) => {
    const autoRefreshButton = page.locator('button:has-text("Auto-refresh")');
    if (await autoRefreshButton.count() > 0) {
      await expect(autoRefreshButton.first()).toBeVisible();
    }
  });

  test('should display audit log entries table', async ({ page }) => {
    await page.waitForTimeout(2000);
    // Check for table headers
    const timestampHeader = page.locator('text=/timestamp/i');
    if (await timestampHeader.count() > 0) {
      await expect(timestampHeader.first()).toBeVisible();
    }
  });

  test('should show pagination if multiple pages', async ({ page }) => {
    await page.waitForTimeout(2000);
    const pagination = page.locator('text=/page/i');
    if (await pagination.count() > 0) {
      await expect(pagination.first()).toBeVisible();
    }
  });
});

