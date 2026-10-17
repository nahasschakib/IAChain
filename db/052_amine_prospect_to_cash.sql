-- db/052 — Amine (ANF-16) en fin de chaîne du workflow Prospect to Cash (P0-06)
-- Idempotent : ne fait rien si le nœud ou l'usage existent déjà.
BEGIN;

INSERT INTO workflow_nodes
  (id, workflow_slug, node_key, label, tag, kind, blurb, details, mapping, outputs, parents,
   version, col_index, row_index, agent_slug, design_note)
SELECT
  (SELECT COALESCE(MAX(id), 0) + 1 FROM workflow_nodes),
  'prospect-to-cash', 'amine', 'Amine · Analyse financière', NULL, 'agent',
  'Amine — analyse financière du cycle : marges, trésorerie et écarts budgétaires',
  '{}'::jsonb,
  '[]'::jsonb,
  '["rapport.marges", "rapport.tresorerie", "rapport.ecarts_budgetaires", "rapport.recommandations", "rapport.version"]'::jsonb,
  ARRAY['youssef'],
  'v1.0', 0, 11, 'amine',
  'Fin de chaîne : lit la période et la configuration en saisie manuelle (aucune donnée héritée de Youssef). Le contrat reste identique à celui de la Clôture mensuelle.'
WHERE NOT EXISTS (
  SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'prospect-to-cash' AND node_key = 'amine'
);

-- Usage « Prospect to Cash » au contrat d'Amine, statut copié de celui de Youssef
INSERT INTO agent_contract_workflow_usage (agent_id, workflow_name, status, sort_order)
SELECT a.id, u.workflow_name, u.status,
       COALESCE((SELECT MAX(sort_order) FROM agent_contract_workflow_usage WHERE agent_id = a.id), -1) + 1
FROM agents a
JOIN agents y ON y.name = 'Youssef'
JOIN agent_contract_workflow_usage u ON u.agent_id = y.id AND u.workflow_name ILIKE 'Prospect%'
WHERE a.name = 'Amine'
  AND NOT EXISTS (
    SELECT 1 FROM agent_contract_workflow_usage x
    WHERE x.agent_id = a.id AND x.workflow_name ILIKE 'Prospect%'
  );

COMMIT;

-- Vérification
SELECT node_key, label, row_index, parents, agent_slug FROM workflow_nodes
WHERE workflow_slug = 'prospect-to-cash' AND row_index >= 10 ORDER BY row_index;
SELECT workflow_name, status, sort_order FROM agent_contract_workflow_usage
WHERE agent_id = (SELECT id FROM agents WHERE name = 'Amine') ORDER BY sort_order;