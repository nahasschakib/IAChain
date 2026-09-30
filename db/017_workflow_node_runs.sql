-- 017 · État d'exécution par organisation (option A)
-- Le catalogue (workflows, workflow_nodes) devient une recette en lecture seule.
-- L'état d'une exécution vit dans workflow_executions + workflow_node_runs.

BEGIN;

-- 1. Bandeau et libellé d'exécution, portés par l'exécution
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS banner    jsonb;
ALTER TABLE workflow_executions ADD COLUMN IF NOT EXISTS run_label text;

-- 2. État de chaque nœud pour une exécution donnée
CREATE TABLE IF NOT EXISTS workflow_node_runs (
  id           serial PRIMARY KEY,
  execution_id integer NOT NULL REFERENCES workflow_executions(id) ON DELETE CASCADE,
  node_key     text    NOT NULL,
  state        text    NOT NULL CHECK (state IN ('done','running','waiting','pending','failed')),
  note         text,
  org_id       text    REFERENCES tenants(org_id) ON UPDATE CASCADE,
  UNIQUE (execution_id, node_key)
);
CREATE INDEX IF NOT EXISTS workflow_node_runs_org_idx ON workflow_node_runs (org_id);

-- 3. Migration : bandeau + libellé du catalogue → exécution correspondante
UPDATE workflow_executions e
SET banner    = COALESCE(e.banner, w.run_banner::jsonb),
    run_label = COALESCE(e.run_label, w.run_label)
FROM workflows w
WHERE w.id = e.workflow_id;

-- 4. Migration : état des nœuds du catalogue → workflow_node_runs
INSERT INTO workflow_node_runs (execution_id, node_key, state, note, org_id)
SELECT e.id, n.node_key, n.run_state, n.run_note, e.org_id
FROM workflow_nodes n
JOIN workflows w           ON w.slug = n.workflow_slug
JOIN workflow_executions e ON e.workflow_id = w.id
WHERE n.run_state IS NOT NULL
ON CONFLICT (execution_id, node_key) DO NOTHING;

COMMIT;

-- Vérification : attendu 4 exécutions avec bandeau, et 43 nœuds répartis sur 4 exécutions
SELECT e.id, w.slug, e.org_id, e.run_label,
       (e.banner IS NOT NULL) AS has_banner,
       COUNT(r.id) AS node_runs
FROM workflow_executions e
JOIN workflows w ON w.id = e.workflow_id
LEFT JOIN workflow_node_runs r ON r.execution_id = e.id
GROUP BY e.id, w.slug, e.org_id, e.run_label, e.banner
ORDER BY e.id;