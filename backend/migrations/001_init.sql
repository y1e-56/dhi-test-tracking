-- Database creation (run separately if needed)
-- CREATE DATABASE dhi_test_tracking;

-- Enum types
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'chef_testeur', 'tester', 'developer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE campaign_status AS ENUM ('planning', 'in_progress', 'completed', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE feature_status AS ENUM ('pending', 'conforme', 'anomaly_detected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE anomaly_status AS ENUM ('new', 'in_progress', 'resolution_signaled', 'validated', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE organization_mode AS ENUM ('exploratory', 'scenario', 'combination');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE notification_type AS ENUM ('anomaly_reported', 'resolution_signaled', 'reopened');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'feature_conforme';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE entity_type AS ENUM ('project', 'campaign', 'feature', 'anomaly', 'user');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE action_type AS ENUM ('created', 'updated', 'archived', 'deleted', 'status_changed', 'assigned', 'commented');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE priority_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE assignment_status AS ENUM ('pending', 'in_progress', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'tester',
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  objective TEXT,
  organization_mode organization_mode NOT NULL DEFAULT 'exploratory',
  start_date DATE,
  end_date DATE,
  test_lead_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status campaign_status NOT NULL DEFAULT 'planning',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Features table
CREATE TABLE IF NOT EXISTS features (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  priority priority_level NOT NULL DEFAULT 'medium',
  status feature_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Test cases table
CREATE TABLE IF NOT EXISTS test_cases (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER REFERENCES features(id) ON DELETE CASCADE,
  campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  expected_result TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure legacy schemas get campaign_id on test_cases
DO $$ BEGIN
  BEGIN
    ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES campaigns(id) ON DELETE CASCADE;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Anomalies table
CREATE TABLE IF NOT EXISTS anomalies (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  test_case_id INTEGER REFERENCES test_cases(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  reported_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
  status anomaly_status NOT NULL DEFAULT 'new',
  resolution_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure legacy schemas get the test_case_id column
DO $$ BEGIN
  BEGIN
    ALTER TABLE anomalies ADD COLUMN IF NOT EXISTS test_case_id INTEGER REFERENCES test_cases(id) ON DELETE SET NULL;
  EXCEPTION WHEN duplicate_column THEN NULL;
  END;
END $$;

-- Assignments table (feature-to-user assignments)
CREATE TABLE IF NOT EXISTS assignments (
  id SERIAL PRIMARY KEY,
  feature_id INTEGER NOT NULL REFERENCES features(id) ON DELETE CASCADE,
  assigned_to INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status assignment_status NOT NULL DEFAULT 'pending',
  UNIQUE(feature_id, assigned_to)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  notified_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  anomaly_id INTEGER REFERENCES anomalies(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Campaign team members
CREATE TABLE IF NOT EXISTS campaign_members (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  team_type VARCHAR(20) NOT NULL CHECK (team_type IN ('tester', 'developer')),
  UNIQUE(campaign_id, user_id)
);

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS link_url TEXT;

-- History actions table
CREATE TABLE IF NOT EXISTS history_actions (
  id SERIAL PRIMARY KEY,
  entity_type entity_type NOT NULL,
  entity_id INTEGER NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action_type action_type NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_campaigns_project_id ON campaigns(project_id);
CREATE INDEX IF NOT EXISTS idx_features_campaign_id ON features(campaign_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_feature_id ON anomalies(feature_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_test_case_id ON anomalies(test_case_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_campaign_id ON anomalies(campaign_id);
CREATE INDEX IF NOT EXISTS idx_anomalies_assigned_to ON anomalies(assigned_to);
CREATE INDEX IF NOT EXISTS idx_assignments_feature_id ON assignments(feature_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assigned_to ON assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_notified_user_id ON notifications(notified_user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id ON campaign_members(campaign_id);
CREATE INDEX IF NOT EXISTS idx_history_actions_entity_type_entity_id ON history_actions(entity_type, entity_id);
 