-- Durée d'assignation des tâches (jours) + échéance calculée
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS duration_days INTEGER;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

-- Rétro-remplissage des échéances pour les assignations existantes ayant une durée
UPDATE assignments
SET due_date = assigned_at + (duration_days * INTERVAL '1 day')
WHERE due_date IS NULL AND duration_days IS NOT NULL;
