-- Couverture fonctionnelle par fonctionnalité
-- Matrice de couverture : feature ↔ types de test (Partial<Record<TestType, boolean>>)

ALTER TABLE features ADD COLUMN IF NOT EXISTS coverage JSONB NOT NULL DEFAULT '{}'::jsonb;