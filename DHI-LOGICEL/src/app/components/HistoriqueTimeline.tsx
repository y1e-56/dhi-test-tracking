import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Bug, RefreshCw, Pencil, Trash2, Archive, UserCheck, UserPlus, UserMinus, TestTube, Circle } from 'lucide-react';
import { HistoriqueAction, User } from '../types';
import { getHistoriqueActionLabel, formatHistoriqueDescription } from '../utils/historique';

const actionIcons: Record<string, typeof Circle> = {
  created: Bug,
  status_changed: RefreshCw,
  updated: Pencil,
  deleted: Trash2,
  archived: Archive,
  assigned: UserCheck,
  member_added: UserPlus,
  member_removed: UserMinus,
  test_case_created: TestTube,
  test_case_deleted: TestTube,
};

interface HistoriqueTimelineProps {
  historique: HistoriqueAction[];
  users: User[];
  maxVisible?: number;
}

export function HistoriqueTimeline({ historique, users, maxVisible }: HistoriqueTimelineProps) {
  const { t } = useTranslation();
  const [showAll, setShowAll] = useState(false);

  if (historique.length === 0) {
    return <p className="text-sm text-slate-400 text-center py-4">{t('anomalie.detail.no_history')}</p>;
  }

  const visible = maxVisible && !showAll ? historique.slice(0, maxVisible) : historique;

  return (
    <div>
      {visible.map((entry, idx) => {
        const auteur = users.find(u => u.id === entry.userId);
        const Icon = actionIcons[entry.action] || Circle;
        const label = getHistoriqueActionLabel(entry.action, t);
        const isLast = idx === visible.length - 1;
        return (
          <div key={entry.id} className="relative pl-8 pb-5 last:pb-0">
            {!isLast && <div className="absolute left-[11px] top-6 bottom-0 w-px bg-slate-200" />}
            <div className="absolute left-0 top-0 w-6 h-6 rounded-full border-2 border-white bg-indigo-50 shadow-sm flex items-center justify-center">
              <Icon className="w-3 h-3 text-indigo-500" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-slate-800 truncate">
                <span className="font-semibold">{auteur ? `${auteur.prenom} ${auteur.nom}` : '—'}</span>
              </p>
              <span className="text-[11px] text-slate-400 shrink-0">
                {new Date(entry.date).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}
              </span>
            </div>
            <span className="inline-block text-[10px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded mt-1">
              {label}
            </span>
            {entry.commentaire && (
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                {formatHistoriqueDescription(entry.commentaire, t)}
              </p>
            )}
          </div>
        );
      })}
      {maxVisible && historique.length > maxVisible && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-indigo-500 hover:text-indigo-700 font-medium"
        >
          {showAll
            ? t('anomalie.detail.show_less')
            : t('anomalie.detail.show_more', { count: historique.length - maxVisible })}
        </button>
      )}
    </div>
  );
}
