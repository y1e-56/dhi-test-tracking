-- S1 : Portefeuille produits, releases et environnements (CDC §6.1, §6.3)
DO $$ BEGIN
  CREATE TYPE release_status AS ENUM ('planned', 'in_progress', 'released', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE environment_type AS ENUM ('development', 'integration', 'staging', 'production');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Rôle quality_manager pour les permissions CRUD du portefeuille
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'quality_manager';

-- Types d'entités pour l'audit (history_actions)
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'product';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'release';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'environment';

CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  quality_manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS releases (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  version VARCHAR(50) NOT NULL,
  description TEXT,
  status release_status NOT NULL DEFAULT 'planned',
  planned_date DATE,
  released_at TIMESTAMPTZ,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, version)
);

CREATE TABLE IF NOT EXISTS environments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  type environment_type NOT NULL DEFAULT 'integration',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, name)
);

CREATE INDEX IF NOT EXISTS idx_releases_product_id ON releases(product_id);
CREATE INDEX IF NOT EXISTS idx_environments_product_id ON environments(product_id);
