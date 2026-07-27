import { Page } from '@playwright/test';

export interface FormIssue {
  severity: 'critical' | 'major' | 'minor';
  category: string;
  element: string;
  description: string;
}

export async function checkForms(page: Page): Promise<FormIssue[]> {
  const issues: FormIssue[] = [];

  const requiredNoIndicator = await page.evaluate(() => {
    const requiredInputs = document.querySelectorAll('input[required], textarea[required], select[required]');
    return Array.from(requiredInputs).filter((input) => {
      const parent = input.closest('.form-group, .field, [class*="form"], [class*="field"]');
      if (!parent) return true;
      const indicator = parent.querySelector('.required, .asterisk, [class*="required"], [class*="asterisk"]');
      const ariaRequired = input.getAttribute('aria-required');
      return !indicator && ariaRequired !== 'true';
    }).map((input) => ({
      tag: input.tagName,
      type: input.getAttribute('type'),
      name: input.getAttribute('name'),
      id: input.id,
    }));
  });
  for (const input of requiredNoIndicator) {
    issues.push({
      severity: 'major',
      category: 'forms',
      element: `<${input.tag} name="${input.name}" required>`,
      description: 'Champ requis sans indicateur visible (asterisque ou aria-required) — l\'utilisateur ne sait pas qu\'il est obligatoire',
    });
  }

  const noFormValidation = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    return Array.from(forms).filter((form) => {
      const novalidate = form.hasAttribute('novalidate');
      const onsubmit = form.getAttribute('onsubmit');
      return novalidate || (onsubmit && onsubmit.includes('return false'));
    }).map(() => 'found');
  });
  if (noFormValidation.length > 0) {
    issues.push({
      severity: 'minor',
      category: 'forms',
      element: 'form',
      description: 'Formulaire avec validation désactivée (novalidate) — les erreurs ne sont pas signalées au navigateur',
    });
  }

  const passwordNoToggle = await page.evaluate(() => {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    return Array.from(passwordInputs).filter((input) => {
      const parent = input.closest('.relative, [class*="input"], [class*="field"]');
      if (!parent) return false;
      const toggle = parent.querySelector('button, [class*="toggle"], [class*="eye"], [class*="visibility"]');
      return !toggle;
    }).length;
  });
  if (passwordNoToggle > 0) {
    issues.push({
      severity: 'minor',
      category: 'forms',
      element: `input[type="password"]`,
      description: 'Champ mot de passe sans bouton de visibilité — l\'utilisateur ne peut pas vérifier sa saisie',
    });
  }

  const submitButtons = await page.evaluate(() => {
    const buttons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
    return Array.from(buttons).filter((btn) => {
      const text = btn.textContent?.trim();
      const value = (btn as HTMLInputElement).value;
      return !text && !value;
    }).length;
  });
  if (submitButtons > 0) {
    issues.push({
      severity: 'major',
      category: 'forms',
      element: 'button[type="submit"]',
      description: 'Bouton de soumission sans texte — l\'utilisateur ne sait pas ce que fait le bouton',
    });
  }

  const longForms = await page.evaluate(() => {
    const forms = document.querySelectorAll('form');
    return Array.from(forms).filter((form) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      return inputs.length > 6;
    }).map((form) => {
      const inputs = form.querySelectorAll('input, textarea, select');
      const hasSections = form.querySelectorAll('fieldset, legend, [class*="section"], [class*="group"]');
      return { inputCount: inputs.length, sectionCount: hasSections.length };
    });
  });
  for (const form of longForms) {
    if (form.sectionCount === 0) {
      issues.push({
        severity: 'minor',
        category: 'forms',
        element: `form avec ${form.inputCount} champs`,
        description: 'Formulaire long sans sections (fieldset/group) — peut être décourageant pour l\'utilisateur',
      });
    }
  }

  return issues;
}
