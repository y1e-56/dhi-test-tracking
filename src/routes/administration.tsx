import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { KpiCard } from "@/components/dhi/indicators";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ROLE_LABEL, type AppRole } from "@/lib/dhi-data";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { loadSession, useStore } from "@/lib/dhi-store";

const ADMIN_ROLES: AppRole[] = ["admin", "qa_lead", "quality_manager"];

export const Route = createFileRoute("/administration")({
  beforeLoad: () => {
    const s = loadSession();
    if (!s || !ADMIN_ROLES.includes(s.role)) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [{ title: "Administration — DHI Quality Platform" }],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { t } = useI18n();
  const { users, updateUserRole, toggleUserActive } = useStore();
  const roles = Object.keys(ROLE_LABEL) as AppRole[];

  return (
    <AppShell
      title={t("pages.administration.title")}
      subtitle={t("pages.administration.subtitle")}
      breadcrumb={["Système", "Administration"]}
      tabs={SYSTEM_TABS}
      actions={
        <Button size="sm" asChild>
          <Link to="/administration/ajouter-utilisateur">
            <Plus className="size-4" /> {t("pages.administration.add_user")}
          </Link>
        </Button>
      }
    >
      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard label={t("pages.administration.users")} value={users.length} />
        <KpiCard
          label={t("pages.administration.active")}
          value={users.filter((u) => u.active).length}
          tone="success"
        />
        <KpiCard
          label={t("pages.administration.profiles")}
          value={roles.length}
          hint={t("pages.administration.customizable")}
        />
      </div>

      <div className="panel overflow-hidden">
        <div className="flex h-11 items-center border-b border-border bg-subtle px-4">
          <h2 className="text-[13px] font-semibold tracking-tight">
            {t("pages.administration.accounts")}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.nom")}</TableHead>
              <TableHead>{t("pages.administration.email")}</TableHead>
              <TableHead>{t("pages.administration.profile")}</TableHead>
              <TableHead>{t("pages.administration.state")}</TableHead>
              <TableHead className="text-right">{t("pages.administration.action")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                <TableCell>
                  <Select
                    value={u.role}
                    onValueChange={(v) => {
                      updateUserRole(u.id, v as AppRole);
                      toast.success(
                        t("pages.administration.role_updated").replace("{name}", u.name),
                      );
                    }}
                  >
                    <SelectTrigger className="h-8 w-52 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {ROLE_LABEL[r]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-sm">
                  {u.active ? t("common.actif") : t("common.inactif")}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      toggleUserActive(u.id);
                      toast.success(
                        u.active
                          ? t("pages.administration.deactivated").replace("{name}", u.name)
                          : t("pages.administration.reactivated").replace("{name}", u.name),
                      );
                    }}
                  >
                    {u.active
                      ? t("pages.administration.deactivate")
                      : t("pages.administration.activate")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}
