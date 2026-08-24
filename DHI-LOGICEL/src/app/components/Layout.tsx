import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate, useLocation, Outlet } from 'react-router';
import {
  Bell, LogOut, Menu, Home, FolderKanban, TestTube,
  BarChart3, ChevronRight, Bug, Users, Sparkles, Languages, KeyRound, Eye, EyeOff, Search,
  ClipboardList, FileText, Settings, Shield, Clock, UserPlus, Package
} from 'lucide-react';
import { CommandPalette } from './CommandPalette';
import { Breadcrumbs } from './ui/Breadcrumbs';
import { useBreadcrumbs } from '../hooks/useBreadcrumbs';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { AIChatBox } from './AIChatBox';
import { ErrorBoundary } from './ErrorBoundary';
import { authService } from '../services/authService';
import { toast } from 'sonner';

export function Layout() {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const { notifications, marquerNotificationLue } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatBoxOpen, setChatBoxOpen] = useState(false);
  const [changePwdOpen, setChangePwdOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ current: '', next: '', confirm: '' });
  const [pwdVisible, setPwdVisible] = useState({ current: false, next: false, confirm: false });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [recentOpen, setRecentOpen] = useState(false);
  const [recentPages, setRecentPages] = useState<{ path: string; label: string; time: number }[]>([]);
  const breadcrumbItems = useBreadcrumbs();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('dhi_recent_pages');
    if (stored) {
      try { setRecentPages(JSON.parse(stored)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '/dashboard') return;
    const label = breadcrumbItems.length > 0 ? breadcrumbItems[breadcrumbItems.length - 1].label : location.pathname;
    const entry = { path: location.pathname, label, time: Date.now() };
    setRecentPages(prev => {
      const filtered = prev.filter(p => p.path !== location.pathname);
      const updated = [entry, ...filtered].slice(0, 8);
      localStorage.setItem('dhi_recent_pages', JSON.stringify(updated));
      return updated;
    });
  }, [location.pathname]);

  if (!currentUser) return null;

  const notificationsNonLues = notifications.filter(n => n.userId === currentUser.id && !n.lue);

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: t('role.admin'),
      chef_testeur: t('role.test_lead'),
      testeur: t('role.tester'),
      developpeur: t('role.developer'),
    };
    return labels[role] || role;
  };

  const getRoleAccent = (role: string) => {
    const accents: Record<string, string> = {
      admin: 'bg-purple-500',
      chef_testeur: 'bg-sky-500',
      testeur: 'bg-emerald-500',
      developpeur: 'bg-amber-500',
    };
    return accents[role] || 'bg-slate-500';
  };

  interface NavItem {
    path: string;
    label: string;
    icon: typeof Home;
    roles: string[];
  }

  interface NavSection {
    label: string;
    items: NavItem[];
  }

  const allNavSections: NavSection[] = [
    {
      label: '',
      items: [
        { path: '/dashboard', label: t('nav.dashboard'), icon: Home, roles: ['admin', 'chef_testeur', 'testeur', 'developpeur'] },
      ],
    },
    {
      label: t('nav.section_portfolio'),
      items: [
        { path: '/produits', label: t('nav.products'), icon: Package, roles: ['admin', 'chef_testeur'] },
      ],
    },
    {
      label: t('nav.section_projects'),
      items: [
        { path: '/projets', label: t('nav.projects'), icon: FolderKanban, roles: ['admin', 'chef_testeur'] },
        { path: '/campagnes', label: t('nav.campaigns'), icon: ClipboardList, roles: ['admin', 'chef_testeur'] },
      ],
    },
    {
      label: t('nav.section_my_work'),
      items: [
        { path: '/testeur/taches', label: t('nav.my_tasks'), icon: TestTube, roles: ['admin', 'testeur'] },
        { path: '/developpeur/anomalies', label: t('nav.my_anomalies'), icon: Bug, roles: ['developpeur'] },
      ],
    },
    {
      label: t('nav.section_admin'),
      items: [
        { path: '/admin/anomalies', label: t('nav.all_anomalies'), icon: Shield, roles: ['admin'] },
        { path: '/admin/assignations', label: t('breadcrumbs.assignment'), icon: UserPlus, roles: ['admin'] },
        { path: '/admin/utilisateurs', label: t('nav.users'), icon: Users, roles: ['admin'] },
        { path: '/admin/history', label: t('nav.history'), icon: FileText, roles: ['admin'] },
        { path: '/reporting', label: t('nav.reporting'), icon: BarChart3, roles: ['admin', 'chef_testeur'] },
      ],
    },
  ];

  const navSections = allNavSections
    .map(section => ({
      ...section,
      items: section.items.filter(item => item.roles.includes(currentUser.role)),
    }))
    .filter(section => section.items.length > 0);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.next !== pwdForm.confirm) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }
    if (pwdForm.next.length < 6) {
      toast.error('Le nouveau mot de passe doit faire au moins 6 caractères');
      return;
    }
    setPwdLoading(true);
    try {
      await authService.changePassword(pwdForm.current, pwdForm.next);
      toast.success('Mot de passe modifié avec succès');
      setChangePwdOpen(false);
      setPwdForm({ current: '', next: '', confirm: '' });
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Mot de passe actuel incorrect');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleNotificationClick = (notification: { id: string; lienUrl?: string }) => {
    marquerNotificationLue(notification.id);
    if (notification.lienUrl) {
      navigate(notification.lienUrl);
      setSidebarOpen(false);
    }
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fr' ? 'en' : 'fr';
    i18n.changeLanguage(newLang);
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 h-16 border-b border-white/[0.08] flex-shrink-0 bg-gradient-to-b from-white/[0.05] to-transparent">
        <img src="/logo.svg" alt="DHI" className="w-9 h-9 rounded-xl flex-shrink-0 shadow-lg shadow-indigo-500/30" />
        <div>
          <div className="font-bold text-white text-sm tracking-tight">{t('app.title')}</div>
          <div className="text-white/40 text-[10px] font-mono tracking-widest">{t('app.subtitle')}</div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-4 overflow-y-auto">
        <div className="space-y-4">
          {navSections.map((section, sectionIdx) => (
            <div key={sectionIdx}>
              {section.label && (
                <p className="text-white/25 text-[10px] font-bold uppercase tracking-widest px-3 mb-2">{section.label}</p>
              )}
              <div className="space-y-0.5">
                {section.items.map(link => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <a
                      key={link.path}
                      href={link.path}
                      onClick={(e) => { e.preventDefault(); navigate(link.path); setSidebarOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left group ${
                        active
                          ? 'bg-gradient-to-r from-indigo-500/25 to-indigo-500/10 text-white font-semibold shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                          : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-indigo-300' : 'group-hover:text-white/80'}`} />
                      <span className="flex-1 truncate">{link.label}</span>
                      {active && <ChevronRight className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />}
                    </a>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>

      <div className="px-2.5 pb-4 flex-shrink-0 border-t border-white/[0.08] pt-4 space-y-2">
        <button
          onClick={toggleLanguage}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left text-white/60 hover:bg-white/[0.06] hover:text-white/90 group"
        >
          <Languages className="w-4 h-4 flex-shrink-0 group-hover:text-white/80" />
          <span className="flex-1 truncate">{i18n.language === 'fr' ? 'English' : 'Français'}</span>
        </button>
        <button
          onClick={() => setChatBoxOpen(true)}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left group ${
            chatBoxOpen
              ? 'bg-gradient-to-r from-purple-500/25 to-purple-500/10 text-white font-semibold shadow-lg shadow-purple-500/10 border border-purple-500/20'
              : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
          }`}
        >
          <Sparkles className={`w-4 h-4 flex-shrink-0 transition-colors ${chatBoxOpen ? 'text-purple-300' : 'group-hover:text-white/80'}`} />
          <span className="flex-1 truncate">{t('layout.ai_assistant')}</span>
          {chatBoxOpen && <ChevronRight className="w-3.5 h-3.5 text-purple-300 flex-shrink-0" />}
        </button>
        {notificationsNonLues.length > 0 && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-gradient-to-r from-indigo-500/15 to-indigo-500/5 rounded-xl border border-indigo-500/20">
            <Bell className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />
            <span className="text-xs text-indigo-200 font-medium truncate">
              {notificationsNonLues.length} {t('layout.notification')}{notificationsNonLues.length > 1 ? 's' : ''}
            </span>
          </div>
        )}
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.08]">
          <div className={`w-8 h-8 ${getRoleAccent(currentUser.role)} rounded-full flex items-center justify-center flex-shrink-0 shadow-lg`}>
            <span className="text-[10px] font-bold text-white">
              {currentUser.prenom[0]}{currentUser.nom[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-semibold truncate">{currentUser.prenom} {currentUser.nom}</div>
            <div className="text-white/40 text-[10px] truncate">{getRoleLabel(currentUser.role)}</div>
          </div>
          <button
            onClick={() => setChangePwdOpen(true)}
            className="text-white/30 hover:text-white/80 hover:bg-white/[0.1] transition-all p-1.5 rounded-lg flex-shrink-0"
            title="Changer le mot de passe"
          >
            <KeyRound className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleLogout}
            className="text-white/30 hover:text-white/80 hover:bg-white/[0.1] transition-all p-1.5 rounded-lg flex-shrink-0"
            title={t('layout.logout')}
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50">
      <aside className="hidden lg:flex lg:flex-col w-56 flex-shrink-0 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 shadow-2xl">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-md"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex flex-col w-56 bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 z-50 shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <header className="flex-shrink-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <div className="flex items-center gap-2 min-w-0">
            <button
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all flex-shrink-0"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0 overflow-hidden">
              <Breadcrumbs items={breadcrumbItems} />
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              <span className="hidden md:inline">{t('search.placeholder')}</span>
              <kbd className="hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-100 rounded border border-slate-200">
                ⌘K
              </kbd>
            </button>

            {recentPages.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                    <Clock className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 shadow-lg">
                  <DropdownMenuLabel className="text-xs font-semibold text-slate-500">
                    {t('search.recent')}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {recentPages.slice(0, 5).map((page, i) => (
                    <DropdownMenuItem
                      key={`${page.path}-${i}`}
                      onClick={() => { navigate(page.path); setRecentOpen(false); }}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                      <span className="truncate text-sm">{page.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all">
                  <Bell style={{ width: '1.125rem', height: '1.125rem' }} />
                  {notificationsNonLues.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-red-500/30">
                      {notificationsNonLues.length > 9 ? '9+' : notificationsNonLues.length}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 shadow-lg">
                <DropdownMenuLabel className="flex items-center justify-between py-3">
                  <span className="font-semibold">{t('layout.notifications')}</span>
                  {notificationsNonLues.length > 0 && (
                    <Badge className="bg-red-100 text-red-700 text-[10px] px-1.5 py-0.5">
                      {notificationsNonLues.length} {t('layout.new_notifications')}
                    </Badge>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notificationsNonLues.length === 0 ? (
                  <div className="px-4 py-10 text-center">
                    <Bell className="w-8 h-8 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400">{t('layout.no_notifications')}</p>
                  </div>
                ) : (
                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {notificationsNonLues.map(notif => (
                      <DropdownMenuItem
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className="flex items-start gap-3 p-3 cursor-pointer"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0 mt-2" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-slate-800 truncate">{notif.titre}</div>
                          <div className="text-xs text-slate-500 mt-0.5 leading-relaxed line-clamp-2">{notif.message}</div>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            {new Date(notif.dateCreation).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="hidden lg:flex items-center gap-3 ml-2 pl-4 border-l border-slate-200">
              <div className={`w-8 h-8 ${getRoleAccent(currentUser.role)} rounded-full flex items-center justify-center shadow-md`}>
                <span className="text-[10px] font-bold text-white">
                  {currentUser.prenom[0]}{currentUser.nom[0]}
                </span>
              </div>
              <div className="hidden xl:block">
                <div className="text-xs font-semibold text-slate-800 leading-tight">{currentUser.prenom} {currentUser.nom}</div>
                <div className="text-[10px] text-slate-500">{getRoleLabel(currentUser.role)}</div>
              </div>
              <button
                onClick={() => setChangePwdOpen(true)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                title="Changer le mot de passe"
              >
                <KeyRound className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={handleLogout}
                className="ml-1 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                title={t('layout.logout')}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-8">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      <Dialog open={changePwdOpen} onOpenChange={v => { setChangePwdOpen(v); if (!v) { setPwdForm({ current: '', next: '', confirm: '' }); setPwdVisible({ current: false, next: false, confirm: false }); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-indigo-500" />
              Changer le mot de passe
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleChangePwd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Mot de passe actuel</label>
              <div className="relative">
                <input
                  type={pwdVisible.current ? 'text' : 'password'}
                  value={pwdForm.current}
                  onChange={e => setPwdForm(f => ({ ...f, current: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                  autoComplete="current-password"
                />
                <button type="button" tabIndex={-1} onClick={() => setPwdVisible(v => ({ ...v, current: !v.current }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {pwdVisible.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={pwdVisible.next ? 'text' : 'password'}
                  value={pwdForm.next}
                  onChange={e => setPwdForm(f => ({ ...f, next: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1} onClick={() => setPwdVisible(v => ({ ...v, next: !v.next }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {pwdVisible.next ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Confirmer le nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={pwdVisible.confirm ? 'text' : 'password'}
                  value={pwdForm.confirm}
                  onChange={e => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  required
                  autoComplete="new-password"
                />
                <button type="button" tabIndex={-1} onClick={() => setPwdVisible(v => ({ ...v, confirm: !v.confirm }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {pwdVisible.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <button
                type="button"
                onClick={() => { setChangePwdOpen(false); setPwdForm({ current: '', next: '', confirm: '' }); setPwdVisible({ current: false, next: false, confirm: false }); }}
                className="px-4 py-2 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-all"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={pwdLoading}
                className="px-4 py-2 rounded-lg text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-all"
              >
                {pwdLoading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AIChatBox open={chatBoxOpen} onClose={() => setChatBoxOpen(false)} />
      <CommandPalette open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
