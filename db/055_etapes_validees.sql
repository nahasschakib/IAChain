-- P4-07 : événement « étape validée » (une ligne par approbation validée rattachée à une exécution)
CREATE TABLE IF NOT EXISTS etapes_validees (
  id           bigserial PRIMARY KEY,
  org_id       text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  execution_id bigint NOT NULL,
  node_key     text NOT NULL,
  approval_id  bigint NOT NULL,
  agent_id     bigint,
  tag          text,
  decided_by   text,
  payload      jsonb NOT NULL DEFAULT '{}'::jsonb,
  statut       text NOT NULL DEFAULT 'nouveau'
               CHECK (statut IN ('nouveau', 'traite', 'ignore')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT etapes_validees_approval_uniq UNIQUE (approval_id)
);

CREATE INDEX IF NOT EXISTS idx_etapes_validees_org_statut
  ON etapes_validees (org_id, statut, created_at DESC);