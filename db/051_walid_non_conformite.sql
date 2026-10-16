-- db/051_walid_non_conformite.sql
-- P4-19b : Walid (conformité) entre Ghita et Rim dans le workflow non-conformite

-- 1. Décalage d'un cran des nœuds à partir de Rim (une seule fois : seulement si Walid n'existe pas encore)
UPDATE workflow_nodes
SET row_index = row_index + 1
WHERE workflow_slug = 'non-conformite' AND row_index >= 2
  AND NOT EXISTS (SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'non-conformite' AND node_key = 'conf');

-- 2. Nœud de Walid
INSERT INTO workflow_nodes (id, tag, kind, blurb, label, details, mapping, outputs, parents, version, node_key, col_index, row_index, agent_slug, design_note, workflow_slug)
SELECT COALESCE(MAX(id), 0) + 1, NULL, 'agent',
       'Walid — vérifie la conformité du paramétrage ERP et des procédures qualité, preuves à l''appui',
       'Walid · Conformité', '{}'::jsonb,
       '[{"to": "parametrage_erp", "from": "erp.formulaires"}, {"to": "procedure_pr_adv_07", "from": "ged.procedures"}, {"to": "lecon_ll_023", "from": "kb.lecons"}]'::jsonb,
       '["conformite.controle", "conformite.preuve_manquante", "conformite.regle", "conformite.resultat"]'::jsonb,
       '{ano}'::text[], 'v1.0', 'conf', 0, 2, 'walid', NULL, 'non-conformite'
FROM workflow_nodes
WHERE NOT EXISTS (SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'non-conformite' AND node_key = 'conf');

-- 3. Rim reçoit désormais le résultat de Walid
UPDATE workflow_nodes
SET parents = '{conf}'::text[],
    mapping = '[{"to": "ecart", "from": "kpi.derive"}, {"to": "perimetre", "from": "anomalie.perimetre"}, {"to": "conformite", "from": "conformite.resultat"}]'::jsonb
WHERE workflow_slug = 'non-conformite' AND node_key = 'diag'
  AND EXISTS (SELECT 1 FROM workflow_nodes WHERE workflow_slug = 'non-conformite' AND node_key = 'conf');

-- 4. Contrat de Rim : nouvelle entrée dérivée de Walid
INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, 'conformite', 'derivable', 'text',
       'Dérivé de Walid · QM-03 (contrôle de conformité : résultat, règle, preuve manquante)',
       COALESCE((SELECT MAX(sort_order) FROM agent_contract_inputs WHERE agent_id = a.id), 0) + 1
FROM agents a
WHERE a.slug = 'rim'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_inputs i WHERE i.agent_id = a.id AND i.field_key = 'conformite');