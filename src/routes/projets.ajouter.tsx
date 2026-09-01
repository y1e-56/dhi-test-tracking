import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/dhi/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PEOPLE, type ProjectStatus } from "@/lib/dhi-data";
import { QUALITY_TABS } from "@/lib/dhi-nav";
import { useStore } from "@/lib/dhi-store";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/projets/ajouter")({
  head: () => ({
    meta: [{ title: "Créer un projet — DHI Quality Platform" }],
  }),
  component: CreateProjectPage,
});

type ProjectForm = {
  name: string;
  objective: string;
  productId: string;
  targetVersion: string;
  manager: string;
  qaLead: string;
  status: ProjectStatus;
  startDate: string;
  endDate: string;
  progress: number;
};

function CreateProjectPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { products, addProject } = useStore();

  const [form, setForm] = useState<ProjectForm>({
    name: "",
    objective: "",
    productId: products[0]?.id ?? "",
    targetVersion: "",
    manager: PEOPLE[0] ?? "",
    qaLead: PEOPLE[1] ?? "",
    status: "planifie",
    startDate: new Date().toISOString().slice(0, 10),
    endDate: "",
    progress: 0,
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.productId) {
      toast.error(t("pages.projects.required"));
      return;
    }
    addProject({
      productId: form.productId,
      name: form.name.trim(),
      objective: form.objective,
      targetVersion: form.targetVersion || "1.0",
      status: form.status,
      startDate: form.startDate,
      endDate: form.endDate,
      manager: form.manager,
      qaLead: form.qaLead,
      progress: form.progress,
    });
    toast.success(`${t("pages.projects.created")} « ${form.name.trim()} »`);
    navigate({ to: "/projets" });
  };

  return (
    <AppShell
      title={t("pages.projects.title")}
      subtitle={t("pages.projects.subtitle")}
      breadcrumb={t("pages.projects.breadcrumb")}
      tabs={QUALITY_TABS}
    >
      <div className="panel">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/projets" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("common.projets")}
          </Button>
        </div>

        <form onSubmit={submit} className="max-w-4xl space-y-8">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.projects.new_project_page")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("pages.projects.subtitle")}</p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-1.5">
                <Label htmlFor="p-name">{t("pages.projects.name_label")}</Label>
                <Input
                  id="p-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t("pages.projects.name_placeholder")}
                  required
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="p-obj">{t("pages.projects.objective")}</Label>
                <Input
                  id="p-obj"
                  value={form.objective}
                  onChange={(e) => setForm({ ...form, objective: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>{t("pages.projects.parent_product")}</Label>
                  <Select
                    value={form.productId}
                    onValueChange={(v) => setForm({ ...form, productId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="p-ver">{t("pages.projects.target_version")}</Label>
                  <Input
                    id="p-ver"
                    value={form.targetVersion}
                    onChange={(e) => setForm({ ...form, targetVersion: e.target.value })}
                    placeholder="4.12"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>{t("common.statut")}</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v as ProjectStatus })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planifie">
                        {t("pages.projects.status_planifie")}
                      </SelectItem>
                      <SelectItem value="encours">{t("pages.projects.status_encours")}</SelectItem>
                      <SelectItem value="termine">{t("pages.projects.status_termine")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("pages.projects.progress")}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={form.progress}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        progress: Math.max(0, Math.min(100, Number(e.target.value) || 0)),
                      })
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label htmlFor="p-start">{t("pages.projects.start_date")}</Label>
                  <Input
                    id="p-start"
                    type="date"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="p-end">{t("pages.projects.end_date")}</Label>
                  <Input
                    id="p-end"
                    type="date"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <Label>{t("pages.projects.manager_label")}</Label>
                  <Select
                    value={form.manager}
                    onValueChange={(v) => setForm({ ...form, manager: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PEOPLE.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <Label>{t("pages.projects.qa_lead")}</Label>
                  <Select
                    value={form.qaLead}
                    onValueChange={(v) => setForm({ ...form, qaLead: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PEOPLE.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/projets" })}
              className="h-11 px-6"
            >
              {t("actions.annuler")}
            </Button>
            <Button type="submit" className="h-11 px-6">
              {t("pages.projects.new_project")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
