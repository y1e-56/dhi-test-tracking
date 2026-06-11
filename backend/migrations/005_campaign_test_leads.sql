CREATE TABLE IF NOT EXISTS campaign_test_leads (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(campaign_id, user_id)
);

INSERT INTO campaign_test_leads (campaign_id, user_id)
  SELECT id, test_lead_id FROM campaigns WHERE test_lead_id IS NOT NULL
  ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_campaign_test_leads_campaign_id ON campaign_test_leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_test_leads_user_id ON campaign_test_leads(user_id);
