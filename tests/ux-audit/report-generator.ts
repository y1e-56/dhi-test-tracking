import * as fs from 'fs';
import * as path from 'path';
import { AuditReport } from './audit-runner';

function severityColor(severity: string): string {
  switch (severity) {
    case 'critical': return '#dc2626';
    case 'major': return '#ea580c';
    case 'minor': return '#ca8a04';
    default: return '#6b7280';
  }
}

function severityIcon(severity: string): string {
  switch (severity) {
    case 'critical': return '&#x26A0;&#xFE0F;';
    case 'major': return '&#x26A0;';
    case 'minor': return '&#x2139;';
    default: return '';
  }
}

function scoreColor(score: number): string {
  if (score >= 80) return '#16a34a';
  if (score >= 60) return '#ca8a04';
  if (score >= 40) return '#ea580c';
  return '#dc2626';
}

function calculateScore(report: AuditReport): number {
  const { critical, major, minor } = report.summary;
  const totalPages = report.pages.length;
  if (totalPages === 0) return 0;
  const totalIssues = critical + major + minor;
  const penalty = (critical * 15) + (major * 5) + (minor * 1);
  const score = Math.max(0, 100 - penalty);
  return Math.round(score);
}

export function generateReport(report: AuditReport, outputDir: string) {
  const score = calculateScore(report);
  const pagesHtml = report.pages.map((page) => {
    const issueCount = page.issues.length;
    const criticalCount = page.issues.filter((i) => i.severity === 'critical').length;
    const majorCount = page.issues.filter((i) => i.severity === 'major').length;
    const minorCount = page.issues.filter((i) => i.severity === 'minor').length;

    const issuesHtml = page.issues.length === 0
      ? '<p style="color:#16a34a;font-weight:500;">Aucun problème détecté</p>'
      : page.issues.map((issue) => `
        <tr>
          <td style="color:${severityColor(issue.severity)};font-weight:600;white-space:nowrap;">
            ${severityIcon(issue.severity)} ${issue.severity.toUpperCase()}
          </td>
          <td style="font-weight:500;">${issue.category}</td>
          <td><code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;font-size:12px;">${escapeHtml(issue.element)}</code></td>
          <td>${escapeHtml(issue.description)}</td>
        </tr>
      `).join('');

    const screenshotRelative = page.screenshot ? path.relative(outputDir, page.screenshot) : '';
    const screenshotHtml = screenshotRelative
      ? `<img src="${screenshotRelative}" style="max-width:300px;border-radius:8px;border:1px solid #e5e7eb;cursor:pointer;" onclick="window.open(this.src)" />`
      : '<span style="color:#9ca3af;">Pas de screenshot</span>';

    return `
      <div style="background:white;border-radius:12px;padding:24px;margin-bottom:24px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div>
            <h3 style="font-size:18px;font-weight:600;margin:0;">
              <span style="background:#e0e7ff;color:#3730a3;padding:2px 8px;border-radius:6px;font-size:12px;margin-right:8px;">${page.role}</span>
              ${escapeHtml(page.url)}
            </h3>
            <p style="color:#6b7280;margin:4px 0 0;font-size:14px;">
              ${issueCount} problème(s) — ${criticalCount} critique(s), ${majorCount} majeur(s), ${minorCount} mineur(s)
            </p>
          </div>
          <div>${screenshotHtml}</div>
        </div>
        ${issueCount > 0 ? `
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr style="border-bottom:2px solid #e5e7eb;">
              <th style="text-align:left;padding:8px;">Sévérité</th>
              <th style="text-align:left;padding:8px;">Catégorie</th>
              <th style="text-align:left;padding:8px;">Élément</th>
              <th style="text-align:left;padding:8px;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${issuesHtml}
          </tbody>
        </table>
        ` : ''}
      </div>
    `;
  }).join('');

  const categoryHtml = Object.entries(report.summary.byCategory)
    .sort(([, a], [, b]) => b - a)
    .map(([cat, count]) => `
      <div style="display:flex;justify-content:space-between;padding:8px 12px;background:#f9fafb;border-radius:8px;">
        <span style="font-weight:500;text-transform:capitalize;">${cat}</span>
        <span style="font-weight:600;color:#374151;">${count}</span>
      </div>
    `).join('');

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DHI Test Tracking — Rapport Audit UX</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; color: #1f2937; }
    .container { max-width: 1200px; margin: 0 auto; padding: 32px 24px; }
  </style>
</head>
<body>
  <div class="container">
    <div style="text-align:center;margin-bottom:40px;">
      <h1 style="font-size:28px;font-weight:700;margin-bottom:8px;">Rapport d'Audit UX</h1>
      <p style="color:#6b7280;">DHI Test Tracking — ${new Date(report.timestamp).toLocaleString('fr-FR')}</p>
      <p style="color:#6b7280;font-size:14px;">Base URL: ${report.baseUrl}</p>
    </div>

    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin-bottom:32px;">
      <div style="background:white;border-radius:12px;padding:24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:48px;font-weight:700;color:${scoreColor(score)};">${score}</div>
        <div style="color:#6b7280;font-size:14px;">Score UX / 100</div>
      </div>
      <div style="background:white;border-radius:12px;padding:24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:48px;font-weight:700;color:#1f2937;">${report.summary.totalIssues}</div>
        <div style="color:#6b7280;font-size:14px;">Problèmes totaux</div>
      </div>
      <div style="background:white;border-radius:12px;padding:24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:48px;font-weight:700;color:#dc2626;">${report.summary.critical}</div>
        <div style="color:#6b7280;font-size:14px;">Critiques</div>
      </div>
      <div style="background:white;border-radius:12px;padding:24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:48px;font-weight:700;color:#ea580c;">${report.summary.major}</div>
        <div style="color:#6b7280;font-size:14px;">Majeurs</div>
      </div>
      <div style="background:white;border-radius:12px;padding:24px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
        <div style="font-size:48px;font-weight:700;color:#ca8a04;">${report.summary.minor}</div>
        <div style="color:#6b7280;font-size:14px;">Mineurs</div>
      </div>
    </div>

    ${categoryHtml ? `
    <div style="background:white;border-radius:12px;padding:24px;margin-bottom:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <h2 style="font-size:18px;font-weight:600;margin-bottom:16px;">Par cat&eacute;gorie</h2>
      <div style="display:grid;gap:8px;">
        ${categoryHtml}
      </div>
    </div>
    ` : ''}

    <h2 style="font-size:22px;font-weight:600;margin-bottom:24px;">D&eacute;tail par page</h2>
    ${pagesHtml}
  </div>
</body>
</html>`;

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'ux-audit-report.html'), html);
  fs.writeFileSync(path.join(outputDir, 'ux-audit-data.json'), JSON.stringify(report, null, 2));
  console.log(`Report: ${path.join(outputDir, 'ux-audit-report.html')}`);
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
