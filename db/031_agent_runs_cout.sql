-- 031 : colonnes de cout numeriques dans agent_runs (P2-01)
-- Le cout reel est calcule par chaque agent (src/lib/cost.ts) et range dans le JSON result (cost_mad, cost_usd).
-- Un declencheur le recopie dans des colonnes numeriques, pour pouvoir le sommer et le filtrer en SQL.
-- Les colonnes ne sont jamais ecrasees si elles sont deja renseignees. Idempotent.

BEGIN;

ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS cost_mad numeric(12,4);
ALTER TABLE public.agent_runs ADD COLUMN IF NOT EXISTS cost_usd numeric(12,6);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_runs_cost_mad_check' AND conrelid = 'public.agent_runs'::regclass) THEN
    ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_cost_mad_check CHECK (cost_mad IS NULL OR cost_mad >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agent_runs_cost_usd_check' AND conrelid = 'public.agent_runs'::regclass) THEN
    ALTER TABLE public.agent_runs ADD CONSTRAINT agent_runs_cost_usd_check CHECK (cost_usd IS NULL OR cost_usd >= 0);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.agent_runs_copy_cost() RETURNS trigger AS $$
BEGIN
  IF NEW.cost_mad IS NULL AND NEW.result ->> 'cost_mad' ~ '^[0-9]+(\.[0-9]+)?$' THEN
    NEW.cost_mad := (NEW.result ->> 'cost_mad')::numeric;
  END IF;
  IF NEW.cost_usd IS NULL AND NEW.result ->> 'cost_usd' ~ '^[0-9]+(\.[0-9]+)?$' THEN
    NEW.cost_usd := (NEW.result ->> 'cost_usd')::numeric;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS agent_runs_copy_cost_trg ON public.agent_runs;
CREATE TRIGGER agent_runs_copy_cost_trg
  BEFORE INSERT OR UPDATE OF result ON public.agent_runs
  FOR EACH ROW EXECUTE FUNCTION public.agent_runs_copy_cost();

-- Reprise de l'existant (declenche le recopiage sur les lignes qui ont un cout dans le JSON)
UPDATE public.agent_runs SET result = result WHERE result IS NOT NULL AND cost_mad IS NULL AND result ? 'cost_mad';

COMMIT;
