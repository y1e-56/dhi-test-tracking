import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
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
import { ROLE_LABEL, type AppRole } from "@/lib/dhi-data";
import { SYSTEM_TABS } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";
import { loadSession, useStore } from "@/lib/dhi-store";

const ADMIN_ROLES: AppRole[] = ["admin", "qa_lead", "quality_manager"];

export const Route = createFileRoute("/administration/ajouter-utilisateur")({
  beforeLoad: () => {
    const s = loadSession();
    if (!s || !ADMIN_ROLES.includes(s.role)) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [{ title: "Ajouter un utilisateur — DHI Quality Platform" }],
  }),
  component: AddUserPage,
});

function AddUserPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { addUser } = useStore();
  const roles = Object.keys(ROLE_LABEL) as AppRole[];

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    role: "lecteur" as AppRole,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error(t("pages.add_user.name_required"));
      return;
    }

    if (!formData.email.trim()) {
      toast.error(t("pages.add_user.email_required"));
      return;
    }

    if (!formData.email.includes("@")) {
      toast.error(t("pages.add_user.email_invalid"));
      return;
    }

    addUser({
      name: formData.name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      active: true,
    });

    toast.success(t("pages.add_user.success").replace("{name}", formData.name.trim()));
    navigate({ to: "/administration" });
  };

  return (
    <AppShell
      title={t("pages.add_user.title")}
      subtitle={t("pages.add_user.subtitle")}
      breadcrumb={t("pages.add_user.breadcrumb")}
      tabs={SYSTEM_TABS}
    >
      <div className="panel">
        <div className="mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate({ to: "/administration" })}
            className="gap-2"
          >
            <ArrowLeft className="size-4" />
            {t("pages.add_user.back_to_admin")}
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="max-w-2xl space-y-6">
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                {t("pages.add_user.personal_info")}
              </h2>
              <p className="text-sm text-muted-foreground">
                {t("pages.add_user.personal_info_hint")}
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  {t("pages.add_user.full_name")}
                </Label>
                <Input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Jean Dupont"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("pages.add_user.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="jean.dupont@exemple.com"
                  required
                  className="h-11"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="role" className="text-sm font-medium">
                  {t("pages.add_user.role")}
                </Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value as AppRole })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder={t("pages.add_user.select_role")} />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>
                        {ROLE_LABEL[role]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">{t("pages.add_user.role_hint")}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/administration" })}
              className="h-11 px-6"
            >
              {t("pages.add_user.annuler")}
            </Button>
            <Button type="submit" className="h-11 px-6">
              {t("pages.add_user.create")}
            </Button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
