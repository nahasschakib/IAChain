-- P4-07 : brouillons de messages de suivi de Soumaya (un par étape validée)
CREATE TABLE IF NOT EXISTS suivi_brouillons (
  id               bigserial PRIMARY KEY,
  org_id           text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  etape_validee_id bigint NOT NULL REFERENCES etapes_validees(id),
  execution_id     bigint NOT NULL,
  node_key         text NOT NULL,
  agent_id         bigint NOT NULL,
  agent_run_id     bigint,
  canal            text NOT NULL DEFAULT 'email',
  destinataire     text,
  texte            text NOT NULL,
  langue           text NOT NULL DEFAULT 'fr',
  statut           text NOT NULL DEFAULT 'brouillon'
                   CHECK (statut IN ('brouillon', 'a_valider', 'envoye', 'rejete', 'bloque')),
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suivi_brouillons_etape_uniq UNIQUE (etape_validee_id)
);

CREATE INDEX IF NOT EXISTS idx_suivi_brouillons_org_statut
  ON suivi_brouillons (org_id, statut, created_at DESC);