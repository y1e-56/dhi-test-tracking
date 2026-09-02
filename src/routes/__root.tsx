import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { DhiStoreProvider } from "@/lib/dhi-store";
import { I18nProvider, useI18n } from "@/lib/i18n";

function NotFoundComponent() {
  const { t } = useI18n();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">
          {t("pages.root.page_not_found")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("pages.root.page_not_found_message")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("pages.root.back_to_dashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const { t } = useI18n();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("pages.root.page_load_error")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("pages.root.error_message")}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("pages.root.retry")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("pages.root.home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  beforeLoad: async () => {},
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DHI Quality Platform — Pilotage de la qualité logicielle" },
      {
        name: "description",
        content:
          "Plateforme centralisée de pilotage de la qualité : produits, campagnes de tests, couverture, anomalies et décisions Go/No-Go.",
      },
      { property: "og:title", content: "DHI Quality Platform" },
      {
        property: "og:description",
        content: "Gouvernance mesurable et traçable de la qualité logicielle.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Geist:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" dir="ltr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function ClientOnly({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    console.log("[DHI] ClientOnly mounting...");
    window.addEventListener("error", (e) => {
      console.error("[DHI] Global error:", e.message, e.filename, e.lineno);
      setError(`Erreur: ${e.message} (${e.filename?.split("/").pop()}:${e.lineno})`);
    });
    setMounted(true);
  }, []);
  console.log("[DHI] ClientOnly render, mounted=", mounted, "error=", error);
  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="max-w-lg rounded-xl border border-danger/30 bg-danger/10 p-6 text-danger">
          <h2 className="text-lg font-semibold">Erreur capturée</h2>
          <p className="mt-2 text-sm font-mono">{error}</p>
        </div>
      </div>
    );
  }
  if (!mounted) return null;
  return <>{children}</>;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  console.log("[DHI] RootComponent RENDERED, queryClient=", !!queryClient);

  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <DhiStoreProvider>
          <ClientOnly>
            <Outlet />
            <Toaster richColors position="bottom-right" />
          </ClientOnly>
        </DhiStoreProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}
