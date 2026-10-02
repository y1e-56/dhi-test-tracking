-- Exigences : produit direct, priorité persistée, liaisons multiples fonctionnalités
--
-- Constat : requirements.feature_id est NOT NULL, ce qui interdit toute exigence non
-- encore rattachée à une fonctionnalité, et n'autorise qu'une seule fonctionnalité par
-- exigence. Le formulaire propose pourtant les deux cas.
--
-- 1) feature_id devient nullable
-- 2) product_id est ajouté : la chaîne features -> campagnes -> projects -> products
--    est rompue (projects.product_id NULL), on ne peut pas dériver le produit de la
--    seule fonctionnalité. Le produit devient une donnée propre de l'exigence.
-- 3) priority est ajouté en réutilisant l'enum priority_level existant (low/medium/high/critical)
-- 4) requirement_features remplace le many-to-one implicite

-- ── 1) feature_id nullable ────────────────────────────────────
ALTER TABLE requirements ALTER COLUMN feature_id DROP NOT NULL;

-- ── 2) Produit de l'exigence ───────────────────────────────────
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE CASCADE;

-- Rétro-remplissage : déduire le produit via la fonctionnalité -> campagne -> projet
UPDATE requirements r
SET product_id = pr.product_id
FROM features f
JOIN campaigns c ON c.id = f.campaign_id
JOIN projects pr ON pr.id = c.project_id
WHERE r.feature_id = f.id
  AND r.product_id IS NULL
  AND pr.product_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_requirements_product ON requirements(product_id);

-- ── 3) Priorité persistée ──────────────────────────────────────
-- Enum priority_level déjà défini par les fonctionnalités : low, medium, high, critical
ALTER TABLE requirements ADD COLUMN IF NOT EXISTS priority priority_level NOT NULL DEFAULT 'medium';

-- ── 4) Liaisons multiples exigences <-> fonctionnalités ────────
CREATE TABLE IF NOT EXISTS requirement_features (
  requirement_id INTEGER NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (requirement_id, feature_id)
);

CREATE INDEX IF NOT EXISTS idx_requirement_features_feature ON requirement_features(feature_id);

-- Rétro-remplissage : migrer la liaison directe existante vers la table de jointure
INSERT INTO requirement_features (requirement_id, feature_id)
SELECT r.id, r.feature_id
FROM requirements r
WHERE r.feature_id IS NOT NULL
ON CONFLICT DO NOTHING;
