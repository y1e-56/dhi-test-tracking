-- Ajoute automatiquement le chef testeur créateur comme chef de sa campagne
-- pour toutes les campagnes existantes (retrouvé via l'historique de création)

INSERT INTO campaign_test_leads (campaign_id, user_id)
SELECT DISTINCT h.entity_id, h.user_id
FROM history_actions h
JOIN users u ON u.id = h.user_id
JOIN campaigns c ON c.id = h.entity_id
WHERE h.entity_type = 'campaign'
  AND h.action_type = 'created'
  AND h.user_id IS NOT NULL
  AND u.role IN ('chef_testeur', 'test_lead')
ON CONFLICT (campaign_id, user_id) DO NOTHING;
