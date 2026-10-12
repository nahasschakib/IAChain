-- db/043 : suivi des décisions humaines sur les brouillons de réponse (P4-06b)
-- Une ligne par demande « Réponse support » traitée. Sert à calculer, sans
-- compteur stocké, le nombre de brouillons acceptés d'affilée sans correction.

CREATE TABLE IF NOT EXISTS reponse_revisions (
  id                 serial PRIMARY KEY,
  org_id             text        NOT NULL,
  approval_id        integer     NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  email_id           uuid        REFERENCES emails_entrants(id) ON DELETE SET NULL,
  agent_id           integer     NOT NULL,
  categorie          text        NOT NULL,
  priorite           text,
  canal              text        NOT NULL DEFAULT 'email',
  decision           text        NOT NULL CHECK (decision IN ('approuve', 'rejete')),
  brouillon_original text        NOT NULL,
  texte_final        text,
  modifie            boolean     NOT NULL DEFAULT false,
  decided_by         text        NOT NULL,
  decided_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT reponse_revisions_approval_uniq UNIQUE (approval_id)
);

CREATE INDEX IF NOT EXISTS reponse_revisions_serie_idx
  ON reponse_revisions (org_id, agent_id, canal, categorie, decided_at DESC);