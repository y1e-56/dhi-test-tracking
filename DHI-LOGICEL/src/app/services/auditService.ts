import { AuditEntry } from '../types';

const AUDIT_KEY = 'dhi_audit_trail';

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
}
function save<T>(key: string, data: T[]): void { localStorage.setItem(key, JSON.stringify(data)); }
function uid(): string { return `id_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`; }

export const auditService = {
  enregistrer(userId: string, userName: string, action: string, entityType: AuditEntry['entityType'], entityId: string, details: string, ancienValeur?: string, nouvelleValeur?: string): void {
    const entry: AuditEntry = {
      id: uid(), userId, userName, action, entityType, entityId, details,
      ancienValeur, nouvelleValeur, date: new Date().toISOString(),
    };
    const all = load<AuditEntry>(AUDIT_KEY);
    all.unshift(entry);
    if (all.length > 500) all.length = 500;
    save(AUDIT_KEY, all);
  },

  lister(filtres?: { entityType?: string; userId?: string; dateDebut?: string; dateFin?: string; recherche?: string }): AuditEntry[] {
    let entries = load<AuditEntry>(AUDIT_KEY);
    if (!filtres) return entries;
    if (filtres.entityType) entries = entries.filter((e) => e.entityType === filtres.entityType);
    if (filtres.userId) entries = entries.filter((e) => e.userId === filtres.userId);
    if (filtres.dateDebut) entries = entries.filter((e) => e.date >= filtres.dateDebut!);
    if (filtres.dateFin) entries = entries.filter((e) => e.date <= filtres.dateFin!);
    if (filtres.recherche) {
      const r = filtres.recherche.toLowerCase();
      entries = entries.filter((e) => e.action.toLowerCase().includes(r) || e.details.toLowerCase().includes(r) || e.userName.toLowerCase().includes(r));
    }
    return entries;
  },

  stats(): { total: number; parType: Record<string, number>; parUser: Record<string, number> } {
    const entries = load<AuditEntry>(AUDIT_KEY);
    const parType: Record<string, number> = {};
    const parUser: Record<string, number> = {};
    entries.forEach((e) => {
      parType[e.entityType] = (parType[e.entityType] || 0) + 1;
      parUser[e.userName] = (parUser[e.userName] || 0) + 1;
    });
    return { total: entries.length, parType, parUser };
  },

  vider(): void { save(AUDIT_KEY, []); },
};
