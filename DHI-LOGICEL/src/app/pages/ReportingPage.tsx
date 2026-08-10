import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileText, Download, BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Clock, Sparkles, Timer } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { envoyerMessageIA, suggerePriorite } from '../services/aiService';
import { Anomalie, Priorite, StatutAnomalie, StatutFonctionnalite } from '../types';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';

const COLORS_STATUT = ['#EF4444', '#F59E0B', '#10B981', '#94A3B8'];
const COLORS_PRIORITE = ['#DC2626', '#F97316', '#EAB308', '#94A3B8'];

export function ReportingPage() {
  const { t } = useTranslation();
  const { currentUser, users } = useAuth();
  const { campagnes, projets, fonctionnalites, anomalies } = useData();
  const [campagneSelectionnee, setCampagneSelectionnee] = useState<string>('');

  if (!currentUser || (currentUser.role !== 'chef_testeur' && currentUser.role !== 'admin')) {
    return (
      <div className="text-center py-20">
        <BarChart3 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-500">{t('reporting.access_denied')}</p>
      </div>
    );
  }

  const getUserName = (userId?: string): string => {
    if (!userId || userId === 'undefined') return '—';
    const u = users.find(x => x.id === userId);
    return u ? `${u.prenom} ${u.nom}`.trim() : `#${userId}`;
  };

  const getFeatureName = (featureId?: string): string => {
    if (!featureId) return '—';
    const f = fonctionnalites.find(x => x.id === featureId);
    return f ? f.nom : `#${featureId}`;
  };

  const getPrioriteReelle = (a: Anomalie): Priorite => suggerePriorite(a.titre, a.description);

  const statutAnomalieLabel = (s: StatutAnomalie): string =>
    ({
      nouvelle: t('statut.nouvelle'),
      en_cours: t('statut.en_cours'),
      resolution_signalee: t('statut.resolution_signalee'),
      validee: t('statut.validee'),
      cloturee: t('statut.cloturee'),
    })[s] || s;

  const statutFonctionnaliteLabel = (s: StatutFonctionnalite): string =>
    ({
      non_testee: t('reporting.pdf_not_tested'),
      conforme: t('reporting.pdf_compliant'),
      anomalie: t('reporting.pdf_with_anomalies'),
    })[s] || s;

  const statutCampagneLabel = (s: string): string =>
    ({
      en_preparation: t('reporting.pdf_planned'),
      en_cours: t('reporting.pdf_in_progress'),
      terminee: t('reporting.pdf_completed'),
      archive: t('reporting.pdf_archived'),
    })[s] || s;

  const prioriteLabel = (p: Priorite): string =>
    ({
      critique: t('reporting.pdf_critical'),
      haute: t('reporting.pdf_high'),
      moyenne: t('reporting.pdf_medium'),
      basse: t('reporting.pdf_low'),
    })[p] || p;

  interface LigneStat {
    id: string;
    nom: string;
    role: string;
    creees: number;
    enCours: number;
    resolues: number;
    assignees: number;
  }

  const calculerStatsParPersonne = (): LigneStat[] => {
    const ac = anomalies.filter(a => a.campagneId === campagneSelectionnee);
    const personnes = new Map<string, LigneStat>();
    const ajouter = (id: string, role: string) => {
      if (!personnes.has(id)) {
        personnes.set(id, { id, nom: getUserName(id), role, creees: 0, enCours: 0, resolues: 0, assignees: 0 });
      }
    };
    ac.forEach(a => {
      if (a.testeurId) {
        ajouter(a.testeurId, t('reporting.pdf_tester_role'));
        const p = personnes.get(a.testeurId)!;
        p.creees += 1;
        if (a.statut === 'nouvelle' || a.statut === 'en_cours') p.enCours += 1;
        if (a.statut === 'resolution_signalee' || a.statut === 'validee' || a.statut === 'cloturee') p.resolues += 1;
      }
      if (a.developpeurId) {
        ajouter(a.developpeurId, t('reporting.pdf_developer_role'));
        const p = personnes.get(a.developpeurId)!;
        p.assignees += 1;
        if (a.statut === 'resolution_signalee' || a.statut === 'validee' || a.statut === 'cloturee') p.resolues += 1;
      }
    });
    return Array.from(personnes.values());
  };

  const formatDuree = (jours: number): string =>
    `${jours.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} ${t('reporting.days')}`;

  const delaiMoyenResolutionJours = (): number | null => {
    const resolues = anomalies.filter(a => a.campagneId === campagneSelectionnee && a.dateResolution);
    if (resolues.length === 0) return null;
    const totalMs = resolues.reduce((sum, a) => {
      const ms = new Date(a.dateResolution!).getTime() - new Date(a.dateCreation).getTime();
      return sum + (ms > 0 ? ms : 0);
    }, 0);
    return totalMs / resolues.length / (1000 * 60 * 60 * 24);
  };

  const calculerConformiteParTesteur = () => {
    if (!campagne) return [];
    const testeurs = new Set<string>([...(campagne.chefTesteurIds || []), ...(campagne.equipeTesteurs || [])]);
    return Array.from(testeurs).map(id => {
      const features = fonctionnalites.filter(f => f.campagneId === campagneSelectionnee && f.testeurAssigneId === id);
      const conformes = features.filter(f => f.statut === 'conforme').length;
      const avecAnomalies = features.filter(f => f.statut === 'anomalie').length;
      return {
        nom: getUserName(id),
        role: campagne.chefTesteurIds?.includes(id) ? t('reporting.pdf_lead_role') : t('reporting.pdf_tester_role'),
        assignees: features.length,
        conformes,
        avecAnomalies,
        taux: features.length > 0 ? Math.round((conformes / features.length) * 100) : 0,
      };
    }).filter(r => r.assignees > 0);
  };

  const calculerAnomaliesParFonctionnalite = () => {
    const map = new Map<string, { total: number; critiques: number; ouvertes: number }>();
    anomalies.filter(a => a.campagneId === campagneSelectionnee).forEach(a => {
      const fid = a.fonctionnaliteId || 'inconnue';
      const entree = map.get(fid) || { total: 0, critiques: 0, ouvertes: 0 };
      entree.total += 1;
      if (getPrioriteReelle(a) === 'critique') entree.critiques += 1;
      if (a.statut === 'nouvelle' || a.statut === 'en_cours') entree.ouvertes += 1;
      map.set(fid, entree);
    });
    return Array.from(map.entries()).map(([fid, e]) => ({ nom: getFeatureName(fid), ...e }));
  };

  const getEquipeRows = (): { role: string; nom: string; email: string }[] => {
    if (!campagne) return [];
    const rows: { role: string; nom: string; email: string }[] = [];
    (campagne.chefTesteurIds || []).forEach(id => {
      const u = users.find(x => x.id === id);
      rows.push({ role: t('reporting.pdf_lead_role'), nom: getUserName(id), email: u?.email || '—' });
    });
    (campagne.equipeTesteurs || []).forEach(id => {
      if (campagne.chefTesteurIds?.includes(id)) return;
      const u = users.find(x => x.id === id);
      rows.push({ role: t('reporting.pdf_tester_role'), nom: getUserName(id), email: u?.email || '—' });
    });
    (campagne.equipeDeveloppeurs || []).forEach(id => {
      const u = users.find(x => x.id === id);
      rows.push({ role: t('reporting.pdf_developer_role'), nom: getUserName(id), email: u?.email || '—' });
    });
    return rows;
  };

  const genererSynthese = (): string => {
    if (!campagne || !projet || !stats) return '';
    const lignes: string[] = [];
    lignes.push(t('reporting.pdf_syn_campaign', { campagne: campagne.nom, projet: projet.nom }));
    lignes.push(t('reporting.pdf_syn_coverage', { total: stats.totalFonctionnalites, testees: stats.conformes + stats.anomaliesDetectees, taux: tauxAvancement }));
    lignes.push(t('reporting.pdf_syn_compliance', { taux: tauxConformite, conformes: stats.conformes }));
    if (stats.totalAnomalies > 0) {
      lignes.push(t('reporting.pdf_syn_anomalies', { total: stats.totalAnomalies, nouvelles: stats.nouvelles, enCours: stats.enCours, resolues: stats.resolues, cloturees: stats.cloturees }));
      if (stats.critiques > 0) lignes.push(t('reporting.pdf_syn_critical', { n: stats.critiques }));
    } else {
      lignes.push(t('reporting.pdf_syn_no_anomalies'));
    }
    lignes.push('');
    lignes.push(t('reporting.pdf_recommendations'));
    if (stats.nonTestees > 0) lignes.push(`- ${t('reporting.pdf_rec_untested', { n: stats.nonTestees })}`);
    if (stats.nouvelles > 0) lignes.push(`- ${t('reporting.pdf_rec_new', { n: stats.nouvelles })}`);
    if (stats.enCours > 0) lignes.push(`- ${t('reporting.pdf_rec_inprogress', { n: stats.enCours })}`);
    if (stats.critiques > 0) lignes.push(`- ${t('reporting.pdf_rec_critical')}`);
    if (tauxConformite < 50) lignes.push(`- ${t('reporting.pdf_rec_lowcompliance', { taux: tauxConformite })}`);
    else lignes.push(`- ${t('reporting.pdf_rec_goodcompliance', { taux: tauxConformite })}`);
    return lignes.join('\n');
  };

  const handleExportPDF = () => {
    if (!campagne || !stats || !projet) {
      toast.error(t('reporting.select_campaign_error'));
      return;
    }

    try {
      toast.success(t('reporting.generating_pdf'));

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const marge = 15;
      let currentY = 20;

      const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

      const ensureSpace = (needed: number) => {
        if (currentY + needed > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }
      };

      const addHeading = (text: string, size = 14, color: [number, number, number] = [30, 41, 59]) => {
        ensureSpace(28);
        doc.setFontSize(size);
        doc.setTextColor(color[0], color[1], color[2]);
        doc.text(text, marge, currentY);
        currentY += 8;
      };

      const addTable = (head: string[][], body: string[][], theme: 'striped' | 'grid' | 'plain' = 'striped') => {
        autoTable(doc, {
          startY: currentY,
          head,
          body,
          theme,
          headStyles: { fillColor: [79, 70, 229], fontSize: 9 },
          styles: { fontSize: 9, cellPadding: 3 },
          margin: { left: marge, right: marge },
        });
        currentY = (doc as any).lastAutoTable.finalY + 15;
      };

      // ===== Page 1 : en-tête et synthèse chiffrée =====
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text(t('reporting.pdf_report_title'), pageWidth / 2, currentY, { align: 'center' });

      currentY += 9;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(t('reporting.pdf_generated_on', { date: new Date().toLocaleString('fr-FR') }), pageWidth / 2, currentY, { align: 'center' });

      currentY += 15;

      addHeading(t('reporting.pdf_general_info'));
      addTable([[t('reporting.pdf_property'), t('reporting.pdf_value')]], [
        [t('reporting.pdf_campagne'), campagne.nom],
        [t('reporting.pdf_projet'), projet.nom],
        [t('reporting.pdf_start_date'), formatDate(campagne.dateDebut)],
        [t('reporting.pdf_end_date'), formatDate(campagne.dateFin)],
        [t('reporting.pdf_status'), statutCampagneLabel(campagne.statut)],
      ]);

      addHeading(t('reporting.pdf_key_indicators'));
      addTable([[t('reporting.pdf_indicator'), t('reporting.pdf_indicator_value')]], [
        [t('reporting.pdf_progress_rate'), `${tauxAvancement}%`],
        [t('reporting.pdf_compliance_rate'), `${tauxConformite}%`],
        [t('reporting.pdf_total_features'), stats.totalFonctionnalites.toString()],
        [t('reporting.pdf_tested_features'), `${stats.conformes + stats.anomaliesDetectees}`],
        [t('reporting.pdf_total_anomalies'), stats.totalAnomalies.toString()],
        [t('reporting.pdf_avg_resolution_time'), (() => {
          const d = delaiMoyenResolutionJours();
          return d !== null ? formatDuree(d) : t('reporting.pdf_not_applicable');
        })()],
      ]);

      addHeading(t('reporting.pdf_features_distribution'));
      addTable([[t('reporting.pdf_status_header'), t('reporting.pdf_count_header')]], [
        [t('reporting.pdf_not_tested'), stats.nonTestees.toString()],
        [t('reporting.pdf_compliant'), stats.conformes.toString()],
        [t('reporting.pdf_with_anomalies'), stats.anomaliesDetectees.toString()],
      ], 'grid');

      if (stats.totalAnomalies > 0) {
        addHeading(t('reporting.pdf_anomalies_by_status'));
        addTable([[t('reporting.pdf_status_header'), t('reporting.pdf_count_header')]], [
          [t('reporting.pdf_new'), stats.nouvelles.toString()],
          [t('reporting.pdf_in_progress'), stats.enCours.toString()],
          [t('reporting.pdf_resolved'), stats.resolues.toString()],
          [t('reporting.pdf_closed'), stats.cloturees.toString()],
        ], 'grid');

        addHeading(t('reporting.pdf_anomalies_by_priority'));
        addTable([[t('reporting.pdf_status_header'), t('reporting.pdf_count_header')]], [
          [t('reporting.pdf_critical'), stats.critiques.toString()],
          [t('reporting.pdf_high'), stats.hautes.toString()],
          [t('reporting.pdf_medium'), stats.moyennes.toString()],
          [t('reporting.pdf_low'), stats.basses.toString()],
        ], 'grid');
      }

      // ===== Page 2 : synthèse et équipe =====
      doc.addPage();
      currentY = 20;

      addHeading(t('reporting.pdf_synthesis'));
      const lignesSynthese = doc.splitTextToSize(genererSynthese(), pageWidth - 2 * marge);
      doc.setFontSize(10);
      doc.setTextColor(71, 85, 105);
      doc.text(lignesSynthese, marge, currentY);
      currentY += (lignesSynthese.length * 5) + 15;

      addHeading(t('reporting.pdf_team'));
      const equipeRows = getEquipeRows();
      addTable([[t('reporting.pdf_member_role'), t('reporting.pdf_member_name'), t('reporting.pdf_member_email')]],
        equipeRows.length > 0
          ? equipeRows.map(r => [r.role, r.nom, r.email])
          : [[t('reporting.pdf_no_members'), '—', '—']],
      );

      // ===== Page 3 : détails =====
      doc.addPage();
      currentY = 20;

      addHeading(t('reporting.pdf_features_detail'));
      const fonctionnalitesCampagne = fonctionnalites.filter(f => f.campagneId === campagneSelectionnee);
      addTable([[t('reporting.pdf_num'), t('reporting.pdf_feature'), t('reporting.pdf_status_header'), t('reporting.pdf_priority'), t('reporting.pdf_tester'), t('reporting.pdf_created')]],
        fonctionnalitesCampagne.length > 0
          ? fonctionnalitesCampagne.map((f, i) => [
              String(i + 1),
              f.nom,
              statutFonctionnaliteLabel(f.statut),
              prioriteLabel(f.priorite),
              getUserName(f.testeurAssigneId),
              formatDate(f.dateTest),
            ])
          : [[t('reporting.pdf_no_features'), '—', '—', '—', '—', '—']],
      );

      addHeading(t('reporting.pdf_anomalies_detail'));
      const anomaliesCampagne = anomalies.filter(a => a.campagneId === campagneSelectionnee);
      addTable([[t('reporting.pdf_num'), t('reporting.pdf_anomaly_title'), t('reporting.pdf_feature'), t('reporting.pdf_status_header'), t('reporting.pdf_priority'), t('reporting.pdf_tester'), t('reporting.pdf_developer'), t('reporting.pdf_created'), t('reporting.pdf_resolved')]],
        anomaliesCampagne.length > 0
          ? anomaliesCampagne.map((a, i) => [
              String(i + 1),
              a.titre,
              getFeatureName(a.fonctionnaliteId),
              statutAnomalieLabel(a.statut),
              prioriteLabel(getPrioriteReelle(a)),
              getUserName(a.testeurId),
              getUserName(a.developpeurId),
              formatDate(a.dateCreation),
              formatDate(a.dateResolution),
            ])
          : [[t('reporting.no_anomalies'), '—', '—', '—', '—', '—', '—', '—', '—']],
      );

      addHeading(t('reporting.pdf_anomalies_by_feature'));
      const anomaliesParFeature = calculerAnomaliesParFonctionnalite();
      addTable([[t('reporting.pdf_feature'), t('reporting.pdf_total_anomalies'), t('reporting.pdf_critical'), t('reporting.pdf_open')]],
        anomaliesParFeature.length > 0
          ? anomaliesParFeature.map(r => [r.nom, String(r.total), String(r.critiques), String(r.ouvertes)])
          : [[t('reporting.no_anomalies'), '—', '—', '—']],
      );

      addHeading(t('reporting.pdf_compliance_by_tester'));
      const conformiteParTesteur = calculerConformiteParTesteur();
      addTable([[t('reporting.pdf_member_name'), t('reporting.pdf_member_role'), t('reporting.pdf_features_assigned'), t('reporting.pdf_compliant'), t('reporting.pdf_with_anomalies'), t('reporting.pdf_compliance_rate')]],
        conformiteParTesteur.length > 0
          ? conformiteParTesteur.map(r => [r.nom, r.role, String(r.assignees), String(r.conformes), String(r.avecAnomalies), `${r.taux}%`])
          : [[t('reporting.pdf_no_members'), '—', '—', '—', '—', '—']],
      );

      addHeading(t('reporting.pdf_person_stats'));
      const lignesStats = calculerStatsParPersonne();
      addTable([[t('reporting.pdf_member_name'), t('reporting.pdf_member_role'), t('reporting.pdf_anomalies_created'), t('reporting.pdf_anomalies_assigned'), t('reporting.pdf_anomalies_inprogress'), t('reporting.pdf_anomalies_resolved_closed')]],
        lignesStats.length > 0
          ? lignesStats.map(s => [s.nom, s.role, s.creees.toString(), s.assignees.toString(), s.enCours.toString(), s.resolues.toString()])
          : [[t('reporting.no_anomalies'), '—', '—', '—', '—', '—']],
      );

      // Pied de page : numérotation
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(t('reporting.pdf_page_footer', { page: p, total: totalPages }), pageWidth / 2, pageHeight - 8, { align: 'center' });
      }

      const fileName = `Rapport_${campagne.nom.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      toast.success(t('reporting.pdf_success'));
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error(t('reporting.pdf_error'));
    }
  };

  const handleExportExcel = () => {
    if (!campagne || !stats || !projet) {
      toast.error(t('reporting.select_campaign_error'));
      return;
    }

    try {
      toast.success(t('reporting.generating_excel'));

      const workbook = XLSX.utils.book_new();
      const formatDate = (d?: string) => (d ? new Date(d).toLocaleDateString('fr-FR') : '—');

      const appendSheet = (name: string, data: unknown[][], colWidths?: number[]) => {
        const ws = XLSX.utils.aoa_to_sheet(data);
        if (colWidths) ws['!cols'] = colWidths.map(w => ({ wch: w }));
        XLSX.utils.book_append_sheet(workbook, ws, name);
      };

      // 1. Synthèse
      const synthese = genererSynthese();
      appendSheet(t('reporting.excel_summary'), [
        [t('reporting.excel_report_title')],
        [],
        [t('reporting.pdf_campagne'), campagne.nom],
        [t('reporting.pdf_projet'), projet.nom],
        [t('reporting.pdf_start_date'), formatDate(campagne.dateDebut)],
        [t('reporting.pdf_end_date'), formatDate(campagne.dateFin)],
        [t('reporting.pdf_status'), statutCampagneLabel(campagne.statut)],
        [t('reporting.excel_generated_on'), new Date().toLocaleString('fr-FR')],
        [],
        [t('reporting.excel_key_indicators')],
        [t('reporting.pdf_progress_rate'), `${tauxAvancement}%`],
        [t('reporting.pdf_compliance_rate'), `${tauxConformite}%`],
        [t('reporting.pdf_total_features'), stats.totalFonctionnalites],
        [t('reporting.pdf_tested_features'), stats.conformes + stats.anomaliesDetectees],
        [t('reporting.pdf_total_anomalies'), stats.totalAnomalies],
        [t('reporting.pdf_avg_resolution_time'), (() => {
          const d = delaiMoyenResolutionJours();
          return d !== null ? formatDuree(d) : t('reporting.pdf_not_applicable');
        })()],
        [t('reporting.pdf_not_tested'), stats.nonTestees],
        [t('reporting.pdf_compliant'), stats.conformes],
        [t('reporting.pdf_with_anomalies'), stats.anomaliesDetectees],
        [],
        [t('reporting.excel_synthesis')],
        ...synthese.split('\n').map(l => [l]),
      ], [40, 80]);

      // 2. Fonctionnalités
      const fonctionnalitesCampagne = fonctionnalites.filter(f => f.campagneId === campagneSelectionnee);
      appendSheet(t('reporting.excel_features_sheet'), [
        [t('reporting.excel_features_distribution')],
        [],
        [t('reporting.pdf_status_header'), t('reporting.pdf_count_header')],
        [t('reporting.pdf_not_tested'), stats.nonTestees],
        [t('reporting.pdf_compliant'), stats.conformes],
        [t('reporting.pdf_with_anomalies'), stats.anomaliesDetectees],
        [t('reporting.excel_total'), stats.totalFonctionnalites],
        [],
        [t('reporting.pdf_features_detail')],
        [t('reporting.pdf_num'), t('reporting.pdf_feature'), t('reporting.pdf_status_header'), t('reporting.pdf_priority'), t('reporting.pdf_tester'), t('reporting.pdf_created')],
        ...fonctionnalitesCampagne.map((f, i) => [
          i + 1, f.nom, statutFonctionnaliteLabel(f.statut), prioriteLabel(f.priorite), getUserName(f.testeurAssigneId), formatDate(f.dateTest),
        ]),
      ], [6, 45, 20, 14, 22, 16]);

      // 3. Anomalies
      const anomaliesCampagne = anomalies.filter(a => a.campagneId === campagneSelectionnee);
      appendSheet(t('reporting.excel_anomalies_sheet'), [
        [t('reporting.pdf_anomalies_detail')],
        [],
        [t('reporting.pdf_num'), t('reporting.pdf_anomaly_title'), t('reporting.pdf_feature'), t('reporting.pdf_status_header'), t('reporting.pdf_priority'), t('reporting.pdf_tester'), t('reporting.pdf_developer'), t('reporting.pdf_created'), t('reporting.pdf_resolved'), t('reporting.pdf_resolution_comment')],
        ...(anomaliesCampagne.length > 0
          ? anomaliesCampagne.map((a, i) => [
              i + 1,
              a.titre,
              getFeatureName(a.fonctionnaliteId),
              statutAnomalieLabel(a.statut),
              prioriteLabel(getPrioriteReelle(a)),
              getUserName(a.testeurId),
              getUserName(a.developpeurId),
              formatDate(a.dateCreation),
              formatDate(a.dateResolution),
              a.commentaireResolution || '—',
            ])
          : [[t('reporting.excel_no_anomalies')]]),
      ], [6, 40, 40, 20, 14, 20, 20, 16, 16, 50]);

      // 4. Équipe
      appendSheet(t('reporting.excel_team_sheet'), [
        [t('reporting.pdf_team')],
        [],
        [t('reporting.pdf_member_role'), t('reporting.pdf_member_name'), t('reporting.pdf_member_email')],
        ...(getEquipeRows().length > 0
          ? getEquipeRows().map(r => [r.role, r.nom, r.email])
          : [[t('reporting.pdf_no_members'), '—', '—']]),
      ], [20, 30, 40]);

      // 5. Stats par personne
      appendSheet(t('reporting.excel_person_sheet'), [
        [t('reporting.pdf_person_stats')],
        [],
        [t('reporting.pdf_member_name'), t('reporting.pdf_member_role'), t('reporting.pdf_anomalies_created'), t('reporting.pdf_anomalies_assigned'), t('reporting.pdf_anomalies_inprogress'), t('reporting.excel_anomalies_resolved_closed')],
        ...(calculerStatsParPersonne().map(s => [s.nom, s.role, s.creees, s.assignees, s.enCours, s.resolues])),
      ], [30, 20, 20, 20, 16, 16]);

      // 6. Anomalies par fonctionnalité
      appendSheet(t('reporting.excel_by_feature_sheet'), [
        [t('reporting.pdf_anomalies_by_feature')],
        [],
        [t('reporting.pdf_feature'), t('reporting.pdf_total_anomalies'), t('reporting.pdf_critical'), t('reporting.pdf_open')],
        ...(calculerAnomaliesParFonctionnalite().map(r => [r.nom, r.total, r.critiques, r.ouvertes])),
      ], [45, 18, 15, 15]);

      // 7. Conformité par testeur
      appendSheet(t('reporting.excel_compliance_sheet'), [
        [t('reporting.pdf_compliance_by_tester')],
        [],
        [t('reporting.pdf_member_name'), t('reporting.pdf_member_role'), t('reporting.pdf_features_assigned'), t('reporting.pdf_compliant'), t('reporting.pdf_with_anomalies'), t('reporting.pdf_compliance_rate')],
        ...(calculerConformiteParTesteur().map(r => [r.nom, r.role, r.assignees, r.conformes, r.avecAnomalies, `${r.taux}%`])),
      ], [30, 20, 22, 18, 18, 15]);

      const fileName = `Rapport_${campagne.nom.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast.success(t('reporting.excel_success'));
    } catch (error) {
      console.error('Erreur lors de la génération de l\'Excel:', error);
      toast.error(t('reporting.excel_error'));
    }
  };

  const getCampagneStats = (campagneId: string) => {
    const fc = fonctionnalites.filter(f => f.campagneId === campagneId);
    const ac = anomalies.filter(a => a.campagneId === campagneId);
    return {
      totalFonctionnalites: fc.length,
      nonTestees: fc.filter(f => f.statut === 'non_testee').length,
      conformes: fc.filter(f => f.statut === 'conforme').length,
      anomaliesDetectees: fc.filter(f => f.statut === 'anomalie').length,
      totalAnomalies: ac.length,
      nouvelles: ac.filter(a => a.statut === 'nouvelle').length,
      enCours: ac.filter(a => a.statut === 'en_cours').length,
      resolues: ac.filter(a => a.statut === 'resolution_signalee').length,
      cloturees: ac.filter(a => a.statut === 'cloturee' || a.statut === 'validee').length,
      critiques: ac.filter(a => getPrioriteReelle(a) === 'critique').length,
      hautes: ac.filter(a => getPrioriteReelle(a) === 'haute').length,
      moyennes: ac.filter(a => getPrioriteReelle(a) === 'moyenne').length,
      basses: ac.filter(a => getPrioriteReelle(a) === 'basse').length,
    };
  };

  const campagne = campagnes.find(c => c.id === campagneSelectionnee);
  const projet = projets.find(p => p.id === campagne?.projetId);
  const stats = campagneSelectionnee ? getCampagneStats(campagneSelectionnee) : null;

  const tauxAvancement = stats && stats.totalFonctionnalites > 0
    ? Math.round(((stats.conformes + stats.anomaliesDetectees) / stats.totalFonctionnalites) * 100)
    : 0;

  const [rapportDialogOpen, setRapportDialogOpen] = useState(false);
  const [rapportContenu, setRapportContenu] = useState('');

  const handleGenererRapportIA = async () => {
    if (!campagne || !stats) {
      toast.error(t('reporting.select_campaign_error'));
      return;
    }
    try {
      toast.loading(t('reporting.ai_report_generating'));
      const { reply } = await envoyerMessageIA(
        `Génère un rapport IA complet pour la campagne "${campagne.nom}"`,
        campagneSelectionnee
      );
      toast.dismiss();
      setRapportContenu(reply);
      setRapportDialogOpen(true);
    } catch {
      toast.dismiss();
      toast.error(t('reporting.ai_report_error'));
    }
  };

  const tauxConformite = stats && stats.totalFonctionnalites > 0
    ? Math.round((stats.conformes / stats.totalFonctionnalites) * 100)
    : 0;

  const chartFonctionnalites = stats ? [
    { name: t('reporting.pdf_not_tested'), value: stats.nonTestees },
    { name: t('reporting.pdf_compliant'), value: stats.conformes },
    { name: t('reporting.pdf_with_anomalies'), value: stats.anomaliesDetectees },
  ] : [];

  const chartAnomaliesStatut = stats ? [
    { name: t('reporting.pdf_new'), value: stats.nouvelles },
    { name: t('reporting.pdf_in_progress'), value: stats.enCours },
    { name: t('reporting.pdf_resolved'), value: stats.resolues },
    { name: t('reporting.pdf_closed'), value: stats.cloturees },
  ].filter(d => d.value > 0) : [];

  const chartAnomaliesPriorite = stats ? [
    { name: t('reporting.pdf_critical'), value: stats.critiques },
    { name: t('reporting.pdf_high'), value: stats.hautes },
    { name: t('reporting.pdf_medium'), value: stats.moyennes },
    { name: t('reporting.pdf_low'), value: stats.basses },
  ].filter(d => d.value > 0) : [];

  const chartBarFoncts = stats ? [
    { cat: t('reporting.pdf_not_tested'), total: stats.nonTestees },
    { cat: t('reporting.pdf_compliant'), total: stats.conformes },
    { cat: t('reporting.pdf_with_anomalies'), total: stats.anomaliesDetectees },
  ] : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{t('reporting.title')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{t('reporting.subtitle')}</p>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-5 pb-5">
          <label className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 block">
            {t('reporting.select_label')}
          </label>
          <Select value={campagneSelectionnee || undefined} onValueChange={setCampagneSelectionnee} onClear={() => setCampagneSelectionnee('')}>
            <SelectTrigger className="w-full max-w-lg bg-white border-slate-200">
              <SelectValue placeholder={t('reporting.select_placeholder')} />
            </SelectTrigger>
            <SelectContent>
              {campagnes.map(c => {
                const p = projets.find(proj => proj.id === c.projetId);
                return (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{c.nom}</span>
                      <span className="text-slate-400 text-xs">— {p?.nom}</span>
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {!campagneSelectionnee && (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <BarChart3 className="w-7 h-7 text-indigo-400" />
          </div>
          <p className="font-semibold text-slate-700">{t('reporting.no_campaign_title')}</p>
          <p className="text-sm text-slate-400 mt-1">{t('reporting.no_campaign_desc')}</p>
        </div>
      )}

      {campagneSelectionnee && stats && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">{t('reporting.pdf_general_info')}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('reporting.pdf_campagne')}</p>
                    <p className="font-semibold text-slate-800 text-sm">{campagne?.nom}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('reporting.pdf_projet')}</p>
                    <p className="font-semibold text-slate-800 text-sm">{projet?.nom}</p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('reporting.pdf_start_date')}</p>
                    <p className="font-semibold text-slate-800 text-sm font-mono">
                      {campagne && new Date(campagne.dateDebut).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('reporting.pdf_end_date')}</p>
                    <p className="font-semibold text-slate-800 text-sm font-mono">
                      {campagne && new Date(campagne.dateFin).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{t('reporting.pdf_status')}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <div className={`w-2 h-2 rounded-full ${campagne?.statut === 'en_cours' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {campagne?.statut.replace('_', ' ')}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">{t('reporting.pdf_key_indicators')}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-indigo-500" />
                      <p className="text-sm font-semibold text-slate-700">{t('reporting.pdf_progress_rate')}</p>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{tauxAvancement}%</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-2 rounded-full transition-all" style={{ width: `${tauxAvancement}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    {stats.conformes + stats.anomaliesDetectees} / {stats.totalFonctionnalites} {t('reporting.features_tested')}
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <p className="text-sm font-semibold text-slate-700">{t('reporting.pdf_compliance_rate')}</p>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">{tauxConformite}%</p>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div className="bg-gradient-to-r from-emerald-500 to-emerald-400 h-2 rounded-full transition-all" style={{ width: `${tauxConformite}%` }} />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 font-mono">
                    {stats.conformes} {t('reporting.features_compliant')}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-3">
                    <Clock className="w-4 h-4 text-slate-400" />
                    <div>
                      <div className="text-lg font-bold text-slate-800">{stats.nonTestees}</div>
                      <div className="text-[10px] text-slate-400">{t('reporting.pdf_not_tested')}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 bg-red-50 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="text-lg font-bold text-red-700">{stats.totalAnomalies}</div>
                      <div className="text-[10px] text-red-400">{t('common.anomalies')}</div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-indigo-50 rounded-lg p-3">
                  <Timer className="w-4 h-4 text-indigo-500" />
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-indigo-400">{t('reporting.avg_resolution_time')}</div>
                    <div className="text-lg font-bold text-indigo-700">
                      {(() => {
                        const d = delaiMoyenResolutionJours();
                        return d !== null ? formatDuree(d) : '—';
                      })()}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">{t('reporting.features_by_status')}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={chartBarFoncts} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="cat" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                      labelStyle={{ fontWeight: 600, color: '#0F172A' }}
                    />
                    <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                      {chartBarFoncts.map((entry, index) => (
                        <Cell key={`bar-cell-${entry.cat}`} fill={['#94A3B8', '#10B981', '#EF4444'][index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">{t('reporting.anomalies_by_priority')}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                {chartAnomaliesPriorite.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartAnomaliesPriorite}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {chartAnomaliesPriorite.map((entry, index) => (
                          <Cell key={`pie-cell-${entry.name}`} fill={COLORS_PRIORITE[index % COLORS_PRIORITE.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[200px] flex items-center justify-center">
                    <p className="text-sm text-slate-400">{t('common.no_anomalies')}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {stats.totalAnomalies > 0 && (
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 pt-5 px-5">
                <CardTitle className="text-sm font-bold text-slate-800">{t('reporting.anomalies_by_status_title')}</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { labelKey: 'statut.nouvelle', value: stats.nouvelles, color: 'bg-red-50 border-red-100', num: 'text-red-600' },
                    { labelKey: 'statut.en_cours', value: stats.enCours, color: 'bg-amber-50 border-amber-100', num: 'text-amber-600' },
                    { labelKey: 'statut.resolution_signalee', value: stats.resolues, color: 'bg-emerald-50 border-emerald-100', num: 'text-emerald-600' },
                    { labelKey: 'statut.cloturee', value: stats.cloturees, color: 'bg-slate-50 border-slate-100', num: 'text-slate-600' },
                  ].map(item => (
                    <div key={item.labelKey} className={`border rounded-xl p-4 text-center ${item.color}`}>
                      <div className={`text-2xl font-bold ${item.num}`}>{item.value}</div>
                      <div className="text-xs text-slate-500 mt-1 font-semibold">{t(item.labelKey)}</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3 pt-5 px-5">
              <CardTitle className="text-sm font-bold text-slate-800">{t('reporting.export_title')}</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-5">
              <p className="text-sm text-slate-500 mb-4">
                {t('reporting.export_desc', { name: campagne?.nom })}
              </p>
              <div className="flex flex-wrap gap-3">
                  <Button onClick={handleExportPDF} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                    <FileText className="w-4 h-4" />
                    {t('reporting.export_pdf')}
                  </Button>
                  <Button onClick={handleExportExcel} variant="outline" className="gap-2 border-slate-200 hover:border-indigo-300">
                    <Download className="w-4 h-4" />
                    {t('reporting.export_excel')}
                  </Button>
                  <Button onClick={handleGenererRapportIA} variant="outline" className="gap-2 border-purple-200 hover:border-purple-400 hover:bg-purple-50 text-purple-700">
                    <Sparkles className="w-4 h-4" />
                    {t('reporting.export_ai')}
                  </Button>
              </div>
            </CardContent>
          </Card>

          {/* Dialogue Rapport IA */}
          <Dialog open={rapportDialogOpen} onOpenChange={setRapportDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  {t('reporting.ai_report_title', { name: campagne?.nom })}
                </DialogTitle>
                <DialogDescription>
                  {t('reporting.ai_report_desc')}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="h-96 rounded-lg border border-slate-100 bg-slate-50 p-4">
                <pre className="text-sm font-mono text-slate-700 whitespace-pre-wrap">{rapportContenu}</pre>
              </ScrollArea>
              <div className="flex justify-end">
                <DialogClose asChild>
                  <Button variant="outline" className="border-slate-200">{t('reporting.close')}</Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  );
}
