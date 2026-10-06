-- 009 · Rattachement des agents aux processus (par agent, en plus de la catégorie)
-- Un agent peut servir plusieurs processus (ex. Anas : Gestion commerciale + Marketing).
ALTER TABLE processes ADD COLUMN IF NOT EXISTS agent_slugs text[] NOT NULL DEFAULT '{}';

UPDATE processes SET agent_categories = '{}',
  agent_slugs = '{ilyas,karim,mehdi,salma,yasmine,nadia,anas}' WHERE slug = 'gestion-commerciale';
UPDATE processes SET agent_categories = '{}',
  agent_slugs = '{anas,lina,othmane,sofia}' WHERE slug = 'marketing';
UPDATE processes SET agent_categories = '{}',
  agent_slugs = '{imane,hamza,zineb}' WHERE slug = 'service-client';
-- quality-management reste rattaché par catégorie ('Qualité')

-- Contrôle : attendu 10 / 7 / 4 / 3
SELECT p.slug,
  (SELECT COUNT(*) FROM agents a
     WHERE a.slug = ANY (p.agent_slugs)
        OR lower(a.category) IN (SELECT lower(c) FROM unnest(p.agent_categories) c)) AS agents
FROM processes p ORDER BY p.sort_order;