CREATE TABLE IF NOT EXISTS org_autonomie_seuil (
  id          bigserial PRIMARY KEY,
  org_id      text        NOT NULL,
  agent_id    integer     NOT NULL,
  action_key  text        NOT NULL,
  seuil       integer     NOT NULL CHECK (seuil BETWEEN 5 AND 200),
  modifie_par text        NOT NULL,
  modifie_le  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, agent_id, action_key)
);