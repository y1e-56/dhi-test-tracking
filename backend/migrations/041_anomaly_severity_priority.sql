-- Gravite et priorite d'une anomalie : saisies dans l'interface mais jamais
-- stockees jusqu'ici (toute anomalie redevenait « moyenne » au rechargement).
-- RG-8 (delai de correction) s'applique aux anomalies de gravite haute.
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS severity priority_level NOT NULL DEFAULT 'medium';
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS priority priority_level NOT NULL DEFAULT 'medium';
