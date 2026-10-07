-- 030 : rattache crm_accounts a une organisation (P1-06c)
-- Les comptes existants (jeu d'essai issu d'un import xlsx) sont rattaches a l'organisation exploitante (SOCYTAY).
-- Un nom de compte est unique par organisation (insensible a la casse).
-- Idempotent.

BEGIN;

ALTER TABLE public.crm_accounts ADD COLUMN IF NOT EXISTS org_id text;

UPDATE public.crm_accounts
SET org_id = (SELECT org_id FROM public.tenants WHERE is_platform = true LIMIT 1)
WHERE org_id IS NULL;

ALTER TABLE public.crm_accounts ALTER COLUMN org_id SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_accounts_org_id_fkey' AND conrelid = 'public.crm_accounts'::regclass) THEN
    ALTER TABLE public.crm_accounts ADD CONSTRAINT crm_accounts_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.tenants(org_id) ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS crm_accounts_org_name_key ON public.crm_accounts (org_id, lower(name));

COMMIT;
