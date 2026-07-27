import { Page } from '@playwright/test';

export interface NavigationIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  element: string;
  description: string;
  url?: string;
}

export async function checkNavigation(page: Page): Promise<NavigationIssue[]> {
  const issues: NavigationIssue[] = [];

  const brokenLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href]');
    return Array.from(links).filter((a) => {
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false;
      if (href.startsWith('http') && !href.includes(window.location.hostname)) return false;
      return true;
    }).map((a) => ({
      href: a.getAttribute('href') || '',
      text: a.textContent?.trim()?.slice(0, 50) || '',
    }));
  });

  for (const link of brokenLinks) {
    try {
      const response = await page.request.get(link.href, { timeout: 10_000 });
      if (response.status() >= 400) {
        issues.push({
          severity: 'critical',
          category: 'navigation',
          element: `<a href="${link.href}">${link.text}</a>`,
          description: `Lien cassé — status ${response.status()}`,
          url: link.href,
        });
      }
    } catch {
      issues.push({
        severity: 'major',
        category: 'navigation',
        element: `<a href="${link.href}">${link.text}</a>`,
        description: 'Lien inaccessible — timeout ou erreur réseau',
        url: link.href,
      });
    }
  }

  const emptyLinks = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href]');
    return Array.from(links).filter((a) => {
      const text = a.textContent?.trim();
      const ariaLabel = a.getAttribute('aria-label');
      const title = a.getAttribute('title');
      const img = a.querySelector('img[alt]');
      return !text && !ariaLabel && !title && !img;
    }).map((a) => ({
      href: a.getAttribute('href') || '',
    }));
  });
  for (const link of emptyLinks) {
    issues.push({
      severity: 'major',
      category: 'navigation',
      element: `<a href="${link.href}">`,
      description: 'Lien sans texte visible ni aria-label — l\'utilisateur ne sait pas où il clique',
      url: link.href,
    });
  }

  const sidebarLinks = await page.evaluate(() => {
    const sidebar = document.querySelector('nav, aside, [class*="sidebar"]');
    if (!sidebar) return [];
    const links = sidebar.querySelectorAll('a[href]');
    return Array.from(links).map((a) => ({
      href: a.getAttribute('href') || '',
      text: a.textContent?.trim()?.slice(0, 50) || '',
      hasIcon: !!a.querySelector('svg, img, [class*="icon"]'),
    }));
  });

  const currentPath = new URL(page.url()).pathname;
  const activeLink = sidebarLinks.find((l) => l.href === currentPath);
  if (sidebarLinks.length > 0 && !activeLink) {
    issues.push({
      severity: 'minor',
      category: 'navigation',
      element: 'sidebar',
      description: 'Aucun lien de sidebar n\'est visuellement marqué comme actif sur cette page',
    });
  }

  const noIconLinks = sidebarLinks.filter((l) => !l.hasIcon && l.text.length > 0);
  if (noIconLinks.length > 0) {
    issues.push({
      severity: 'minor',
      category: 'navigation',
      element: 'sidebar',
      description: `${noIconLinks.length} lien(s) sidebar sans icône — réduit la scanabilité`,
    });
  }

  return issues;
}
