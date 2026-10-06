-- Champ « Registre de rédaction » (choix unique) pour les agents dont le livrable est un texte rédigé
INSERT INTO agent_task_fields (agent_id, field_key, label, field_type, provenance, required, options, default_value, sort_order)
SELECT a.id, 'registre', 'Registre de rédaction', 'choice', 'Saisie manuelle', false,
       '["Direct","Institutionnel","Technique"]'::jsonb, 'Direct', 99
FROM agents a
WHERE a.slug IN ('zineb','amine','youssef','anas','lina','rachid','sofia','karim','salma','imane')
  AND NOT EXISTS (
    SELECT 1 FROM agent_task_fields f
    WHERE f.agent_id = a.id AND f.field_key = 'registre'
  );