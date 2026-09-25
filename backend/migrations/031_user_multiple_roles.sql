-- 031: un utilisateur peut cumuler plusieurs rôles
-- users.role reste le « rôle principal » (le plus privilégié) pour l'historique
-- et la compatibilité ; users.roles contient la liste complète des rôles.

ALTER TABLE users ADD COLUMN IF NOT EXISTS roles TEXT[];

-- initialisation : chaque utilisateur existant démarre avec son rôle actuel
UPDATE users SET roles = ARRAY[role] WHERE roles IS NULL OR array_length(roles, 1) = 0;

ALTER TABLE users ALTER COLUMN roles SET DEFAULT ARRAY['lecteur']::TEXT[];
ALTER TABLE users ALTER COLUMN roles SET NOT NULL;