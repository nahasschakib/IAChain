-- Phase 1c : contrats, permissions et usage des 10 agents Qualité (QM-01 à QM-10)
-- Relançable : supprime d'abord les lignes existantes de ces 10 agents uniquement.

DELETE FROM agent_contract_inputs WHERE agent_id IN (SELECT id FROM agents WHERE category = 'Qualité');
DELETE FROM agent_contract_outputs WHERE agent_id IN (SELECT id FROM agents WHERE category = 'Qualité');
DELETE FROM agent_permissions WHERE agent_id IN (SELECT id FROM agents WHERE category = 'Qualité');
DELETE FROM agent_contract_workflow_usage WHERE agent_id IN (SELECT id FROM agents WHERE category = 'Qualité');

INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, v.field_key, v.requirement, v.data_type, v.chain, v.ord
FROM (VALUES
  ('QM-01', 'kpi_taux_d_erreur', 'derivable', 'object', 'Adil · QM-02', 1),
  ('QM-01', 'anomalie_confirmee', 'derivable', 'object', 'Ghita · QM-04', 2),
  ('QM-01', 'objectifs_qualite_2026', 'required', 'object', 'Référentiel qualité', 3),
  ('QM-02', 'commandes_saisies', 'required', 'object', 'ERP', 1),
  ('QM-02', 'commandes_corrigees', 'required', 'object', 'ERP · journal des modifications', 2),
  ('QM-02', 'cible', 'required', 'object', 'Référentiel qualité', 3),
  ('QM-03', 'procedure_pr_adv_07', 'required', 'object', 'GED qualité', 1),
  ('QM-03', 'parametrage_erp', 'required', 'object', 'ERP', 2),
  ('QM-03', 'lecon_ll_023', 'derivable', 'object', 'Houda · QM-10', 3),
  ('QM-04', 'serie_kpi_sur_26_semaines', 'derivable', 'object', 'Adil · QM-02', 1),
  ('QM-04', 'incidents_de_saisie', 'required', 'object', 'Helpdesk interne', 2),
  ('QM-04', 'calendrier_des_changements', 'required', 'object', 'ERP · mises en production', 3),
  ('QM-05', 'diagnostic', 'derivable', 'object', 'Rim · QM-01', 1),
  ('QM-05', 'anomalie_et_declencheurs', 'derivable', 'object', 'Ghita · QM-04', 2),
  ('QM-05', 'historique_des_causes', 'required', 'object', 'Base de connaissance', 3),
  ('QM-06', 'cause_retenue', 'derivable', 'object', 'Décision humaine · A. Kettani', 1),
  ('QM-06', 'ressources_it', 'required', 'object', 'Planning DSI', 2),
  ('QM-06', 'methode_de_verification', 'required', 'object', 'Référentiel qualité', 3),
  ('QM-07', 'cause_racine', 'derivable', 'object', 'Soufiane · QM-05', 1),
  ('QM-07', 'cartographie_des_formulaires', 'required', 'object', 'ERP', 2),
  ('QM-07', 'incidents_similaires', 'required', 'object', 'Base de connaissance', 3),
  ('QM-08', 'kpi_historiques', 'derivable', 'object', 'Adil · QM-02', 1),
  ('QM-08', 'actions_et_efficacite', 'derivable', 'object', 'Tarik · QM-09', 2),
  ('QM-08', 'reclamations_clients', 'required', 'object', 'CRM', 3),
  ('QM-09', 'reference', 'derivable', 'object', 'Adil · QM-02', 1),
  ('QM-09', 'date_de_mise_en_uvre', 'derivable', 'object', 'Exécution · 16 sept.', 2),
  ('QM-09', 'serie_kpi', 'required', 'object', 'ERP', 3),
  ('QM-10', 'dossier_nc_041', 'derivable', 'object', 'Workflow WF-04', 1),
  ('QM-10', 'decisions_humaines', 'required', 'object', 'Registre des décisions', 2),
  ('QM-10', 'mesure_d_efficacite', 'derivable', 'object', 'Tarik · QM-09', 3)
) AS v(code, field_key, requirement, data_type, chain, ord)
JOIN agents a ON a.code = v.code;

INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, v.field_key, v.descr, v.data_type, v.ord
FROM (VALUES
  ('QM-01', 'ecart', 'Écart (fait)', 'string', 1),
  ('QM-01', 'perimetre', 'Périmètre (preuve)', 'string', 2),
  ('QM-01', 'risque', 'Risque (inférence)', 'string', 3),
  ('QM-01', 'priorite', 'Priorité (recommandation)', 'string', 4),
  ('QM-02', 'taux_d_erreur_de_saisie', 'Taux d''erreur de saisie (fait)', 'string', 1),
  ('QM-02', 'tendance', 'Tendance (fait)', 'string', 2),
  ('QM-02', 'derive', 'Dérive (fait)', 'string', 3),
  ('QM-03', 'regle', 'Règle (fait)', 'string', 1),
  ('QM-03', 'controle', 'Contrôle (fait)', 'string', 2),
  ('QM-03', 'preuve_manquante', 'Preuve manquante (preuve)', 'string', 3),
  ('QM-03', 'resultat', 'Résultat (inférence)', 'string', 4),
  ('QM-04', 'rupture', 'Rupture (fait)', 'string', 1),
  ('QM-04', 'concentration', 'Concentration (preuve)', 'string', 2),
  ('QM-04', 'coincidence', 'Coïncidence (preuve)', 'string', 3),
  ('QM-04', 'lecture', 'Lecture (inférence)', 'string', 4),
  ('QM-05', 'hypothese_1', 'Hypothèse 1 (hypothèse)', 'string', 1),
  ('QM-05', 'preuve', 'Preuve (preuve)', 'string', 2),
  ('QM-05', 'hypothese_2', 'Hypothèse 2 (hypothèse)', 'string', 3),
  ('QM-05', 'a_investiguer', 'À investiguer (recommandation)', 'string', 4),
  ('QM-06', 'action', 'Action (recommandation)', 'string', 1),
  ('QM-06', 'responsable', 'Responsable (recommandation)', 'string', 2),
  ('QM-06', 'echeance', 'Échéance (recommandation)', 'string', 3),
  ('QM-06', 'verification', 'Vérification (recommandation)', 'string', 4),
  ('QM-07', 'exposition_1', 'Exposition (preuve)', 'string', 1),
  ('QM-07', 'exposition_2', 'Exposition (preuve)', 'string', 2),
  ('QM-07', 'risque', 'Risque (hypothèse)', 'string', 3),
  ('QM-07', 'action', 'Action (recommandation)', 'string', 4),
  ('QM-08', 'opportunite', 'Opportunité (recommandation)', 'string', 1),
  ('QM-08', 'benefice_attendu', 'Bénéfice attendu (inférence)', 'string', 2),
  ('QM-08', 'risque_de_mise_en_uvre', 'Risque de mise en œuvre (inférence)', 'string', 3),
  ('QM-08', 'kpi_a_suivre', 'KPI à suivre (recommandation)', 'string', 4),
  ('QM-09', 'reference', 'Référence (fait)', 'string', 1),
  ('QM-09', 'pic', 'Pic (fait)', 'string', 2),
  ('QM-09', 'actuel_sur_10_jours', 'Actuel sur 10 jours (fait)', 'string', 3),
  ('QM-09', 'evaluation', 'Évaluation (inférence)', 'string', 4),
  ('QM-10', 'lecon', 'Leçon (connaissance)', 'string', 1),
  ('QM-10', 'reutilisation_1', 'Réutilisation (connaissance)', 'string', 2),
  ('QM-10', 'reutilisation_2', 'Réutilisation (connaissance)', 'string', 3)
) AS v(code, field_key, descr, data_type, ord)
JOIN agents a ON a.code = v.code;

INSERT INTO agent_permissions (agent_id, action_label, mode, stats_text, sort_order)
SELECT a.id, v.action_label, v.mode, v.stats, v.ord
FROM (VALUES
  ('QM-01', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-01', 'Production de le diagnostic priorisé', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-02', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-02', 'Production de les KPI et dérives', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-03', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-03', 'Production de les résultats de conformité', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-03', 'Levée d''exception', 'Validation requise', 'Décision : responsable qualité', 3),
  ('QM-04', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-04', 'Production de les anomalies et déclencheurs', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-05', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-05', 'Production de les hypothèses de cause', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-05', 'Retenue de la cause racine', 'Validation requise', 'Décision : responsable qualité', 3),
  ('QM-06', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-06', 'Production de le plan d''action corrective', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-06', 'Approbation de l''action corrective', 'Validation requise', 'Décision : manager opérations', 3),
  ('QM-07', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-07', 'Production de les actions préventives', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-07', 'Validation de l''action préventive', 'Validation requise', 'Décision : responsable qualité', 3),
  ('QM-08', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-08', 'Production de les opportunités priorisées', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-08', 'Arbitrage des opportunités d''amélioration', 'Validation requise', 'Décision : comité qualité', 3),
  ('QM-09', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-09', 'Production de l''évaluation d''efficacité', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-09', 'Clôture de l''action', 'Validation requise', 'Décision : responsable qualité', 3),
  ('QM-10', 'Lecture des données sources', 'Automatique', 'Utilisé à chaque exécution', 1),
  ('QM-10', 'Production de la leçon apprise', 'Automatique', 'Sortie structurée : faits, preuves et hypothèses séparés', 2),
  ('QM-10', 'Publication de la leçon apprise', 'Validation requise', 'Décision : responsable qualité', 3)
) AS v(code, action_label, mode, stats, ord)
JOIN agents a ON a.code = v.code;

INSERT INTO agent_contract_workflow_usage (agent_id, workflow_name, status, sort_order)
SELECT a.id, v.wf, v.status, v.ord
FROM (VALUES
  ('QM-01', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-02', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-03', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-04', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-05', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-06', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-07', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-08', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-09', 'Non-conformité → Amélioration continue', 'actif · v1', 1),
  ('QM-10', 'Non-conformité → Amélioration continue', 'actif · v1', 1)
) AS v(code, wf, status, ord)
JOIN agents a ON a.code = v.code;

-- Vérification attendue : 30 entrées, 38 sorties, 27 permissions, 10 usages
SELECT
 (SELECT COUNT(*) FROM agent_contract_inputs i JOIN agents a ON a.id=i.agent_id WHERE a.category='Qualité') AS entrees,
 (SELECT COUNT(*) FROM agent_contract_outputs o JOIN agents a ON a.id=o.agent_id WHERE a.category='Qualité') AS sorties,
 (SELECT COUNT(*) FROM agent_permissions p JOIN agents a ON a.id=p.agent_id WHERE a.category='Qualité') AS permissions,
 (SELECT COUNT(*) FROM agent_contract_workflow_usage u JOIN agents a ON a.id=u.agent_id WHERE a.category='Qualité') AS usages;