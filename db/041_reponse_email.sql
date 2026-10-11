ALTER TABLE emails_entrants
  ADD COLUMN IF NOT EXISTS reponse_brouillon text,
  ADD COLUMN IF NOT EXISTS reponse_agent_run_id integer REFERENCES agent_runs(id) ON DELETE SET NULL;