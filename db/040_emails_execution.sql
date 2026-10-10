ALTER TABLE emails_entrants
  ADD COLUMN IF NOT EXISTS execution_id integer REFERENCES workflow_executions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_emails_entrants_execution ON emails_entrants (execution_id);