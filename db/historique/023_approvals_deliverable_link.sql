ALTER TABLE approvals
  ADD COLUMN IF NOT EXISTS deliverable_id integer REFERENCES deliverables(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_approvals_deliverable_id ON approvals(deliverable_id);