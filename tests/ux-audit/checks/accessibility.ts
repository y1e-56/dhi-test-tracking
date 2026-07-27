import { Page } from '@playwright/test';

export interface AccessibilityIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  element: string;
  description: string;
  selector?: string;
}

export async function checkAccessibility(page: Page): Promise<AccessibilityIssue[]> {
  const issues: AccessibilityIssue[] = [];

  const imgNoAlt = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img:not([alt])');
    return Array.from(imgs).map((img) => ({
      tag: 'img',
      src: (img as HTMLImageElement).src?.slice(0, 100),
      parent: img.parentElement?.tagName,
    }));
  });
  for (const img of imgNoAlt) {
    issues.push({
      severity: 'critical',
      category: 'accessibility',
      element: `<img src="${img.src}">`,
      description: 'Image sans attribut alt — les lecteurs d\'écran ne peuvent pas la décrire',
    });
  }

  const imgEmptyAlt = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img[alt=""]');
    return Array.from(imgs).filter((img) => {
      const role = img.getAttribute('role');
      return role !== 'presentation' && role !== 'none';
    }).length;
  });
  if (imgEmptyAlt > 0) {
    issues.push({
      severity: 'minor',
      category: 'accessibility',
      element: `${imgEmptyAlt} image(s) avec alt=""`,
      description: 'Images décoratives sans role="presentation" — peut induire en erreur les lecteurs d\'écran',
    });
  }

  const inputsNoLabel = await page.evaluate(() => {
    const inputs = document.querySelectorAll('input:not([type="hidden"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea, select');
    return Array.from(inputs).filter((input) => {
      const id = input.id;
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const placeholder = input.getAttribute('placeholder');
      const hasLabel = id ? document.querySelector(`label[for="${id}"]`) : false;
      return !hasLabel && !ariaLabel && !ariaLabelledBy && !placeholder;
    }).map((input) => ({
      tag: input.tagName,
      type: input.getAttribute('type'),
      name: input.getAttribute('name'),
      className: input.className?.slice(0, 80),
    }));
  });
  for (const input of inputsNoLabel) {
    issues.push({
      severity: 'critical',
      category: 'accessibility',
      element: `<${input.tag} type="${input.type}" name="${input.name}">`,
      description: 'Champ de formulaire sans label, aria-label ou placeholder — inaccessible aux lecteurs d\'écran',
      selector: `input[name="${input.name}"]`,
    });
  }

  const buttonsNoAccessibleName = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button');
    return Array.from(buttons).filter((btn) => {
      const text = btn.textContent?.trim();
      const ariaLabel = btn.getAttribute('aria-label');
      const title = btn.getAttribute('title');
      return !text && !ariaLabel && !title;
    }).map((btn) => ({
      className: btn.className?.slice(0, 80),
      innerHTML: btn.innerHTML?.slice(0, 100),
    }));
  });
  for (const btn of buttonsNoAccessibleName) {
    issues.push({
      severity: 'major',
      category: 'accessibility',
      element: `<button class="${btn.className}">`,
      description: 'Bouton sans nom accessible (texte, aria-label ou title) — les lecteurs d\'écran lisent juste "bouton"',
    });
  }

  const linksNoAccessibleName = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href]');
    return Array.from(links).filter((a) => {
      const text = a.textContent?.trim();
      const ariaLabel = a.getAttribute('aria-label');
      const img = a.querySelector('img[alt]');
      return !text && !ariaLabel && !img;
    }).map((a) => ({
      href: a.getAttribute('href'),
      className: a.className?.slice(0, 80),
    }));
  });
  for (const link of linksNoAccessibleName) {
    issues.push({
      severity: 'major',
      category: 'accessibility',
      element: `<a href="${link.href}">`,
      description: 'Lien sans nom accessible — les lecteurs d\'écran lisent juste "lien"',
    });
  }

  const headingOrder = await page.evaluate(() => {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let prevLevel = 0;
    const issues: string[] = [];
    for (const h of headings) {
      const level = parseInt(h.tagName[1]);
      if (level > prevLevel + 1 && prevLevel > 0) {
        issues.push(`Saut de h${prevLevel} à h${level}: "${h.textContent?.trim()?.slice(0, 50)}"`);
      }
      prevLevel = level;
    }
    return issues;
  });
  for (const issue of headingOrder) {
    issues.push({
      severity: 'minor',
      category: 'accessibility',
      element: 'heading',
      description: issue,
    });
  }

  const focusTraps = await page.evaluate(() => {
    const elements = document.querySelectorAll('[tabindex]');
    return Array.from(elements).filter((el) => {
      const tabindex = parseInt(el.getAttribute('tabindex') || '0');
      return tabindex > 0;
    }).length;
  });
  if (focusTraps > 0) {
    issues.push({
      severity: 'minor',
      category: 'accessibility',
      element: `${focusTraps} élément(s) avec tabindex positif`,
      description: 'Le tabindex positif altère l\'ordre naturel de navigation au clavier',
    });
  }

  return issues;
}
