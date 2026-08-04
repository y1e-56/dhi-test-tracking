-- Notification in-app lors de la création d'un projet (chefs de test concernés)
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project_created';
