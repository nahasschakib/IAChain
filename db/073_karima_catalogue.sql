-- db/073_karima_catalogue.sql
-- P4-10i (4/n) : catalogue de Karima aligné sur la facturation réelle (contrat v4.0).
-- Idempotent.

BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM agents WHERE slug = 'karima') <> 1 THEN
    RAISE EXCEPTION 'Agent karima introuvable';
  END IF;
END $$;

UPDATE agents
SET description = 'Établit la facture d''un devis validé : montants repris et recalculés par le code, identité légale du brand kit, validation humaine avant l''attribution du numéro.',
    cost_estimate = 0
WHERE slug = 'karima';

UPDATE agent_permissions
SET action_label = 'Lire le devis validé'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND action_label = 'Lire la commande signée';

-- Contrôle
SELECT a.description, a.cost_estimate, p.action_label, p.mode
FROM agents a
LEFT JOIN agent_permissions p ON p.agent_id = a.id
WHERE a.slug = 'karima'
ORDER BY p.sort_order;

COMMIT;