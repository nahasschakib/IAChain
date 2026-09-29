-- 008 · Processus métier (niveau au-dessus des workflows)
-- Idempotent : relançable sans risque.

CREATE TABLE IF NOT EXISTS processes (
  slug             text PRIMARY KEY,
  tag              text NOT NULL,
  version          text NOT NULL,
  name             text NOT NULL,
  description      text NOT NULL,
  subprocesses     jsonb NOT NULL DEFAULT '[]'::jsonb,
  agent_categories text[] NOT NULL DEFAULT '{}',
  cta              text,          -- NULL = « Workflow <code> → » calculé depuis le workflow lié
  href             text,          -- NULL = /workflows/<slug du premier workflow lié>
  is_reference     boolean NOT NULL DEFAULT false,
  sort_order       int NOT NULL DEFAULT 0
);

ALTER TABLE workflows ADD COLUMN IF NOT EXISTS process_slug text;

INSERT INTO processes (slug, tag, version, name, description, subprocesses, agent_categories, cta, href, is_reference, sort_order) VALUES
('quality-management','RÉFÉRENCE','v1.0','Quality Management',
 'Détecter, analyser, corriger, prévenir, mesurer et capitaliser : la boucle PDCA complète, avec décisions humaines tracées.',
 '["Planification","Surveillance","Contrôle","Audit","Non-conformités","Causes racines","Corrective","Préventive","Performance","Amélioration","Leçons apprises"]'::jsonb,
 '{Qualité}','Ouvrir le processus →','/processes/quality-management',true,1),
('gestion-commerciale','VENTES','v3','Gestion commerciale',
 'Du lead à l''opportunité écrite au CRM, avec contrôle de remise et approbation.',
 '["Prospection","Qualification","Proposition","Contrôle tarifaire"]'::jsonb,
 '{Sales,Finance}',NULL,NULL,false,2),
('marketing','MARKETING','v1','Marketing',
 'Du signal marché au plan média validé et aux contenus publiés.',
 '["Veille","Planification","Production","Diffusion"]'::jsonb,
 '{Marketing}',NULL,NULL,false,3),
('service-client','SERVICE CLIENT','v2','Service client',
 'Tri, réponse, escalade et analyse des causes des réclamations.',
 '["Tri","Réponse","Escalade","Causes racines"]'::jsonb,
 '{Support}',NULL,NULL,false,4)
ON CONFLICT (slug) DO UPDATE SET
  tag = EXCLUDED.tag, version = EXCLUDED.version, name = EXCLUDED.name,
  description = EXCLUDED.description, subprocesses = EXCLUDED.subprocesses,
  agent_categories = EXCLUDED.agent_categories, cta = EXCLUDED.cta, href = EXCLUDED.href,
  is_reference = EXCLUDED.is_reference, sort_order = EXCLUDED.sort_order;

UPDATE workflows SET process_slug = 'gestion-commerciale' WHERE slug = 'prospect-to-cash';
UPDATE workflows SET process_slug = 'marketing'           WHERE slug = 'idee-marketing';
UPDATE workflows SET process_slug = 'service-client'      WHERE slug = 'support-client';
UPDATE workflows SET process_slug = 'quality-management'  WHERE slug = 'non-conformite';

-- Contrôle (canvas : agents 10 / 7 / 4 / 3 · workflows 1 / 1 / 1 / 1)
SELECT p.slug,
  (SELECT COUNT(*) FROM agents a WHERE lower(a.category) IN (SELECT lower(c) FROM unnest(p.agent_categories) c)) AS agents,
  (SELECT COUNT(*) FROM workflows w WHERE w.process_slug = p.slug) AS workflows
FROM processes p ORDER BY p.sort_order;