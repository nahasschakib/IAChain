-- db/026_agents_catalogue_columns.sql
-- P1-05 : deux colonnes de catalogue sur agents, vides au depart (decision du 06/10/2026).
--   temps_gagne_min  : temps gagne estime par execution, en minutes (renseigne par les preuves de valeur, phase 2)
--   niveau_commercial : socle, module ou option (fixe en P5-01, quand le catalogue est stabilise)
-- Le "pole" reste la colonne category. Le niveau d'autonomie reste calcule depuis les permissions.
-- Idempotent.
BEGIN;

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS temps_gagne_min integer;
ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS niveau_commercial text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agents_temps_gagne_min_check' AND conrelid = 'public.agents'::regclass) THEN
    ALTER TABLE public.agents ADD CONSTRAINT agents_temps_gagne_min_check
      CHECK (temps_gagne_min IS NULL OR temps_gagne_min >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agents_niveau_commercial_check' AND conrelid = 'public.agents'::regclass) THEN
    ALTER TABLE public.agents ADD CONSTRAINT agents_niveau_commercial_check
      CHECK (niveau_commercial IS NULL OR niveau_commercial IN ('socle', 'module', 'option'));
  END IF;
END $$;

COMMENT ON COLUMN public.agents.temps_gagne_min IS 'Temps gagne estime par execution (minutes) ; NULL tant que non mesure';
COMMENT ON COLUMN public.agents.niveau_commercial IS 'socle, module ou option ; NULL tant que la grille commerciale n''est pas fixee (P5-01)';

COMMIT;
