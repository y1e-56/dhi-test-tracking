-- Champ propriétaire libre : propriétaire saisissable en texte (nom), en plus de l'owner_id (facultatif)
ALTER TABLE products ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Rétro-remplissage : reprendre le nom des owners existants (owner_id) vers owner_name
UPDATE products
SET owner_name = (SELECT u.first_name || ' ' || u.last_name FROM users u WHERE u.id = products.owner_id)
WHERE owner_name IS NULL AND owner_id IS NOT NULL;