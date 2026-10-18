import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { AppError } from '../middleware/errorHandler.js';
import {
  ANOMALY_GUARD_MESSAGES,
  applyCorrectionDelay,
  assertAnomalyLevel,
  assertAssigneeIsCampaignDeveloper,
  assertCanReportAnomaly,
} from './anomalyGuard.js';

const testCase = { id: 3, feature_id: 10, campaign_id: 20 };
const base = { testCase, featureId: 10, campaignId: 20 };
const rejectsWith = (message) => (err) =>
  err instanceof AppError && err.statusCode === 400 && err.message === message;

describe('anomalyGuard — anomalie conditionnée par un cas de test non validé', () => {
  test('autorise une anomalie sur un cas en échec ou bloqué', () => {
    for (const latestResult of ['failed', 'blocked']) {
      assert.doesNotThrow(() => assertCanReportAnomaly({ ...base, latestResult }));
    }
  });

  test('refuse une anomalie sur un cas réussi, non exécuté ou non applicable', () => {
    for (const latestResult of ['passed', 'not_run', 'skipped', null]) {
      assert.throws(
        () => assertCanReportAnomaly({ ...base, latestResult }),
        rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseNotFailed)
      );
    }
  });

  test('refuse une anomalie sans cas de test', () => {
    assert.throws(
      () => assertCanReportAnomaly({ ...base, testCase: null, latestResult: 'failed' }),
      rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseRequired)
    );
  });

  test('refuse un cas d\'une autre fonctionnalité ou campagne', () => {
    assert.throws(
      () => assertCanReportAnomaly({ ...base, featureId: 11, latestResult: 'failed' }),
      rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseMismatch)
    );
    assert.throws(
      () => assertCanReportAnomaly({ ...base, campaignId: 21, latestResult: 'failed' }),
      rejectsWith(ANOMALY_GUARD_MESSAGES.testCaseMismatch)
    );
  });
});

describe('anomalyGuard — affectation aux développeurs de la campagne', () => {
  test('accepte un développeur de la campagne, ou aucune affectation', () => {
    assert.doesNotThrow(() => assertAssigneeIsCampaignDeveloper(15, [15, 16]));
    assert.doesNotThrow(() => assertAssigneeIsCampaignDeveloper('16', [15, 16]));
    assert.doesNotThrow(() => assertAssigneeIsCampaignDeveloper(null, []));
    assert.doesNotThrow(() => assertAssigneeIsCampaignDeveloper(undefined, []));
  });

  test('refuse un utilisateur hors de l équipe développeurs de la campagne', () => {
    assert.throws(
      () => assertAssigneeIsCampaignDeveloper(13, [15, 16]),
      rejectsWith(ANOMALY_GUARD_MESSAGES.assigneeNotCampaignDeveloper)
    );
  });
});

describe('anomalyGuard — RG-8 délai de correction des anomalies hautes', () => {
  const rg8 = (mode = 'warning', value = 7) => ({
    id: 'RG-8', label: 'Délai de correction gravité haute', active: true,
    value, unit: 'days', comparator: 'lte', mode,
  });
  const from = '2026-10-01T09:00:00Z';

  test('sans échéance : fixée à création + RG-8 jours pour une gravité haute', () => {
    const r = applyCorrectionDelay({ severity: 'high', dueDate: null, from, rule: rg8() });
    assert.equal(r.dueDate, '2026-10-08T09:00:00.000Z');
  });

  test('gravité non haute ou règle inactive : aucune contrainte', () => {
    assert.equal(applyCorrectionDelay({ severity: 'medium', dueDate: null, from, rule: rg8() }).dueDate, null);
    const inactive = { ...rg8('blocking'), active: false };
    assert.doesNotThrow(() => applyCorrectionDelay({ severity: 'high', dueDate: '2026-12-31', from, rule: inactive }));
  });

  test('échéance trop lointaine : refusée si bloquante, signalée si avertissement', () => {
    assert.throws(
      () => applyCorrectionDelay({ severity: 'critical', dueDate: '2026-10-15', from, rule: rg8('blocking') }),
      (e) => e.statusCode === 400 && /RG-8 .* 14 jours \(attendu ≤ 7 jours\)/.test(e.message)
    );
    const r = applyCorrectionDelay({ severity: 'high', dueDate: '2026-10-15', from, rule: rg8('warning') });
    assert.equal(r.verdict.ok, false);
  });

  test('échéance dans le délai : acceptée', () => {
    const r = applyCorrectionDelay({ severity: 'high', dueDate: '2026-10-07', from, rule: rg8('blocking') });
    assert.equal(r.verdict.ok, true);
  });

  test('gravité inconnue et date invalide refusées', () => {
    assert.throws(() => assertAnomalyLevel('urgent', 'Gravité'), (e) => e.statusCode === 400);
    assert.doesNotThrow(() => assertAnomalyLevel(undefined, 'Gravité'));
    assert.throws(() => applyCorrectionDelay({ severity: 'high', dueDate: 'pas une date', from, rule: rg8() }), (e) => e.statusCode === 400);
  });
});

