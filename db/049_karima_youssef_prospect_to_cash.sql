-- db/049_karima_youssef_prospect_to_cash.sql
-- P4-09e : branche Karima (facturation) et Youssef (recouvrement) à la suite de « Action CRM »

INSERT INTO workflow_nodes (id, tag, kind, blurb, label, details, mapping, outputs, parents, version, node_key, col_index, row_index, agent_slug, design_note, workflow_slug)
SELECT COALESCE(MAX(id), 0) + 1, NULL, 'agent',
       'Karima — facture la commande une fois la proposition acceptée (TVA, retenue à la source)',
       'Karima · Facturation', '{}'::jsonb, '[]'::jsonb,
       '["facture.numero", "facture.montant_ht", "facture.tva", "facture.montant_ttc", "facture.xml", "facture.version"]'::jsonb,
       '{crm}'::text[], 'v1.0', 'karima', 0, 8, 'karima', NULL, 'prospect-to-cash'
FROM workflow_nodes
WHERE NOT EXISTS (SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'prospect-to-cash' AND node_key = 'karima');

INSERT INTO workflow_nodes (id, tag, kind, blurb, label, details, mapping, outputs, parents, version, node_key, col_index, row_index, agent_slug, design_note, workflow_slug)
SELECT COALESCE(MAX(id), 0) + 1, NULL, 'agent',
       'Youssef — plan de relance et d''escalade des factures impayées',
       'Youssef · Recouvrement', '{}'::jsonb,
       '[{"to": "historique", "from": "crm.account_id"}]'::jsonb,
       '["plan.escalade", "plan.relances", "plan.version"]'::jsonb,
       '{karima}'::text[], 'v1.0', 'youssef', 0, 9, 'youssef', NULL, 'prospect-to-cash'
FROM workflow_nodes
WHERE NOT EXISTS (SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'prospect-to-cash' AND node_key = 'youssef');

INSERT INTO agent_contract_workflow_usage (agent_id, workflow_name, status, sort_order)
SELECT a.id, 'Prospect to Cash', 'actif·v3', 0
FROM agents a
WHERE a.slug = 'youssef'
  AND NOT EXISTS (
    SELECT 1 FROM agent_contract_workflow_usage u
    WHERE u.agent_id = a.id AND u.workflow_name = 'Prospect to Cash'
  );