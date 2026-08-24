-- S1 : Liens produits ↔ projets et campagnes ↔ releases/environnements
-- CDC §6.2, §18 (BF-060) et RG-005 : toute campagne doit viser une version déterminée.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS release_id INTEGER REFERENCES releases(id) ON DELETE SET NULL;
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS environment_id INTEGER REFERENCES environments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_product_id ON projects(product_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_release_id ON campaigns(release_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_environment_id ON campaigns(environment_id);
