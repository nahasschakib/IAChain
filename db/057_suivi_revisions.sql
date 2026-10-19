-- P4-07 : suivi des corrections de Soumaya (une ligne par message de suivi décidé)
CREATE TABLE IF NOT EXISTS suivi_revisions (
  id                 bigserial PRIMARY KEY,
  org_id             text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  approval_id        bigint NOT NULL,
  suivi_id           bigint NOT NULL REFERENCES suivi_brouillons(id),
  agent_id           bigint NOT NULL,
  categorie          text NOT NULL,
  canal              text NOT NULL DEFAULT 'email',
  decision           text NOT NULL CHECK (decision IN ('approuve', 'rejete')),
  brouillon_original text NOT NULL,
  texte_final        text,
  modifie            boolean NOT NULL DEFAULT false,
  decided_by         text,
  decided_at         timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT suivi_revisions_approval_uniq UNIQUE (approval_id)
);

CREATE INDEX IF NOT EXISTS idx_suivi_revisions_serie
  ON suivi_revisions (org_id, agent_id, canal, categorie, decided_at DESC);