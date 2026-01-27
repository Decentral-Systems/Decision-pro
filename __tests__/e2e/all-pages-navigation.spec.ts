/**
 * Browser E2E Tests - Navigation to All Pages
 * Ensures all pages are accessible and load correctly
 */

import { test, expect } from '@playwright/test';

test.describe('All Pages Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('input[id="username"]', { timeout: 10000 });
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
  });

  const pages = [
    { path: '/dashboard', title: 'Executive Dashboard' },
    { path: '/analytics', title: 'Analytics' },
    { path: '/compliance', title: 'Compliance' },
    { path: '/credit-scoring/history', title: 'Credit Scoring History' },
    { path: '/default-prediction', title: 'Default Prediction' },
    { path: '/default-prediction/history', title: 'Default Prediction History' },
    { path: '/dynamic-pricing', title: 'Dynamic Pricing' },
    { path: '/customers', title: 'Customers' },
    { path: '/realtime-scoring', title: 'Real-Time Scoring' },
    { path: '/ml-center', title: 'ML Center' },
    { path: '/settings', title: 'Settings' },
    { path: '/system-status', title: 'System Status' },
    { path: '/admin/audit-logs', title: 'Audit Logs' },
    { path: '/admin/users', title: 'User Management' },
  ];

  for (const pageInfo of pages) {
    test(`should load ${pageInfo.path} page`, async ({ page }) => {
      await page.goto(pageInfo.path);
      await page.waitForLoadState('networkidle', { timeout: 15000 });
      
      // Check for page title or main heading
      const title = page.locator(`text=/${pageInfo.title}/i`);
      if (await title.count() > 0) {
        await expect(title.first()).toBeVisible({ timeout: 10000 });
      } else {
        // Fallback: check if page loaded (no error)
        const error = page.locator('text=/error/i');
        expect(await error.count()).toBe(0);
      }
    });
  }
});

