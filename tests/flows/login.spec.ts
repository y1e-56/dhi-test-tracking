import { test, expect } from '@playwright/test';
import { USERS } from '../utils/auth';

test.describe('Login Flow', () => {
  test('page de login affiche le formulaire', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/mot de passe|password/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /se connecter|login|connexion/i })).toBeVisible();
  });

  test('login avec identifiants valides (admin)', async ({ page }) => {
    const user = USERS.admin;
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/email/i).fill(user.email);
    await page.getByPlaceholder(/mot de passe|password/i).fill(user.password);
    await page.getByRole('button', { name: /se connecter|login|connexion/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login avec mauvais mot de passe affiche erreur', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/email/i).fill('admin@test.fr');
    await page.getByPlaceholder(/mot de passe|password/i).fill('WRONG_PASSWORD');
    await page.getByRole('button', { name: /se connecter|login|connexion/i }).click();

    await expect(page.locator('.toast, [role="alert"], .error, .text-red, .text-destructive').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('login avec email inexistant affiche erreur', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByPlaceholder(/email/i).fill('inexistant@test.fr');
    await page.getByPlaceholder(/mot de passe|password/i).fill('whatever123');
    await page.getByRole('button', { name: /se connecter|login|connexion/i }).click();

    await expect(page.locator('.toast, [role="alert"], .error, .text-red, .text-destructive').first())
      .toBeVisible({ timeout: 10_000 });
  });

  test('champs vides empêchent la soumission', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.getByRole('button', { name: /se connecter|login|connexion/i }).click();
    await expect(page).toHaveURL(/\//);
  });

  for (const [key, user] of Object.entries(USERS)) {
    test(`login ${user.role} (${user.email}) redirige vers dashboard`, async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      await page.getByPlaceholder(/email/i).fill(user.email);
      await page.getByPlaceholder(/mot de passe|password/i).fill(user.password);
      await page.getByRole('button', { name: /se connecter|login|connexion/i }).click();

      await page.waitForURL('**/dashboard', { timeout: 15_000 });
      await expect(page).toHaveURL(/dashboard/);
    });
  }
});
