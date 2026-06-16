import { useState } from 'react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '../i18n/i18n';
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';
import { useNavigate, useLocation } from 'react-router';
import {
  Bell, LogOut, Menu, Home, FolderKanban, TestTube,
  BarChart3, ChevronRight, Bug, Users, Sparkles, Languages
} from 'lucide-react';
import { Badge } from './ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { AIChatBox } from './AIChatBox';

export function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { currentUser, logout } = useAuth();
  const { notifications, marquerNotificationLue } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatBoxOpen, setChatBoxOpen] = useState(false);

  if (!currentUser) return <>{children}</>;

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

  const allNavLinks = [
    { path: '/dashboard', label: t('nav.dashboard'), icon: Home, roles: ['admin', 'chef_testeur', 'testeur', 'developpeur'] },
    { path: '/projets', label: t('nav.projects'), icon: FolderKanban, roles: ['admin', 'chef_testeur'] },
    { path: '/admin/utilisateurs', label: t('nav.users'), icon: Users, roles: ['admin'] },
    { path: '/admin/history', label: t('nav.history'), icon: BarChart3, roles: ['admin'] },
    { path: '/admin/anomalies', label: t('nav.all_anomalies'), icon: Bug, roles: ['admin'] },
    { path: '/admin/assignation', label: t('nav.assignment'), icon: TestTube, roles: ['admin'] },
    { path: '/campagnes', label: t('nav.campaigns'), icon: TestTube, roles: ['admin', 'chef_testeur'] },
    { path: '/testeur/taches', label: t('nav.my_tasks'), icon: TestTube, roles: ['admin', 'testeur'] },
    { path: '/developpeur/anomalies', label: t('nav.my_anomalies'), icon: Bug, roles: ['developpeur'] },
    { path: '/reporting', label: t('nav.reporting'), icon: BarChart3, roles: ['admin', 'chef_testeur'] },
  ];

  const navLinks = allNavLinks.filter(l => l.roles.includes(currentUser.role));

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/dashboard' && location.pathname.startsWith(path));

  const currentPageLabel = navLinks.find(l => isActive(l.path))?.label || t('nav.dashboard');

  const handleLogout = () => {
    logout();
    navigate('/');
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
        <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-500/30">
          <TestTube className="w-4.5 h-4.5 text-white" />
        </div>
        <div>
          <div className="font-bold text-white text-sm tracking-tight">{t('app.title')}</div>
          <div className="text-white/40 text-[10px] font-mono tracking-widest">{t('app.subtitle')}</div>
        </div>
      </div>

      <nav className="flex-1 px-2.5 py-4 overflow-y-auto">
        <p className="text-white/30 text-[10px] font-bold uppercase tracking-widest px-3 mb-3">{t('layout.menu')}</p>
        <div className="space-y-1">
          {navLinks.map(link => {
            const Icon = link.icon;
            const active = isActive(link.path);
            return (
              <button
                key={link.path}
                onClick={() => { navigate(link.path); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-200 text-left group ${
                  active
                    ? 'bg-gradient-to-r from-indigo-500/25 to-indigo-500/10 text-white font-semibold shadow-lg shadow-indigo-500/10 border border-indigo-500/20'
                    : 'text-white/60 hover:bg-white/[0.06] hover:text-white/90'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? 'text-indigo-300' : 'group-hover:text-white/80'}`} />
                <span className="flex-1 truncate">{link.label}</span>
                {active && <ChevronRight className="w-3.5 h-3.5 text-indigo-300 flex-shrink-0" />}
              </button>
            );
          })}
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
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-400 hidden sm:inline font-medium">{t('layout.dhi_breadcrumb')}</span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <span className="font-semibold text-slate-800">{currentPageLabel}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
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
            {children}
          </div>
        </main>
      </div>

      <AIChatBox open={chatBoxOpen} onClose={() => setChatBoxOpen(false)} />
    </div>
  );
}
