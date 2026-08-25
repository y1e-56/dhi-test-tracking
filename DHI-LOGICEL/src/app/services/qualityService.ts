import { CritereQualite, ScoreQualite, PointCritique, HistoriqueQualite, SanteQualite } from '../types';

const STORAGE_PREFIX = 'dhi_';

function load<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save<T>(key: string, data: T[]) {
  localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 8);
}

const DEFAULT_CRITERES: Omit<CritereQualite, 'id' | 'produitId' | 'dateCreation'>[] = [
  { nom: 'Fonctionnel', description: 'Conformité fonctionnelle et respect des exigences', poids: 30, estBloquant: true },
  { nom: 'Sécurité', description: 'Protection des données, authentification, autorisation', poids: 20, estBloquant: true },
  { nom: 'Performance', description: 'Temps de réponse, débit, charge', poids: 15, estBloquant: false },
  { nom: 'Fiabilité', description: 'Stabilité, tolérance aux pannes, récupération', poids: 15, estBloquant: false },
  { nom: 'Maintenabilité', description: 'Qualité du code, documentation, évolutivité', poids: 10, estBloquant: false },
  { nom: 'Documentation', description: 'Documentation utilisateur et technique', poids: 5, estBloquant: false },
  { nom: 'Testabilité', description: 'Facilité de test, automatisation, reproductibilité', poids: 5, estBloquant: false },
];

function calculerSante(score: number): SanteQualite {
  if (score >= 80) return 'sain';
  if (score >= 60) return 'a_surveiller';
  if (score >= 40) return 'a_risque';
  return 'critique';
}

function calculerScore(criteres: CritereQualite[], produitId: string): ScoreQualite {
  const data = load<{ produitId: string; score: number; detail: ScoreQualite['detail'] }>('quality_scores_local');
  const existing = data.find((d) => d.produitId === produitId);

  const score = existing?.score ?? 75;
  const detail = existing?.detail ?? {
    resultatsTests: 80,
    couverture: 70,
    couvertureCritiques: 85,
    incidents: 75,
    nonFonctionnel: 70,
    testabilite: 65,
    controlesQualite: 80,
  };

  return {
    id: uid(),
    produitId,
    score,
    sante: calculerSante(score),
    detail,
    dateCalcul: new Date().toISOString(),
  };
}

export const qualityService = {
  getCriteres(produitId: string): CritereQualite[] {
    const all = load<CritereQualite>('quality_criteres');
    const result = all.filter((c) => c.produitId === produitId);
    if (result.length === 0) {
      const defaults = DEFAULT_CRITERES.map((c) => ({
        ...c,
        id: uid(),
        produitId,
        dateCreation: new Date().toISOString(),
      }));
      const updated = [...all, ...defaults];
      save('quality_criteres', updated);
      return defaults;
    }
    return result;
  },

  createCritere(produitId: string, data: { nom: string; description: string; poids: number; estBloquant: boolean }): CritereQualite {
    const all = load<CritereQualite>('quality_criteres');
    const critere: CritereQualite = {
      id: uid(),
      produitId,
      ...data,
      dateCreation: new Date().toISOString(),
    };
    all.push(critere);
    save('quality_criteres', all);
    return critere;
  },

  updateCritere(produitId: string, critereId: string, data: Partial<Pick<CritereQualite, 'nom' | 'description' | 'poids' | 'estBloquant'>>): CritereQualite | null {
    const all = load<CritereQualite>('quality_criteres');
    const idx = all.findIndex((c) => c.id === critereId && c.produitId === produitId);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    save('quality_criteres', all);
    return all[idx];
  },

  deleteCritere(produitId: string, critereId: string): boolean {
    const all = load<CritereQualite>('quality_criteres');
    const filtered = all.filter((c) => !(c.id === critereId && c.produitId === produitId));
    if (filtered.length === all.length) return false;
    save('quality_criteres', filtered);
    return true;
  },

  getScore(produitId: string): ScoreQualite {
    const criteres = this.getCriteres(produitId);
    return calculerScore(criteres, produitId);
  },

  updateScoreDetail(produitId: string, detail: ScoreQualite['detail']): ScoreQualite {
    const total =
      detail.resultatsTests * 0.25 +
      detail.couverture * 0.2 +
      detail.couvertureCritiques * 0.2 +
      detail.incidents * 0.15 +
      detail.nonFonctionnel * 0.1 +
      detail.testabilite * 0.05 +
      detail.controlesQualite * 0.05;
    const score = Math.round(total);
    const sante = calculerSante(score);

    const data = load<{ produitId: string; score: number; detail: ScoreQualite['detail'] }>('quality_scores_local');
    const idx = data.findIndex((d) => d.produitId === produitId);
    if (idx >= 0) {
      data[idx] = { produitId, score, detail };
    } else {
      data.push({ produitId, score, detail });
    }
    save('quality_scores_local', data);

    const hist = load<HistoriqueQualite>('quality_history');
    hist.push({ id: uid(), produitId, score, sante, date: new Date().toISOString() });
    save('quality_history', hist);

    return { id: uid(), produitId, score, sante, detail, dateCalcul: new Date().toISOString() };
  },

  getHistorique(produitId: string): HistoriqueQualite[] {
    return load<HistoriqueQualite>('quality_history')
      .filter((h) => h.produitId === produitId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getPointsCritiques(produitId: string): PointCritique[] {
    return load<PointCritique>('quality_watchpoints')
      .filter((p) => p.produitId === produitId)
      .sort((a, b) => {
        const order = { critique: 0, haute: 1, moyenne: 2, faible: 3 };
        return (order[a.criticite] ?? 4) - (order[b.criticite] ?? 4);
      });
  },

  createPointCritique(produitId: string, data: Omit<PointCritique, 'id' | 'produitId' | 'dateCreation'>): PointCritique {
    const all = load<PointCritique>('quality_watchpoints');
    const point: PointCritique = {
      id: uid(),
      produitId,
      ...data,
      dateCreation: new Date().toISOString(),
    };
    all.push(point);
    save('quality_watchpoints', all);
    return point;
  },

  updatePointCritique(produitId: string, pointId: string, data: Partial<PointCritique>): PointCritique | null {
    const all = load<PointCritique>('quality_watchpoints');
    const idx = all.findIndex((p) => p.id === pointId && p.produitId === produitId);
    if (idx === -1) return null;
    all[idx] = { ...all[idx], ...data };
    save('quality_watchpoints', all);
    return all[idx];
  },

  deletePointCritique(produitId: string, pointId: string): boolean {
    const all = load<PointCritique>('quality_watchpoints');
    const filtered = all.filter((p) => !(p.id === pointId && p.produitId === produitId));
    if (filtered.length === all.length) return false;
    save('quality_watchpoints', filtered);
    return true;
  },
};
