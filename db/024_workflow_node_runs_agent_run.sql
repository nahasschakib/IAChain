-- Lie chaque exécution d'étape de workflow au run d'agent réel qui l'a produite
ALTER TABLE workflow_node_runs
  ADD COLUMN IF NOT EXISTS agent_run_id integer
  REFERENCES agent_runs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_workflow_node_runs_agent_run
  ON workflow_node_runs(agent_run_id);