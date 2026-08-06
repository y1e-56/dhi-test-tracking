function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[ch]);
}

function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08)">
      <tr><td style="padding:24px 32px;background:#4f46e5">
        <h1 style="margin:0;font-size:18px;color:#fff;font-weight:700">DHI Test Tracking</h1>
      </td></tr>
      <tr><td style="padding:32px">${body}</td></tr>
      <tr><td style="padding:16px 32px;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center">
        Cet email est envoyé automatiquement par DHI Test Tracking. Merci de ne pas y répondre.
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
}

function button(link, label) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0"><tr><td style="background:#4f46e5;border-radius:6px;padding:12px 24px">
    <a href="${escapeHtml(link)}" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px;display:block">${escapeHtml(label)}</a>
  </td></tr></table>`;
}

export function taskAssignedEmail({ userFirstName, featureName, campaignName, linkUrl }) {
  return layout('Nouvelle tâche assignée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      La fonctionnalité <strong>« ${escapeHtml(featureName)} »</strong> (campagne <em>${escapeHtml(campaignName)}</em>) vous a été assignée.
    </p>
    ${button(linkUrl, 'Voir mes tâches')}
  `);
}

export function anomalyAssignedEmail({ userFirstName, anomalyDescription, featureName, linkUrl }) {
  return layout('Anomalie assignée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5">
      Une anomalie vous a été assignée sur la fonctionnalité <strong>« ${escapeHtml(featureName)} »</strong>&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;font-size:14px;color:#7f1d1d;border-radius:4px">
      ${escapeHtml(anomalyDescription)}
    </blockquote>
    ${button(linkUrl, 'Voir mes anomalies')}
  `);
}

export function resolutionSignaledEmail({ userFirstName, anomalyDescription, devName, linkUrl }) {
  return layout('Résolution signalée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      <strong>${escapeHtml(devName)}</strong> a signalé une résolution pour l'anomalie&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#f0fdf4;border-left:3px solid #22c55e;font-size:14px;color:#166534;border-radius:4px">
      ${escapeHtml(anomalyDescription)}
    </blockquote>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Connectez-vous pour valider ou rejeter cette résolution.
    </p>
    ${button(linkUrl, 'Voir l\'anomalie')}
  `);
}

export function anomalyRejectedEmail({ userFirstName, anomalyDescription, testerName, linkUrl }) {
  return layout('Résolution rejetée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      <strong>${escapeHtml(testerName)}</strong> a rejeté la résolution de l'anomalie&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;font-size:14px;color:#7f1d1d;border-radius:4px">
      ${escapeHtml(anomalyDescription)}
    </blockquote>
    ${button(linkUrl, 'Voir l\'anomalie')}
  `);
}

export function anomalyValidatedEmail({ userFirstName, anomalyDescription, campaignName, linkUrl }) {
  return layout('Anomalie résolue', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5">
      Une anomalie a été résolue et validée sur la campagne <em>${escapeHtml(campaignName)}</em>&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#f0fdf4;border-left:3px solid #22c55e;font-size:14px;color:#166534;border-radius:4px">
      ${escapeHtml(anomalyDescription)}
    </blockquote>
    ${button(linkUrl, 'Voir l\'anomalie')}
  `);
}

export function featureConformeEmail({ userFirstName, featureName, campaignName, linkUrl }) {
  return layout('Fonctionnalité conforme', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      La fonctionnalité <strong>« ${escapeHtml(featureName)} »</strong> (campagne <em>${escapeHtml(campaignName)}</em>) a été marquée comme conforme.
    </p>
    ${button(linkUrl, 'Voir la campagne')}
  `);
}

export function passwordForgotAdminEmail({ adminFirstName, userFullName, userEmail, linkUrl }) {
  return layout('Mot de passe oublié', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(adminFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      <strong>${escapeHtml(userFullName)}</strong> (${escapeHtml(userEmail)}) a signalé avoir oublié son mot de passe sur DHI Test Tracking.
    </p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Vous pouvez réinitialiser son mot de passe depuis la page d'administration des utilisateurs.
    </p>
    ${button(linkUrl, 'Gérer les utilisateurs')}
  `);
}

export function passwordResetByAdminEmail({ userFirstName, tempPassword, linkUrl }) {
  return layout('Mot de passe réinitialisé', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Votre mot de passe DHI Test Tracking a été réinitialisé par un administrateur. Voici votre mot de passe temporaire&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#eff6ff;border-left:3px solid #4f46e5;font-size:16px;font-weight:700;color:#1e3a8a;border-radius:4px;font-family:monospace">
      ${escapeHtml(tempPassword)}
    </blockquote>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Pour votre sécurité, nous vous recommandons de le modifier dès votre prochaine connexion depuis votre profil.
    </p>
    ${button(linkUrl, 'Se connecter')}
  `);
}

export function projectCreatedEmail({ userFirstName, projectName, linkUrl }) {
  return layout('Nouveau projet créé', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Un nouveau projet a été créé sur DHI Test Tracking&nbsp;: <strong>« ${escapeHtml(projectName)} »</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Vous recevez cette notification en tant que chef testeur. Vous pouvez dès à présent créer des campagnes et organiser les tests.
    </p>
    ${button(linkUrl, 'Voir le projet')}
  `);
}

export function campaignCreatedEmail({ userFirstName, campaignName, projectName, campaignLink, roleLabel }) {
  return layout('Nouvelle campagne créée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Une nouvelle campagne <strong>« ${escapeHtml(campaignName)} »</strong> a été créée dans le projet <em>${escapeHtml(projectName)}</em>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Vous êtes membre de cette campagne en tant que <strong>${escapeHtml(roleLabel)}</strong>.
    </p>
    ${button(campaignLink, 'Voir la campagne')}
  `);
}

export function userCreatedEmail({ userFirstName, email, password, linkUrl }) {
  return layout('Votre compte DHI Test Tracking', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Un compte a été créé pour vous sur <strong>DHI Test Tracking</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;color:#334155">
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Email</td><td>${escapeHtml(email)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Mot de passe</td><td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:13px">${escapeHtml(password)}</code></td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Nous vous recommandons de changer votre mot de passe après votre première connexion.
    </p>
    ${button(linkUrl, 'Se connecter')}
  `);
}

export function loginNotificationEmail({ userFirstName, date, time, ip }) {
  return layout('Connexion détectée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(userFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Une connexion a été détectée sur votre compte DHI Test Tracking.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;color:#334155">
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Date</td><td>${escapeHtml(date)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Heure</td><td>${escapeHtml(time)}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">IP</td><td>${escapeHtml(ip) || 'Inconnue'}</td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Si c'était vous, vous pouvez ignorer cet email.<br>
      Sinon, contactez votre administrateur.
    </p>
  `);
}

export function campaignCompletedEmail({ adminFirstName, campaignName, projectName, linkUrl }) {
  return layout('Campagne terminée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${escapeHtml(adminFirstName)}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      La campagne <strong>« ${escapeHtml(campaignName)} »</strong> du projet <em>${escapeHtml(projectName)}</em> vient d'être marquée comme <strong style="color:#16a34a">terminée</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Vous pouvez consulter le rapport de campagne et les statistiques depuis l'application.
    </p>
    ${button(linkUrl, 'Voir la campagne')}
  `);
}
