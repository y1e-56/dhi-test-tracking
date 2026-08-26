import { Anomalie } from '../types';

const DETTE_KEY = 'dhi_dette_qualite';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
function uid(): string { return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }

export interface DetteQualite {
  id: string;
  anomalieId: string;
  campagneId: string;
  projetId: string;
  module: string;
  priorite: string;
  statutAnomalie: string;
  dateCreation: string;
  dateLimiteCorrection?: string;
  joursRetention: number;
  impact: 'faible' | 'moyen' | 'eleve' | 'critique';
  description: string;
}

export interface ResumeDette {
  total: number;
  parImpact: { faible: number; moyen: number; eleve: number; critique: number };
  parModule: { module: number; count: number }[];
  ancienneteMoyenne: number;
  detteCritique: number;
}

export const detteQualiteService = {
  calculerDette(anomalies: Anomalie[], campagneId: string): DetteQualite[] {
    const now = Date.now();
    return anomalies
      .filter((a) => a.campagneId === campagneId && a.statut !== 'cloturee' && a.statut !== 'validee')
      .map((a) => {
        const jours = Math.floor((now - new Date(a.dateCreation).getTime()) / 86400000);
        const impact = a.priorite === 'critique' ? 'critique' : a.priorite === 'haute' ? 'eleve' : a.priorite === 'moyenne' ? 'moyen' : 'faible';
        return {
          id: uid(), anomalieId: a.id, campagneId: a.campagneId, projetId: '',
          module: '', priorite: a.priorite, statutAnomalie: a.statut,
          dateCreation: a.dateCreation, dateLimiteCorrection: a.dateLimiteCorrection,
          joursRetention: jours, impact, description: a.description,
        };
      });
  },

  calculerResume(dettes: DetteQualite[]): ResumeDette {
    const parImpact = { faible: 0, moyen: 0, eleve: 0, critique: 0 };
    const moduleMap = new Map<string, number>();
    let totalJours = 0;
    dettes.forEach((d) => {
      parImpact[d.impact as keyof typeof parImpact]++;
      moduleMap.set(d.module || 'Inconnu', (moduleMap.get(d.module || 'Inconnu') || 0) + 1);
      totalJours += d.joursRetention;
    });
    return {
      total: dettes.length,
      parImpact,
      parModule: Array.from(moduleMap.entries()).map(([module, count]) => ({ module, count })).sort((a, b) => b.count - a.count),
      ancienneteMoyenne: dettes.length > 0 ? Math.round(totalJours / dettes.length) : 0,
      detteCritique: parImpact.critique + parImpact.eleve,
    };
  },

  sauvegarderDette(dette: DetteQualite): void {
    const all = load<DetteQualite>(DETTE_KEY);
    const idx = all.findIndex((d) => d.anomalieId === dette.anomalieId);
    if (idx !== -1) { all[idx] = dette; } else { all.push(dette); }
    save(DETTE_KEY, all);
  },

  listDettes(): DetteQualite[] { return load<DetteQualite>(DETTE_KEY); },
};
