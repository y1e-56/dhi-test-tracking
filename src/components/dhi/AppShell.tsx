import { Link } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Boxes,
  ListChecks,
  FlaskConical,
  Grid3x3,
  Bug,
  ShieldCheck,
  Bell,
  Rocket,
  Eye,
  FileCheck2,
  Settings,
  History,
  BookOpen,
  type LucideIcon,
} from "lucide-react";
import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

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
      { to: "/produits", label: "Produits & Projets", icon: Boxes },
      { to: "/fonctionnalites", label: "Fonctionnalités", icon: ListChecks },
      { to: "/exigences", label: "Exigences", icon: FileCheck2 },
      { to: "/couverture", label: "Matrice de couverture", icon: Grid3x3 },
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
      { to: "/anomalies", label: "Anomalies & Incidents", icon: Bug },
      { to: "/referentiels", label: "Référentiels & règles", icon: BookOpen },
      { to: "/administration", label: "Administration", icon: Settings },
      { to: "/audit", label: "Audit & historique", icon: History },
    ],
  },
];

export function AppShell({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2 border-b border-sidebar-border px-5 py-5">
          <div className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">DHI Quality</p>
            <p className="text-xs text-sidebar-foreground/60">Platform</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
              <div className="flex flex-col gap-0.5">
                {section.items.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    activeOptions={{ exact: item.to === "/" }}
                    className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    activeProps={{
                      className: "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
                    }}
                  >
                    <item.icon className="size-4" />
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>
        <div className="border-t border-sidebar-border px-5 py-4 text-xs text-sidebar-foreground/60">
          Gouvernance mesurable & traçable
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4">
            <div>
              <h1 className="text-lg font-semibold">{title}</h1>
              {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <div className="flex items-center gap-2">{actions}</div>
          </div>
          <nav className="flex gap-1 overflow-x-auto border-t border-border px-4 py-2 lg:hidden">
            {allItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="whitespace-nowrap rounded-md px-3 py-1.5 text-xs text-muted-foreground"
                activeProps={{ className: "bg-secondary text-secondary-foreground font-medium" }}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </header>
        <main className="flex-1 px-6 py-6">{children}</main>
      </div>
    </div>
  );
}
