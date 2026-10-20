-- db/060_ilyas_vers_yasmine.sql
-- P4-09c (1/2) : Ilyas transmet sa liste à Yasmine (et non à Mehdi) ;
-- l'entrée signal.payload de Yasmine devient dérivable de liste.comptes (contrat additif v1.5).
-- Idempotent : peut être rejoué sans effet. S'arrête avec une erreur si la ligne attendue est introuvable.

BEGIN;

-- 1. Permission d'Ilyas : la transmission va à Yasmine.
UPDATE agent_permissions
SET action_label = 'Transmettre la liste à Yasmine · Capture'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'ilyas')
  AND action_label = 'Transmettre la liste à Mehdi · Qualification';

-- 2. Entrée de Yasmine : signal.payload dérivable de la liste d'Ilyas.
DO $$
DECLARE n int;
BEGIN
  UPDATE agent_contract_inputs
  SET requirement = 'derivable',
      resolution_chain = 'Dérivé de Ilyas · Prospection par requête (liste.comptes)'
  WHERE agent_id = (SELECT id FROM agents WHERE slug = 'yasmine')
    AND field_key = 'signal.payload';
  GET DIAGNOSTICS n = ROW_COUNT;
  IF n <> 1 THEN
    RAISE EXCEPTION 'signal.payload de Yasmine : % ligne(s) trouvée(s), 1 attendue', n;
  END IF;
END $$;

-- 3. Version du contrat de Yasmine (additif : aucune sortie ni entrée supprimée).
UPDATE agent_contract_meta
SET version = 'v1.5'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'yasmine');

COMMIT;

-- Vérifications (lecture seule)
SELECT action_label, mode FROM agent_permissions
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'ilyas') ORDER BY sort_order;

SELECT field_key, requirement, resolution_chain FROM agent_contract_inputs
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'yasmine') ORDER BY sort_order;

SELECT version FROM agent_contract_meta
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'yasmine');

SELECT field_key, description FROM agent_contract_outputs
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'ilyas') ORDER BY sort_order;