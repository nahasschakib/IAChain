-- db/050_nadia_controle_facture.sql
-- Second contrôle de Nadia : application des tarifs sur la facture établie, avant envoi au client

INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, 'facture', 'derivable', 'text',
       'Dérivé de Karima · Facturation (FAC-07) : numéro, montants HT, TVA et TTC de la facture établie',
       COALESCE((SELECT MAX(sort_order) FROM agent_contract_inputs WHERE agent_id = a.id), 0) + 1
FROM agents a
WHERE a.slug = 'nadia'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_inputs i WHERE i.agent_id = a.id AND i.field_key = 'facture');

INSERT INTO workflow_nodes (id, tag, kind, blurb, label, details, mapping, outputs, parents, version, node_key, col_index, row_index, agent_slug, design_note, workflow_slug)
SELECT COALESCE(MAX(id), 0) + 1, NULL, 'agent',
       'Nadia — recontrôle l''application des tarifs sur la facture établie, avant envoi au client',
       'Nadia · Contrôle facture', '{}'::jsonb,
       '[{"to": "plafond", "from": "discount.cap"}, {"to": "proposition", "from": "proposal.document"}, {"to": "facture", "from": "facture.numero"}]'::jsonb,
       '["verdict", "motif"]'::jsonb,
       '{karima}'::text[], 'v1.0', 'nadia_facture', 0, 9, 'nadia',
       'Second passage de Nadia : si le verdict est non conforme, la facture retourne à Karima et n''est pas envoyée au client.',
       'prospect-to-cash'
FROM workflow_nodes
WHERE NOT EXISTS (SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'prospect-to-cash' AND node_key = 'nadia_facture');

UPDATE workflow_nodes
SET parents = '{nadia_facture}'::text[], row_index = 10
WHERE workflow_slug = 'prospect-to-cash' AND node_key = 'youssef'
  AND EXISTS (SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'prospect-to-cash' AND node_key = 'nadia_facture');