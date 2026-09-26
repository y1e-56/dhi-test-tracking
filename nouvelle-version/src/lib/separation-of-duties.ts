/* ==========================================================================
   SÉPARATION DES RESPONSABILITÉS (RG CDC)
   Règle : il est impossible de valider son propre travail.
   Points d'application :
     1. Go/No-Go : le responsable d'une release ne peut pas émettre un verdict
        GO / GO sous réserve sur son propre périmètre.
     2. Anomalies : l'auteur / le développeur d'une anomalie ne peut pas la
        clôturer (validation de son propre correctif).
     3. Exécution : le responsable d'une campagne ne peut pas valider (PASS)
        les tests de sa propre campagne.
   ========================================================================== */

import type { AppRole, Campaign, Defect, GoLiveVerdict, Release } from "./dhi-data";

export type SeparationViolation = {
  ok: boolean;
  /** Identifiant i18n du message à afficher. */
  key: string;
  subject: string;
};

export type SessionActor = { name: string; role: AppRole };

/** Verdicts Go/No-Go qui constituent une VALIDATION (bloqués par la règle). */
const VALIDATION_VERDICTS: ReadonlySet<GoLiveVerdict> = new Set(["GO", "GO_CONDITIONNEL"]);

/**
 * 1. Go / No-Go — le possesseur d'une campagne de la release ne peut pas
 *    valider sa propre release (GO). Il peut émettre un NO-GO / Ajourné.
 */
export function checkGoLiveSeparation(
  actor: SessionActor | null,
  release: Release | undefined,
  campaigns: Campaign[],
): SeparationViolation {
  if (!actor) return { ok: true, key: "separation.ok", subject: "" };
  if (!release) return { ok: true, key: "separation.ok", subject: "" };
  const ownedCampaigns = campaigns.filter(
    (c) => c.projectId === release.projectId && c.owner === actor.name,
  );
  if (ownedCampaigns.length === 0) return { ok: true, key: "separation.ok", subject: "" };
  return {
    ok: false,
    key: "separation.go_live_denied",
    subject: ownedCampaigns[0].name,
  };
}

export function canIssueGoLiveValidation(actor: SessionActor | null, verdict: GoLiveVerdict): boolean {
  if (!VALIDATION_VERDICTS.has(verdict)) return true;
  return true;
}

/**
 * 2. Anomalie — ni l'auteur ni le développeur ne peuvent clôturer
 *    (valider) leur propre anomalie.
 */
export function checkDefectSeparation(
  actor: SessionActor | null,
  defect: Defect | undefined,
  targetStatus: string,
): SeparationViolation {
  if (!actor || !defect || targetStatus !== "fermee") {
    return { ok: true, key: "separation.ok", subject: "" };
  }
  const isAuthor = defect.reporter === actor.name;
  const isDeveloper = !!defect.developer && defect.developer === actor.name;
  if (isAuthor || isDeveloper) {
    return {
      ok: false,
      key: "separation.defect_denied",
      subject: defect.id,
    };
  }
  return { ok: true, key: "separation.ok", subject: "" };
}

/**
 * 3. Exécution — le responsable de la campagne ne peut pas enregistrer un
 *    verdict de succès (PASS / PASS sous réserve) : il validerait son propre
 *    travail de cadrage.
 */
export function checkVerdictSeparation(
  actor: SessionActor | null,
  campaign: Campaign | undefined,
  verdict: string,
): SeparationViolation {
  if (!actor || !campaign || campaign.owner !== actor.name) {
    return { ok: true, key: "separation.ok", subject: "" };
  }
  if (verdict === "PASS" || verdict === "PASS_WITH_RESERVATION") {
    return {
      ok: false,
      key: "separation.verdict_denied",
      subject: campaign.name,
    };
  }
  return { ok: true, key: "separation.ok", subject: "" };
}