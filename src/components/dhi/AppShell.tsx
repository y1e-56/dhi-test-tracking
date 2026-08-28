import { Link } from "@tanstack/react-router";
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
  Menu,
  Search,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

/* Priorité 1 (vertical) : les 5 domaines métier. */
const NAV_SECTIONS: NavSection[] = [
  {
    title: "Pilotage",
    items: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/alertes", label: "Alertes", icon: Bell },
    ],
  },
  {
    title: "Qualité",
    items: [
      { to: "/produits", label: "Produits & projets", icon: Boxes },
      { to: "/fonctionnalites", label: "Fonctionnalités", icon: ListChecks },
      { to: "/exigences", label: "Exigences", icon: FileCheck2 },
      { to: "/couverture", label: "Couverture", icon: Grid3x3 },
    ],
  },
  {
    title: "Exécution",
    items: [{ to: "/campagnes", label: "Campagnes de tests", icon: FlaskConical }],
  },
  {
    title: "Décision",
    items: [
      { to: "/go-live", label: "Go Live Center", icon: Rocket },
      { to: "/points-a-surveiller", label: "Points à surveiller", icon: Eye },
    ],
  },
  {
    title: "Système",
    items: [
      { to: "/anomalies", label: "Anomalies & incidents", icon: Bug },
      { to: "/referentiels", label: "Référentiels & règles", icon: BookOpen },
      { to: "/administration", label: "Administration", icon: Settings },
      { to: "/audit", label: "Audit & historique", icon: History },
    ],
  },
];

const navLinkClass =
  "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground";
const navLinkActiveClass =
  "bg-sidebar-accent text-sidebar-accent-foreground shadow-[inset_0_0_0_1px_var(--color-sidebar-border)]";

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-1 flex-col gap-5 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.title} className="flex flex-col gap-1">
          <p className="label-eyebrow px-2.5 pb-1">{section.title}</p>
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
              <span className="truncate">{item.label}</span>
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-4">
      <div className="flex size-7 items-center justify-center rounded-md bg-sidebar-primary text-[11px] font-bold tracking-tight text-sidebar-primary-foreground">
        QC
      </div>
      <div className="min-w-0">
        <p className="truncate text-[13px] font-semibold leading-none text-foreground">
          DHI Quality
        </p>
        <p className="mt-1 text-[11px] leading-none text-muted-foreground">Platform</p>
      </div>
    </div>
  );
}

export interface AppShellTab {
  to: string;
  label: string;
  exact?: boolean;
}

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
  breadcrumb?: string[];
  /** Priorité 2 (horizontal) : sous-navigation de la section courante. */
  tabs?: AppShellTab[];
  actions?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);

  return (
    <div className="flex min-h-screen bg-subtle">
      {/* Navigation principale : verticale, persistante */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar lg:flex print:hidden">
        <Brand />
        <SidebarNav />
        <div className="border-t border-sidebar-border px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
          Gouvernance mesurable
          <br />& traçable
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur-md print:hidden">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="lg:hidden" aria-label="Navigation">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[264px] bg-sidebar p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
                <SidebarNav onNavigate={() => setOpen(false)} />
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              {breadcrumb?.length ? (
                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  {breadcrumb.map((crumb, i) => (
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
              <div className="hidden items-center gap-2 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-muted-foreground xl:flex">
                <Search className="size-3.5" />
                <span>Rechercher</span>
                <kbd className="num rounded border border-border bg-muted px-1 text-[10px]">⌘K</kbd>
              </div>
              {actions}
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
                  {tab.label}
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
                {item.label}
              </Link>
            ))}
          </nav>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-[1400px] space-y-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
