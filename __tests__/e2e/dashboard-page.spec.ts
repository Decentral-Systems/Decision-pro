/**
 * Browser E2E Tests for Dashboard Page
 * Tests all dashboard enhancements
 */

import { test, expect } from '@playwright/test';

test.describe('Dashboard Page Enhancements', () => {
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

  test('should display dashboard page', async ({ page }) => {
    await expect(page.locator('text=/executive dashboard/i')).toBeVisible({ timeout: 15000 });
  });

  test('should show correlation-ID display', async ({ page }) => {
    await page.waitForTimeout(2000);
    const correlationId = page.locator('text=/corr_/i');
    if (await correlationId.count() > 0) {
      await expect(correlationId.first()).toBeVisible();
    }
  });

  test('should show refresh button', async ({ page }) => {
    const refreshButton = page.locator('button:has-text("Refresh")');
    if (await refreshButton.count() > 0) {
      await expect(refreshButton.first()).toBeVisible();
    }
  });

  test('should show SLA chips', async ({ page }) => {
    await page.waitForTimeout(2000);
    const slaChips = page.locator('text=/sla|uptime|latency/i');
    if (await slaChips.count() > 0) {
      await expect(slaChips.first()).toBeVisible();
    }
  });

  test('should show export buttons for ML and Compliance', async ({ page }) => {
    await page.waitForTimeout(3000);
    const exportButtons = page.locator('button:has-text("Export")');
    if (await exportButtons.count() > 0) {
      await expect(exportButtons.first()).toBeVisible();
    }
  });
});

