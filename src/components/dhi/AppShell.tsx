/* =========================================================
   1. IMPORTS
   ========================================================= */
import { Link, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  ListChecks,
  FlaskConical,
  Grid3x3,
  Bug,
  Bell,
  Rocket,
  Eye,
  FileCheck2,
  Settings,
  History,
  BookOpen,
  FolderKanban,
  Menu,
  Search,
  ChevronRight,
  LogOut,
  UserRound,
  LogIn,
  Moon,
  Sun,
  Globe,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { SEARCH_PAGES, SEARCH_GROUPS, type AppShellTab } from "@/lib/dhi-nav";
import { ROLE_LABEL, ROLE_PAGES, NOTIFICATION_TYPE_LABEL } from "@/lib/dhi-data";
import { useStore } from "@/lib/dhi-store";
import { hasAccessToPage, getDefaultDashboardForRole } from "@/lib/role-protection";
import { useI18n, type TranslationKey } from "@/lib/i18n";

/* =========================================================
   2. TYPES
   ========================================================= */
interface NavItem {
  to: string;
  label: TranslationKey;
  icon: LucideIcon;
}

interface NavSection {
  title: TranslationKey;
  items: NavItem[];
}

/* =========================================================
   3. DONNÉES / CONFIG
   ========================================================= */

/* Priorité 1 (vertical) : les 5 domaines métier. */
const NAV_SECTIONS: NavSection[] = [
  {
    title: "nav.pilotage",
    items: [
      { to: "/", label: "nav.dashboard", icon: LayoutDashboard },
      { to: "/alertes", label: "nav.alertes", icon: Bell },
    ],
  },
  {
    title: "nav.qualite",
    items: [
      { to: "/produits", label: "nav.produits", icon: Boxes },
      { to: "/projets", label: "nav.projets", icon: FolderKanban },
      { to: "/fonctionnalites", label: "nav.fonctionnalites", icon: ListChecks },
      { to: "/exigences", label: "nav.exigences", icon: FileCheck2 },
      { to: "/couverture", label: "nav.couverture", icon: Grid3x3 },
    ],
  },
  {
    title: "nav.execution",
    items: [{ to: "/campagnes", label: "nav.campagnes", icon: FlaskConical }],
  },
  {
    title: "nav.decision",
    items: [
      { to: "/go-live", label: "nav.go_live", icon: Rocket },
      { to: "/points-a-surveiller", label: "nav.points_surveiller", icon: Eye },
    ],
  },
  {
    title: "nav.systeme",
    items: [
      { to: "/anomalies", label: "nav.anomalies", icon: Bug },
      { to: "/referentiels", label: "nav.referentiels", icon: BookOpen },
      { to: "/administration", label: "nav.administration", icon: Settings },
      { to: "/audit", label: "nav.audit", icon: History },
    ],
  },
];

const navLinkClass =
  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const navLinkActiveClass =
  "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--color-sidebar-border)]";

export type { AppShellTab };

/* =========================================================
   4. COMPOSANTS HELPERS
   ========================================================= */

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { currentUser } = useStore();
  const { t } = useI18n();

  // Filtrer les éléments de navigation en fonction du rôle de l'utilisateur
  const filteredSections = NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => (currentUser ? hasAccessToPage(item.to) : false)),
  })).filter((section) => section.items.length > 0);

  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {filteredSections.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="label-eyebrow px-2.5 pb-1">{t(section.title)}</p>
          {section.items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={onNavigate}
              activeOptions={{ exact: item.to === "/" }}
              className={navLinkClass}
              activeProps={{ className: navLinkActiveClass }}
            >
              <item.icon className="size-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
              <span className="truncate">{t(item.label)}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  const { t } = useI18n();

  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
      <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-[11px] font-bold tracking-tight text-sidebar-primary-foreground">
        QC
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-none text-foreground">
          {t("brand")}
        </p>
        <p className="mt-1 text-[11px] leading-none text-muted-foreground">{t("tagline")}</p>
      </div>
    </div>
  );
}

/* =========================================================
   4b. COMPOSANT — Menu utilisateur / Session
   ========================================================= */

