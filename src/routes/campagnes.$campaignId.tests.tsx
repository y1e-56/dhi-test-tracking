import { createFileRoute, Link, Outlet, useMatches, notFound } from "@tanstack/react-router";
import { AppShell } from "@/components/dhi/AppShell";
import { CriticalityBadge, VerdictBadge } from "@/components/dhi/indicators";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadSnapshot, useStore } from "@/lib/dhi-store";
import { campaigns as seedCampaigns } from "@/lib/dhi-data";
import { campaignTabs } from "@/lib/dhi-nav";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/campagnes/$campaignId/tests")({
  loader: ({ params }) => {
    const snapshot = loadSnapshot();
    const campaigns = snapshot?.campaigns ?? seedCampaigns;
    const c = campaigns.find((x) => x.id === params.campaignId);
    return { name: c?.name ?? "Campagne" };
  },
  head: ({ loaderData }) => ({
    meta: [{ title: `Cas de test · ${loaderData?.name ?? "Campagne"} — DHI Quality Platform` }],
  }),
  component: CampaignTests,
});

function CampaignTests() {
  const { campaignId } = Route.useParams();
  const matches = useMatches();
  const { t } = useI18n();
  const { campaigns, tests } = useStore();
  const exact = matches[matches.length - 1]?.pathname === `/campagnes/${campaignId}/tests`;
  if (!exact) return <Outlet />;

  const campaign = campaigns.find((c) => c.id === campaignId);

  const rows = tests.filter((x) => x.campaignId === campaignId);

  return (
    <AppShell
      title={campaign?.name ?? t("nav.campaign_tests")}
      subtitle={t("nav.campaign_tests")}
      breadcrumb={[t("nav.execution"), t("nav.campagnes"), campaign?.name ?? "", t("nav.campaign_tests")]}
      tabs={campaignTabs(campaignId)}
    >
      <div className="panel">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.id")}</TableHead>
              <TableHead>{t("pages.campaign_detail.test")}</TableHead>
              <TableHead>{t("common.criticite")}</TableHead>
              <TableHead>{t("common.type")}</TableHead>
              <TableHead>{t("common.verdict")}</TableHead>
              <TableHead>{t("common.testeur")}</TableHead>
              <TableHead className="text-right">{t("pages.campaign_detail.execution")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((tc) => (
              <TableRow key={tc.id}>
                <TableCell className="num font-medium">{tc.id}</TableCell>
                <TableCell className="max-w-xs truncate">{tc.name}</TableCell>
                <TableCell>
                  <CriticalityBadge level={tc.criticality} />
                </TableCell>
                <TableCell className="text-sm capitalize">{tc.type.replace(/_/g, " ")}</TableCell>
                <TableCell>
                  <VerdictBadge verdict={tc.verdict} />
                </TableCell>
                <TableCell className="text-sm">{tc.tester ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <Link
                    to="/execution/$testId"
                    params={{ testId: tc.id }}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {t("pages.campaign_detail.executer")}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                  {t("pages.product_detail.no_campaigns_for_product")}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </AppShell>
  );
}