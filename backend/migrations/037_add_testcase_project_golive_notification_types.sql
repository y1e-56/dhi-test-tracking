-- Notifications in-app : affectation d'un cas de test, fin d'un projet (archivage), décision Go-Live
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'test_case_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project_archived';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'go_live_decision';
