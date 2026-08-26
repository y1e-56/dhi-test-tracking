import { CouvertureModule, CouvertureTypeTest, CouvertureCriticite, TrouTest, ScoreQualiteAvance } from '../types';

const TROUS_KEY = 'dhi_trous_tests';
const SCORE_AVANCE_KEY = 'dhi_score_avance';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
function uid(): string { return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }

interface FeatureInput { module: string; statut: string; priorite: string; }
interface TestCaseInput { type: string; }
interface ExecutionInput { verdict: string; }

export const couvertureService = {
  // ─── COUVERTURE PAR MODULE ───
  calculerCouvertureModules(features: FeatureInput[]): CouvertureModule[] {
    const modules = new Map<string, FeatureInput[]>();
    features.forEach((f) => {
      const mod = f.module || 'Sans module';
      if (!modules.has(mod)) modules.set(mod, []);
      modules.get(mod)!.push(f);
    });
    return Array.from(modules.entries()).map(([module, feats]) => {
      const total = feats.length;
      const couvertes = feats.filter((f) => f.statut === 'conforme').length;
      const avecAnomalies = feats.filter((f) => f.statut === 'anomalie').length;
      const nonTestees = feats.filter((f) => f.statut === 'non_testee').length;
      return { module, totalFonctionnalites: total, couvertes, avecAnomalies, nonTestees, tauxCouverture: total > 0 ? Math.round((couvertes / total) * 100) : 0 };
    }).sort((a, b) => a.tauxCouverture - b.tauxCouverture);
  },

  // ─── COUVERTURE PAR TYPE DE TEST ───
  calculerCouvertureTypes(testCases: TestCaseInput[], executions: ExecutionInput[]): CouvertureTypeTest[] {
    const types = new Map<string, { total: number; executes: number; reussis: number; echecs: number }>();
    testCases.forEach((tc) => {
      const t = tc.type || 'non_defini';
      if (!types.has(t)) types.set(t, { total: 0, executes: 0, reussis: 0, echecs: 0 });
      types.get(t)!.total++;
    });
    executions.forEach((ex) => {
      const tc = testCases.find((_, i) => i >= 0);
      const type = tc?.type || 'non_defini';
      const entry = types.get(type);
      if (entry && ex.verdict !== 'non_execute') {
        entry.executes++;
        if (ex.verdict === 'pass') entry.reussis++;
        if (ex.verdict === 'fail') entry.echecs++;
      }
    });
    return Array.from(types.entries()).map(([type, data]) => ({
      type, totalCasTests: data.total, executes: data.executes,
      reussis: data.reussis, echecs: data.echecs,
      tauxReussite: data.executes > 0 ? Math.round((data.reussis / data.executes) * 100) : 0,
    }));
  },

  // ─── COUVERTURE PAR CRITICITÉ ───
  calculerCouvertureCriticite(features: FeatureInput[]): CouvertureCriticite[] {
    const criticites = new Map<string, FeatureInput[]>();
    features.forEach((f) => {
      const c = f.priorite || 'non_definie';
      if (!criticites.has(c)) criticites.set(c, []);
      criticites.get(c)!.push(f);
    });
    return Array.from(criticites.entries()).map(([criticite, feats]) => {
      const total = feats.length;
      const couvertes = feats.filter((f) => f.statut === 'conforme').length;
      return { criticite, totalFonctionnalites: total, couvertes, tauxCouverture: total > 0 ? Math.round((couvertes / total) * 100) : 0 };
    }).sort((a, b) => a.tauxCouverture - b.tauxCouverture);
  },

  // ─── DÉTECTION DES TROUS ───
  detecterTrous(features: FeatureInput[], testCases: TestCaseInput[], modules: CouvertureModule[], types: CouvertureTypeTest[]): TrouTest[] {
    const trous: TrouTest[] = [];
    modules.forEach((m) => {
      if (m.tauxCouverture < 50) {
        trous.push({ id: uid(), module: m.module, typeTest: 'tous', criticite: 'haute', description: `Module "${m.module}" couvert à seulement ${m.tauxCouverture}%`, recommandation: `Ajouter des cas de test pour le module ${m.module}`, dateDetection: new Date().toISOString() });
      }
    });
    types.forEach((tt) => {
      if (tt.totalCasTests === 0) {
        trous.push({ id: uid(), module: 'global', typeTest: tt.type, criticite: 'moyenne', description: `Aucun test de type "${tt.type}" exécuté`, recommandation: `Créer des tests de type ${tt.type}`, dateDetection: new Date().toISOString() });
      }
    });
    const featuresNonTestees = features.filter((f) => f.statut === 'non_testee' && (f.priorite === 'critique' || f.priorite === 'haute'));
    featuresNonTestees.forEach((f) => {
      trous.push({ id: uid(), module: f.module, typeTest: 'tous', criticite: f.priorite, description: `Fonctionnalité prioritaire "${f.module}" non testée`, recommandation: `Prioriser les tests sur ${f.module}`, dateDetection: new Date().toISOString() });
    });
    return trous;
  },

  // ─── SCORE QUALITÉ AVANCÉ ───
  calculerScoreAvance(produitId: string, features: FeatureInput[], modules: CouvertureModule[], types: CouvertureTypeTest[]): ScoreQualiteAvance {
    const scoreGlobal = features.length > 0 ? Math.round((features.filter((f) => f.statut === 'conforme').length / features.length) * 100) : 0;
    const prevScores = load<ScoreQualiteAvance>(SCORE_AVANCE_KEY).filter((s) => s.produitId === produitId);
    const lastScore = prevScores.length > 0 ? prevScores[prevScores.length - 1].scoreGlobal : scoreGlobal;
    const tendance = scoreGlobal > lastScore + 2 ? 'amelioration' : scoreGlobal < lastScore - 2 ? 'deterioration' : 'stable';
    const score: ScoreQualiteAvance = {
      produitId, scoreGlobal, tendance,
      detailParModule: modules.map((m) => ({ module: m.module, score: m.tauxCouverture })),
      detailParType: types.map((t) => ({ type: t.type, score: t.tauxReussite })),
      dateCalcul: new Date().toISOString(),
    };
    const allScores = load<ScoreQualiteAvance>(SCORE_AVANCE_KEY);
    allScores.push(score);
    save(SCORE_AVANCE_KEY, allScores);
    return score;
  },

  // ─── TROUS PERSISTANTS ───
  listTrous(): TrouTest[] { return load<TrouTest>(TROUS_KEY); },
  saveTrous(trous: TrouTest[]): void { save(TROUS_KEY, trous); },
};
