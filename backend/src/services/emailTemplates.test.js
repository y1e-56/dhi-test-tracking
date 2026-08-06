import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  taskAssignedEmail,
  anomalyAssignedEmail,
  resolutionSignaledEmail,
  anomalyRejectedEmail,
  anomalyValidatedEmail,
  featureConformeEmail,
  passwordForgotAdminEmail,
  passwordResetByAdminEmail,
  projectCreatedEmail,
  campaignCreatedEmail,
  userCreatedEmail,
  loginNotificationEmail,
  campaignCompletedEmail,
} from './emailTemplates.js';

const URL = 'http://localhost:5173/detail';

function assertEmailShape(html, { contains, href = null }) {
  assert.equal(typeof html, 'string');
  assert.ok(html.startsWith('<!DOCTYPE html>'), 'doit être un document HTML');
  assert.ok(html.includes('DHI Test Tracking'), 'doit contenir le header/footer DHI Test Tracking');
  assert.ok(
    html.includes('Cet email est envoyé automatiquement par DHI Test Tracking'),
    'doit contenir le pied de page automatique'
  );
  for (const needle of contains) {
    assert.ok(html.includes(needle), `doit contenir « ${needle} »`);
  }
  if (href) {
    assert.ok(html.includes(`href="${href}"`), `doit contenir le lien ${href}`);
  }
}

const cases = [
  {
    name: 'taskAssignedEmail',
    fn: taskAssignedEmail,
    args: { userFirstName: 'Marie', featureName: 'Authentification', campaignName: 'Campagne V1', linkUrl: URL },
    contains: ['Bonjour', 'Marie', 'Authentification', 'Campagne V1', 'Voir mes tâches'],
    href: URL,
  },
  {
    name: 'anomalyAssignedEmail',
    fn: anomalyAssignedEmail,
    args: { userFirstName: 'Paul', anomalyDescription: 'Le bouton ne répond pas', featureName: 'Login', linkUrl: URL },
    contains: ['Paul', 'Login', 'Le bouton ne répond pas', 'Voir mes anomalies'],
    href: URL,
  },
  {
    name: 'resolutionSignaledEmail',
    fn: resolutionSignaledEmail,
    args: { userFirstName: 'Marie', anomalyDescription: 'Corrigé dans la 2.1', devName: 'Karim', linkUrl: URL },
    contains: ['Marie', 'Karim', 'Corrigé dans la 2.1', 'valider ou rejeter'],
    href: URL,
  },
  {
    name: 'anomalyRejectedEmail',
    fn: anomalyRejectedEmail,
    args: { userFirstName: 'Karim', anomalyDescription: 'Non reproduit', testerName: 'Marie', linkUrl: URL },
    contains: ['Karim', 'Marie', 'Non reproduit', 'rejeté'],
    href: URL,
  },
  {
    name: 'anomalyValidatedEmail',
    fn: anomalyValidatedEmail,
    args: { userFirstName: 'Marie', anomalyDescription: 'Résolu et vérifié', campaignName: 'Campagne V1', linkUrl: URL },
    contains: ['Marie', 'Résolu et vérifié', 'Campagne V1', 'résolue et validée'],
    href: URL,
  },
  {
    name: 'featureConformeEmail',
    fn: featureConformeEmail,
    args: { userFirstName: 'Marie', featureName: 'Export PDF', campaignName: 'Campagne V1', linkUrl: URL },
    contains: ['Marie', 'Export PDF', 'Campagne V1', 'conforme'],
    href: URL,
  },
  {
    name: 'passwordForgotAdminEmail',
    fn: passwordForgotAdminEmail,
    args: { adminFirstName: 'Sophie', userFullName: 'Paul Martin', userEmail: 'paul@test.fr', linkUrl: URL },
    contains: ['Sophie', 'Paul Martin', 'paul@test.fr', 'oublié son mot de passe'],
    href: URL,
  },
  {
    name: 'passwordResetByAdminEmail',
    fn: passwordResetByAdminEmail,
    args: { userFirstName: 'Marie', tempPassword: 'Temp@12345', linkUrl: URL },
    contains: ['Marie', 'Temp@12345', 'mot de passe temporaire'],
    href: URL,
  },
  {
    name: 'projectCreatedEmail',
    fn: projectCreatedEmail,
    args: { userFirstName: 'Sophie', projectName: 'Mobile App', linkUrl: URL },
    contains: ['Sophie', 'Mobile App', 'chef testeur'],
    href: URL,
  },
  {
    name: 'campaignCreatedEmail',
    fn: campaignCreatedEmail,
    args: { userFirstName: 'Sophie', campaignName: 'Campagne Mobile', projectName: 'Mobile App', campaignLink: URL, roleLabel: 'Chef testeur' },
    contains: ['Sophie', 'Campagne Mobile', 'Mobile App', 'Chef testeur'],
    href: URL,
  },
  {
    name: 'userCreatedEmail',
    fn: userCreatedEmail,
    args: { userFirstName: 'Paul', email: 'paul@test.fr', password: 'Start#2026', linkUrl: URL },
    contains: ['Paul', 'paul@test.fr', 'Start#2026', 'changer votre mot de passe'],
    href: URL,
  },
  {
    name: 'loginNotificationEmail',
    fn: loginNotificationEmail,
    args: { userFirstName: 'Marie', date: '05/08/2026', time: '14:32', ip: '192.168.1.10' },
    contains: ['Marie', '05/08/2026', '14:32', '192.168.1.10', 'Connexion détectée'],
  },
  {
    name: 'campaignCompletedEmail',
    fn: campaignCompletedEmail,
    args: { adminFirstName: 'Sophie', campaignName: 'Campagne V1', projectName: 'DHI Logiciel', linkUrl: URL },
    contains: ['Sophie', 'Campagne V1', 'DHI Logiciel', 'terminée'],
    href: URL,
  },
];

