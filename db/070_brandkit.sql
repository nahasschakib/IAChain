-- db/070_brandkit.sql
-- Brand kit de l'organisation : identité légale saisie une fois, réutilisée par les processus.
-- Reprend l'identité de facture_emetteur (db/069) puis la réduit aux paramètres de facturation.
-- Idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS org_brandkit (
  org_id text PRIMARY KEY REFERENCES tenants(org_id) ON UPDATE CASCADE,
  raison_sociale text,
  nom_commercial text,
  forme_juridique text,
  capital_social numeric(14,2),
  ice text,
  identifiant_fiscal text,
  rc text,
  rc_tribunal text,
  taxe_professionnelle text,
  cnss text,
  adresse text,
  ville text,
  code_postal text,
  pays text NOT NULL DEFAULT 'Maroc',
  telephone text,
  email_contact text,
  site_web text,
  banque text,
  rib text,
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT org_brandkit_ice_format CHECK (ice IS NULL OR ice ~ '^[0-9]{15}$'),
  CONSTRAINT org_brandkit_rib_format CHECK (rib IS NULL OR rib ~ '^[0-9]{24}$')
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'facture_emetteur') THEN
    INSERT INTO org_brandkit
      (org_id, raison_sociale, forme_juridique, ice, identifiant_fiscal, rc,
       taxe_professionnelle, adresse, ville, rib, updated_by, updated_at)
    SELECT org_id, raison_sociale, forme_juridique, ice, identifiant_fiscal, rc,
           patente, adresse, ville, rib, updated_by, updated_at
    FROM facture_emetteur
    ON CONFLICT (org_id) DO NOTHING;

    ALTER TABLE facture_emetteur
      DROP COLUMN IF EXISTS raison_sociale,
      DROP COLUMN IF EXISTS forme_juridique,
      DROP COLUMN IF EXISTS ice,
      DROP COLUMN IF EXISTS identifiant_fiscal,
      DROP COLUMN IF EXISTS rc,
      DROP COLUMN IF EXISTS patente,
      DROP COLUMN IF EXISTS adresse,
      DROP COLUMN IF EXISTS ville,
      DROP COLUMN IF EXISTS rib;

    ALTER TABLE facture_emetteur RENAME TO facture_parametres;
  END IF;
END $$;

COMMIT;