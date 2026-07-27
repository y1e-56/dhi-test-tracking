import { Page } from '@playwright/test';

export interface EmptyStateIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  element: string;
  description: string;
}

export async function checkEmptyStates(page: Page): Promise<EmptyStateIssue[]> {
  const issues: EmptyStateIssue[] = [];

  const emptyTables = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    return Array.from(tables).filter((table) => {
      const tbody = table.querySelector('tbody');
      if (!tbody) return true;
      const rows = tbody.querySelectorAll('tr');
      return rows.length === 0;
    }).map((table) => {
      const parent = table.parentElement;
      const siblingText = parent?.textContent?.slice(0, 200) || '';
      const hasEmptyMessage = /aucun|empty|no data|pas de/i.test(siblingText);
      const hasAction = !!parent?.querySelector('button, a[href]');
      return { hasEmptyMessage, hasAction };
    });
  });
  for (const table of emptyTables) {
    if (!table.hasEmptyMessage) {
      issues.push({
        severity: 'critical',
        category: 'empty-states',
        element: 'table vide',
        description: 'Tableau vide sans message "Aucun résultat" — l\'utilisateur croit qu\'il y a une erreur',
      });
    }
    if (!table.hasAction) {
      issues.push({
        severity: 'major',
        category: 'empty-states',
        element: 'table vide',
        description: 'Tableau vide sans bouton d\'action (créer, importer) — l\'utilisateur est bloqué',
      });
    }
  }

  const emptyLists = await page.evaluate(() => {
    const lists = document.querySelectorAll('[class*="list"], [class*="grid"], [role="list"]');
    return Array.from(lists).filter((list) => {
      const children = list.children;
      return children.length === 0;
    }).map((list) => ({
      className: list.className?.slice(0, 80),
      parentText: list.parentElement?.textContent?.slice(0, 200) || '',
    }));
  });
  for (const list of emptyLists) {
    const hasEmptyMessage = /aucun|empty|no data|pas de/i.test(list.parentText);
    if (!hasEmptyMessage) {
      issues.push({
        severity: 'major',
        category: 'empty-states',
        element: `liste vide (${list.className})`,
        description: 'Liste vide sans message explicatif — l\'utilisateur ne comprend pas pourquoi il n\'y a rien',
      });
    }
  }

  const loadingSpinners = await page.evaluate(() => {
    const spinners = document.querySelectorAll('[class*="spinner"], [class*="loading"], [class*="skeleton"], .animate-spin');
    return spinners.length;
  });
  const infiniteLoaders = await page.evaluate(() => {
    const loaders = document.querySelectorAll('[class*="loading"], [class*="spinner"]');
    return Array.from(loaders).filter((loader) => {
      const style = window.getComputedStyle(loader);
      return style.display !== 'none' && style.visibility !== 'hidden';
    }).length;
  });
  if (infiniteLoaders > 2) {
    issues.push({
      severity: 'minor',
      category: 'empty-states',
      element: `${infiniteLoaders} loaders visibles`,
      description: 'Plusieurs loaders visibles simultanément — peut indiquer un problème de performance ou de données manquantes',
    });
  }

  const noSearchResults = await page.evaluate(() => {
    const searchInputs = document.querySelectorAll('input[type="search"], input[placeholder*="recherch"], input[placeholder*="search"], input[placeholder*="filter"]');
    return Array.from(searchInputs).map((input) => {
      const parent = input.closest('.relative, [class*="search"], [class*="filter"]');
      const resultsContainer = parent?.parentElement?.querySelector('[class*="result"], [class*="list"], [class*="dropdown"]');
      return {
        hasResultsArea: !!resultsContainer,
        resultsEmpty: resultsContainer ? resultsContainer.children.length === 0 : false,
      };
    });
  });
  for (const search of noSearchResults) {
    if (search.hasResultsArea && search.resultsEmpty) {
      issues.push({
        severity: 'minor',
        category: 'empty-states',
        element: 'champ de recherche',
        description: 'Zone de résultats de recherche vide sans message "Aucun résultat" — l\'utilisateur croit que ça ne fonctionne pas',
      });
    }
  }

  return issues;
}