describe('emailTemplates', () => {
  for (const { name, fn, args, contains, href } of cases) {
    test(name, () => {
      assertEmailShape(fn(args), { contains, href });
    });
  }

  test('loginNotificationEmail affiche « Inconnue » quand aucune IP', () => {
    const html = loginNotificationEmail({ userFirstName: 'Marie', date: '05/08/2026', time: '14:32' });
    assert.ok(html.includes('Inconnue'));
  });

  test('passwordResetByAdminEmail met le mot de passe temporaire en évidence', () => {
    const html = passwordResetByAdminEmail({ userFirstName: 'Marie', tempPassword: 'S3cret!x', linkUrl: URL });
    assert.ok(html.includes('font-family:monospace'));
  });

  test('les liens de boutons sont sécurisés contre les guillemets dans l\'URL', () => {
    const html = taskAssignedEmail({
      userFirstName: 'Marie',
      featureName: 'Auth',
      campaignName: 'V1',
      linkUrl: 'http://x/a?q="onclick="alert(1)',
    });
    assert.ok(!html.includes('"onclick='), 'l\'attribut onclick ne doit pas être injecté dans href');
    assert.ok(html.includes('&quot;onclick='), 'les guillemets du lien doivent être échappés');
  });

  test('échappe le contenu utilisateur (anti-XSS) dans les libellés et textes', () => {
    const html = anomalyAssignedEmail({
      userFirstName: '<b>Marie</b>',
      anomalyDescription: '<script>alert(1)</script>',
      featureName: 'Login" onmouseover="x',
      linkUrl: URL,
    });
    assert.ok(!html.includes('<script>'), 'les balises <script> doivent être échappées');
    assert.ok(!html.includes('" onmouseover='), 'aucun guillemet brut ne doit précéder un attribut');
    assert.ok(html.includes('&lt;b&gt;Marie&lt;/b&gt;'));
    assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
    assert.ok(html.includes('Login&quot; onmouseover=&quot;x'));
  });
});
