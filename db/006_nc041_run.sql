-- 006 · Cycle NC-041 en cours (WF-04) : approbation APR-0447, exécution, activité.
-- Idempotent : peut être rejoué sans doublon. Prérequis : 005 (workflow WF-04) exécuté.

-- 1. Approbation APR-0447 (SLA 48 h : créée il y a 18 h, échéance dans 30 h)
INSERT INTO approvals (title, tag, workflow_id, status, agent_label, created_at, due_at)
SELECT 'Action corrective AC-017 · unité de saisie ERP', 'Action corrective', w.id, 'en_attente', 'Meryem',
       now() - interval '18 hours', now() + interval '30 hours'
FROM workflows w
WHERE w.slug = 'non-conformite'
  AND NOT EXISTS (
    SELECT 1 FROM approvals a
    WHERE a.workflow_id = w.id AND a.title = 'Action corrective AC-017 · unité de saisie ERP'
  );

-- 2. Exécution NC-041 : étape 9/14 (approbation manager)
INSERT INTO workflow_executions (workflow_id, status, progress_done, progress_total, started_at, client_label, current_step)
SELECT w.id, 'en_cours', 9, 14, now() - interval '2 days', 'NC-041', 'Approbation manager'
FROM workflows w
WHERE w.slug = 'non-conformite'
  AND NOT EXISTS (
    SELECT 1 FROM workflow_executions e WHERE e.workflow_id = w.id AND e.client_label = 'NC-041'
  );

-- 3. Activité du cycle (hier, pour ne pas écraser les événements du jour)
INSERT INTO activity_log (workflow_id, agent_label, status, tone, created_at)
SELECT w.id, v.agent, v.status, v.tone, now() - v.ago
FROM workflows w
CROSS JOIN (VALUES
  ('Ghita',    'Terminé',     'signal', interval '30 hours'),
  ('Soufiane', 'Terminé',     'signal', interval '24 hours'),
  ('Meryem',   'Approbation', 'amber',  interval '18 hours')
) AS v(agent, status, tone, ago)
WHERE w.slug = 'non-conformite'
  AND NOT EXISTS (
    SELECT 1 FROM activity_log l
    WHERE l.workflow_id = w.id AND l.agent_label = v.agent AND l.status = v.status
  );

-- 4. Cohérence du graphe : la fusion est faite (le correctif prime, le préventif suit)
UPDATE workflow_nodes
SET run_state = 'done', run_note = 'plan consolidé'
WHERE workflow_slug = 'non-conformite' AND node_key = 'merge';

-- Vérification attendue : 1 approbation, 1 exécution, 3 lignes d'activité
SELECT
  (SELECT COUNT(*) FROM approvals a JOIN workflows w ON w.id = a.workflow_id
    WHERE w.slug = 'non-conformite' AND a.status = 'en_attente') AS approbations,
  (SELECT COUNT(*) FROM workflow_executions e JOIN workflows w ON w.id = e.workflow_id
    WHERE w.slug = 'non-conformite' AND e.status = 'en_cours') AS executions,
  (SELECT COUNT(*) FROM activity_log l JOIN workflows w ON w.id = l.workflow_id
    WHERE w.slug = 'non-conformite') AS activite;