-- Multi-tenant : table des clients (tenants) + org_id sur les données client
-- SOCYTAY = exploitant de la plateforme ET premier client (actif d'office).
-- Rejouable sans risque.

CREATE TABLE IF NOT EXISTS tenants (
  org_id        text PRIMARY KEY,                 -- identifiant d'organisation Clerk (org_...)
  name          text NOT NULL,
  status        text NOT NULL DEFAULT 'en_attente'
                CHECK (status IN ('en_attente','actif','suspendu')),
  plan          text,
  payment_ref   text,                             -- référence du règlement, saisie à la validation
  is_platform   boolean NOT NULL DEFAULT false,   -- true = organisation exploitante
  created_at    timestamptz NOT NULL DEFAULT now(),
  activated_at  timestamptz
);

-- Un seul exploitant possible
CREATE UNIQUE INDEX IF NOT EXISTS tenants_one_platform ON tenants (is_platform) WHERE is_platform;

INSERT INTO tenants (org_id, name, status, plan, is_platform, activated_at)
VALUES ('org_3JjkPg8pWssYcm0Ij0zme1Z2lyl', 'SOCYTAY', 'actif', 'interne', true, now())
ON CONFLICT (org_id) DO NOTHING;

DO $$
DECLARE
  t text;
  socytay constant text := 'org_3JjkPg8pWssYcm0Ij0zme1Z2lyl';
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'approvals','approval_events','org_experts','deliverables','activity_log',
    'agent_execution_history','workflow_executions',
    'integrations','integration_mappings','integration_logs',
    'qm_actions','qm_cases','qm_cycle_steps','qm_knowledge_items','qm_kpi_details',
    'qm_kpis','qm_lesson_reuse','qm_lessons','qm_rca_candidates','qm_rca_ishikawa',
    'qm_rca_pareto','qm_rca_symptoms','qm_rca_whys','qm_signals'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS org_id text REFERENCES tenants(org_id) ON UPDATE CASCADE', t);
    EXECUTE format('UPDATE %I SET org_id = %L WHERE org_id IS NULL', t, socytay);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (org_id)', t || '_org_id_idx', t);
  END LOOP;
END $$;