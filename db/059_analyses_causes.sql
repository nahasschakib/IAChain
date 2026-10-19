-- P4-08 : analyses de causes racines de Hamza (RCL-10), une ligne par analyse
CREATE TABLE IF NOT EXISTS analyses_causes (
  id              bigserial PRIMARY KEY,
  org_id          text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  agent_id        bigint NOT NULL,
  agent_run_id    bigint,
  periode_debut   timestamptz NOT NULL,
  periode_fin     timestamptz NOT NULL,
  nb_emails       integer NOT NULL,
  synthese        text NOT NULL,
  causes          jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommandations jsonb NOT NULL DEFAULT '[]'::jsonb,
  statut          text NOT NULL DEFAULT 'brouillon'
                  CHECK (statut IN ('brouillon', 'a_valider', 'valide', 'rejete')),
  decided_by      text,
  decided_at      timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analyses_causes_org_statut
  ON analyses_causes (org_id, statut, created_at DESC);