import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, AlertCircle, Moon, Sun, Globe, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { loadSession, useStore } from "@/lib/dhi-store";
import { ROLE_LABEL, type AppRole } from "@/lib/dhi-data";
import { getDefaultDashboardForRole } from "@/lib/role-protection";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Connexion — DHI Quality Platform" },
      {
        name: "description",
        content: "Connexion à la plateforme de pilotage de la qualité logicielle DHI.",
      },
    ],
  }),
  beforeLoad: () => {
    const s = loadSession();
    if (s) return { redirect: "/" } as const;
    return;
  },
  component: LoginPage,
});

const DEMO_ACCOUNTS: { email: string; name: string; role: string; password: string }[] = [
  { email: "admin@test.fr", name: "Admin Principal", role: "admin", password: "Admin@DHI2026" },
  { email: "chef@test.fr", name: "Chef Projet", role: "chef_testeur", password: "Chef@DHI2026" },
  { email: "chef2@test.fr", name: "Second Chef", role: "chef_testeur", password: "Chef@DHI2026" },
  { email: "testeur@test.fr", name: "Testeur Principal", role: "tester", password: "Testeur@DHI2026" },
  { email: "dev@test.fr", name: "Developpeur Senior", role: "developer", password: "Dev@DHI2026" },
];

function LoginPage() {
  const { login, users } = useStore();
  const navigate = useNavigate();
  const { lang, setLang, theme, toggleTheme, languages, t } = useI18n();
  const [email, setEmail] = useState("admin@test.fr");
  const [password, setPassword] = useState("Admin@DHI2026");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const r = await login(email, password);
    if (!r.ok) {
      setError(r.error ?? t("common.erreur"));
      setLoading(false);
      return;
    }

    toast.success(t("login.bienvenue"));
    setLoading(false);
    const dashboard = getDefaultDashboardForRole((r.user?.role || "lecteur") as AppRole);
    void navigate({ to: dashboard });
  };

  const toggleLanguage = () => {
    const currentIndex = languages.findIndex((l) => l.id === lang);
    const nextIndex = (currentIndex + 1) % languages.length;
    const next = languages[nextIndex] ?? languages[0];
    if (next) setLang(next.id);
  };

  const pick = (account: (typeof DEMO_ACCOUNTS)[number]) => {
    setEmail(account.email);
    setPassword(account.password);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-subtle to-background py-12 px-4">
      <div className="mx-auto flex max-w-5xl flex-col items-center">
        <div className="mb-10 flex items-center gap-4">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/25">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight">DHI Quality Platform</p>
            <p className="text-sm text-muted-foreground">{t("brand")}</p>
          </div>
        </div>

        {/* Theme and language controls */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={toggleTheme} className="gap-2">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            {theme === "dark" ? t("common.mode_clair") : t("common.mode_sombre")}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleLanguage}
            className="gap-2"
            aria-label={t("common.changer_langue")}
            title={t("common.langue_label").replace(
              "{langue}",
              languages.find((l) => l.id === lang)?.native || lang,
            )}
          >
            <Globe className="size-4" />
            {lang === "fr" ? "FR" : "EN"}
          </Button>
        </div>

        <div className="grid w-full gap-8 lg:grid-cols-5">
          <Card className="p-8 lg:col-span-3">
            <form onSubmit={submit} className="flex flex-col gap-5">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{t("actions.connexion")}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{t("login.sous_titre")}</p>
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" />
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  {t("login.email")}
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="prenom.nom@dhi.io"
                  required
                  className="h-10"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  {t("login.mdp")}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    required
                    className="h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? t("login.cacher_mdp") : t("login.afficher_mdp")
                    }
                    title={showPassword ? t("login.cacher_mdp") : t("login.afficher_mdp")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              <Button className="mt-2 h-10" type="submit" disabled={loading}>
                {loading ? t("pages.login.connecting") : t("actions.connexion")}
              </Button>

              <p className="pt-2 text-center text-xs text-muted-foreground">
                {t("login.mdp")} {t("pages.login.demo_password")} :{" "}
                <span className="font-mono font-medium">Admin@DHI2026</span>
              </p>
            </form>
          </Card>

          <Card className="p-8 lg:col-span-2">
            <div className="mb-4">
              <p className="text-base font-semibold tracking-tight">{t("login.compte_demo")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("pages.login.demo_hint")}</p>
            </div>
            <div className="flex flex-col gap-3">
              {DEMO_ACCOUNTS.map((a) => {
                const disabled = users.find(
                  (u) => u.email.toLowerCase() === a.email.toLowerCase() && !u.active,
                );
                return (
                  <button
                    key={a.email}
                    type="button"
                    disabled={!!disabled}
                    onClick={() => pick(a)}
                    className={
                      "flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-left text-sm transition-all " +
                      (disabled
                        ? "cursor-not-allowed opacity-50"
                        : "hover:border-primary/50 hover:bg-subtle hover:shadow-sm")
                    }
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">{a.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.email}</p>
                    </div>
                    <span className="shrink-0 rounded-lg bg-secondary px-2.5 py-1 text-[10px] font-medium text-secondary-foreground">
                      {ROLE_LABEL[a.role as keyof typeof ROLE_LABEL] ?? a.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
