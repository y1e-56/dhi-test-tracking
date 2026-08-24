import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { setupConsoleCapture, setupNetworkCapture, capturePageResult, saveResults, PageResult } from '../utils/helpers';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'reports', 'testeur');

test.describe('Testeur Flow', () => {
  let results: PageResult[] = [];

  test.afterAll(async () => {
    saveResults(results, 'testeur-flow.json', RESULTS_DIR);
  });

  test('testeur: login → dashboard', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'testeur');
    await page.waitForLoadState('networkidle');
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('testeur: sidebar n\'affiche PAS admin pages', async ({ page }) => {
    await loginAs(page, 'testeur');
    await page.waitForLoadState('networkidle');

    const adminLink = page.locator('a[href*="/admin"]').first();
    await expect(adminLink).not.toBeVisible();
  });

  test('testeur: naviguer vers mes taches', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'testeur');
    await page.getByRole('link', { name: /t[aâ]che|task/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/testeur\/taches/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('testeur: naviguer vers campagnes assignées', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'testeur');
    const campagneLink = page.getByRole('link', { name: /campagne/i }).first();
    if (await campagneLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await campagneLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/campagnes/);
      results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
    }
  });

  test('testeur: cliquer sur une anomalie', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'testeur');
    await page.goto('/testeur/taches');
    await page.waitForLoadState('networkidle');

    const anomalyLink = page.locator('a[href*="/anomalies/"]').first();
    if (await anomalyLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await anomalyLink.click();
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveURL(/anomalies\/\d+/);
      results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
    }
  });
});
