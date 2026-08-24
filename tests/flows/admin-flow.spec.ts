import { test, expect } from '@playwright/test';
import { loginAs, USERS } from '../utils/auth';
import { setupConsoleCapture, setupNetworkCapture, capturePageResult, saveResults, PageResult } from '../utils/helpers';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'reports', 'admin');

test.describe('Admin Flow', () => {
  let results: PageResult[] = [];

  test.afterAll(async () => {
    saveResults(results, 'admin-flow.json', RESULTS_DIR);
  });

  test('admin: login → dashboard', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'admin');
    await page.waitForLoadState('networkidle');
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('admin: sidebar affiche toutes les sections', async ({ page }) => {
    await loginAs(page, 'admin');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    const navLinks = sidebar.getByRole('link');
    const count = await navLinks.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('admin: naviguer vers projets', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'admin');
    await page.getByRole('link', { name: /projet/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/projets/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('admin: naviguer vers campagnes', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'admin');
    await page.getByRole('link', { name: /campagne/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/campagnes/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('admin: naviguer vers admin utilisateurs', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'admin');
    await page.getByRole('link', { name: /utilisateur|user/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/admin/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('admin: naviguer vers historique', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'admin');
    await page.getByRole('link', { name: /historique|history/i }).first().click();
    await page.waitForLoadState('networkidle');
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('admin: naviguer vers reporting', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'admin');
    await page.getByRole('link', { name: /rapport|reporting/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/reporting/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('admin: cmd+K ouvre le palette de recherche', async ({ page }) => {
    await loginAs(page, 'admin');
    await expect(page.locator('nav, aside, [class*="sidebar"]').first()).toBeVisible();
    await page.keyboard.press('Control+k');
    await expect(page.locator('[role="dialog"], [cmdk-dialog], [class*="command"]').first())
      .toBeVisible({ timeout: 5_000 });
  });
});
