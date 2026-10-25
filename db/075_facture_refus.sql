CREATE TABLE IF NOT EXISTS facture_refus (
  id SERIAL PRIMARY KEY,
  org_id TEXT NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  validation_id INTEGER NOT NULL,
  verdict TEXT NOT NULL,
  motif TEXT NOT NULL,
  action_corrective TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_facture_refus_org_validation
  ON facture_refus (org_id, validation_id, id DESC);