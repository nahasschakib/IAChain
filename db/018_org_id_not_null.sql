-- 018 · org_id obligatoire sur toutes les tables clientes
-- Garde-fou : plus aucune ligne ne peut exister sans organisation.

DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables tb
      ON tb.table_schema = c.table_schema AND tb.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name  = 'org_id'
      AND c.is_nullable  = 'YES'
      AND c.table_name  <> 'tenants'
      AND tb.table_type  = 'BASE TABLE'
  LOOP
    EXECUTE format('ALTER TABLE %I ALTER COLUMN org_id SET NOT NULL', t.table_name);
    RAISE NOTICE 'NOT NULL posé sur %', t.table_name;
  END LOOP;
END $$;

-- Vérification : attendu 0 ligne (plus aucune colonne org_id nullable)
SELECT table_name
FROM information_schema.columns
WHERE table_schema = 'public' AND column_name = 'org_id'
  AND is_nullable = 'YES' AND table_name <> 'tenants';