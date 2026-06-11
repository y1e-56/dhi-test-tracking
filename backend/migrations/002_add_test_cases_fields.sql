DO $$ BEGIN
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS steps TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS priority priority_level NOT NULL DEFAULT 'medium';
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
