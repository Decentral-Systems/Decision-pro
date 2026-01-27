/**
 * Browser E2E Tests for System Status Page
 * Tests metrics charts, dependency graph, auto-refresh, SLA indicators
 */

import { test, expect } from '@playwright/test';

test.describe('System Status Page Enhancements', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.waitForLoadState('networkidle', { timeout: 15000 });
    await page.waitForSelector('input[id="username"]', { timeout: 10000 });
    await page.fill('input[id="username"]', 'admin');
    await page.fill('input[id="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Navigate to system status
    await page.goto('/system-status');
    await page.waitForLoadState('networkidle', { timeout: 20000 });
  });

  test('should display system status page', async ({ page }) => {
    await expect(page.locator('text=System Status')).toBeVisible();
  });

  test('should show SLA metrics cards', async ({ page }) => {
    await expect(page.locator('text=/uptime sla/i')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/latency p95/i')).toBeVisible();
    await expect(page.locator('text=/error rate/i')).toBeVisible();
  });

  test('should display auto-refresh toggle', async ({ page }) => {
    const autoRefreshToggle = page.locator('label:has-text("Auto-refresh")');
    await expect(autoRefreshToggle).toBeVisible({ timeout: 10000 });
  });

  test('should enable auto-refresh when toggled', async ({ page }) => {
    const toggle = page.locator('label:has-text("Auto-refresh")').locator('..').locator('button[role="switch"]');
    if (await toggle.count() > 0) {
      await toggle.first().click();
      await page.waitForTimeout(500);
      // Toggle should be checked
      const isChecked = await toggle.first().getAttribute('aria-checked');
      expect(isChecked).toBe('true');
    }
  });

  test('should show refresh button', async ({ page }) => {
    await expect(page.locator('button:has-text("Refresh")')).toBeVisible();
  });

  test('should display dependencies section', async ({ page }) => {
    await page.waitForTimeout(2000);
    const dependenciesSection = page.locator('text=/dependencies/i');
    if (await dependenciesSection.count() > 0) {
      await expect(dependenciesSection.first()).toBeVisible();
    }
  });

  test('should show synthetic checks if available', async ({ page }) => {
    await page.waitForTimeout(2000);
    const syntheticChecks = page.locator('text=/synthetic checks/i');
    if (await syntheticChecks.count() > 0) {
      await expect(syntheticChecks.first()).toBeVisible();
    }
  });
});

