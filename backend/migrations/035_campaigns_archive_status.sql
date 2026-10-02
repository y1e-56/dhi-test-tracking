-- Conserve le statut d'une campagne avant archivage, afin qu'une restauration
-- du projet ne remette pas toutes ses campagnes en 'planning'.
--
-- Idempotent ET non destructif : initDb rejoue toutes les migrations a chaque
-- demarrage, donc un DROP COLUMN effacerait le statut de repli des campagnes
-- archivees entre deux redemarrages. La colonne n'est jamais supprimee ici.

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS status_before_archive campaign_status;

-- Une version anterieure de cette migration avait cree la colonne en TEXT sur
-- les bases ou la colonne existait deja. On convertit dans ce cas, et seulement
-- dans ce cas : un ALTER TYPE reecrit la table, inutile si le type est deja bon.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'campaigns'
      AND column_name = 'status_before_archive'
      AND udt_name <> 'campaign_status'
  ) THEN
    EXECUTE 'ALTER TABLE campaigns
             ALTER COLUMN status_before_archive TYPE campaign_status
             USING status_before_archive::campaign_status';
  END IF;
END $$;

-- Les campagnes deja archivees avant cette migration n'ont pas de statut de repli.
-- WHERE IS NULL rend l'operation repetable sans ecraser les statuts deja memorises.
UPDATE campaigns
SET status_before_archive = 'planning'
WHERE status = 'archived' AND status_before_archive IS NULL;
