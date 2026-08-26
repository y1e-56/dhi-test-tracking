import { TestExecution, Preuve, Verdict, TypePreuve } from '../types';

const EXEC_KEY = 'dhi_executions';
const PREUVE_KEY = 'dhi_preuves';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
function uid(): string { return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }

export interface ProgressionCampagne {
  total: number;
  executes: number;
  pass: number;
  fail: number;
  blocked: number;
  na: number;
  pourcentage: number;
}

export const campagneExecutionService = {
  // ─── EXÉCUTIONS ───
  listExecutions(campagneId: string): TestExecution[] {
    return load<TestExecution>(EXEC_KEY).filter((e) => e.campagneId === campagneId);
  },

  getExecution(campagneId: string, casTestId: string): TestExecution | undefined {
    return load<TestExecution>(EXEC_KEY).find((e) => e.campagneId === campagneId && e.casTestId === casTestId);
  },

  upsertExecution(data: Omit<TestExecution, 'id' | 'dateExecution'>): TestExecution {
    const all = load<TestExecution>(EXEC_KEY);
    const idx = all.findIndex((e) => e.campagneId === data.campagneId && e.casTestId === data.casTestId);
    const exec: TestExecution = {
      ...data,
      id: idx !== -1 ? all[idx].id : uid(),
      dateExecution: new Date().toISOString(),
    };
    if (idx !== -1) { all[idx] = exec; } else { all.push(exec); }
    save(EXEC_KEY, all);
    return exec;
  },

  getProgression(campagneId: string, totalCases: number): ProgressionCampagne {
    const execs = load<TestExecution>(EXEC_KEY).filter((e) => e.campagneId === campagneId);
    const executes = execs.filter((e) => e.verdict !== 'non_execute');
    const pass = execs.filter((e) => e.verdict === 'pass').length;
    const fail = execs.filter((e) => e.verdict === 'fail').length;
    const blocked = execs.filter((e) => e.verdict === 'blocked').length;
    const na = execs.filter((e) => e.verdict === 'na').length;
    return {
      total: totalCases,
      executes: executes.length,
      pass, fail, blocked, na,
      pourcentage: totalCases > 0 ? Math.round((executes.length / totalCases) * 100) : 0,
    };
  },

  // ─── PREUVES ───
  listPreuves(executionId: string): Preuve[] {
    return load<Preuve>(PREUVE_KEY).filter((p) => p.executionId === executionId);
  },

  listPreuvesByCampagne(campagneId: string): Preuve[] {
    return load<Preuve>(PREUVE_KEY).filter((p) => p.campagneId === campagneId);
  },

  createPreuve(data: Omit<Preuve, 'id' | 'dateAjout'>): Preuve {
    const all = load<Preuve>(PREUVE_KEY);
    const pr: Preuve = { ...data, id: uid(), dateAjout: new Date().toISOString() };
    all.push(pr); save(PREUVE_KEY, all); return pr;
  },

  deletePreuve(id: string): void {
    save(PREUVE_KEY, load<Preuve>(PREUVE_KEY).filter((p) => p.id !== id));
  },

  // ─── DUPLICATION DE CAMPAGNE ───
  duplicuerCampagne(sourceId: string, nouveauNom: string, projetId: string): any {
    const allCampagnes = load<any>('dhi_campagnes');
    const source = allCampagnes.find((c: any) => c.id === sourceId);
    if (!source) throw new Error('Campagne source introuvable');

    const newId = uid();
    const nouvelle = {
      ...source,
      id: newId,
      nom: nouveauNom,
      statut: 'en_preparation',
      dateDebut: '',
      dateFin: '',
      dateCreation: new Date().toISOString(),
      version: (source.version || 1) + 1,
      campagneParentId: sourceId,
    };
    allCampagnes.push(nouvelle);
    save('dhi_campagnes', allCampagnes);
    return nouvelle;
  },
};
