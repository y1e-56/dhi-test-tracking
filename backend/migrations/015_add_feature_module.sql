-- Ajout de la colonne module sur les fonctionnalités (utilisée pour la génération automatique des cas de test)
ALTER TABLE features ADD COLUMN IF NOT EXISTS module VARCHAR(255);