function NotificationBell() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { notifications, currentUser, markNotificationRead, markAllNotificationsRead } =
    useStore();

  if (!currentUser) return null;

  const mine = notifications
    .filter((n) => n.userId === currentUser.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative"
          aria-label={t("pages.notifications.title")}
        >
          <Bell className="size-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>{t("pages.notifications.title")}</span>
          <button
            type="button"
            onClick={markAllNotificationsRead}
            className="text-xs font-normal text-muted-foreground hover:text-foreground"
          >
            {t("pages.notifications.mark_all_read")}
          </button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {mine.length === 0 ? (
          <DropdownMenuItem disabled className="justify-center py-6 text-sm text-muted-foreground">
            {t("pages.notifications.empty")}
          </DropdownMenuItem>
        ) : (
          <DropdownMenuGroup className="max-h-96 overflow-y-auto">
            {mine.slice(0, 20).map((n) => (
              <DropdownMenuItem
                key={n.id}
                className={n.read ? "opacity-60" : undefined}
                onSelect={() => {
                  if (!n.read) markNotificationRead(n.id);
                  if (n.link) void navigate({ to: n.link as never });
                }}
              >
                <div className="flex flex-col gap-0.5 py-1">
                  <div className="flex items-center gap-2">
                    <span className="label-eyebrow">{NOTIFICATION_TYPE_LABEL[n.type]}</span>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <p className="text-sm font-medium">{n.title}</p>
                  <p className="text-xs text-muted-foreground">{n.message}</p>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void navigate({ to: "/notifications" })}>
          {t("pages.notifications.view_all")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function UserMenu() {
  const navigate = useNavigate();
  const { currentUser, logout } = useStore();
  const { lang, setLang, theme, toggleTheme, languages, t } = useI18n();

  const initials = (name: string) =>
    name
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const toggleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.id === lang);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLang(languages[nextIndex].id);
  };

  if (!currentUser) {
    return (
      <Button size="sm" variant="outline" onClick={() => void navigate({ to: "/login" })}>
        <LogIn className="size-4" /> {t("actions.connexion")}
      </Button>
    );
  }

  const dashboardPath = getDefaultDashboardForRole(currentUser.role);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="flex shrink-0 items-center gap-2 rounded-md border border-transparent px-2 py-1 transition-colors hover:border-border hover:bg-subtle"
        >
          <Avatar className="size-7 border border-border">
            <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
              {initials(currentUser.name)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 text-left sm:block">
            <p className="truncate text-[12px] font-semibold leading-none">{currentUser.name}</p>
            <p className="mt-0.5 truncate text-[10px] text-muted-foreground leading-none">
              {ROLE_LABEL[currentUser.role] ?? currentUser.role}
            </p>
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>
          <p className="text-sm font-semibold">{currentUser.name}</p>
          <p className="text-xs font-normal text-muted-foreground">{currentUser.email}</p>
          <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-primary/80">
            {ROLE_LABEL[currentUser.role] ?? currentUser.role}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem
            onClick={() => void navigate({ to: dashboardPath })}
            className="text-sm"
          >
            <LayoutDashboard className="mr-2 size-4 text-muted-foreground" /> {t("nav.dashboard")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => void navigate({ to: "/audit" })} className="text-sm">
            <History className="mr-2 size-4 text-muted-foreground" /> {t("nav.audit")}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={toggleTheme} className="text-sm">
            {theme === "dark" ? (
              <Sun className="mr-2 size-4 text-muted-foreground" />
            ) : (
              <Moon className="mr-2 size-4 text-muted-foreground" />
            )}
            {theme === "dark" ? t("common.mode_clair") : t("common.mode_sombre")}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={toggleLanguage} className="text-sm">
            <Globe className="mr-2 size-4 text-muted-foreground" />
            {t("common.langue")}: {languages.find((l) => l.id === lang)?.native || lang}
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            logout();
            toast.success(t("common.deconnexion_message"));
            void navigate({ to: "/login" });
          }}
          className="text-sm text-danger focus:text-danger"
        >
          <LogOut className="mr-2 size-4" /> {t("actions.deconnexion")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* =========================================================
   5. COMPOSANT PRINCIPAL — AppShell
   ========================================================= */

export function AppShell({
  title,
  subtitle,
  breadcrumb,
  tabs,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  /** Fil d'Ariane affiché au-dessus du titre. */
  breadcrumb?: string | string[];
  /** Priorité 2 (horizontal) : sous-navigation de la section courante. */
  tabs?: AppShellTab[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { currentUser } = useStore();
  const { lang, setLang, theme, toggleTheme, languages, t } = useI18n();
  const allItems = NAV_SECTIONS.flatMap((s) => s.items).filter((item) =>
    currentUser ? hasAccessToPage(item.to) : false,
  );

  const toggleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.id === lang);
    const nextIndex = (currentIndex + 1) % languages.length;
    setLang(languages[nextIndex].id);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="flex min-h-screen bg-subtle">
      {/* Navigation principale : verticale, persistante */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex print:hidden">
        <Brand />
        <SidebarNav />
        <div className="border-t border-sidebar-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          {t("footer.copyright")}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md print:hidden">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="lg:hidden"
                  aria-label={t("common.navigation")}
                >
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[264px] bg-sidebar p-0">
                <SheetTitle className="sr-only">{t("common.navigation")}</SheetTitle>
                <Brand />
                <SidebarNav onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              {breadcrumb ? (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {(Array.isArray(breadcrumb) ? breadcrumb : [breadcrumb]).map((crumb, i) => (
                    <span key={crumb} className="flex items-center gap-1 truncate">
                      {i > 0 ? <ChevronRight className="size-3 opacity-60" /> : null}
                      {crumb}
                    </span>
                  ))}
                </div>
              ) : null}
              <div className="flex items-baseline gap-2">
                <h1 className="truncate text-[15px] font-semibold tracking-tight">{title}</h1>
                {subtitle ? (
                  <p className="hidden truncate text-xs text-muted-foreground md:block">
                    {subtitle}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setSearchOpen(true)}
                className="hidden items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground xl:flex hover:bg-subtle"
              >
                <Search className="size-3.5" />
                <span>{t("common.recherche_page")}</span>
                <kbd className="num rounded border border-border bg-muted px-1 text-[10px]">⌘K</kbd>
              </button>
              <Button
                variant="outline"
                size="icon"
                className="xl:hidden"
                aria-label={t("common.recherche_ecran")}
                onClick={() => setSearchOpen(true)}
              >
                <Search className="size-4" />
              </Button>

              {/* Theme Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleTheme}
                aria-label={t("common.changer_theme")}
                title={theme === "dark" ? t("common.mode_clair") : t("common.mode_sombre")}
              >
                {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>

              {/* Language Toggle */}
              <Button
                variant="outline"
                size="icon"
                onClick={toggleLanguage}
                aria-label={t("common.changer_langue")}
                title={t("common.langue_label").replace(
                  "{langue}",
                  lang === "fr" ? "Français" : "English",
                )}
              >
                {" "}
                <Globe className="size-4" />
                <span className="sr-only">{lang === "fr" ? "FR" : "EN"}</span>
              </Button>

              {actions}
              <NotificationBell />
              <UserMenu />
            </div>
          </div>

          {/* Sous-navigation horizontale contextuelle */}
          {tabs?.length ? (
            <nav className="flex gap-4 overflow-x-auto px-4 sm:px-6">
              {tabs.map((tab) => (
                <Link
                  key={tab.to}
                  to={tab.to}
                  activeOptions={{ exact: tab.exact ?? false }}
                  className="-mb-px whitespace-nowrap border-b-2 border-transparent py-2 text-[13px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                  activeProps={{ className: "border-foreground text-foreground" }}
                >
                  {t(tab.label)}
                </Link>
              ))}
            </nav>
          ) : null}

          {/* Repli mobile de la navigation principale */}
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-2 lg:hidden">
            {allItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="whitespace-nowrap rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground"
                activeProps={{ className: "bg-secondary text-foreground" }}
              >
                {t(item.label)}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="w-full space-y-6">{children}</div>
        </main>
      </div>

      <CommandDialog open={searchOpen} onOpenChange={setSearchOpen}>
        <CommandInput placeholder={t("common.recherche_ecran")} />
        <CommandList>
          <CommandEmpty>{t("common.aucun_ecran")}</CommandEmpty>
          {SEARCH_GROUPS.map((group) => (
            <CommandGroup key={group} heading={t(group)}>
              {SEARCH_PAGES.filter((p) => p.group === group && hasAccessToPage(p.to)).map((p) => (
                <CommandItem
                  key={p.to}
                  value={`${t(p.label)} ${p.to}`}
                  onSelect={() => {
                    setSearchOpen(false);
                    void navigate({ to: p.to });
                  }}
                >
                  {t(p.label)}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </div>
  );
}
