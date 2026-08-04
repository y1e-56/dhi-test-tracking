-- Délai de correction des anomalies (pré-rempli depuis l'échéance de la tâche, modifiable)
ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS correction_due_date TIMESTAMPTZ;
