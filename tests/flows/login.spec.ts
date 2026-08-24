import { test, expect } from '@playwright/test';
import { USERS } from '../utils/auth';

test.describe('Login Flow', () => {
  test('page de login affiche le formulaire', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter|login|connexion|sign in/i })).toBeVisible();
  });

  test('login avec identifiants valides (admin)', async ({ page }) => {
    const user = USERS.admin;
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /se connecter|login|connexion|sign in/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login avec mauvais mot de passe affiche erreur', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill('admin@test.fr');
    await page.locator('#password').fill('WRONG_PASSWORD');
    await page.getByRole('button', { name: /se connecter|login|connexion|sign in/i }).click();

    await expect(page.locator('.toast, [role="alert"], .error, .text-red, .text-destructive').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('login avec email inexistant affiche erreur', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill('inexistant@test.fr');
    await page.locator('#password').fill('whatever123');
    await page.getByRole('button', { name: /se connecter|login|connexion|sign in/i }).click();

    await expect(page.locator('.toast, [role="alert"], .error, .text-red, .text-destructive').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('champs vides empêchent la soumission', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /se connecter|login|connexion|sign in/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  for (const [key, user] of Object.entries(USERS)) {
    test(`login ${user.role} (${user.email}) redirige vers dashboard`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.locator('#email').fill(user.email);
      await page.locator('#password').fill(user.password);
      await page.getByRole('button', { name: /se connecter|login|connexion|sign in/i }).click();

      await page.waitForURL('**/dashboard', { timeout: 15_000 });
      await expect(page).toHaveURL(/dashboard/);
    });
  }
});
