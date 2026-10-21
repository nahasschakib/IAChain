-- 1. Écran : la politique et la proposition viennent du système, plus de champs manuels
DELETE FROM agent_task_fields
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia')
  AND field_key IN ('plafond', 'politique', 'proposition');

-- 2. Contrat, entrées : le plafond saisi laisse la place à la politique active
UPDATE agent_contract_inputs
SET field_key = 'politique',
    data_type = 'text',
    resolution_chain = 'Politique tarifaire active de l''organisation (Paramètres) : plafonds par grille, plafond avec dérogation, motifs d''exception'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia') AND field_key = 'plafond';

UPDATE agent_contract_inputs
SET resolution_chain = 'Dérivé de Salma · Proposition commerciale (PRP-04) : remise, segment, client (choisi dans la liste des propositions chiffrées)'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia') AND field_key = 'proposition';

-- 3. Contrat, sorties
UPDATE agent_contract_outputs
SET description = 'Conforme, Dérogation requise, Non conforme ou À contrôler manuellement'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia') AND field_key = 'verdict';

INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, 'plafond_pct', 'Plafond de remise applicable au segment (%)', 'number',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_outputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'nadia'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = a.id AND o.field_key = 'plafond_pct');

INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, 'ecart_pts', 'Remise proposée moins plafond, en points', 'number',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_outputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'nadia'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = a.id AND o.field_key = 'ecart_pts');

-- 4. Version du contrat (changement incompatible : le plafond n'est plus une entrée)
UPDATE agent_contract_meta
SET version = CASE WHEN version LIKE 'v%' THEN 'v2.0' ELSE '2.0' END,
    compatibility_note = 'v2.0 : le plafond n''est plus saisi, Nadia lit la politique tarifaire active. Verdicts étendus à quatre valeurs. Sorties ajoutées : plafond_pct, ecart_pts.'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia')
  AND version NOT IN ('2.0', 'v2.0');

-- 5. Contrôle
SELECT 'field' k, field_key v FROM agent_task_fields WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia')
UNION ALL SELECT 'input', field_key FROM agent_contract_inputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia')
UNION ALL SELECT 'output', field_key FROM agent_contract_outputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia')
UNION ALL SELECT 'meta', version FROM agent_contract_meta WHERE agent_id = (SELECT id FROM agents WHERE slug = 'nadia');