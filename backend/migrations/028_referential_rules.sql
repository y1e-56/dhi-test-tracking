-- Référentiels & règles de qualité
-- Domaines sans équivalent backend jusqu'ici (module ajouté ryan-back-end)

CREATE TABLE IF NOT EXISTS referential_rules (
  id         TEXT PRIMARY KEY,
  domain     TEXT NOT NULL,
  label      TEXT NOT NULL,
  threshold  TEXT NOT NULL,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO referential_rules (id, domain, label, threshold, active) VALUES
  ('RG-1',  'Santé',      'Seuil sain',                        '≥ 85/100',              TRUE),
  ('RG-2',  'Santé',      'Seuil à surveiller',                '≥ 75/100',              TRUE),
  ('RG-3',  'Santé',      'Seuil à risque',                    '≥ 60/100',              TRUE),
  ('RG-4',  'Campagne',   'Taux d''exécution minimal avant clôture', '≥ 95 %',          TRUE),
  ('RG-5',  'Campagne',   'Taux de succès minimal',            '≥ 90 %',                TRUE),
  ('RG-6',  'Couverture', 'Couverture fonctionnelle cible',    '≥ 90 %',                TRUE),
  ('RG-7',  'Couverture', 'Couverture fonctionnalité critique','100 %, types obligatoires', TRUE),
  ('RG-8',  'Anomalies',  'Délai de correction gravité haute', '≤ 7 jours',             TRUE),
  ('RG-9',  'Go Live',    'Anomalies hautes ouvertes tolérées','0',                     TRUE),
  ('RG-10', 'Go Live',    'Complétude checklist minimale pour GO', '≥ 85 %',            FALSE)
ON CONFLICT (id) DO UPDATE SET
  domain = EXCLUDED.domain, label = EXCLUDED.label,
  threshold = EXCLUDED.threshold, active = EXCLUDED.active, updated_at = NOW();