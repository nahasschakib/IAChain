-- P4-10d : validation humaine du devis (après le contrôle de remise de Nadia).
-- Un devis validé crée l'exécution « Prospect to Cash » du dossier et alimente le suivi d'avancement (Soumaya).
CREATE TABLE IF NOT EXISTS devis_validations (
  id           serial PRIMARY KEY,
  org_id       text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  salma_run_id integer NOT NULL,
  nadia_run_id integer,
  client       text NOT NULL,
  verdict      text NOT NULL,
  statut       text NOT NULL DEFAULT 'a_valider' CHECK (statut IN ('a_valider', 'valide', 'rejete')),
  execution_id bigint,
  created_by   text,
  decided_by   text,
  decided_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_devis_validations_org ON devis_validations (org_id, created_at DESC);
-- Une seule validation en attente ou acquise par proposition ; un rejet permet un nouveau contrôle.
CREATE UNIQUE INDEX IF NOT EXISTS uq_devis_validations_actif
  ON devis_validations (org_id, salma_run_id) WHERE statut IN ('a_valider', 'valide');

SELECT 'table' k, COUNT(*)::text v FROM devis_validations;