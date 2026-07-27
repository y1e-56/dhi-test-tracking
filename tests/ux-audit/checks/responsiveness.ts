import { Page } from '@playwright/test';

export interface ResponsivenessIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  element: string;
  description: string;
  viewport?: string;
}

export async function checkResponsiveness(page: Page): Promise<ResponsivenessIssue[]> {
  const issues: ResponsivenessIssue[] = [];

  const overflowElements = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const problems: Array<{ tag: string; className: string; scrollWidth: number; clientWidth: number }> = [];
    for (const el of Array.from(all)) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.scrollWidth > htmlEl.clientWidth + 5) {
        const tag = htmlEl.tagName;
        const cls = htmlEl.className?.toString().slice(0, 60) || '';
        if (tag !== 'HTML' && tag !== 'BODY' && !cls.includes('scroll')) {
          problems.push({
            tag,
            className: cls,
            scrollWidth: htmlEl.scrollWidth,
            clientWidth: htmlEl.clientWidth,
          });
        }
      }
    }
    return problems.slice(0, 10);
  });
  for (const el of overflowElements) {
    issues.push({
      severity: 'major',
      category: 'responsiveness',
      element: `<${el.tag} class="${el.className}">`,
      description: `Overflow horizontal détecté (${el.scrollWidth}px > ${el.clientWidth}px) — contenu tronqué sur mobile`,
    });
  }

  const smallTouchTargets = await page.evaluate(() => {
    const clickables = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"], [onclick]');
    const problems: Array<{ tag: string; text: string; width: number; height: number }> = [];
    for (const el of Array.from(clickables)) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0 && (rect.width < 44 || rect.height < 44)) {
        const text = el.textContent?.trim()?.slice(0, 30) || '';
        if (text || el.tagName === 'INPUT') {
          problems.push({
            tag: el.tagName,
            text,
            width: Math.round(rect.width),
            height: Math.round(rect.height),
          });
        }
      }
    }
    return problems.slice(0, 15);
  });
  for (const el of smallTouchTargets) {
    issues.push({
      severity: el.width < 24 || el.height < 24 ? 'critical' : 'major',
      category: 'responsiveness',
      element: `<${el.tag}> "${el.text}" (${el.width}x${el.height}px)`,
      description: `Cible cliquable trop petite (${el.width}x${el.height}px < 44x44px) — difficile à toucher sur mobile`,
    });
  }

  const truncatedText = await page.evaluate(() => {
    const textElements = document.querySelectorAll('p, span, h1, h2, h3, h4, h5, h6, td, th, label, a');
    const problems: Array<{ tag: string; text: string; overflow: boolean }> = [];
    for (const el of Array.from(textElements)) {
      const htmlEl = el as HTMLElement;
      if (htmlEl.scrollWidth > htmlEl.clientWidth + 2) {
        const text = htmlEl.textContent?.trim()?.slice(0, 50) || '';
        if (text.length > 10) {
          problems.push({
            tag: el.tagName,
            text,
            overflow: true,
          });
        }
      }
    }
    return problems.slice(0, 10);
  });
  for (const el of truncatedText) {
    issues.push({
      severity: 'minor',
      category: 'responsiveness',
      element: `<${el.tag}> "${el.text}..."`,
      description: 'Texte tronqué sans tooltip — l\'utilisateur ne peut pas lire le contenu complet',
    });
  }

  const fixedWidthElements = await page.evaluate(() => {
    const all = document.querySelectorAll('*');
    const problems: Array<{ tag: string; className: string; width: number }> = [];
    for (const el of Array.from(all)) {
      const style = window.getComputedStyle(el);
      const width = style.width;
      if (width && width.endsWith('px') && !width.startsWith('0')) {
        const px = parseInt(width);
        if (px > 600 && el.tagName !== 'HTML' && el.tagName !== 'BODY' && el.tagName !== 'SCRIPT') {
          const cls = el.className?.toString().slice(0, 60) || '';
          problems.push({
            tag: el.tagName,
            className: cls,
            width: px,
          });
        }
      }
    }
    return problems.slice(0, 5);
  });
  for (const el of fixedWidthElements) {
    issues.push({
      severity: 'minor',
      category: 'responsiveness',
      element: `<${el.tag} class="${el.className}">`,
      description: `Largeur fixe ${el.width}px — peut causer un overflow sur les petits écrans`,
    });
  }

  return issues;
}
