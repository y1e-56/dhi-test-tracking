import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard } from "@/components/dhi/indicators";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { useStore } from "@/lib/dhi-store";

export const Route = createFileRoute("/audit")({
  head: () => ({
    meta: [{ title: "Audit & historique — DHI Quality Platform" }],
  }),
  component: AuditPage,
});

function AuditPage() {
  const { t } = useI18n();
  const { audit } = useStore();
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    if (!q.trim()) return audit;
    const s = q.toLowerCase();
    return audit.filter(
      (e) =>
        e.actor.toLowerCase().includes(s) ||
        e.action.toLowerCase().includes(s) ||
        e.entity.toLowerCase().includes(s) ||
        e.detail.toLowerCase().includes(s),
    );
  }, [audit, q]);

  return (
    <AppShell
      title={t("pages.audit.title")}
      subtitle={t("pages.audit.subtitle")}
      breadcrumb={t("pages.audit.breadcrumb")}
      tabs={SYSTEM_TABS}
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <KpiCard
          label={t("pages.audit.events")}
          value={audit.length}
          hint={t("pages.audit.memory_journal")}
        />
        <KpiCard
          label={t("pages.audit.displayed")}
          value={rows.length}
          hint={t("pages.audit.after_filter")}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-border bg-subtle px-4 py-2.5">
          <h2 className="text-[13px] font-semibold tracking-tight">{t("pages.audit.journal")}</h2>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("pages.audit.filter_placeholder")}
            className="ml-auto w-72"
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.date")}</TableHead>
              <TableHead>{t("pages.audit.acteur")}</TableHead>
              <TableHead>{t("pages.audit.action")}</TableHead>
              <TableHead>{t("pages.audit.entite")}</TableHead>
              <TableHead>{t("pages.audit.detail")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="num whitespace-nowrap text-xs text-muted-foreground">
                  {e.at}
                </TableCell>
                <TableCell className="text-sm">{e.actor}</TableCell>
                <TableCell className="text-sm font-medium">{e.action}</TableCell>
                <TableCell className="num text-sm">{e.entity}</TableCell>
                <TableCell className="max-w-md truncate text-sm text-muted-foreground">
                  {e.detail}
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                  {t("pages.audit.no_events")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
