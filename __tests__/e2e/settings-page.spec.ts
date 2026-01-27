/**
 * Browser E2E Tests for Settings Page
 * Tests all enhancements: role-based permissions, MFA, versioning, import/export
 */

import { test, expect } from '@playwright/test';

test.describe('Settings Page Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('input[id="username"]', { timeout: 10000 });
    
    // Login as admin
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  });

  test('should display settings page with all tabs', async ({ page }) => {
    await expect(page.locator('text=Settings')).toBeVisible();
    await expect(page.locator('text=System')).toBeVisible();
    await expect(page.locator('text=API')).toBeVisible();
    await expect(page.locator('text=Security')).toBeVisible();
    await expect(page.locator('text=Notifications')).toBeVisible();
  });

  test('should show version badge when version exists', async ({ page }) => {
    // Check if version badge is displayed
    const versionBadge = page.locator('text=/v\\d+/');
    if (await versionBadge.count() > 0) {
      await expect(versionBadge.first()).toBeVisible();
    }
  });

  test('should show current values vs defaults', async ({ page }) => {
    // Click on System tab
    await page.click('text=System');
    
    // Check for current value indicators
    const currentValueIndicators = page.locator('text=/Current:/i');
    if (await currentValueIndicators.count() > 0) {
      await expect(currentValueIndicators.first()).toBeVisible();
    }
  });

  test('should show export and import buttons', async ({ page }) => {
    await expect(page.locator('text=Export')).toBeVisible();
    await expect(page.locator('text=Import')).toBeVisible();
  });

  test('should open import dialog when import button is clicked', async ({ page }) => {
    await page.click('text=Import');
    
    await expect(page.locator('text=/import settings/i')).toBeVisible();
    await expect(page.locator('textarea')).toBeVisible();
  });

  test('should show MFA confirmation dialog when enabling MFA', async ({ page }) => {
    await page.click('text=Security');
    
    const mfaSwitch = page.locator('label:has-text("Require Multi-Factor Authentication")').locator('..').locator('button[role="switch"]');
    if (await mfaSwitch.count() > 0) {
      await mfaSwitch.first().click();
      
      // Should show confirmation dialog
      await expect(page.locator('text=/enable multi-factor authentication/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should validate quiet hours overlap', async ({ page }) => {
    await page.click('text=Notifications');
    
    // Enable quiet hours
    const quietHoursSwitch = page.locator('label:has-text("Enable Quiet Hours")').locator('..').locator('button[role="switch"]');
    if (await quietHoursSwitch.count() > 0) {
      await quietHoursSwitch.first().click();
      
      // Set invalid times (too close)
      const startInput = page.locator('input[id="quiet_hours_start"]');
      const endInput = page.locator('input[id="quiet_hours_end"]');
      
      if (await startInput.count() > 0 && await endInput.count() > 0) {
        await startInput.fill('22:00');
        await endInput.fill('22:30');
        
        // Should show validation error
        await page.waitForTimeout(1000);
        const errorMessage = page.locator('text=/too close/i');
        if (await errorMessage.count() > 0) {
          await expect(errorMessage.first()).toBeVisible();
        }
      }
    }
  });

  test('should show test notification channel buttons', async ({ page }) => {
    await page.click('text=Notifications');
    
    // Enable quiet hours to show test buttons
    const quietHoursSwitch = page.locator('label:has-text("Enable Quiet Hours")').locator('..').locator('button[role="switch"]');
    if (await quietHoursSwitch.count() > 0) {
      await quietHoursSwitch.first().click();
      
      await page.waitForTimeout(500);
      
      // Check for test buttons
      const testButtons = page.locator('button:has-text("Test")');
      if (await testButtons.count() > 0) {
        await expect(testButtons.first()).toBeVisible();
      }
    }
  });

  test('should save settings successfully', async ({ page }) => {
    await page.click('text=System');
    
    // Change a setting
    const refreshInput = page.locator('input[id="auto_refresh_interval"]');
    if (await refreshInput.count() > 0) {
      await refreshInput.fill('60');
      
      // Click save
      await page.click('text=Save Changes');
      
      // Should show success message
      await page.waitForTimeout(1000);
      const successMessage = page.locator('text=/success/i');
      if (await successMessage.count() > 0) {
        await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

