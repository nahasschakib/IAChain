-- db/069_factures_efacture.sql
-- P4-10i (1/n) : facturation de Karima, prête pour l'e-facture (DGI, art. 145-IX du CGI).
-- Aucun connecteur DGI : le décret et la spécification d'API ne sont pas publiés.
-- Ici : identité légale du client, paramètres d'émetteur, factures, numérotation, état de transmission.
-- Idempotent.

BEGIN;

-- 1. Identité légale du client (B2B : l'ICE du client est requis pour facturer).
ALTER TABLE crm_accounts
  ADD COLUMN IF NOT EXISTS ice text,
  ADD COLUMN IF NOT EXISTS identifiant_fiscal text,
  ADD COLUMN IF NOT EXISTS rc text,
  ADD COLUMN IF NOT EXISTS adresse text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_accounts_ice_format') THEN
    ALTER TABLE crm_accounts
      ADD CONSTRAINT crm_accounts_ice_format CHECK (ice IS NULL OR ice ~ '^[0-9]{15}$');
  END IF;
END $$;

-- 2. Émetteur et paramètres de facturation, par organisation.
CREATE TABLE IF NOT EXISTS facture_emetteur (
  org_id text PRIMARY KEY REFERENCES tenants(org_id) ON UPDATE CASCADE,
  raison_sociale text,
  forme_juridique text,
  ice text,
  identifiant_fiscal text,
  rc text,
  patente text,
  adresse text,
  ville text,
  rib text,
  delai_paiement_jours integer NOT NULL DEFAULT 30 CHECK (delai_paiement_jours BETWEEN 0 AND 120),
  mode_efacture text NOT NULL DEFAULT 'desactive' CHECK (mode_efacture IN ('desactive', 'clearance')),
  updated_by text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT facture_emetteur_ice_format CHECK (ice IS NULL OR ice ~ '^[0-9]{15}$')
);

-- 3. Compteur de numérotation (annuel, par organisation).
CREATE TABLE IF NOT EXISTS facture_sequences (
  org_id text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  annee integer NOT NULL,
  dernier integer NOT NULL DEFAULT 0,
  PRIMARY KEY (org_id, annee)
);

-- 4. Factures. Les identités émetteur et client sont copiées au moment de la facture (instantané).
CREATE TABLE IF NOT EXISTS factures (
  id serial PRIMARY KEY,
  org_id text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  salma_run_id integer NOT NULL,
  validation_id integer NOT NULL,
  execution_id bigint,
  client text NOT NULL,
  client_account_id integer,
  client_ice text,
  client_identifiant_fiscal text,
  client_rc text,
  client_adresse text,
  emetteur jsonb NOT NULL DEFAULT '{}'::jsonb,
  lignes jsonb NOT NULL DEFAULT '[]'::jsonb,
  remise_pct numeric(5,2) NOT NULL DEFAULT 0,
  total_ht numeric(14,2) NOT NULL,
  total_tva numeric(14,2) NOT NULL,
  total_ttc numeric(14,2) NOT NULL,
  tva_detail jsonb NOT NULL DEFAULT '[]'::jsonb,
  devise text NOT NULL DEFAULT 'MAD',
  date_emission date,
  date_echeance date,
  annee integer,
  seq integer,
  numero text,
  texte text,
  texte_source text CHECK (texte_source IN ('ia', 'modele')),
  statut text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'a_valider', 'valide', 'rejete')),
  agent_run_id integer,
  version text,
  created_by text,
  decided_by text,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT factures_ice_client_format CHECK (client_ice IS NULL OR client_ice ~ '^[0-9]{15}$'),
  CONSTRAINT factures_numero_si_valide CHECK ((statut = 'valide') = (numero IS NOT NULL))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_factures_numero
  ON factures (org_id, numero) WHERE numero IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS ux_factures_seq
  ON factures (org_id, annee, seq) WHERE seq IS NOT NULL;
-- Une seule facture active par devis validé.
CREATE UNIQUE INDEX IF NOT EXISTS ux_factures_validation_active
  ON factures (org_id, validation_id) WHERE statut IN ('brouillon', 'a_valider', 'valide');
CREATE INDEX IF NOT EXISTS idx_factures_org ON factures (org_id, id DESC);

-- 5. État de transmission à la plateforme (indépendant du fournisseur ; DGI aujourd'hui, rien d'actif).
CREATE TABLE IF NOT EXISTS facture_transmissions (
  id serial PRIMARY KEY,
  org_id text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  facture_id integer NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  fournisseur text NOT NULL DEFAULT 'dgi',
  statut text NOT NULL DEFAULT 'non_transmise'
    CHECK (statut IN ('non_transmise', 'soumise', 'validee_dgi', 'rejetee_dgi')),
  identifiant_dgi text,
  horodatage_dgi timestamptz,
  motif_rejet text,
  xml text,
  xml_profil text,
  signature_ref text,
  tentatives integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (facture_id, fournisseur)
);
CREATE INDEX IF NOT EXISTS idx_facture_transmissions_org ON facture_transmissions (org_id, statut);

COMMIT;