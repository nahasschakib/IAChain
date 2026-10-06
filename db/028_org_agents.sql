-- 028 : activation des agents par organisation (P1-06)
-- Une ligne = un agent active pour une organisation. Sans ligne, l'agent n'est pas actif pour elle.
-- Remplissage initial : SOCYTAY (organisation exploitante) a tous les agents ; les autres organisations aucun.
-- Idempotent.

BEGIN;

CREATE TABLE IF NOT EXISTS public.org_agents (
  org_id text NOT NULL,
  agent_id integer NOT NULL,
  activated_at timestamptz NOT NULL DEFAULT now(),
  activated_by text,
  CONSTRAINT org_agents_pkey PRIMARY KEY (org_id, agent_id),
  CONSTRAINT org_agents_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.tenants(org_id) ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT org_agents_agent_id_fkey FOREIGN KEY (agent_id) REFERENCES public.agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS org_agents_agent_id_idx ON public.org_agents (agent_id);

COMMENT ON TABLE public.org_agents IS 'Agents actives par organisation (vente par modules). Le catalogue des agents reste commun a toutes les organisations.';

INSERT INTO public.org_agents (org_id, agent_id, activated_by)
SELECT t.org_id, a.id, 'migration 028'
FROM public.tenants t
CROSS JOIN public.agents a
WHERE t.is_platform = true
ON CONFLICT (org_id, agent_id) DO NOTHING;

COMMIT;
