-- 027 : cles uniques naturelles et cles etrangeres du catalogue (P1-02b)
-- Rend les seeds rejouables sans doublon et empeche les noeuds de workflow orphelins.
-- Idempotent : chaque contrainte n'est ajoutee que si elle n'existe pas deja.
-- Ne touche a aucune donnee propre a une organisation.

BEGIN;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agents_code_key' AND conrelid = 'public.agents'::regclass) THEN
    ALTER TABLE public.agents ADD CONSTRAINT agents_code_key UNIQUE (code);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflows_code_key' AND conrelid = 'public.workflows'::regclass) THEN
    ALTER TABLE public.workflows ADD CONSTRAINT workflows_code_key UNIQUE (code);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_contract_inputs_agent_field_key' AND conrelid = 'public.agent_contract_inputs'::regclass) THEN
    ALTER TABLE public.agent_contract_inputs ADD CONSTRAINT agent_contract_inputs_agent_field_key UNIQUE (agent_id, field_key);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_contract_outputs_agent_field_key' AND conrelid = 'public.agent_contract_outputs'::regclass) THEN
    ALTER TABLE public.agent_contract_outputs ADD CONSTRAINT agent_contract_outputs_agent_field_key UNIQUE (agent_id, field_key);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_contract_workflow_usage_agent_wf_key' AND conrelid = 'public.agent_contract_workflow_usage'::regclass) THEN
    ALTER TABLE public.agent_contract_workflow_usage ADD CONSTRAINT agent_contract_workflow_usage_agent_wf_key UNIQUE (agent_id, workflow_name);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_permissions_agent_action_key' AND conrelid = 'public.agent_permissions'::regclass) THEN
    ALTER TABLE public.agent_permissions ADD CONSTRAINT agent_permissions_agent_action_key UNIQUE (agent_id, action_label);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_task_fields_agent_field_key' AND conrelid = 'public.agent_task_fields'::regclass) THEN
    ALTER TABLE public.agent_task_fields ADD CONSTRAINT agent_task_fields_agent_field_key UNIQUE (agent_id, field_key);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_steps_workflow_position_key' AND conrelid = 'public.workflow_steps'::regclass) THEN
    ALTER TABLE public.workflow_steps ADD CONSTRAINT workflow_steps_workflow_position_key UNIQUE (workflow_id, position);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_nodes_workflow_slug_fkey' AND conrelid = 'public.workflow_nodes'::regclass) THEN
    ALTER TABLE public.workflow_nodes ADD CONSTRAINT workflow_nodes_workflow_slug_fkey FOREIGN KEY (workflow_slug) REFERENCES public.workflows(slug);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflow_nodes_agent_slug_fkey' AND conrelid = 'public.workflow_nodes'::regclass) THEN
    ALTER TABLE public.workflow_nodes ADD CONSTRAINT workflow_nodes_agent_slug_fkey FOREIGN KEY (agent_slug) REFERENCES public.agents(slug);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'workflows_process_slug_fkey' AND conrelid = 'public.workflows'::regclass) THEN
    ALTER TABLE public.workflows ADD CONSTRAINT workflows_process_slug_fkey FOREIGN KEY (process_slug) REFERENCES public.processes(slug);
  END IF;
END $$;

COMMIT;
