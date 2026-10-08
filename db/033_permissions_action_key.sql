-- P2-06 : clé stable pour appliquer les permissions à l'exécution
ALTER TABLE agent_permissions
  ADD COLUMN IF NOT EXISTS action_key text;

CREATE UNIQUE INDEX IF NOT EXISTS agent_permissions_agent_action_key_uq
  ON agent_permissions (agent_id, action_key)
  WHERE action_key IS NOT NULL;

-- Mehdi : décision de transmission à la vente (go/no-go)
UPDATE agent_permissions
SET action_key = 'transmission_vente'
WHERE id = 71
  AND action_label = 'Décision de transmission à la vente (go/no-go)'
  AND action_key IS NULL;