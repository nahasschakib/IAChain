CREATE TABLE IF NOT EXISTS agent_runs (
  id             SERIAL PRIMARY KEY,
  org_id         TEXT NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  agent_id       INTEGER NOT NULL REFERENCES agents(id),
  user_id        TEXT,
  input          JSONB NOT NULL,
  result         JSONB,
  model          TEXT,
  input_tokens   INTEGER,
  output_tokens  INTEGER,
  status         TEXT NOT NULL DEFAULT 'ok',
  error          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS agent_runs_org_idx ON agent_runs (org_id, created_at DESC);