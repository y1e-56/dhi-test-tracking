import { test, expect } from '@playwright/test';
import { loginAs } from '../utils/auth';
import { setupConsoleCapture, setupNetworkCapture, capturePageResult, saveResults, PageResult } from '../utils/helpers';
import { fileURLToPath } from 'url';
import * as path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RESULTS_DIR = path.join(__dirname, 'reports', 'dev');

test.describe('Developpeur Flow', () => {
  let results: PageResult[] = [];

  test.afterAll(async () => {
    saveResults(results, 'dev-flow.json', RESULTS_DIR);
  });

  test('dev: login → dashboard', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'dev');
    await page.waitForLoadState('networkidle');
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('dev: sidebar n\'affiche PAS admin ni taches testeur', async ({ page }) => {
    await loginAs(page, 'dev');
    await page.waitForLoadState('networkidle');

    const adminLink = page.locator('a[href*="/admin"]').first();
    await expect(adminLink).not.toBeVisible();

    const testeurLink = page.locator('a[href*="/testeur"]').first();
    await expect(testeurLink).not.toBeVisible();
  });

  test('dev: naviguer vers anomalies', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'dev');
    await page.getByRole('link', { name: /anomalie/i }).first().click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/developpeur\/anomalies/);
    results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
  });

  test('dev: naviguer vers campagnes si accessible', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'dev');
    const campagneLink = page.getByRole('link', { name: /campagne/i }).first();
    if (await campagneLink.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await campagneLink.click();
      await page.waitForLoadState('networkidle');
      results.push(await capturePageResult(page, consoleErrors, networkErrors, RESULTS_DIR));
    }
  });

  test('dev: cliquer sur une anomalie assignée', async ({ page }) => {
    const consoleErrors = setupConsoleCapture(page);
    const networkErrors = setupNetworkCapture(page);

    await loginAs(page, 'dev');
    await page.goto('/developpeur/anomalies');
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
