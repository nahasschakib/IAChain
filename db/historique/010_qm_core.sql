-- 010 · Quality Management : données du cœur (cas, KPI, signaux, cycle NC-041)
-- Tables préfixées qm_. Idempotent (CREATE IF NOT EXISTS + DELETE/INSERT sur les données de démo).

CREATE TABLE IF NOT EXISTS qm_cases (
  id            text PRIMARY KEY,           -- NC-041
  title         text NOT NULL,
  source        text NOT NULL,
  severity      text NOT NULL,              -- Critique | Majeure | Mineure
  status        text NOT NULL,
  opened_label  text NOT NULL,
  cause         text,
  action_id     text,
  owner         text,
  effectiveness text,
  step          int  NOT NULL DEFAULT 0,    -- nb d'étapes du cycle déjà réalisées
  sort_order    int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qm_kpis (
  id         serial PRIMARY KEY,
  label      text NOT NULL,
  value      text NOT NULL,
  note       text NOT NULL,
  sort_order int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qm_signals (
  id         serial PRIMARY KEY,
  n          text NOT NULL,
  label      text NOT NULL,
  tab        text NOT NULL,                 -- onglet cible (nc, rca, actions, approvals)
  sort_order int  NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS qm_cycle_steps (
  case_id    text NOT NULL REFERENCES qm_cases(id) ON DELETE CASCADE,
  n          int  NOT NULL,
  phase      text NOT NULL,                 -- PLAN | DO | CHECK | ACT | LEARN
  agent_code text,                          -- QM-xx si l'acteur est un agent
  actor      text,                          -- acteur humain / exécution
  role       text,
  date_label text NOT NULL,
  label      text NOT NULL,
  output     text NOT NULL,
  kind       text NOT NULL,                 -- FAIT | PREUVE | INFÉRENCE | HYPOTHÈSE | DÉCISION | RECOMMANDATION | CONNAISSANCE
  evidence   text NOT NULL,
  next_label text,
  is_human   boolean NOT NULL DEFAULT false,
  PRIMARY KEY (case_id, n)
);

DELETE FROM qm_cycle_steps;
DELETE FROM qm_kpis;
DELETE FROM qm_signals;
DELETE FROM qm_cases;

-- NC-041 : 6 étapes réalisées, action AC-017 en attente d'approbation (APR-0447)
INSERT INTO qm_cases (id, title, source, severity, status, opened_label, cause, action_id, owner, effectiveness, step, sort_order) VALUES
('NC-041','Hausse du taux d''erreur de saisie des commandes','KPI','Majeure','Action en attente d''approbation','2 sept.','Unité par défaut « pièce » (retenue)','AC-017','A. Kettani','à mesurer',6,1),
('NC-040','Certificats matière manquants sur 3 lots fournisseur','Audit','Critique','Analyse des causes','28 août','Hypothèse en revue',NULL,'A. Kettani','à mesurer',0,2),
('NC-038','Retards de livraison récurrents à Kénitra','Réclamations','Mineure','Action en cours','19 août','Hypothèse : capacité transporteur','AC-015','H. Amrani','à mesurer',0,3),
('NC-036','Emballages endommagés à réception','Réclamations','Mineure','Vérifiée · close','30 juil.','Calage insuffisant (retenue)','AC-012','N. Saber','−41 % de réclamations',0,4);

INSERT INTO qm_kpis (label, value, note, sort_order) VALUES
('Score qualité','86','sur 100 · +3 ce trimestre',1),
('Problèmes ouverts','7','dont 4 non-conformités',2),
('Critiques','1','NC-040 · certificats',3),
('Non-conformités','4','2 majeures',4),
('Actions correctives','5','2 en cours',5),
('En retard','1','AC-012 · J+4',6),
('Taux d''erreur','3,8 %','cible ≤ 1,5 %',7),
('Opportunités','4','identifiées par Kenza',8);

INSERT INTO qm_signals (n, label, tab, sort_order) VALUES
('3','anomalies détectées cette semaine par Ghita','nc',1),
('2','problèmes récurrents : unité ERP, retards Kénitra','rca',2),
('4','opportunités d''amélioration identifiées par Kenza','actions',3),
('1','action corrective à valider par un humain','approvals',4);

INSERT INTO qm_cycle_steps (case_id, n, phase, agent_code, actor, role, date_label, label, output, kind, evidence, next_label, is_human) VALUES
  ('NC-041', 1, 'CHECK', 'QM-02', NULL, NULL, '02 sept.', 'Dérive détectée', 'Taux d''erreur de saisie : 1,2 % → 3,8 % en 3 semaines, seuil de 1,5 % franchi.', 'FAIT', 'ERP · 12 480 commandes', NULL, false),
  ('NC-041', 2, 'CHECK', 'QM-04', NULL, NULL, '04 sept.', 'Anomalie confirmée', 'Rupture le 2 sept. ; 71 % des erreurs sur le site de Tanger ; coïncide avec la mise en production d''un formulaire.', 'PREUVE', 'Série 26 semaines · calendrier des changements', NULL, false),
  ('NC-041', 3, 'PLAN', 'QM-01', NULL, NULL, '05 sept.', 'Diagnostic initial', 'Écart de 2,6 pts par rapport à l''objectif, risque de litiges sur les quantités, priorité haute.', 'INFÉRENCE', 'Matrice gravité × fréquence', NULL, false),
  ('NC-041', 4, 'PLAN', 'QM-05', NULL, NULL, '09 sept.', 'Hypothèses de cause', '3 hypothèses classées : unité par défaut du formulaire (moyenne à élevée), intérimaires non formés (moyenne), import catalogue (faible).', 'HYPOTHÈSE', '5 Pourquoi · Ishikawa · Pareto', NULL, false),
  ('NC-041', 5, 'PLAN', NULL, 'A. Kettani', 'Responsable qualité', '11 sept.', 'Cause retenue', 'Unité par défaut « pièce » au lieu de « carton », confirmée en rejouant 50 saisies.', 'DÉCISION', 'Test de reproduction 48/50 · DEC-0209', 'Retenir la cause (humain)', true),
  ('NC-041', 6, 'DO', 'QM-06', NULL, NULL, '12 sept.', 'Action corrective proposée', 'AC-017 : rétablir l''unité « carton » par défaut et bloquer au-delà de 500 unités. Échéance 19 sept.', 'RECOMMANDATION', 'Responsable proposé : équipe ERP', NULL, false),
  ('NC-041', 7, 'DO', NULL, 'S. Idrissi', 'Manager opérations', '15 sept.', 'Action approuvée avec modification', 'Échéance avancée au 16 sept. La recommandation initiale reste au registre, à côté de la décision finale.', 'DÉCISION', 'Registre DEC-0212', 'Valider l''action (manager)', true),
  ('NC-041', 8, 'DO', NULL, 'Exécution', 'Équipe ERP', '16 sept.', 'Action mise en œuvre', 'Paramétrage déployé sur les 3 sites le 16 sept.', 'FAIT', 'Ticket DSI-4471', 'Marquer l''action exécutée', false),
  ('NC-041', 9, 'CHECK', 'QM-09', NULL, NULL, '26 sept.', 'Mesure après action', '1,4 % sur 10 jours, sous la cible ; −63 % par rapport au pic.', 'FAIT', 'Avant / après · 10 jours', NULL, false),
  ('NC-041', 10, 'ACT', 'QM-08', NULL, NULL, '26 sept.', 'Efficacité évaluée', 'Action efficace, à confirmer sur une 2e période. Opportunité : revue qualité systématique des changements ERP.', 'RECOMMANDATION', '3 cas comparables', NULL, false),
  ('NC-041', 11, 'ACT', 'QM-07', NULL, NULL, '26 sept.', 'Prévention étendue', '2 formulaires exposés à la même cause (retours, transferts inter-sites) : AP-008 proposée.', 'HYPOTHÈSE', 'Cartographie ERP · 38 formulaires', NULL, false),
  ('NC-041', 12, 'LEARN', 'QM-10', NULL, NULL, '26 sept.', 'Leçon apprise capitalisée', 'LL-023 publiée ; Walid la contrôle désormais comme règle R-QC-14.', 'CONNAISSANCE', 'Base de connaissance', NULL, false);

-- Contrôle : attendu 4 cas · 8 KPI · 4 signaux · 11 étapes
SELECT (SELECT COUNT(*) FROM qm_cases) AS cas, (SELECT COUNT(*) FROM qm_kpis) AS kpi,
       (SELECT COUNT(*) FROM qm_signals) AS signaux, (SELECT COUNT(*) FROM qm_cycle_steps) AS etapes;