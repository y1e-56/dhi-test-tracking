-- Document référentiel de test (PDF/Word) attaché à une fonctionnalité
ALTER TABLE features ADD COLUMN IF NOT EXISTS attachment_path TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS attachment_name TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS attachment_type TEXT;
ALTER TABLE features ADD COLUMN IF NOT EXISTS attachment_size BIGINT;
