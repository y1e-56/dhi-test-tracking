import { chromium, Page, Browser } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { loginAs, USERS, TestUser } from '../utils/auth';
import { checkAccessibility, AccessibilityIssue } from './checks/accessibility';
import { checkNavigation, NavigationIssue } from './checks/navigation';
import { checkForms, FormIssue } from './checks/forms';
import { checkEmptyStates, EmptyStateIssue } from './checks/empty-states';
import { checkResponsiveness, ResponsivenessIssue } from './checks/responsiveness';
import { generateReport } from './report-generator';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type UXIssue = AccessibilityIssue | NavigationIssue | FormIssue | EmptyStateIssue | ResponsivenessIssue;

export interface PageAuditResult {
  url: string;
  role: string;
  screenshot: string;
  issues: UXIssue[];
  timestamp: string;
}

export interface AuditReport {
  timestamp: string;
  baseUrl: string;
  pages: PageAuditResult[];
  summary: {
    totalIssues: number;
    critical: number;
    major: number;
    minor: number;
    byCategory: Record<string, number>;
  };
}

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const OUTPUT_DIR = path.join(__dirname, 'reports');

const PAGES_PER_ROLE: Record<string, Array<{ path: string; name: string }>> = {
  admin: [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/projets', name: 'Projets' },
    { path: '/campagnes', name: 'Campagnes' },
    { path: '/admin/utilisateurs', name: 'Admin Utilisateurs' },
    { path: '/admin/history', name: 'Historique' },
    { path: '/admin/anomalies', name: 'Anomalies (admin)' },
    { path: '/reporting', name: 'Reporting' },
  ],
  chef: [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/projets', name: 'Projets' },
    { path: '/campagnes', name: 'Campagnes' },
    { path: '/reporting', name: 'Reporting' },
  ],
  testeur: [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/testeur/taches', name: 'Mes Taches' },
    { path: '/campagnes', name: 'Campagnes' },
  ],
  dev: [
    { path: '/dashboard', name: 'Dashboard' },
    { path: '/developpeur/anomalies', name: 'Mes Anomalies' },
  ],
};

async function auditPage(page: Page, role: string, pagePath: string, pageName: string): Promise<PageAuditResult> {
  console.log(`  Auditing ${pageName} (${pagePath}) as ${role}...`);

  await page.goto(pagePath, { waitUntil: 'networkidle', timeout: 30_000 });
  await page.waitForTimeout(1_000);

  const slug = `${role}_${pagePath.replace(/\//g, '_').replace(/^_/, '')}`;
  const screenshotPath = path.join(OUTPUT_DIR, 'screenshots', `${slug}.png`);
  fs.mkdirSync(path.dirname(screenshotPath), { recursive: true });

  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch {
    // screenshot failed, continue
  }

  const issues: UXIssue[] = [];

  console.log(`    Checking accessibility...`);
  issues.push(...await checkAccessibility(page));

  console.log(`    Checking navigation...`);
  issues.push(...await checkNavigation(page));

  console.log(`    Checking forms...`);
  issues.push(...await checkForms(page));

  console.log(`    Checking empty states...`);
  issues.push(...await checkEmptyStates(page));

  console.log(`    Checking responsiveness...`);
  issues.push(...await checkResponsiveness(page));

  return {
    url: page.url(),
    role,
    screenshot: screenshotPath,
    issues,
    timestamp: new Date().toISOString(),
  };
}

async function runAudit() {
  console.log('=== DHI Test Tracking — UX Audit Agent ===\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Output: ${OUTPUT_DIR}\n`);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'fr-FR',
  });

  const allResults: PageAuditResult[] = [];

  const rolesToTest = ['admin', 'chef', 'testeur', 'dev'];

  for (const role of rolesToTest) {
    console.log(`\n--- Role: ${role} (${USERS[role].email}) ---`);
    const page = await context.newPage();

    try {
      await loginAs(page, role as keyof typeof USERS);
      console.log(`  Logged in successfully.`);

      const pagesToAudit = PAGES_PER_ROLE[role] || [];
      for (const { path: pagePath, name } of pagesToAudit) {
        try {
          const result = await auditPage(page, role, pagePath, name);
          allResults.push(result);
          console.log(`    Found ${result.issues.length} issue(s).`);
        } catch (err: any) {
          console.log(`    Error auditing ${pagePath}: ${err.message}`);
          allResults.push({
            url: `${BASE_URL}${pagePath}`,
            role,
            screenshot: '',
            issues: [{
              severity: 'critical',
              category: 'navigation',
              element: pagePath,
              description: `Page inaccessible: ${err.message}`,
            }],
            timestamp: new Date().toISOString(),
          });
        }
      }
    } catch (err: any) {
      console.log(`  Login failed for ${role}: ${err.message}`);
    } finally {
      await page.close();
    }
  }

  await browser.close();

  const report = buildReport(allResults);
  generateReport(report, OUTPUT_DIR);

  console.log('\n=== Audit Complete ===');
  console.log(`Total issues: ${report.summary.totalIssues}`);
  console.log(`  Critical: ${report.summary.critical}`);
  console.log(`  Major: ${report.summary.major}`);
  console.log(`  Minor: ${report.summary.minor}`);
  console.log(`\nReport saved to: ${path.join(OUTPUT_DIR, 'ux-audit-report.html')}`);
}

function buildReport(results: PageAuditResult[]): AuditReport {
  let critical = 0;
  let major = 0;
  let minor = 0;
  const byCategory: Record<string, number> = {};

  for (const result of results) {
    for (const issue of result.issues) {
      if (issue.severity === 'critical') critical++;
      else if (issue.severity === 'major') major++;
      else minor++;

      byCategory[issue.category] = (byCategory[issue.category] || 0) + 1;
    }
  }

  return {
    timestamp: new Date().toISOString(),
    baseUrl: BASE_URL,
    pages: results,
    summary: {
      totalIssues: critical + major + minor,
      critical,
      major,
      minor,
      byCategory,
    },
  };
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});
