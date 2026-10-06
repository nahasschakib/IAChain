-- db/000_baseline.sql
-- Etat du schema IAChain au 06/10/2026, tire de la base Neon vivante (information_schema, pg_constraint, pg_indexes).
-- Idempotent : rejouable sans erreur sur une base vide comme sur une base existante. Ne contient aucune donnee.
BEGIN;

CREATE SEQUENCE IF NOT EXISTS public.activity_log_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agent_contract_inputs_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agent_contract_outputs_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agent_contract_workflow_usage_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agent_execution_history_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agent_permissions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agent_runs_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agent_task_fields_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.agents_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.approval_events_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.approvals_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.crm_accounts_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.deliverables_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.integration_logs_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.integration_mappings_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.integrations_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.org_experts_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.org_options_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_kpi_details_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_kpis_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_lesson_reuse_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_rca_candidates_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_rca_ishikawa_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_rca_pareto_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_rca_symptoms_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_rca_whys_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.qm_signals_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.workflow_executions_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.workflow_node_runs_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.workflow_nodes_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.workflow_steps_id_seq;
CREATE SEQUENCE IF NOT EXISTS public.workflows_id_seq;

CREATE TABLE IF NOT EXISTS public.activity_log (
  id integer DEFAULT nextval('activity_log_id_seq'::regclass) NOT NULL,
  agent_id integer,
  workflow_id integer,
  action text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  agent_label text DEFAULT ''::text NOT NULL,
  status text DEFAULT 'Terminé'::text NOT NULL,
  tone text DEFAULT 'signal'::text NOT NULL,
  client_label text,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agent_contract_inputs (
  id integer DEFAULT nextval('agent_contract_inputs_id_seq'::regclass) NOT NULL,
  agent_id integer,
  field_key text NOT NULL,
  requirement text NOT NULL,
  data_type text NOT NULL,
  resolution_chain text,
  sort_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.agent_contract_meta (
  agent_id integer NOT NULL,
  version text NOT NULL,
  consumed_by_count integer DEFAULT 0,
  compatibility_note text
);

CREATE TABLE IF NOT EXISTS public.agent_contract_outputs (
  id integer DEFAULT nextval('agent_contract_outputs_id_seq'::regclass) NOT NULL,
  agent_id integer,
  field_key text NOT NULL,
  description text,
  data_type text NOT NULL,
  sort_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.agent_contract_workflow_usage (
  id integer DEFAULT nextval('agent_contract_workflow_usage_id_seq'::regclass) NOT NULL,
  agent_id integer,
  workflow_name text NOT NULL,
  status text NOT NULL,
  sort_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.agent_execution_history (
  id integer DEFAULT nextval('agent_execution_history_id_seq'::regclass) NOT NULL,
  agent_id integer,
  exec_date date NOT NULL,
  description text NOT NULL,
  status text NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agent_permissions (
  id integer DEFAULT nextval('agent_permissions_id_seq'::regclass) NOT NULL,
  agent_id integer,
  action_label text NOT NULL,
  mode text NOT NULL,
  stats_text text,
  promotion_suggestion text,
  sort_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.agent_runs (
  id integer DEFAULT nextval('agent_runs_id_seq'::regclass) NOT NULL,
  org_id text NOT NULL,
  agent_id integer NOT NULL,
  user_id text,
  input jsonb NOT NULL,
  result jsonb,
  model text,
  input_tokens integer,
  output_tokens integer,
  status text DEFAULT 'ok'::text NOT NULL,
  error text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.agent_task_fields (
  id integer DEFAULT nextval('agent_task_fields_id_seq'::regclass) NOT NULL,
  agent_id integer,
  field_key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL,
  provenance text,
  required boolean DEFAULT false,
  options jsonb,
  default_value text,
  sort_order integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.agents (
  id integer DEFAULT nextval('agents_id_seq'::regclass) NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  short_name text NOT NULL,
  status text DEFAULT 'actif'::text NOT NULL,
  category text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  code text,
  role text,
  version text,
  icon text,
  input_label text,
  output_label text,
  workflow_count integer DEFAULT 0,
  description text,
  cost_estimate numeric(6,2) DEFAULT 4.50,
  currency text DEFAULT 'MAD'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.approval_events (
  id integer DEFAULT nextval('approval_events_id_seq'::regclass) NOT NULL,
  approval_id integer NOT NULL,
  event_type text NOT NULL,
  actor_user_id text,
  target_expert_id integer,
  reason text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.approvals (
  id integer DEFAULT nextval('approvals_id_seq'::regclass) NOT NULL,
  title text NOT NULL,
  tag text,
  agent_id integer,
  workflow_id integer,
  status text DEFAULT 'en_attente'::text NOT NULL,
  payload jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  resolved_at timestamp with time zone,
  detail text,
  agent_label text,
  due_at timestamp with time zone DEFAULT (now() + '24:00:00'::interval),
  decision_reason text,
  delegated_to integer,
  delegated_at timestamp with time zone,
  delegation_reason text,
  org_id text NOT NULL,
  deliverable_id integer
);

CREATE TABLE IF NOT EXISTS public.crm_accounts (
  id integer DEFAULT nextval('crm_accounts_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  city text,
  sector text,
  source text,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.deliverables (
  id integer DEFAULT nextval('deliverables_id_seq'::regclass) NOT NULL,
  title text NOT NULL,
  agent_id integer,
  workflow_id integer,
  kind text NOT NULL,
  version text DEFAULT 'v1'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  agent_label text,
  origin text,
  approval_status text,
  cost numeric(12,4),
  currency text DEFAULT 'MAD'::text NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.integration_logs (
  id integer DEFAULT nextval('integration_logs_id_seq'::regclass) NOT NULL,
  integration_id integer NOT NULL,
  level text NOT NULL,
  message text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.integration_mappings (
  id integer DEFAULT nextval('integration_mappings_id_seq'::regclass) NOT NULL,
  integration_id integer NOT NULL,
  position integer DEFAULT 0 NOT NULL,
  source_field text NOT NULL,
  agent_field text NOT NULL,
  transform text,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.integrations (
  id integer DEFAULT nextval('integrations_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  status text NOT NULL,
  tone text NOT NULL,
  description text NOT NULL,
  meta text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  last_sync_at timestamp with time zone,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.org_experts (
  id integer DEFAULT nextval('org_experts_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  role_title text NOT NULL,
  domain text NOT NULL,
  clerk_user_id text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.org_options (
  id integer DEFAULT nextval('org_options_id_seq'::regclass) NOT NULL,
  org_id text NOT NULL,
  kind text NOT NULL,
  label text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  active boolean DEFAULT true NOT NULL
);

CREATE TABLE IF NOT EXISTS public.org_profile (
  org_id text NOT NULL,
  offer text DEFAULT ''::text NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.processes (
  slug text NOT NULL,
  tag text NOT NULL,
  version text NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  subprocesses jsonb DEFAULT '[]'::jsonb NOT NULL,
  agent_categories text[] DEFAULT '{}'::text[] NOT NULL,
  cta text,
  href text,
  is_reference boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  agent_slugs text[] DEFAULT '{}'::text[] NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_actions (
  id text NOT NULL,
  case_id text,
  type text NOT NULL,
  title text NOT NULL,
  agent_name text,
  agent_code text,
  problem text,
  cause_root text,
  owner text,
  priority text,
  due_label text,
  expected_result text,
  resources text,
  kpi_name text,
  verification text,
  status_step integer DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_cases (
  id text NOT NULL,
  title text NOT NULL,
  source text NOT NULL,
  severity text NOT NULL,
  status text NOT NULL,
  opened_label text NOT NULL,
  cause text,
  action_id text,
  owner text,
  effectiveness text,
  step integer DEFAULT 0 NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  problem_statement text,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_cycle_steps (
  case_id text NOT NULL,
  n integer NOT NULL,
  phase text NOT NULL,
  agent_code text,
  actor text,
  role text,
  date_label text NOT NULL,
  label text NOT NULL,
  output text NOT NULL,
  kind text NOT NULL,
  evidence text NOT NULL,
  next_label text,
  is_human boolean DEFAULT false NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_knowledge_items (
  id text NOT NULL,
  title text NOT NULL,
  from_case text,
  used_label text,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_kpi_details (
  id integer DEFAULT nextval('qm_kpi_details_id_seq'::regclass) NOT NULL,
  name text NOT NULL,
  base_value text,
  target text,
  current_value text,
  delta text,
  period text,
  status_label text,
  status_strong boolean DEFAULT false NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_kpis (
  id integer DEFAULT nextval('qm_kpis_id_seq'::regclass) NOT NULL,
  label text NOT NULL,
  value text NOT NULL,
  note text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_lesson_reuse (
  id integer DEFAULT nextval('qm_lesson_reuse_id_seq'::regclass) NOT NULL,
  lesson_id text,
  text text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_lessons (
  id text NOT NULL,
  case_id text,
  problem text,
  analysis text,
  cause_root text,
  solution text,
  lesson text,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_rca_candidates (
  id integer DEFAULT nextval('qm_rca_candidates_id_seq'::regclass) NOT NULL,
  case_id text,
  rank integer NOT NULL,
  cause text NOT NULL,
  confidence integer NOT NULL,
  conf_label text,
  evidence text,
  retained boolean DEFAULT false NOT NULL,
  retained_text text,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_rca_ishikawa (
  id integer DEFAULT nextval('qm_rca_ishikawa_id_seq'::regclass) NOT NULL,
  case_id text,
  category text NOT NULL,
  item text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_rca_pareto (
  id integer DEFAULT nextval('qm_rca_pareto_id_seq'::regclass) NOT NULL,
  case_id text,
  label text NOT NULL,
  pct numeric NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_rca_symptoms (
  id integer DEFAULT nextval('qm_rca_symptoms_id_seq'::regclass) NOT NULL,
  case_id text,
  text text NOT NULL,
  kind text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_rca_whys (
  id integer DEFAULT nextval('qm_rca_whys_id_seq'::regclass) NOT NULL,
  case_id text,
  n integer NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.qm_signals (
  id integer DEFAULT nextval('qm_signals_id_seq'::regclass) NOT NULL,
  n text NOT NULL,
  label text NOT NULL,
  tab text NOT NULL,
  sort_order integer DEFAULT 0 NOT NULL,
  org_id text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.tenants (
  org_id text NOT NULL,
  name text NOT NULL,
  status text DEFAULT 'en_attente'::text NOT NULL,
  plan text,
  payment_ref text,
  is_platform boolean DEFAULT false NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  activated_at timestamp with time zone,
  market text DEFAULT 'MA'::text NOT NULL,
  currency text DEFAULT 'MAD'::text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id integer DEFAULT nextval('workflow_executions_id_seq'::regclass) NOT NULL,
  workflow_id integer NOT NULL,
  status text DEFAULT 'en_cours'::text NOT NULL,
  progress_done integer DEFAULT 0 NOT NULL,
  progress_total integer DEFAULT 1 NOT NULL,
  started_at timestamp with time zone DEFAULT now() NOT NULL,
  finished_at timestamp with time zone,
  client_label text,
  current_step text,
  org_id text NOT NULL,
  banner jsonb,
  run_label text
);

CREATE TABLE IF NOT EXISTS public.workflow_node_runs (
  id integer DEFAULT nextval('workflow_node_runs_id_seq'::regclass) NOT NULL,
  execution_id integer NOT NULL,
  node_key text NOT NULL,
  state text NOT NULL,
  note text,
  org_id text NOT NULL,
  agent_run_id integer
);

CREATE TABLE IF NOT EXISTS public.workflow_nodes (
  id integer DEFAULT nextval('workflow_nodes_id_seq'::regclass) NOT NULL,
  workflow_slug text NOT NULL,
  node_key text NOT NULL,
  kind text NOT NULL,
  label text NOT NULL,
  agent_slug text,
  version text,
  tag text,
  row_index integer NOT NULL,
  col_index integer DEFAULT 0 NOT NULL,
  parents text[] DEFAULT '{}'::text[] NOT NULL,
  mapping jsonb DEFAULT '[]'::jsonb NOT NULL,
  outputs jsonb DEFAULT '[]'::jsonb NOT NULL,
  design_note text,
  blurb text,
  details jsonb DEFAULT '{}'::jsonb NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workflow_steps (
  id integer DEFAULT nextval('workflow_steps_id_seq'::regclass) NOT NULL,
  workflow_id integer NOT NULL,
  position integer NOT NULL,
  label text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.workflows (
  id integer DEFAULT nextval('workflows_id_seq'::regclass) NOT NULL,
  slug text NOT NULL,
  name text NOT NULL,
  version text DEFAULT 'v1'::text NOT NULL,
  status text DEFAULT 'actif'::text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  code text,
  description text,
  chain jsonb,
  node_count integer,
  merge_count integer,
  approval_count integer,
  studio_ready boolean DEFAULT false NOT NULL,
  sort_order integer,
  cost_estimate numeric(8,2) DEFAULT 0,
  cost_unit text DEFAULT 'run'::text NOT NULL,
  currency text DEFAULT 'MAD'::text NOT NULL,
  process_slug text
);

ALTER SEQUENCE public.activity_log_id_seq OWNED BY public.activity_log.id;
ALTER SEQUENCE public.agent_contract_inputs_id_seq OWNED BY public.agent_contract_inputs.id;
ALTER SEQUENCE public.agent_contract_outputs_id_seq OWNED BY public.agent_contract_outputs.id;
ALTER SEQUENCE public.agent_contract_workflow_usage_id_seq OWNED BY public.agent_contract_workflow_usage.id;
ALTER SEQUENCE public.agent_execution_history_id_seq OWNED BY public.agent_execution_history.id;
ALTER SEQUENCE public.agent_permissions_id_seq OWNED BY public.agent_permissions.id;
ALTER SEQUENCE public.agent_runs_id_seq OWNED BY public.agent_runs.id;
ALTER SEQUENCE public.agent_task_fields_id_seq OWNED BY public.agent_task_fields.id;
ALTER SEQUENCE public.agents_id_seq OWNED BY public.agents.id;
ALTER SEQUENCE public.approval_events_id_seq OWNED BY public.approval_events.id;
ALTER SEQUENCE public.approvals_id_seq OWNED BY public.approvals.id;
ALTER SEQUENCE public.crm_accounts_id_seq OWNED BY public.crm_accounts.id;
ALTER SEQUENCE public.deliverables_id_seq OWNED BY public.deliverables.id;
ALTER SEQUENCE public.integration_logs_id_seq OWNED BY public.integration_logs.id;
ALTER SEQUENCE public.integration_mappings_id_seq OWNED BY public.integration_mappings.id;
ALTER SEQUENCE public.integrations_id_seq OWNED BY public.integrations.id;
ALTER SEQUENCE public.org_experts_id_seq OWNED BY public.org_experts.id;
ALTER SEQUENCE public.org_options_id_seq OWNED BY public.org_options.id;
ALTER SEQUENCE public.qm_kpi_details_id_seq OWNED BY public.qm_kpi_details.id;
ALTER SEQUENCE public.qm_kpis_id_seq OWNED BY public.qm_kpis.id;
ALTER SEQUENCE public.qm_lesson_reuse_id_seq OWNED BY public.qm_lesson_reuse.id;
ALTER SEQUENCE public.qm_rca_candidates_id_seq OWNED BY public.qm_rca_candidates.id;
ALTER SEQUENCE public.qm_rca_ishikawa_id_seq OWNED BY public.qm_rca_ishikawa.id;
ALTER SEQUENCE public.qm_rca_pareto_id_seq OWNED BY public.qm_rca_pareto.id;
ALTER SEQUENCE public.qm_rca_symptoms_id_seq OWNED BY public.qm_rca_symptoms.id;
ALTER SEQUENCE public.qm_rca_whys_id_seq OWNED BY public.qm_rca_whys.id;
ALTER SEQUENCE public.qm_signals_id_seq OWNED BY public.qm_signals.id;
ALTER SEQUENCE public.workflow_executions_id_seq OWNED BY public.workflow_executions.id;
ALTER SEQUENCE public.workflow_node_runs_id_seq OWNED BY public.workflow_node_runs.id;
ALTER SEQUENCE public.workflow_nodes_id_seq OWNED BY public.workflow_nodes.id;
ALTER SEQUENCE public.workflow_steps_id_seq OWNED BY public.workflow_steps.id;
ALTER SEQUENCE public.workflows_id_seq OWNED BY public.workflows.id;

DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='activity_log_pkey' AND conrelid='public.activity_log'::regclass) THEN
  ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_inputs_pkey' AND conrelid='public.agent_contract_inputs'::regclass) THEN
  ALTER TABLE public.agent_contract_inputs ADD CONSTRAINT agent_contract_inputs_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_meta_pkey' AND conrelid='public.agent_contract_meta'::regclass) THEN
  ALTER TABLE public.agent_contract_meta ADD CONSTRAINT agent_contract_meta_pkey PRIMARY KEY (agent_id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_outputs_pkey' AND conrelid='public.agent_contract_outputs'::regclass) THEN
  ALTER TABLE public.agent_contract_outputs ADD CONSTRAINT agent_contract_outputs_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_workflow_usage_pkey' AND conrelid='public.agent_contract_workflow_usage'::regclass) THEN
  ALTER TABLE public.agent_contract_workflow_usage ADD CONSTRAINT agent_contract_workflow_usage_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_execution_history_pkey' AND conrelid='public.agent_execution_history'::regclass) THEN
  ALTER TABLE public.agent_execution_history ADD CONSTRAINT agent_execution_history_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_permissions_pkey' AND conrelid='public.agent_permissions'::regclass) THEN
  ALTER TABLE public.agent_permissions ADD CONSTRAINT agent_permissions_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_runs_pkey' AND conrelid='public.agent_runs'::regclass) THEN
  ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_task_fields_pkey' AND conrelid='public.agent_task_fields'::regclass) THEN
  ALTER TABLE public.agent_task_fields ADD CONSTRAINT agent_task_fields_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agents_pkey' AND conrelid='public.agents'::regclass) THEN
  ALTER TABLE public.agents ADD CONSTRAINT agents_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approval_events_pkey' AND conrelid='public.approval_events'::regclass) THEN
  ALTER TABLE public.approval_events ADD CONSTRAINT approval_events_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approvals_pkey' AND conrelid='public.approvals'::regclass) THEN
  ALTER TABLE public.approvals ADD CONSTRAINT approvals_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='crm_accounts_pkey' AND conrelid='public.crm_accounts'::regclass) THEN
  ALTER TABLE public.crm_accounts ADD CONSTRAINT crm_accounts_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deliverables_pkey' AND conrelid='public.deliverables'::regclass) THEN
  ALTER TABLE public.deliverables ADD CONSTRAINT deliverables_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_logs_pkey' AND conrelid='public.integration_logs'::regclass) THEN
  ALTER TABLE public.integration_logs ADD CONSTRAINT integration_logs_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_mappings_pkey' AND conrelid='public.integration_mappings'::regclass) THEN
  ALTER TABLE public.integration_mappings ADD CONSTRAINT integration_mappings_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integrations_pkey' AND conrelid='public.integrations'::regclass) THEN
  ALTER TABLE public.integrations ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_experts_pkey' AND conrelid='public.org_experts'::regclass) THEN
  ALTER TABLE public.org_experts ADD CONSTRAINT org_experts_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_options_pkey' AND conrelid='public.org_options'::regclass) THEN
  ALTER TABLE public.org_options ADD CONSTRAINT org_options_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_profile_pkey' AND conrelid='public.org_profile'::regclass) THEN
  ALTER TABLE public.org_profile ADD CONSTRAINT org_profile_pkey PRIMARY KEY (org_id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='processes_pkey' AND conrelid='public.processes'::regclass) THEN
  ALTER TABLE public.processes ADD CONSTRAINT processes_pkey PRIMARY KEY (slug);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_actions_pkey' AND conrelid='public.qm_actions'::regclass) THEN
  ALTER TABLE public.qm_actions ADD CONSTRAINT qm_actions_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_cases_pkey' AND conrelid='public.qm_cases'::regclass) THEN
  ALTER TABLE public.qm_cases ADD CONSTRAINT qm_cases_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_cycle_steps_pkey' AND conrelid='public.qm_cycle_steps'::regclass) THEN
  ALTER TABLE public.qm_cycle_steps ADD CONSTRAINT qm_cycle_steps_pkey PRIMARY KEY (case_id, n);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_knowledge_items_pkey' AND conrelid='public.qm_knowledge_items'::regclass) THEN
  ALTER TABLE public.qm_knowledge_items ADD CONSTRAINT qm_knowledge_items_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_kpi_details_pkey' AND conrelid='public.qm_kpi_details'::regclass) THEN
  ALTER TABLE public.qm_kpi_details ADD CONSTRAINT qm_kpi_details_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_kpis_pkey' AND conrelid='public.qm_kpis'::regclass) THEN
  ALTER TABLE public.qm_kpis ADD CONSTRAINT qm_kpis_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_lesson_reuse_pkey' AND conrelid='public.qm_lesson_reuse'::regclass) THEN
  ALTER TABLE public.qm_lesson_reuse ADD CONSTRAINT qm_lesson_reuse_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_lessons_pkey' AND conrelid='public.qm_lessons'::regclass) THEN
  ALTER TABLE public.qm_lessons ADD CONSTRAINT qm_lessons_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_candidates_pkey' AND conrelid='public.qm_rca_candidates'::regclass) THEN
  ALTER TABLE public.qm_rca_candidates ADD CONSTRAINT qm_rca_candidates_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_ishikawa_pkey' AND conrelid='public.qm_rca_ishikawa'::regclass) THEN
  ALTER TABLE public.qm_rca_ishikawa ADD CONSTRAINT qm_rca_ishikawa_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_pareto_pkey' AND conrelid='public.qm_rca_pareto'::regclass) THEN
  ALTER TABLE public.qm_rca_pareto ADD CONSTRAINT qm_rca_pareto_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_symptoms_pkey' AND conrelid='public.qm_rca_symptoms'::regclass) THEN
  ALTER TABLE public.qm_rca_symptoms ADD CONSTRAINT qm_rca_symptoms_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_whys_pkey' AND conrelid='public.qm_rca_whys'::regclass) THEN
  ALTER TABLE public.qm_rca_whys ADD CONSTRAINT qm_rca_whys_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_signals_pkey' AND conrelid='public.qm_signals'::regclass) THEN
  ALTER TABLE public.qm_signals ADD CONSTRAINT qm_signals_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tenants_pkey' AND conrelid='public.tenants'::regclass) THEN
  ALTER TABLE public.tenants ADD CONSTRAINT tenants_pkey PRIMARY KEY (org_id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_executions_pkey' AND conrelid='public.workflow_executions'::regclass) THEN
  ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_node_runs_pkey' AND conrelid='public.workflow_node_runs'::regclass) THEN
  ALTER TABLE public.workflow_node_runs ADD CONSTRAINT workflow_node_runs_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_nodes_pkey' AND conrelid='public.workflow_nodes'::regclass) THEN
  ALTER TABLE public.workflow_nodes ADD CONSTRAINT workflow_nodes_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_steps_pkey' AND conrelid='public.workflow_steps'::regclass) THEN
  ALTER TABLE public.workflow_steps ADD CONSTRAINT workflow_steps_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflows_pkey' AND conrelid='public.workflows'::regclass) THEN
  ALTER TABLE public.workflows ADD CONSTRAINT workflows_pkey PRIMARY KEY (id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agents_slug_key' AND conrelid='public.agents'::regclass) THEN
  ALTER TABLE public.agents ADD CONSTRAINT agents_slug_key UNIQUE (slug);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_experts_clerk_user_id_key' AND conrelid='public.org_experts'::regclass) THEN
  ALTER TABLE public.org_experts ADD CONSTRAINT org_experts_clerk_user_id_key UNIQUE (clerk_user_id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_options_org_id_kind_label_key' AND conrelid='public.org_options'::regclass) THEN
  ALTER TABLE public.org_options ADD CONSTRAINT org_options_org_id_kind_label_key UNIQUE (org_id, kind, label);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_node_runs_execution_id_node_key_key' AND conrelid='public.workflow_node_runs'::regclass) THEN
  ALTER TABLE public.workflow_node_runs ADD CONSTRAINT workflow_node_runs_execution_id_node_key_key UNIQUE (execution_id, node_key);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_nodes_workflow_slug_node_key_key' AND conrelid='public.workflow_nodes'::regclass) THEN
  ALTER TABLE public.workflow_nodes ADD CONSTRAINT workflow_nodes_workflow_slug_node_key_key UNIQUE (workflow_slug, node_key);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflows_slug_key' AND conrelid='public.workflows'::regclass) THEN
  ALTER TABLE public.workflows ADD CONSTRAINT workflows_slug_key UNIQUE (slug);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approval_events_event_type_check' AND conrelid='public.approval_events'::regclass) THEN
  ALTER TABLE public.approval_events ADD CONSTRAINT approval_events_event_type_check CHECK ((event_type = ANY (ARRAY['delegated'::text, 'approved'::text, 'rejected'::text])));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_logs_level_check' AND conrelid='public.integration_logs'::regclass) THEN
  ALTER TABLE public.integration_logs ADD CONSTRAINT integration_logs_level_check CHECK ((level = ANY (ARRAY['ok'::text, 'warn'::text, 'error'::text])));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_options_kind_check' AND conrelid='public.org_options'::regclass) THEN
  ALTER TABLE public.org_options ADD CONSTRAINT org_options_kind_check CHECK ((kind = ANY (ARRAY['segment'::text, 'enjeu'::text])));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='tenants_status_check' AND conrelid='public.tenants'::regclass) THEN
  ALTER TABLE public.tenants ADD CONSTRAINT tenants_status_check CHECK ((status = ANY (ARRAY['en_attente'::text, 'actif'::text, 'suspendu'::text])));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_node_runs_state_check' AND conrelid='public.workflow_node_runs'::regclass) THEN
  ALTER TABLE public.workflow_node_runs ADD CONSTRAINT workflow_node_runs_state_check CHECK ((state = ANY (ARRAY['done'::text, 'running'::text, 'waiting'::text, 'pending'::text, 'failed'::text])));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_nodes_kind_check' AND conrelid='public.workflow_nodes'::regclass) THEN
  ALTER TABLE public.workflow_nodes ADD CONSTRAINT workflow_nodes_kind_check CHECK ((kind = ANY (ARRAY['agent'::text, 'merge'::text, 'approval'::text, 'action'::text, 'condition'::text])));
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='activity_log_agent_id_fkey' AND conrelid='public.activity_log'::regclass) THEN
  ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='activity_log_org_id_fkey' AND conrelid='public.activity_log'::regclass) THEN
  ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='activity_log_workflow_id_fkey' AND conrelid='public.activity_log'::regclass) THEN
  ALTER TABLE public.activity_log ADD CONSTRAINT activity_log_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_inputs_agent_id_fkey' AND conrelid='public.agent_contract_inputs'::regclass) THEN
  ALTER TABLE public.agent_contract_inputs ADD CONSTRAINT agent_contract_inputs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_meta_agent_id_fkey' AND conrelid='public.agent_contract_meta'::regclass) THEN
  ALTER TABLE public.agent_contract_meta ADD CONSTRAINT agent_contract_meta_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_outputs_agent_id_fkey' AND conrelid='public.agent_contract_outputs'::regclass) THEN
  ALTER TABLE public.agent_contract_outputs ADD CONSTRAINT agent_contract_outputs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_contract_workflow_usage_agent_id_fkey' AND conrelid='public.agent_contract_workflow_usage'::regclass) THEN
  ALTER TABLE public.agent_contract_workflow_usage ADD CONSTRAINT agent_contract_workflow_usage_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_execution_history_agent_id_fkey' AND conrelid='public.agent_execution_history'::regclass) THEN
  ALTER TABLE public.agent_execution_history ADD CONSTRAINT agent_execution_history_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_execution_history_org_id_fkey' AND conrelid='public.agent_execution_history'::regclass) THEN
  ALTER TABLE public.agent_execution_history ADD CONSTRAINT agent_execution_history_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_permissions_agent_id_fkey' AND conrelid='public.agent_permissions'::regclass) THEN
  ALTER TABLE public.agent_permissions ADD CONSTRAINT agent_permissions_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_runs_agent_id_fkey' AND conrelid='public.agent_runs'::regclass) THEN
  ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_runs_org_id_fkey' AND conrelid='public.agent_runs'::regclass) THEN
  ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='agent_task_fields_agent_id_fkey' AND conrelid='public.agent_task_fields'::regclass) THEN
  ALTER TABLE public.agent_task_fields ADD CONSTRAINT agent_task_fields_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approval_events_approval_id_fkey' AND conrelid='public.approval_events'::regclass) THEN
  ALTER TABLE public.approval_events ADD CONSTRAINT approval_events_approval_id_fkey FOREIGN KEY (approval_id) REFERENCES approvals(id) ON DELETE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approval_events_org_id_fkey' AND conrelid='public.approval_events'::regclass) THEN
  ALTER TABLE public.approval_events ADD CONSTRAINT approval_events_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approval_events_target_expert_id_fkey' AND conrelid='public.approval_events'::regclass) THEN
  ALTER TABLE public.approval_events ADD CONSTRAINT approval_events_target_expert_id_fkey FOREIGN KEY (target_expert_id) REFERENCES org_experts(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approvals_agent_id_fkey' AND conrelid='public.approvals'::regclass) THEN
  ALTER TABLE public.approvals ADD CONSTRAINT approvals_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approvals_delegated_to_fkey' AND conrelid='public.approvals'::regclass) THEN
  ALTER TABLE public.approvals ADD CONSTRAINT approvals_delegated_to_fkey FOREIGN KEY (delegated_to) REFERENCES org_experts(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approvals_deliverable_id_fkey' AND conrelid='public.approvals'::regclass) THEN
  ALTER TABLE public.approvals ADD CONSTRAINT approvals_deliverable_id_fkey FOREIGN KEY (deliverable_id) REFERENCES deliverables(id) ON DELETE SET NULL;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approvals_org_id_fkey' AND conrelid='public.approvals'::regclass) THEN
  ALTER TABLE public.approvals ADD CONSTRAINT approvals_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='approvals_workflow_id_fkey' AND conrelid='public.approvals'::regclass) THEN
  ALTER TABLE public.approvals ADD CONSTRAINT approvals_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deliverables_agent_id_fkey' AND conrelid='public.deliverables'::regclass) THEN
  ALTER TABLE public.deliverables ADD CONSTRAINT deliverables_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES agents(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deliverables_org_id_fkey' AND conrelid='public.deliverables'::regclass) THEN
  ALTER TABLE public.deliverables ADD CONSTRAINT deliverables_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='deliverables_workflow_id_fkey' AND conrelid='public.deliverables'::regclass) THEN
  ALTER TABLE public.deliverables ADD CONSTRAINT deliverables_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_logs_integration_id_fkey' AND conrelid='public.integration_logs'::regclass) THEN
  ALTER TABLE public.integration_logs ADD CONSTRAINT integration_logs_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_logs_org_id_fkey' AND conrelid='public.integration_logs'::regclass) THEN
  ALTER TABLE public.integration_logs ADD CONSTRAINT integration_logs_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_mappings_integration_id_fkey' AND conrelid='public.integration_mappings'::regclass) THEN
  ALTER TABLE public.integration_mappings ADD CONSTRAINT integration_mappings_integration_id_fkey FOREIGN KEY (integration_id) REFERENCES integrations(id) ON DELETE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integration_mappings_org_id_fkey' AND conrelid='public.integration_mappings'::regclass) THEN
  ALTER TABLE public.integration_mappings ADD CONSTRAINT integration_mappings_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='integrations_org_id_fkey' AND conrelid='public.integrations'::regclass) THEN
  ALTER TABLE public.integrations ADD CONSTRAINT integrations_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_experts_org_id_fkey' AND conrelid='public.org_experts'::regclass) THEN
  ALTER TABLE public.org_experts ADD CONSTRAINT org_experts_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_options_org_id_fkey' AND conrelid='public.org_options'::regclass) THEN
  ALTER TABLE public.org_options ADD CONSTRAINT org_options_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='org_profile_org_id_fkey' AND conrelid='public.org_profile'::regclass) THEN
  ALTER TABLE public.org_profile ADD CONSTRAINT org_profile_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_actions_case_id_fkey' AND conrelid='public.qm_actions'::regclass) THEN
  ALTER TABLE public.qm_actions ADD CONSTRAINT qm_actions_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_actions_org_id_fkey' AND conrelid='public.qm_actions'::regclass) THEN
  ALTER TABLE public.qm_actions ADD CONSTRAINT qm_actions_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_cases_org_id_fkey' AND conrelid='public.qm_cases'::regclass) THEN
  ALTER TABLE public.qm_cases ADD CONSTRAINT qm_cases_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_cycle_steps_case_id_fkey' AND conrelid='public.qm_cycle_steps'::regclass) THEN
  ALTER TABLE public.qm_cycle_steps ADD CONSTRAINT qm_cycle_steps_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id) ON DELETE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_cycle_steps_org_id_fkey' AND conrelid='public.qm_cycle_steps'::regclass) THEN
  ALTER TABLE public.qm_cycle_steps ADD CONSTRAINT qm_cycle_steps_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_knowledge_items_org_id_fkey' AND conrelid='public.qm_knowledge_items'::regclass) THEN
  ALTER TABLE public.qm_knowledge_items ADD CONSTRAINT qm_knowledge_items_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_kpi_details_org_id_fkey' AND conrelid='public.qm_kpi_details'::regclass) THEN
  ALTER TABLE public.qm_kpi_details ADD CONSTRAINT qm_kpi_details_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_kpis_org_id_fkey' AND conrelid='public.qm_kpis'::regclass) THEN
  ALTER TABLE public.qm_kpis ADD CONSTRAINT qm_kpis_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_lesson_reuse_lesson_id_fkey' AND conrelid='public.qm_lesson_reuse'::regclass) THEN
  ALTER TABLE public.qm_lesson_reuse ADD CONSTRAINT qm_lesson_reuse_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES qm_lessons(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_lesson_reuse_org_id_fkey' AND conrelid='public.qm_lesson_reuse'::regclass) THEN
  ALTER TABLE public.qm_lesson_reuse ADD CONSTRAINT qm_lesson_reuse_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_lessons_case_id_fkey' AND conrelid='public.qm_lessons'::regclass) THEN
  ALTER TABLE public.qm_lessons ADD CONSTRAINT qm_lessons_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_lessons_org_id_fkey' AND conrelid='public.qm_lessons'::regclass) THEN
  ALTER TABLE public.qm_lessons ADD CONSTRAINT qm_lessons_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_candidates_case_id_fkey' AND conrelid='public.qm_rca_candidates'::regclass) THEN
  ALTER TABLE public.qm_rca_candidates ADD CONSTRAINT qm_rca_candidates_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_candidates_org_id_fkey' AND conrelid='public.qm_rca_candidates'::regclass) THEN
  ALTER TABLE public.qm_rca_candidates ADD CONSTRAINT qm_rca_candidates_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_ishikawa_case_id_fkey' AND conrelid='public.qm_rca_ishikawa'::regclass) THEN
  ALTER TABLE public.qm_rca_ishikawa ADD CONSTRAINT qm_rca_ishikawa_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_ishikawa_org_id_fkey' AND conrelid='public.qm_rca_ishikawa'::regclass) THEN
  ALTER TABLE public.qm_rca_ishikawa ADD CONSTRAINT qm_rca_ishikawa_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_pareto_case_id_fkey' AND conrelid='public.qm_rca_pareto'::regclass) THEN
  ALTER TABLE public.qm_rca_pareto ADD CONSTRAINT qm_rca_pareto_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_pareto_org_id_fkey' AND conrelid='public.qm_rca_pareto'::regclass) THEN
  ALTER TABLE public.qm_rca_pareto ADD CONSTRAINT qm_rca_pareto_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_symptoms_case_id_fkey' AND conrelid='public.qm_rca_symptoms'::regclass) THEN
  ALTER TABLE public.qm_rca_symptoms ADD CONSTRAINT qm_rca_symptoms_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_symptoms_org_id_fkey' AND conrelid='public.qm_rca_symptoms'::regclass) THEN
  ALTER TABLE public.qm_rca_symptoms ADD CONSTRAINT qm_rca_symptoms_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_whys_case_id_fkey' AND conrelid='public.qm_rca_whys'::regclass) THEN
  ALTER TABLE public.qm_rca_whys ADD CONSTRAINT qm_rca_whys_case_id_fkey FOREIGN KEY (case_id) REFERENCES qm_cases(id);
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_rca_whys_org_id_fkey' AND conrelid='public.qm_rca_whys'::regclass) THEN
  ALTER TABLE public.qm_rca_whys ADD CONSTRAINT qm_rca_whys_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='qm_signals_org_id_fkey' AND conrelid='public.qm_signals'::regclass) THEN
  ALTER TABLE public.qm_signals ADD CONSTRAINT qm_signals_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_executions_org_id_fkey' AND conrelid='public.workflow_executions'::regclass) THEN
  ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_executions_workflow_id_fkey' AND conrelid='public.workflow_executions'::regclass) THEN
  ALTER TABLE public.workflow_executions ADD CONSTRAINT workflow_executions_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_node_runs_agent_run_id_fkey' AND conrelid='public.workflow_node_runs'::regclass) THEN
  ALTER TABLE public.workflow_node_runs ADD CONSTRAINT workflow_node_runs_agent_run_id_fkey FOREIGN KEY (agent_run_id) REFERENCES agent_runs(id) ON DELETE SET NULL;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_node_runs_execution_id_fkey' AND conrelid='public.workflow_node_runs'::regclass) THEN
  ALTER TABLE public.workflow_node_runs ADD CONSTRAINT workflow_node_runs_execution_id_fkey FOREIGN KEY (execution_id) REFERENCES workflow_executions(id) ON DELETE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_node_runs_org_id_fkey' AND conrelid='public.workflow_node_runs'::regclass) THEN
  ALTER TABLE public.workflow_node_runs ADD CONSTRAINT workflow_node_runs_org_id_fkey FOREIGN KEY (org_id) REFERENCES tenants(org_id) ON UPDATE CASCADE;
END IF; END $$;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='workflow_steps_workflow_id_fkey' AND conrelid='public.workflow_steps'::regclass) THEN
  ALTER TABLE public.workflow_steps ADD CONSTRAINT workflow_steps_workflow_id_fkey FOREIGN KEY (workflow_id) REFERENCES workflows(id) ON DELETE CASCADE;
END IF; END $$;

CREATE INDEX IF NOT EXISTS activity_log_org_id_idx ON public.activity_log USING btree (org_id);
CREATE INDEX IF NOT EXISTS agent_execution_history_org_id_idx ON public.agent_execution_history USING btree (org_id);
CREATE INDEX IF NOT EXISTS agent_runs_org_idx ON public.agent_runs USING btree (org_id, created_at DESC);
CREATE INDEX IF NOT EXISTS approval_events_org_id_idx ON public.approval_events USING btree (org_id);
CREATE INDEX IF NOT EXISTS approvals_org_id_idx ON public.approvals USING btree (org_id);
CREATE INDEX IF NOT EXISTS idx_approvals_deliverable_id ON public.approvals USING btree (deliverable_id);
CREATE INDEX IF NOT EXISTS crm_accounts_name_idx ON public.crm_accounts USING btree (lower(name));
CREATE INDEX IF NOT EXISTS deliverables_org_id_idx ON public.deliverables USING btree (org_id);
CREATE INDEX IF NOT EXISTS integration_logs_org_id_idx ON public.integration_logs USING btree (org_id);
CREATE INDEX IF NOT EXISTS integration_mappings_org_id_idx ON public.integration_mappings USING btree (org_id);
CREATE INDEX IF NOT EXISTS integrations_org_id_idx ON public.integrations USING btree (org_id);
CREATE INDEX IF NOT EXISTS org_experts_org_id_idx ON public.org_experts USING btree (org_id);
CREATE INDEX IF NOT EXISTS org_options_org_idx ON public.org_options USING btree (org_id, kind, sort_order);
CREATE INDEX IF NOT EXISTS qm_actions_org_id_idx ON public.qm_actions USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_cases_org_id_idx ON public.qm_cases USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_cycle_steps_org_id_idx ON public.qm_cycle_steps USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_knowledge_items_org_id_idx ON public.qm_knowledge_items USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_kpi_details_org_id_idx ON public.qm_kpi_details USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_kpis_org_id_idx ON public.qm_kpis USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_lesson_reuse_org_id_idx ON public.qm_lesson_reuse USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_lessons_org_id_idx ON public.qm_lessons USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_rca_candidates_org_id_idx ON public.qm_rca_candidates USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_rca_ishikawa_org_id_idx ON public.qm_rca_ishikawa USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_rca_pareto_org_id_idx ON public.qm_rca_pareto USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_rca_symptoms_org_id_idx ON public.qm_rca_symptoms USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_rca_whys_org_id_idx ON public.qm_rca_whys USING btree (org_id);
CREATE INDEX IF NOT EXISTS qm_signals_org_id_idx ON public.qm_signals USING btree (org_id);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_one_platform ON public.tenants USING btree (is_platform) WHERE is_platform;
CREATE INDEX IF NOT EXISTS workflow_executions_org_id_idx ON public.workflow_executions USING btree (org_id);
CREATE INDEX IF NOT EXISTS idx_workflow_node_runs_agent_run ON public.workflow_node_runs USING btree (agent_run_id);
CREATE INDEX IF NOT EXISTS workflow_node_runs_org_idx ON public.workflow_node_runs USING btree (org_id);

COMMIT;
