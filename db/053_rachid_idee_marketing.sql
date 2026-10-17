-- db/053 — Rachid (RPT-14) en fin de chaîne du workflow Idée→Marketing (P0-06)
-- Idempotent : ne fait rien pour ce qui existe déjà.
BEGIN;

-- 1. Entrée « campagne » au contrat de Rachid (dérivable de l'action Publication)
INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, 'campagne', 'derivable', 'text',
       'Dérivé de l''action Publication du workflow Idée→Marketing : identifiant de la campagne publiée (campaign.id)',
       COALESCE((SELECT MAX(sort_order) FROM agent_contract_inputs WHERE agent_id = a.id), 0) + 1
FROM agents a
WHERE a.name = 'Rachid'
  AND NOT EXISTS (
    SELECT 1 FROM agent_contract_inputs x WHERE x.agent_id = a.id AND x.field_key = 'campagne'
  );

-- 2. Nœud « Rachid · Reporting campagne » après la publication
INSERT INTO workflow_nodes
  (id, workflow_slug, node_key, label, tag, kind, blurb, details, mapping, outputs, parents,
   version, col_index, row_index, agent_slug, design_note)
SELECT
  (SELECT COALESCE(MAX(id), 0) + 1 FROM workflow_nodes),
  'idee-marketing', 'rachid', 'Rachid · Reporting campagne', NULL, 'agent',
  'Rachid — reporting des résultats de la campagne publiée : indicateurs, alertes et synthèse',
  '{}'::jsonb,
  '[{"to": "campagne", "from": "campaign.id"}]'::jsonb,
  '["kpi_dashboard", "alerts", "report_document"]'::jsonb,
  ARRAY['publish'],
  'v1.0', 0, 6, 'rachid',
  'Fin de chaîne : reçoit l''identifiant de la campagne publiée. Les métriques (ops_metrics) restent à brancher sur une source de résultats de campagne.'
WHERE NOT EXISTS (
  SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'idee-marketing' AND node_key = 'rachid'
);

-- 3. Usage « Idée→Marketing » au contrat de Rachid, statut copié d'un agent déjà dans ce workflow (Othmane)
INSERT INTO agent_contract_workflow_usage (agent_id, workflow_name, status, sort_order)
SELECT r.id, u.workflow_name, u.status,
       COALESCE((SELECT MAX(sort_order) FROM agent_contract_workflow_usage WHERE agent_id = r.id), 0) + 1
FROM agents r
JOIN agents o ON o.slug = 'othmane'
JOIN agent_contract_workflow_usage u ON u.agent_id = o.id AND u.workflow_name ILIKE '%marketing%'
WHERE r.name = 'Rachid'
  AND NOT EXISTS (
    SELECT 1 FROM agent_contract_workflow_usage x
    WHERE x.agent_id = r.id AND x.workflow_name ILIKE '%marketing%'
  );

COMMIT;

-- Vérification
SELECT node_key, label, row_index, parents, mapping::text AS mapping FROM workflow_nodes
WHERE workflow_slug = 'idee-marketing' AND row_index >= 5 ORDER BY row_index;
SELECT field_key, requirement, sort_order FROM agent_contract_inputs
WHERE agent_id = (SELECT id FROM agents WHERE name = 'Rachid') ORDER BY sort_order;
SELECT workflow_name, status, sort_order FROM agent_contract_workflow_usage
WHERE agent_id = (SELECT id FROM agents WHERE name = 'Rachid') ORDER BY sort_order;