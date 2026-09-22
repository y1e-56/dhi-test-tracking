-- Séparation des responsabilités : une résolution ne peut pas être validée par son auteur.
-- resolved_by  : utilisateur qui a signalé la résolution de l'anomalie
-- validated_by : utilisateur qui a validé la résolution (contrôle qualité)
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS validated_by INTEGER REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_anomalies_resolved_by ON anomalies(resolved_by);
CREATE INDEX IF NOT EXISTS idx_anomalies_validated_by ON anomalies(validated_by);