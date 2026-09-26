-- Notifications in-app à la création d'un produit et d'une campagne
-- (destinataires affectés à l'entité créée)
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'product_created';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'campaign_created';