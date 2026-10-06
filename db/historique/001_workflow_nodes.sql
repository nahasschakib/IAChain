INSERT INTO workflow_nodes
  (workflow_slug, node_key, kind, label, agent_slug, version, tag, row_index, col_index, parents, mapping, outputs, run_state, run_note)
VALUES
('idee-marketing','sofia','agent','Sofia · Veille marché','sofia',NULL,NULL,0,0,'{}','[]','[]','done',NULL),
('idee-marketing','othmane','agent','Othmane · Plan de campagne','othmane',NULL,NULL,1,0,'{sofia}','[]','[]','done',NULL),
('idee-marketing','lina','agent','Lina · Production de contenu','lina',NULL,NULL,2,0,'{othmane}','[]','[]','running',NULL),
('idee-marketing','approval','approval','Approbation humaine',NULL,NULL,'SLA 24 H',3,0,'{lina}','[]','[]','pending',NULL),
('idee-marketing','publish','action','Publication des contenus',NULL,NULL,'ACTION',4,0,'{approval}','[]','[]','pending',NULL)
ON CONFLICT (workflow_slug, node_key) DO NOTHING;