-- P4-07 : journal des messages de suivi traités en automatique (un par brouillon)
CREATE TABLE IF NOT EXISTS suivi_auto_journal (
  id                      bigserial PRIMARY KEY,
  org_id                  text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  agent_id                bigint NOT NULL,
  action_key              text NOT NULL DEFAULT 'envoi_suivi',
  suivi_id                bigint NOT NULL REFERENCES suivi_brouillons(id),
  etape_validee_id        bigint NOT NULL,
  execution_id            bigint NOT NULL,
  categorie               text NOT NULL,
  canal                   text NOT NULL DEFAULT 'email',
  brouillon               text NOT NULL,
  agent_run_id            bigint,
  cree_le                 timestamptz NOT NULL DEFAULT now(),
  correction_signalee_le  timestamptz,
  correction_signalee_par text,
  correction_motif        text,
  CONSTRAINT suivi_auto_journal_suivi_uniq UNIQUE (suivi_id)
);

CREATE INDEX IF NOT EXISTS idx_suivi_auto_journal_org
  ON suivi_auto_journal (org_id, agent_id, cree_le DESC);