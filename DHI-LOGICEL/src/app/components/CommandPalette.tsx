import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
  CommandSeparator,
} from './ui/command';
import {
  FolderKanban, TestTube, Bug, Users, BarChart3, Home,
  Search, FileText, AlertTriangle,
} from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentUser, users } = useAuth();
  const { projets, campagnes, anomalies, fonctionnalites } = useData();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!open) setSearch('');
  }, [open]);

  const handleSelect = useCallback((path: string) => {
    navigate(path);
    onOpenChange(false);
  }, [navigate, onOpenChange]);

  const role = currentUser?.role;

  const filteredProjets = (projets || []).filter(p =>
    p.nom.toLowerCase().includes(search.toLowerCase()) ||
    p.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredCampagnes = (campagnes || []).filter(c =>
    c.nom.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAnomalies = (anomalies || []).filter(a =>
    a.titre.toLowerCase().includes(search.toLowerCase()) ||
    a.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredFonctionnalites = (fonctionnalites || []).filter(f =>
    f.nom.toLowerCase().includes(search.toLowerCase()) ||
    f.description?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredUsers = (users || []).filter(u =>
    u.nom.toLowerCase().includes(search.toLowerCase()) ||
    u.prenom.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const showProjets = role === 'admin' || role === 'chef_testeur';
  const showUsers = role === 'admin';
  const showReporting = role === 'admin' || role === 'chef_testeur';

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title={t('search.title')} description={t('search.description')}>
      <CommandInput placeholder={t('search.placeholder')} value={search} onValueChange={setSearch} />
      <CommandList>
        <CommandEmpty>{t('search.no_results')}</CommandEmpty>

        <CommandGroup heading={t('search.navigation')}>
          <CommandItem onSelect={() => handleSelect('/dashboard')}>
            <Home className="w-4 h-4 text-slate-500" />
            <span>{t('nav.dashboard')}</span>
            <CommandShortcut>⌘1</CommandShortcut>
          </CommandItem>
          {showProjets && (
            <CommandItem onSelect={() => handleSelect('/projets')}>
              <FolderKanban className="w-4 h-4 text-indigo-500" />
              <span>{t('nav.projects')}</span>
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
          )}
          {showProjets && (
            <CommandItem onSelect={() => handleSelect('/campagnes')}>
              <TestTube className="w-4 h-4 text-sky-500" />
              <span>{t('nav.campaigns')}</span>
              <CommandShortcut>⌘3</CommandShortcut>
            </CommandItem>
          )}
          {role === 'testeur' && (
            <CommandItem onSelect={() => handleSelect('/testeur/taches')}>
              <TestTube className="w-4 h-4 text-emerald-500" />
              <span>{t('nav.my_tasks')}</span>
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
          )}
          {role === 'developpeur' && (
            <CommandItem onSelect={() => handleSelect('/developpeur/anomalies')}>
              <Bug className="w-4 h-4 text-amber-500" />
              <span>{t('nav.my_anomalies')}</span>
              <CommandShortcut>⌘2</CommandShortcut>
            </CommandItem>
          )}
          {showReporting && (
            <CommandItem onSelect={() => handleSelect('/reporting')}>
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <span>{t('nav.reporting')}</span>
            </CommandItem>
          )}
        </CommandGroup>

        {search.length > 0 && (
          <>
            <CommandSeparator />

            {showProjets && filteredProjets.length > 0 && (
              <CommandGroup heading={t('search.projects')}>
                {filteredProjets.slice(0, 5).map(projet => (
                  <CommandItem key={projet.id} onSelect={() => handleSelect(`/campagnes?projetId=${projet.id}`)}>
                    <FolderKanban className="w-4 h-4 text-indigo-500" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{projet.nom}</span>
                      {projet.description && (
                        <span className="text-xs text-slate-400 ml-2 truncate">{projet.description}</span>
                      )}
                    </div>
                    <span className="text-xs text-slate-400">{projet.statut === 'actif' ? '●' : '○'}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredCampagnes.length > 0 && (
              <CommandGroup heading={t('search.campaigns')}>
                {filteredCampagnes.slice(0, 5).map(campagne => (
                  <CommandItem key={campagne.id} onSelect={() => handleSelect(`/campagnes/${campagne.id}`)}>
                    <TestTube className="w-4 h-4 text-sky-500" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{campagne.nom}</span>
                      <span className="text-xs text-slate-400 ml-2">{campagne.statut}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {filteredFonctionnalites.length > 0 && (
              <CommandGroup heading={t('search.features')}>
                {filteredFonctionnalites.slice(0, 5).map(fonctionnalite => {
                  const campagne = campagnes.find(c => c.id === fonctionnalite.campagneId);
                  return (
                    <CommandItem key={fonctionnalite.id} onSelect={() => handleSelect(`/campagnes/${fonctionnalite.campagneId}`)}>
                      <FileText className="w-4 h-4 text-violet-500" />
                      <div className="flex-1 min-w-0">
                        <span className="font-medium">{fonctionnalite.nom}</span>
                        <span className="text-xs text-slate-400 ml-2">{campagne?.nom}</span>
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {filteredAnomalies.length > 0 && (
              <CommandGroup heading={t('search.anomalies')}>
                {filteredAnomalies.slice(0, 5).map(anomalie => (
                  <CommandItem key={anomalie.id} onSelect={() => handleSelect(`/anomalies/${anomalie.id}`)}>
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{anomalie.titre}</span>
                      <span className="text-xs text-slate-400 ml-2">{anomalie.statut}</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {showUsers && filteredUsers.length > 0 && (
              <CommandGroup heading={t('search.users')}>
                {filteredUsers.slice(0, 5).map(user => (
                  <CommandItem key={user.id} onSelect={() => handleSelect('/admin/utilisateurs')}>
                    <Users className="w-4 h-4 text-purple-500" />
                    <div className="flex-1 min-w-0">
                      <span className="font-medium">{user.prenom} {user.nom}</span>
                      <span className="text-xs text-slate-400 ml-2">{user.email}</span>
                    </div>
                    <span className="text-xs text-slate-400">{user.role}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
