DO $$ BEGIN
  ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'chef_testeur';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
