function layout(title, body) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
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
    <a href="${link}" style="color:#fff;text-decoration:none;font-weight:600;font-size:14px;display:block">${label}</a>
  </td></tr></table>`;
}

export function taskAssignedEmail({ userFirstName, featureName, campaignName, linkUrl }) {
  return layout('Nouvelle tâche assignée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      La fonctionnalité <strong>« ${featureName} »</strong> (campagne <em>${campaignName}</em>) vous a été assignée.
    </p>
    ${button(linkUrl, 'Voir mes tâches')}
  `);
}

export function anomalyAssignedEmail({ userFirstName, anomalyDescription, featureName, linkUrl }) {
  return layout('Anomalie assignée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 8px;font-size:15px;color:#334155;line-height:1.5">
      Une anomalie vous a été assignée sur la fonctionnalité <strong>« ${featureName} »</strong>&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;font-size:14px;color:#7f1d1d;border-radius:4px">
      ${anomalyDescription}
    </blockquote>
    ${button(linkUrl, 'Voir mes anomalies')}
  `);
}

export function resolutionSignaledEmail({ userFirstName, anomalyDescription, devName, linkUrl }) {
  return layout('Résolution signalée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      <strong>${devName}</strong> a signalé une résolution pour l'anomalie&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#f0fdf4;border-left:3px solid #22c55e;font-size:14px;color:#166534;border-radius:4px">
      ${anomalyDescription}
    </blockquote>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Connectez-vous pour valider ou rejeter cette résolution.
    </p>
    ${button(linkUrl, 'Voir l\'anomalie')}
  `);
}

export function anomalyRejectedEmail({ userFirstName, anomalyDescription, testerName, linkUrl }) {
  return layout('Résolution rejetée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      <strong>${testerName}</strong> a rejeté la résolution de l'anomalie&nbsp;:
    </p>
    <blockquote style="margin:0 0 16px;padding:12px 16px;background:#fef2f2;border-left:3px solid #ef4444;font-size:14px;color:#7f1d1d;border-radius:4px">
      ${anomalyDescription}
    </blockquote>
    ${button(linkUrl, 'Voir l\'anomalie')}
  `);
}

export function featureConformeEmail({ userFirstName, featureName, campaignName, linkUrl }) {
  return layout('Fonctionnalité conforme', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      La fonctionnalité <strong>« ${featureName} »</strong> (campagne <em>${campaignName}</em>) a été marquée comme conforme.
    </p>
    ${button(linkUrl, 'Voir la campagne')}
  `);
}

export function projectCreatedEmail({ userFirstName, projectName, linkUrl }) {
  return layout('Nouveau projet créé', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Un nouveau projet a été créé sur DHI Test Tracking&nbsp;: <strong>« ${projectName} »</strong>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Vous recevez cette notification en tant que chef testeur. Vous pouvez dès à présent créer des campagnes et organiser les tests.
    </p>
    ${button(linkUrl, 'Voir le projet')}
  `);
}

export function campaignCreatedEmail({ userFirstName, campaignName, projectName, campaignLink, roleLabel }) {
  return layout('Nouvelle campagne créée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Une nouvelle campagne <strong>« ${campaignName} »</strong> a été créée dans le projet <em>${projectName}</em>.
    </p>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Vous êtes membre de cette campagne en tant que <strong>${roleLabel}</strong>.
    </p>
    ${button(campaignLink, 'Voir la campagne')}
  `);
}

export function userCreatedEmail({ userFirstName, email, password, linkUrl }) {
  return layout('Votre compte DHI Test Tracking', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Un compte a été créé pour vous sur <strong>DHI Test Tracking</strong>.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;color:#334155">
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Email</td><td>${email}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Mot de passe</td><td><code style="background:#f1f5f9;padding:2px 8px;border-radius:4px;font-size:13px">${password}</code></td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Nous vous recommandons de changer votre mot de passe après votre première connexion.
    </p>
    ${button(linkUrl, 'Se connecter')}
  `);
}

export function loginNotificationEmail({ userFirstName, date, time, ip }) {
  return layout('Connexion détectée', `
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">Bonjour <strong>${userFirstName}</strong>,</p>
    <p style="margin:0 0 16px;font-size:15px;color:#334155;line-height:1.5">
      Une connexion a été détectée sur votre compte DHI Test Tracking.
    </p>
    <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;font-size:14px;color:#334155">
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Date</td><td>${date}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">Heure</td><td>${time}</td></tr>
      <tr><td style="padding:4px 16px 4px 0;font-weight:600;color:#64748b">IP</td><td>${ip || 'Inconnue'}</td></tr>
    </table>
    <p style="margin:0 0 16px;font-size:14px;color:#64748b;line-height:1.5">
      Si c'était vous, vous pouvez ignorer cet email.<br>
      Sinon, contactez votre administrateur.
    </p>
  `);
}
