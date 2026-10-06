INSERT INTO workflow_nodes
  (workflow_slug, node_key, kind, label, agent_slug, version, tag, row_index, col_index, parents, mapping, outputs, run_state, run_note)
VALUES
('support-client','imane','agent','Imane · Tri & réponse','imane',NULL,NULL,0,0,'{}','[]','[]','done',NULL),
('support-client','approval','approval','Approbation humaine (escalade)',NULL,NULL,'SLA 4 H',1,0,'{imane}','[]','[]','waiting','en attente de validation'),
('support-client','reply','action','Envoi de la réponse',NULL,NULL,'ACTION',2,0,'{approval}','[]','[]','pending',NULL),
('support-client','hamza','agent','Hamza · Analyse des réclamations','hamza',NULL,NULL,3,0,'{reply}','[]','[]','pending',NULL)
ON CONFLICT (workflow_slug, node_key) DO NOTHING;

-- Ouvrir les deux studios, coûts estimés (MAD, valeurs de démonstration) et libellés de run
UPDATE workflows SET studio_ready = true, node_count = 5, merge_count = 0, approval_count = 1,
  cost_estimate = 21.50, run_label = '#2288' WHERE slug = 'idee-marketing';
UPDATE workflows SET studio_ready = true, node_count = 4, merge_count = 0, approval_count = 1,
  cost_estimate = 12.80, run_label = '#2290' WHERE slug = 'support-client';
UPDATE workflow_nodes
SET label = 'Approbation (escalade)'
WHERE workflow_slug = 'support-client' AND node_key = 'approval';  