import { test, expect } from '@playwright/test';
import { loginAs, USERS } from '../utils/auth';
import { checkAccessibility } from '../ux-audit/checks/accessibility';
import { checkNavigation } from '../ux-audit/checks/navigation';
import { checkForms } from '../ux-audit/checks/forms';
import { checkEmptyStates } from '../ux-audit/checks/empty-states';
import { checkResponsiveness } from '../ux-audit/checks/responsiveness';

const PAGES_TO_AUDIT = [
  { path: '/dashboard', name: 'Dashboard', roles: ['admin', 'chef', 'testeur', 'dev'] },
  { path: '/projets', name: 'Projets', roles: ['admin', 'chef'] },
  { path: '/campagnes', name: 'Campagnes', roles: ['admin', 'chef', 'testeur'] },
  { path: '/admin/utilisateurs', name: 'Admin Users', roles: ['admin'] },
  { path: '/admin/history', name: 'Historique', roles: ['admin'] },
  { path: '/admin/anomalies', name: 'Anomalies Admin', roles: ['admin'] },
  { path: '/reporting', name: 'Reporting', roles: ['admin', 'chef'] },
  { path: '/testeur/taches', name: 'Taches Testeur', roles: ['testeur'] },
  { path: '/developpeur/anomalies', name: 'Anomalies Dev', roles: ['dev'] },
];

for (const pageDef of PAGES_TO_AUDIT) {
  for (const role of pageDef.roles) {
    test(`UX Audit: ${pageDef.name} as ${role}`, async ({ page }) => {
      await loginAs(page, role as keyof typeof USERS);
      await page.goto(pageDef.path, { waitUntil: 'networkidle', timeout: 30_000 });
      await page.waitForTimeout(1_000);

      const a11yIssues = await checkAccessibility(page);
      const navIssues = await checkNavigation(page);
      const formIssues = await checkForms(page);
      const emptyIssues = await checkEmptyStates(page);
      const responsiveIssues = await checkResponsiveness(page);

      const allIssues = [...a11yIssues, ...navIssues, ...formIssues, ...emptyIssues, ...responsiveIssues];
      const criticals = allIssues.filter((i) => i.severity === 'critical');

      console.log(`\n=== ${pageDef.name} as ${role} ===`);
      console.log(`Total issues: ${allIssues.length}`);
      console.log(`  Critical: ${criticals.length}`);
      console.log(`  Major: ${allIssues.filter((i) => i.severity === 'major').length}`);
      console.log(`  Minor: ${allIssues.filter((i) => i.severity === 'minor').length}`);

      if (allIssues.length > 0) {
        console.log('\nIssues:');
        for (const issue of allIssues) {
          console.log(`  [${issue.severity.toUpperCase()}] ${issue.category}: ${issue.description}`);
        }
      }

      expect(criticals.length, `${criticals.length} critical issues found on ${pageDef.name} as ${role}`).toBe(0);
    });
  }
}
