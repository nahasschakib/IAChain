-- db/063_salma_remise_defaut.sql
-- P4-09 : la remise de Salma ne doit pas être préremplie (12 % hérité de l'ancien aperçu).
-- Ajoute le choix 0 et le prend comme valeur par défaut. Idempotent : peut être rejoué sans effet.
-- S'arrête avec une erreur si le champ attendu est introuvable.

BEGIN;

DO $$
DECLARE n int;
BEGIN
  UPDATE agent_task_fields
  SET default_value = '0',
      options = '[0, 5, 8, 10, 12, 15]'
  WHERE agent_id = (SELECT id FROM agents WHERE slug = 'salma')
    AND field_key = 'remise';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'champ remise de Salma : % ligne(s) trouvée(s), 1 attendue', n;
  END IF;
END $$;

COMMIT;

-- Vérification (lecture seule)
SELECT field_key, field_type, default_value, options::text AS options
FROM agent_task_fields
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'salma') AND field_key = 'remise';