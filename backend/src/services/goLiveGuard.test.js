import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  assertGoLiveDecision,
  checklistCompletion,
  goLiveVerdicts,
} from './goLiveGuard.js';

const rules = (rg9 = 'blocking', rg10 = 'warning') =>
  new Map([
    ['RG-9', { id: 'RG-9', label: 'Anomalies hautes ouvertes tolérées', active: true, value: 0, unit: 'count', comparator: 'lte', mode: rg9 }],
    ['RG-10', { id: 'RG-10', label: 'Complétude checklist minimale pour GO', active: true, value: 85, unit: 'percent', comparator: 'gte', mode: rg10 }],
  ]);
const check = (verdict, openHigh, completion, r = rules()) => ({
  verdict,
  verdicts: goLiveVerdicts({ openHigh, completion, rules: r }),
});

describe('goLiveGuard — complétude de la checklist', () => {
  const template = [{ id: 'a', weight: 15 }, { id: 'b', weight: 85 }];
  test('rapportée au modèle complet, pas aux seuls items en base', () => {
    assert.equal(checklistCompletion(template, ['a']), 15);
    assert.equal(checklistCompletion(template, ['a', 'b']), 100);
    assert.equal(checklistCompletion(template, []), 0);
  });
});

describe('goLiveGuard — RG-9 / RG-10', () => {
  test('GO conforme : accepté sans confirmation', () => {
    assert.doesNotThrow(() => assertGoLiveDecision(check('GO', 0, 90), false));
  });

  test('GO avec une anomalie haute ouverte : refusé si RG-9 bloquante, même confirmé', () => {
    assert.throws(
      () => assertGoLiveDecision(check('GO', 1, 100), true),
      (e) => e.statusCode === 409 && /^Décision refusée : RG-9/.test(e.message)
    );
  });

  test('GO avec checklist insuffisante : à confirmer (RG-10 en avertissement)', () => {
    assert.throws(
      () => assertGoLiveDecision(check('GO', 0, 50), false),
      (e) => e.statusCode === 409 && /^Décision à confirmer : RG-10/.test(e.message)
    );
    assert.doesNotThrow(() => assertGoLiveDecision(check('GO', 0, 50), true));
  });

  test('GO conditionnel : les règles non respectées deviennent des réserves à confirmer', () => {
    assert.throws(() => assertGoLiveDecision(check('GO_CONDITIONNEL', 2, 50), false), /à confirmer/);
    assert.doesNotThrow(() => assertGoLiveDecision(check('GO_CONDITIONNEL', 2, 50), true));
  });

  test('NO GO et AJOURNÉ ne sont jamais freinés ; règle inactive ignorée', () => {
    assert.doesNotThrow(() => assertGoLiveDecision(check('NO_GO', 5, 0), false));
    assert.doesNotThrow(() => assertGoLiveDecision(check('AJOURNE', 5, 0), false));
    const r = rules();
    r.set('RG-9', { ...r.get('RG-9'), active: false });
    assert.doesNotThrow(() => assertGoLiveDecision(check('GO', 3, 100, r), false));
  });
});
