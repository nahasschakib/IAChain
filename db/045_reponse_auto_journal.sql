-- db/045 : journal des brouillons de réponse traités en automatique (P4-06b)
-- Une ligne par brouillon produit sans validation humaine. Les colonnes
-- correction_* servent au signalement d'une correction (rétrogradation).

CREATE TABLE IF NOT EXISTS reponse_auto_journal (
  id                      serial PRIMARY KEY,
  org_id                  text        NOT NULL,
  agent_id                integer     NOT NULL,
  action_key              text        NOT NULL,
  email_id                uuid        REFERENCES emails_entrants(id) ON DELETE SET NULL,
  execution_id            integer,
  categorie               text        NOT NULL,
  priorite                text,
  canal                   text        NOT NULL DEFAULT 'email',
  brouillon               text        NOT NULL,
  agent_run_id            integer,
  cree_le                 timestamptz NOT NULL DEFAULT now(),
  correction_signalee_le  timestamptz,
  correction_signalee_par text,
  correction_motif        text
);

CREATE INDEX IF NOT EXISTS reponse_auto_journal_recent_idx
  ON reponse_auto_journal (org_id, agent_id, action_key, cree_le DESC);