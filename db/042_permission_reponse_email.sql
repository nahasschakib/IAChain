UPDATE agent_permissions
SET action_key = 'reponse_email'
WHERE agent_id = (SELECT id FROM agents WHERE name = 'Imane')
  AND action_label = 'Envoi de la réponse au client'
  AND action_key IS NULL;