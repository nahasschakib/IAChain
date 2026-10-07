-- 032 : temps gagne par execution et son hypothese (P2-04)
-- temps_gagne_min = minutes de travail humain remplacees par UNE execution reussie (valeurs provisoires, a recalibrer
-- sur des cas reels). temps_gagne_hypothese documente le calcul. NULL = pas encore estime (affiche « — »).
-- Idempotent : ne touche que les agents listes, et ecrase leurs valeurs a chaque rejeu.

BEGIN;

ALTER TABLE public.agents ADD COLUMN IF NOT EXISTS temps_gagne_hypothese text;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'agents_temps_gagne_min_check' AND conrelid = 'public.agents'::regclass) THEN
    ALTER TABLE public.agents ADD CONSTRAINT agents_temps_gagne_min_check CHECK (temps_gagne_min IS NULL OR temps_gagne_min >= 0);
  END IF;
END $$;

UPDATE public.agents a SET temps_gagne_min = v.min, temps_gagne_hypothese = v.hyp
FROM (VALUES
  ('Ilyas',   45,  'Rechercher à la main des sociétés et leurs contacts pour une requête'),
  ('Yasmine', 15,  'Saisir et structurer un lead entrant'),
  ('Mehdi',   10,  'Vérifier les critères d''un lead et le classer'),
  ('Karim',   40,  'Préparer l''approche commerciale d''un compte'),
  ('Lina',    60,  'Rédiger un contenu marketing'),
  ('Othmane', 90,  'Construire un plan de campagne'),
  ('Sofia',   120, 'Faire une veille et en rédiger la synthèse')
) AS v(name, min, hyp)
WHERE a.name = v.name;

COMMIT;
