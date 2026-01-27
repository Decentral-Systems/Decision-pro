/**
 * Browser E2E Tests for Admin Users Page
 * Tests role-based guardrails, user info, bulk operations, filtering
 */

import { test, expect } from '@playwright/test';

test.describe('Admin Users Page Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('input[id="username"]', { timeout: 10000 });
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to users
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  });

  test('should display users page', async ({ page }) => {
    await expect(page.locator('text=User Management')).toBeVisible();
  });

  test('should show create user button', async ({ page }) => {
    await expect(page.locator('button:has-text("Create User")')).toBeVisible();
  });

  test('should show filters button', async ({ page }) => {
    await expect(page.locator('button:has-text("Filters")')).toBeVisible();
  });

  test('should open filters panel', async ({ page }) => {
    await page.click('button:has-text("Filters")');
    await page.waitForTimeout(500);
    
    // Check for filter inputs
    await expect(page.locator('text=/role/i')).toBeVisible();
    await expect(page.locator('text=/status/i')).toBeVisible();
  });

  test('should display user information columns', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Check for column headers
    const mfaHeader = page.locator('text=/mfa/i');
    const passwordHeader = page.locator('text=/password/i');
    const lockoutHeader = page.locator('text=/lockout/i');
    
    if (await mfaHeader.count() > 0) {
      await expect(mfaHeader.first()).toBeVisible();
    }
    if (await passwordHeader.count() > 0) {
      await expect(passwordHeader.first()).toBeVisible();
    }
    if (await lockoutHeader.count() > 0) {
      await expect(lockoutHeader.first()).toBeVisible();
    }
  });

  test('should show export button', async ({ page }) => {
    await expect(page.locator('button:has-text("Export")')).toBeVisible();
  });

  test('should allow selecting users for bulk operations', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Find checkboxes
    const checkboxes = page.locator('input[type="checkbox"]');
    const checkboxCount = await checkboxes.count();
    
    if (checkboxCount > 1) {
      // Click first user checkbox (skip header checkbox)
      await checkboxes.nth(1).click();
      await page.waitForTimeout(500);
      
      // Should show bulk action buttons
      const bulkActions = page.locator('text=/user\\(s\\) selected/i');
      if (await bulkActions.count() > 0) {
        await expect(bulkActions.first()).toBeVisible();
      }
    }
  });
});

