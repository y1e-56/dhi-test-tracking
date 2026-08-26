import { CheckListItem, Derogation, DecisionGoNogo, VerdictGoNogo } from '../types';

const GO_KEY = 'dhi_go_nogo';
const DEROG_KEY = 'dhi_derogations';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
function uid(): string { return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }

export const goNogoService = {
  creerChecklistDefaut(): CheckListItem[] {
    return [
      { id: uid(), description: 'Tous les cas de test critiques passés', statut: 'a_faire' },
      { id: uid(), description: 'Aucune anomalie bloquante ouverte', statut: 'a_faire' },
      { id: uid(), description: "Taux de couverture ≥ 80%", statut: 'a_faire' },
      { id: uid(), description: 'Score qualité ≥ 85/100', statut: 'a_faire' },
      { id: uid(), description: 'Validé par le chef de test', statut: 'a_faire' },
      { id: uid(), description: 'Environnement de production prêt', statut: 'a_faire' },
      { id: uid(), description: 'Documentation technique à jour', statut: 'a_faire' },
      { id: uid(), description: 'Plan de rollback défini', statut: 'a_faire' },
    ];
  },

  sauvegarderDecision(decision: DecisionGoNogo): void {
    const all = load<DecisionGoNogo>(GO_KEY);
    const idx = all.findIndex((d) => d.projetId === decision.projetId && d.versionId === decision.versionId);
    if (idx !== -1) { all[idx] = decision; } else { all.push(decision); }
    save(GO_KEY, all);
  },

  getDecision(projetId: string, versionId: string): DecisionGoNogo | undefined {
    return load<DecisionGoNogo>(GO_KEY).find((d) => d.projetId === projetId && d.versionId === versionId);
  },

  listDecisions(): DecisionGoNogo[] { return load<DecisionGoNogo>(GO_KEY); },

  demanderDerogation(ref: string, desc: string, risque: string, mesures: string, demandeurId: string): Derogation {
    const d: Derogation = {
      id: uid(), reference: ref, description: desc, risque, mesures,
      demandeurId, statut: 'en_attente', dateDemande: new Date().toISOString(),
    };
    const all = load<Derogation>(DEROG_KEY);
    all.push(d);
    save(DEROG_KEY, all);
    return d;
  },

  repondreDerogation(id: string, statut: 'approuvee' | 'rejetee', approbateurId: string): void {
    const all = load<Derogation>(DEROG_KEY);
    const d = all.find((x) => x.id === id);
    if (d) { d.statut = statut; d.approbateurId = approbateurId; d.dateReponse = new Date().toISOString(); }
    save(DEROG_KEY, all);
  },

  listDerogations(): Derogation[] { return load<Derogation>(DEROG_KEY); },

  calculerVerdict(decision: DecisionGoNogo): VerdictGoNogo {
    if (decision.anomaliesCritiques > 0) return 'no_go';
    if (decision.scoreQualite >= 85 && decision.tauxCouverture >= 80 && decision.anomaliesOuvertes <= 5) return 'go';
    return 'go_reserve';
  },
};
