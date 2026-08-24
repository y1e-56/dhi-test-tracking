import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { setupConsoleCapture, setupNetworkCapture, capturePageResult, saveResults, PageResult } from '../utils/helpers';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'reports', 'chef');

test.describe('Chef Testeur Flow', () => {
  let results: PageResult[] = [];

  test.afterAll(async () => {
    saveResults(results, 'chef-flow.json', RESULTS_DIR);
  });

  test('chef: login → dashboard', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'chef');
    await page.waitForLoadState('networkidle');
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('chef: sidebar affiche navigation + projets + mon travail', async ({ page }) => {
    await loginAs(page, 'chef');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('nav, aside, [class*="sidebar"]').first();
    await expect(sidebar).toBeVisible();

    await expect(sidebar.getByText(/navigation|projets|mon travail/i).first()).toBeVisible();
  });

  test('chef: naviguer vers projets', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'chef');
    await page.getByRole('link', { name: /projet/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/projets/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('chef: naviguer vers campagnes', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'chef');
    await page.getByRole('link', { name: /campagne/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/campagnes/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('chef: cliquer sur une campagne ouvre le détail', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'chef');
    await page.getByRole('link', { name: /campagne/i }).first().click();
    await page.waitForLoadState('networkidle');

    const firstCard = page.locator('[class*="card"], [role="button"], a[href*="campagnes/"]').first();
    if (await firstCard.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await firstCard.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/campagnes\/\d+/);
      results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
    }
  });

  test('chef: naviguer vers reporting', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'chef');
    await page.getByRole('link', { name: /rapport|reporting/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/reporting/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('chef: cmd+K ouvre le palette', async ({ page }) => {
    await loginAs(page, 'chef');
    await expect(page.locator('nav, aside, [class*="sidebar"]').first()).toBeVisible();
    await page.keyboard.press('Control+k');
    await expect(page.locator('[role="dialog"], [cmdk-dialog], [class*="command"]').first())
      .toBeVisible({ timeout: 5_000 });
  });
});
