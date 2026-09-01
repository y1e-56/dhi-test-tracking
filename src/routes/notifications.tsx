import { createFileRoute } from "@tanstack/react-router";
import { CheckCheck } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard, Panel } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/dhi-store";
import { NOTIFICATION_TYPE_LABEL, type NotificationType } from "@/lib/dhi-data";
import { PILOTAGE_TABS } from "@/lib/dhi-nav";
import { useI18n, type TranslationKey } from "@/lib/i18n";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — DHI Quality Platform" },
      {
        name: "description",
        content:
          "Centre de notifications : tests, anomalies, campagnes, produits et décisions Go Live qui vous concernent.",
      },
      { property: "og:title", content: "Notifications — DHI Quality Platform" },
      { property: "og:description", content: "Vos notifications personnelles, ciblées par affectation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});

const TYPE_KEY: Record<NotificationType, TranslationKey> = {
  test_assign: "pages.notifications.type_test",
  defect_assign: "pages.notifications.type_defect",
  defect_status: "pages.notifications.type_defect",
  campaign: "pages.notifications.type_campaign",
  product: "pages.notifications.type_product",
  golive: "pages.notifications.type_golive",
  system: "pages.notifications.type_system",
};

const FILTERS: { id: "all" | "unread" | NotificationType; label: TranslationKey }[] = [
  { id: "all", label: "pages.notifications.all" },
  { id: "unread", label: "pages.notifications.unread" },
  { id: "test_assign", label: "pages.notifications.type_test" },
  { id: "defect_assign", label: "pages.notifications.type_defect" },
  { id: "campaign", label: "pages.notifications.type_campaign" },
  { id: "product", label: "pages.notifications.type_product" },
  { id: "golive", label: "pages.notifications.type_golive" },
];

function NotificationsPage() {
  const { notifications, currentUser, markNotificationRead, markAllNotificationsRead } =
    useStore();
  const { t } = useI18n();
  const [filter, setFilter] = useState<"all" | "unread" | NotificationType>("all");

  const mine = notifications
    .filter((n) => !currentUser || n.userId === currentUser.id)
    .filter((n) =>
      filter === "all" ? true : filter === "unread" ? !n.read : n.type === filter,
    )
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const allMine = notifications.filter((n) => !currentUser || n.userId === currentUser.id);
  const unread = allMine.filter((n) => !n.read).length;

  return (
    <AppShell
      title={t("pages.notifications.title")}
      subtitle={t("pages.notifications.subtitle")}
      breadcrumb={t("pages.notifications.breadcrumb")}
      tabs={PILOTAGE_TABS}
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            markAllNotificationsRead();
            toast.success(t("pages.notifications.all_read"));
          }}
        >
          <CheckCheck className="size-4" /> {t("pages.notifications.mark_all_read")}
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label={t("pages.notifications.total")}
          value={allMine.length}
          hint={t("pages.notifications.hint_total")}
        />
        <KpiCard
          label={t("pages.notifications.unread")}
          value={unread}
          tone="info"
          hint={t("pages.notifications.hint_unread")}
        />
        <KpiCard
          label={t("pages.notifications.defects")}
          value={allMine.filter((n) => n.type === "defect_assign" || n.type === "defect_status").length}
          tone="danger"
          hint={t("pages.notifications.hint_defects")}
        />
        <KpiCard
          label={t("pages.notifications.campaigns")}
          value={allMine.filter((n) => n.type === "campaign").length}
          tone="warning"
          hint={t("pages.notifications.hint_campaigns")}
        />
      </div>

      <Panel
        title={t("pages.notifications.flux")}
        actions={
          <div className="flex items-center gap-1">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium transition-colors",
                  filter === f.id
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                {t(f.label)}
              </button>
            ))}
          </div>
        }
      >
        {mine.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("pages.notifications.empty")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {mine.map((n) => (
              <li key={n.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className={cn(
                    "mt-1.5 size-1.5 shrink-0 rounded-full",
                    n.read ? "bg-border-strong" : "bg-info",
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="label-eyebrow">
                      {NOTIFICATION_TYPE_LABEL[n.type]} · {t(TYPE_KEY[n.type])}
                    </span>
                    <p className={cn("text-sm", n.read ? "font-medium" : "font-semibold")}>
                      {n.title}
                    </p>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="num mt-1 text-xs text-muted-foreground/80">{n.createdAt}</p>
                </div>
                {n.read ? null : (
                  <Button size="sm" variant="ghost" onClick={() => markNotificationRead(n.id)}>
                    {t("pages.notifications.mark_read")}
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </AppShell>
  );
}
