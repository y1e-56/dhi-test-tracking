import { Page, expect } from '@playwright/test';

export interface TestUser {
  email: string;
  password: string;
  role: string;
  label: string;
}

export const USERS: Record<string, TestUser> = {
  admin: {
    email: 'admin@test.fr',
    password: 'Admin@DHI2026',
    role: 'admin',
    label: 'Admin Principal',
  },
  chef: {
    email: 'chef@test.fr',
    password: 'Chef@DHI2026',
    role: 'chef_testeur',
    label: 'Chef Projet',
  },
  chef2: {
    email: 'chef2@test.fr',
    password: 'Chef@DHI2026',
    role: 'chef_testeur',
    label: 'Second Chef',
  },
  testeur: {
    email: 'testeur@test.fr',
    password: 'Testeur@DHI2026',
    role: 'tester',
    label: 'Testeur Principal',
  },
  dev: {
    email: 'dev@test.fr',
    password: 'Dev@DHI2026',
    role: 'developer',
    label: 'Developpeur Senior',
  },
};

const sessionCache = new Map<string, { token: string; user: string }>();

export async function loginAs(page: Page, userKey: keyof typeof USERS) {
  const user = USERS[userKey];
  const cached = sessionCache.get(userKey);

  if (cached) {
    await page.addInitScript(
      ({ token, user }: { token: string; user: string }) => {
        window.localStorage.setItem('token', token);
        window.localStorage.setItem('currentUser', user);
      },
      cached
    );
    await page.goto('/dashboard');
  } else {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('#email').fill(user.email);
    await page.locator('#password').fill(user.password);
    await page.getByRole('button', { name: /se connecter|login|connexion|sign in/i }).click();

    await page.waitForURL('**/dashboard', { timeout: 15_000 });
    const session = await page.evaluate(() => ({
      token: window.localStorage.getItem('token') || '',
      user: window.localStorage.getItem('currentUser') || '',
    }));
    if (session.token && session.user) {
      sessionCache.set(userKey, session);
    }
  }

  await expect(page).toHaveURL(/dashboard/);
}

export async function logout(page: Page) {
  const menuTrigger = page.locator('button').filter({ has: page.locator('svg') }).last();
  await menuTrigger.click();
  const logoutBtn = page.getByRole('menuitem', { name: /déconnexion|logout|deconnexion/i });
  if (await logoutBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await logoutBtn.click();
    await page.waitForURL('**/', { timeout: 10_000 });
  } else {
    await page.evaluate(() => {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('token');
    });
    await page.goto('/');
  }
}
