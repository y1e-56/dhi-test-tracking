import { Anomalie, Campagne, Projet, TestCase, Produit } from '../types';

export type FormatRapport = 'pdf' | 'csv';
export type TypeRapport = 'couverture' | 'anomalies' | 'qualite' | 'go_nogo' | 'projet' | 'produit';

interface RapportConfig {
  type: TypeRapport;
  format: FormatRapport;
  titre: string;
  sousTitre?: string;
  projetId?: string;
  campagneId?: string;
  produitId?: string;
  dateDebut?: string;
  dateFin?: string;
}

function genererCSV(headers: string[], rows: string[][]): string {
  const escape = (v: string) => v.includes(',') || v.includes('"') ? `"${v.replace(/"/g, '""')}"` : v;
  return [headers.join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

function telechargerCSV(content: string, filename: string): void {
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function telechargerHTML(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

export const rapportService = {
  genererRapport(config: RapportConfig, data: { anomalies: Anomalie[]; campagnes: Campagne[]; projets: Projet[]; testCases: TestCase[]; produits: Produit[] }): void {
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `rapport_${config.type}_${dateStr}.${config.format}`;

    if (config.format === 'csv') {
      this.genererCSV_Rapport(config, data, filename);
    } else {
      this.genererPDF_Rapport(config, data, filename);
    }
  },

  genererCSV_Rapport(config: RapportConfig, data: { anomalies: Anomalie[]; campagnes: Campagne[]; projets: Projet[]; testCases: TestCase[] }, filename: string): void {
    let csv = '';
    if (config.type === 'anomalies') {
      csv = genererCSV(
        ['ID', 'Titre', 'Priorité', 'Statut', 'Date création', 'Date résolution'],
        data.anomalies.map((a) => [a.id, a.titre, a.priorite, a.statut, a.dateCreation, a.dateResolution || ''])
      );
    } else if (config.type === 'projet') {
      csv = genererCSV(
        ['ID', 'Nom', 'Description', 'Statut', 'Date début', 'Date fin'],
        data.projets.map((p) => [p.id, p.nom, p.description, p.statut, p.dateDebut, p.dateFin])
      );
    } else if (config.type === 'qualite') {
      csv = genererCSV(
        ['ID', 'Nom', 'Statut', 'Priorité'],
        data.testCases.map((tc) => [tc.id, tc.nom, tc.status || '', tc.priority || ''])
      );
    }
    telechargerCSV(csv, filename);
  },

  genererPDF_Rapport(config: RapportConfig, data: { anomalies: Anomalie[]; campagnes: Campagne[]; projets: Projet[]; testCases: TestCase[]; produits: Produit[] }, filename: string): void {
    const titre = config.titre || `Rapport ${config.type}`;
    const dateStr = new Date().toLocaleDateString('fr-FR');

    let bodyHTML = '';
    if (config.type === 'anomalies') {
      bodyHTML = `<h2>Anomalies (${data.anomalies.length})</h2>
        <table><thead><tr><th>Titre</th><th>Priorité</th><th>Statut</th><th>Date</th></tr></thead><tbody>
        ${data.anomalies.map((a) => `<tr><td>${a.titre}</td><td>${a.priorite}</td><td>${a.statut}</td><td>${a.dateCreation.slice(0, 10)}</td></tr>`).join('')}
        </tbody></table>`;
    } else if (config.type === 'projet') {
      bodyHTML = `<h2>Projets (${data.projets.length})</h2>
        <table><thead><tr><th>Nom</th><th>Statut</th><th>Début</th><th>Fin</th></tr></thead><tbody>
        ${data.projets.map((p) => `<tr><td>${p.nom}</td><td>${p.statut}</td><td>${p.dateDebut}</td><td>${p.dateFin}</td></tr>`).join('')}
        </tbody></table>`;
    } else {
      bodyHTML = `<p>Contenu du rapport ${config.type}</p>`;
    }

    const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><title>${titre}</title>
<style>body{font-family:sans-serif;margin:40px}h1{color:#1e293b;border-bottom:2px solid #6366f1;padding-bottom:8px}table{width:100%;border-collapse:collapse;margin-top:16px}th,td{border:1px solid #e2e8f0;padding:8px 12px;text-align:left}th{background:#f8fafc;font-weight:600}tr:nth-child(even){background:#f8fafc}.header{display:flex;justify-content:space-between;align-items:center}.meta{color:#64748b;font-size:14px}</style></head>
<body><div class="header"><h1>${titre}</h1><div class="meta">${dateStr}${config.sousTitre ? ' — ' + config.sousTitre : ''}</div></div>
${bodyHTML}
<footer style="margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px">Rapport généré le ${dateStr} — DHI Test Tracking</footer>
</body></html>`;

    telechargerHTML(html, filename);
  },
};
