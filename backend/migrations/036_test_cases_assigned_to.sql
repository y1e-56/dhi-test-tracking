-- Affectation d'un cas de test a un testeur, reellement persistee.
--
--Jusqu'ici le testeur n'existait que dans le localStorage du navigateur : il
-- disparaissait au rechargement et n'etait partage par personne. La colonne
-- reference users(id) comme le fait deja anomalies.assigned_to.
--
-- Le nom affichable est derive (first_name + last_name), pas stocke en double :
-- une seule source de verite, et un renommage de l'utilisateur se propage.

ALTER TABLE test_cases
  ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Index sur la colonne : les ecrans filtrent par testeur (charge, affectation).
-- CREATE INDEX IF NOT EXISTS rend l'operation repetable.
CREATE INDEX IF NOT EXISTS idx_test_cases_assigned_to ON test_cases(assigned_to);

COMMENT ON COLUMN test_cases.assigned_to IS
  'Testeur affecte au cas de test (rejoint a users pour le nom affichable)';
