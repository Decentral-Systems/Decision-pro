/**
 * Quick Page Load Tests
 * Simple tests to verify all pages are accessible
 */

import { test, expect } from '@playwright/test';

test.describe('Quick Page Load Check', () => {
  // Use a shared login state
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeAll(async ({ browser }) => {
    // Create authenticated context
    const context = await browser.newContext();
    const page = await context.newPage();
    
    try {
      await page.goto('/login');
      await page.waitForSelector('input[id="username"]', { timeout: 20000 });
      await page.fill('input[id="username"]', 'admin');
      await page.fill('input[id="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 20000 });
      
      // Save auth state
      await context.storageState({ path: 'playwright/.auth/admin.json' });
    } catch (error) {
      console.warn('Could not create auth state:', error);
    } finally {
      await context.close();
    }
  });

  const pages = [
    '/dashboard',
    '/analytics',
    '/compliance',
    '/credit-scoring/history',
    '/default-prediction',
    '/default-prediction/history',
    '/dynamic-pricing',
    '/customers',
    '/realtime-scoring',
    '/ml-center',
    '/settings',
    '/system-status',
    '/admin/audit-logs',
    '/admin/users',
  ];

  for (const path of pages) {
    test(`should load ${path} without errors`, async ({ page }) => {
      await page.goto(path, { waitUntil: 'networkidle', timeout: 30000 });
      
      // Check for critical errors
      const errorMessages = page.locator('text=/500|error|failed/i');
      const errorCount = await errorMessages.count();
      expect(errorCount).toBe(0);
      
      // Page should have loaded content
      const body = page.locator('body');
      await expect(body).toBeVisible();
    });
  }
});



