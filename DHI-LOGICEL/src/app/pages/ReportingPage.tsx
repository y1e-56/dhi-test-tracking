import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { FileText, Download, BarChart3, TrendingUp, CheckCircle2, AlertTriangle, Clock, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { envoyerMessageIA } from '../services/aiService';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose
} from '../components/ui/dialog';
import { ScrollArea } from '../components/ui/scroll-area';

const COLORS_STATUT = ['#EF4444', '#F59E0B', '#10B981', '#94A3B8'];
const COLORS_PRIORITE = ['#DC2626', '#F97316', '#EAB308', '#94A3B8'];

export function ReportingPage() {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
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

  const handleExportPDF = () => {
    if (!campagne || !stats || !projet) {
      toast.error(t('reporting.select_campaign_error'));
      return;
    }

    try {
      toast.success(t('reporting.generating_pdf'));

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      let currentY = 20;

      // En-tête
      doc.setFontSize(20);
      doc.text(t('reporting.pdf_report_title'), pageWidth / 2, currentY, { align: 'center' });

      currentY += 10;
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(t('reporting.pdf_generated_on', { date: new Date().toLocaleString('fr-FR') }), pageWidth / 2, currentY, { align: 'center' });

      currentY += 15;
      doc.setFontSize(14);
      doc.setTextColor(0);
      doc.text(t('reporting.pdf_general_info'), 15, currentY);

      currentY += 8;
      autoTable(doc, {
        startY: currentY,
        head: [[t('reporting.pdf_property'), t('reporting.pdf_value')]],
        body: [
          [t('reporting.pdf_campagne'), campagne.nom],
          [t('reporting.pdf_projet'), projet.nom],
          [t('reporting.pdf_start_date'), new Date(campagne.dateDebut).toLocaleDateString('fr-FR')],
          [t('reporting.pdf_end_date'), new Date(campagne.dateFin).toLocaleDateString('fr-FR')],
          [t('reporting.pdf_status'), campagne.statut.replace('_', ' ')],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.text(t('reporting.pdf_key_indicators'), 15, currentY);

      currentY += 8;
      autoTable(doc, {
        startY: currentY,
        head: [[t('reporting.pdf_indicator'), t('reporting.pdf_indicator_value')]],
        body: [
          [t('reporting.pdf_progress_rate'), `${tauxAvancement}%`],
          [t('reporting.pdf_compliance_rate'), `${tauxConformite}%`],
          [t('reporting.pdf_total_features'), stats.totalFonctionnalites.toString()],
          [t('reporting.pdf_tested_features'), `${stats.conformes + stats.anomaliesDetectees}`],
          [t('reporting.pdf_total_anomalies'), stats.totalAnomalies.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      doc.setFontSize(14);
      doc.text(t('reporting.pdf_features_distribution'), 15, currentY);

      currentY += 8;
      autoTable(doc, {
        startY: currentY,
        head: [[t('reporting.pdf_status_header'), t('reporting.pdf_count_header')]],
        body: [
          [t('reporting.pdf_not_tested'), stats.nonTestees.toString()],
          [t('reporting.pdf_compliant'), stats.conformes.toString()],
          [t('reporting.pdf_with_anomalies'), stats.anomaliesDetectees.toString()],
        ],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;

      if (stats.totalAnomalies > 0) {
        doc.setFontSize(14);
        doc.text(t('reporting.pdf_anomalies_by_status'), 15, currentY);

        currentY += 8;
        autoTable(doc, {
          startY: currentY,
          head: [[t('reporting.pdf_status_header'), t('reporting.pdf_count_header')]],
          body: [
            [t('reporting.pdf_new'), stats.nouvelles.toString()],
            [t('reporting.pdf_in_progress'), stats.enCours.toString()],
            [t('reporting.pdf_resolved'), stats.resolues.toString()],
            [t('reporting.pdf_closed'), stats.cloturees.toString()],
          ],
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
        });

        currentY = (doc as any).lastAutoTable.finalY + 15;

        doc.setFontSize(14);
        doc.text(t('reporting.pdf_anomalies_by_priority'), 15, currentY);

        currentY += 8;
        autoTable(doc, {
          startY: currentY,
          head: [[t('reporting.pdf_status_header'), t('reporting.pdf_count_header')]],
          body: [
            [t('reporting.pdf_critical'), stats.critiques.toString()],
            [t('reporting.pdf_high'), stats.hautes.toString()],
            [t('reporting.pdf_medium'), stats.moyennes.toString()],
            [t('reporting.pdf_low'), stats.basses.toString()],
          ],
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] },
        });
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

      // Créer un nouveau classeur
      const workbook = XLSX.utils.book_new();

      const infoData = [
        [t('reporting.excel_report_title')],
        [],
        ['Campagne', campagne.nom],
        ['Projet', projet.nom],
        [t('reporting.pdf_start_date'), new Date(campagne.dateDebut).toLocaleDateString('fr-FR')],
        [t('reporting.pdf_end_date'), new Date(campagne.dateFin).toLocaleDateString('fr-FR')],
        [t('reporting.pdf_status'), campagne.statut.replace('_', ' ')],
        [t('reporting.excel_generated_on'), new Date().toLocaleString('fr-FR')],
        [],
        [t('reporting.excel_key_indicators')],
        [t('reporting.pdf_progress_rate'), `${tauxAvancement}%`],
        [t('reporting.pdf_compliance_rate'), `${tauxConformite}%`],
        [t('reporting.pdf_total_features'), stats.totalFonctionnalites],
        [t('reporting.pdf_tested_features'), stats.conformes + stats.anomaliesDetectees],
        [t('reporting.pdf_total_anomalies'), stats.totalAnomalies],
      ];
      const wsInfo = XLSX.utils.aoa_to_sheet(infoData);
      XLSX.utils.book_append_sheet(workbook, wsInfo, t('reporting.excel_summary'));

      const fonctData = [
        [t('reporting.excel_features_distribution')],
        [],
        [t('reporting.pdf_status_header'), t('reporting.pdf_count_header')],
        [t('reporting.pdf_not_tested'), stats.nonTestees],
        [t('reporting.pdf_compliant'), stats.conformes],
        [t('reporting.pdf_with_anomalies'), stats.anomaliesDetectees],
        [],
        [t('reporting.excel_total'), stats.totalFonctionnalites],
      ];
      const wsFonct = XLSX.utils.aoa_to_sheet(fonctData);
      XLSX.utils.book_append_sheet(workbook, wsFonct, t('reporting.excel_features_sheet'));

      if (stats.totalAnomalies > 0) {
        const anomaliesData = [
          [t('reporting.excel_anomalies_by_status')],
          [],
          [t('reporting.pdf_status_header'), t('reporting.pdf_count_header')],
          [t('reporting.pdf_new'), stats.nouvelles],
          [t('reporting.pdf_in_progress'), stats.enCours],
          [t('reporting.pdf_resolved'), stats.resolues],
          [t('reporting.pdf_closed'), stats.cloturees],
          [],
          [t('reporting.excel_anomalies_by_priority')],
          [],
          [t('reporting.excel_priority'), t('reporting.pdf_count_header')],
          [t('reporting.pdf_critical'), stats.critiques],
          [t('reporting.pdf_high'), stats.hautes],
          [t('reporting.pdf_medium'), stats.moyennes],
          [t('reporting.pdf_low'), stats.basses],
          [],
          [t('reporting.excel_total'), stats.totalAnomalies],
        ];
        const wsAnomalies = XLSX.utils.aoa_to_sheet(anomaliesData);
        XLSX.utils.book_append_sheet(workbook, wsAnomalies, t('reporting.excel_anomalies_sheet'));
      }

      // Feuille 4: Détail des anomalies
      const anomaliesCampagne = anomalies.filter(a => a.campagneId === campagneSelectionnee);
      if (anomaliesCampagne.length > 0) {
        const detailData = [
          [t('reporting.excel_column_title'), t('reporting.excel_column_status'), t('reporting.excel_column_priority'), t('reporting.excel_column_creation_date'), t('reporting.excel_column_tester'), t('reporting.excel_column_developer')],
        ];
        anomaliesCampagne.forEach(a => {
          detailData.push([
            a.titre,
            a.statut,
            a.priorite,
            new Date(a.dateCreation).toLocaleDateString('fr-FR'),
            a.testeurId,
            a.developpeurId,
          ]);
        });
        const wsDetail = XLSX.utils.aoa_to_sheet(detailData);
        XLSX.utils.book_append_sheet(workbook, wsDetail, t('reporting.excel_detail_sheet'));
      }

      // Télécharger le fichier Excel
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
      critiques: ac.filter(a => a.priorite === 'critique').length,
      hautes: ac.filter(a => a.priorite === 'haute').length,
      moyennes: ac.filter(a => a.priorite === 'moyenne').length,
      basses: ac.filter(a => a.priorite === 'basse').length,
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
          <Select value={campagneSelectionnee || undefined} onValueChange={setCampagneSelectionnee}>
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
