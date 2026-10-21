-- db/062_catalogue_prestations.sql
-- P4-09 (1/4) : catalogue de prestations par organisation, source unique des prix et des lignes
-- des chiffrages de Salma. Idempotent. Les devis figent leurs lignes dans le résultat de l'agent :
-- modifier le catalogue ne change jamais un devis déjà produit.

CREATE TABLE IF NOT EXISTS catalogue_prestations (
  id          serial PRIMARY KEY,
  org_id      text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  libelle     text NOT NULL CHECK (length(btrim(libelle)) BETWEEN 1 AND 120),
  description text CHECK (description IS NULL OR length(description) <= 400),
  unite       text NOT NULL DEFAULT 'forfait' CHECK (unite IN ('forfait', 'jour', 'mois', 'unité')),
  prix_ht     numeric(12,2) NOT NULL CHECK (prix_ht >= 0),
  delai_jours integer CHECK (delai_jours IS NULL OR delai_jours BETWEEN 1 AND 730),
  actif       boolean NOT NULL DEFAULT true,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Un libellé par organisation, sans tenir compte de la casse ni des espaces de bord.
CREATE UNIQUE INDEX IF NOT EXISTS catalogue_prestations_libelle_unique
  ON catalogue_prestations (org_id, lower(btrim(libelle)));

CREATE INDEX IF NOT EXISTS catalogue_prestations_org_actif
  ON catalogue_prestations (org_id, actif);

-- Vérification (lecture seule) : colonnes de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'catalogue_prestations'
ORDER BY ordinal_position;