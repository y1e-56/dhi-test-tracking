-- Project test leads (many-to-many: a project can have multiple test leads)
CREATE TABLE IF NOT EXISTS project_test_leads (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(project_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_project_test_leads_project_id ON project_test_leads(project_id);
CREATE INDEX IF NOT EXISTS idx_project_test_leads_user_id ON project_test_leads(user_id);
