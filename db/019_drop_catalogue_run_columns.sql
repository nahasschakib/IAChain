-- 019 · Le catalogue ne porte plus d'état d'exécution (migré en 017)

DO $$
DECLARE
  unmigrated int;
BEGIN
  -- Garde-fou : chaque état de nœud du catalogue doit exister dans workflow_node_runs
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name = 'workflow_nodes' AND column_name = 'run_state') THEN
    SELECT COUNT(*) INTO unmigrated
    FROM workflow_nodes n
    JOIN workflows w ON w.slug = n.workflow_slug
    WHERE n.run_state IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM workflow_node_runs r
        JOIN workflow_executions e ON e.id = r.execution_id
        WHERE e.workflow_id = w.id AND r.node_key = n.node_key
      );
    IF unmigrated > 0 THEN
      RAISE EXCEPTION '% nœud(s) non migrés vers workflow_node_runs : abandon', unmigrated;
    END IF;
  END IF;
END $$;

ALTER TABLE workflow_nodes DROP COLUMN IF EXISTS run_state;
ALTER TABLE workflow_nodes DROP COLUMN IF EXISTS run_note;
ALTER TABLE workflows      DROP COLUMN IF EXISTS run_label;
ALTER TABLE workflows      DROP COLUMN IF EXISTS run_banner;

-- Vérification : attendu 0 ligne
SELECT table_name, column_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name IN ('run_state','run_note','run_label','run_banner')
  AND table_name IN ('workflow_nodes','workflows');