-- db/061_politique_tarifaire.sql
-- P4-09d (1/3) : politique tarifaire unique par organisation (remises), versionnée.
-- Lue par Karim (remise admissible) et par Nadia (contrôle de la remise proposée).
-- Aucun chiffre par défaut : sans politique active, Karim annonce « non définie »
-- et Nadia renvoie le dossier à un contrôle manuel.
-- Idempotent : peut être rejoué sans effet.

-- Une ligne par version ; une seule version active par organisation.
CREATE TABLE IF NOT EXISTS politique_tarifaire (
  id          serial PRIMARY KEY,
  org_id      text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  version     integer NOT NULL,
  statut      text NOT NULL CHECK (statut IN ('active', 'archivee')),
  motifs      jsonb NOT NULL DEFAULT '[]'::jsonb,   -- motifs d'exception autorisés (liste de textes)
  note        text,
  created_by  text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, version)
);

CREATE UNIQUE INDEX IF NOT EXISTS politique_tarifaire_une_active
  ON politique_tarifaire (org_id) WHERE statut = 'active';

-- Plafonds de remise (en %) par grille :
--   standard, grands_comptes : remise maximale sans dérogation ;
--   derogation               : remise maximale absolue, avec motif et approbation de la direction.
CREATE TABLE IF NOT EXISTS politique_grilles (
  politique_id integer NOT NULL REFERENCES politique_tarifaire(id) ON DELETE CASCADE,
  code         text NOT NULL CHECK (code IN ('standard', 'grands_comptes', 'derogation')),
  plafond_pct  numeric(5,2) NOT NULL CHECK (plafond_pct >= 0 AND plafond_pct <= 100),
  PRIMARY KEY (politique_id, code)
);

-- Rattachement de chaque segment de l'organisation (org_options, kind = 'segment') à une grille.
CREATE TABLE IF NOT EXISTS politique_segments (
  politique_id integer NOT NULL REFERENCES politique_tarifaire(id) ON DELETE CASCADE,
  segment      text NOT NULL,
  grille_code  text NOT NULL CHECK (grille_code IN ('standard', 'grands_comptes')),
  PRIMARY KEY (politique_id, segment)
);

-- Vérification (lecture seule)
SELECT table_name::text AS table_creee
FROM information_schema.tables
WHERE table_name IN ('politique_tarifaire', 'politique_grilles', 'politique_segments')
ORDER BY 1;