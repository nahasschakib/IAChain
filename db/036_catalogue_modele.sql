-- P0-05 : modèle de données du catalogue (idempotent)
-- 1) Colonnes du catalogue (la catégorie/pôle reste agents.category)
ALTER TABLE agents ADD COLUMN IF NOT EXISTS niveau_commercial text;
ALTER TABLE agents ADD COLUMN IF NOT EXISTS statut_catalogue text NOT NULL DEFAULT 'prevu';
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_niveau_commercial_chk;
ALTER TABLE agents ADD CONSTRAINT agents_niveau_commercial_chk
  CHECK (niveau_commercial IS NULL OR niveau_commercial IN ('base','pro','premium'));
ALTER TABLE agents DROP CONSTRAINT IF EXISTS agents_statut_catalogue_chk;
ALTER TABLE agents ADD CONSTRAINT agents_statut_catalogue_chk
  CHECK (statut_catalogue IN ('actif','prevu','reporte'));

-- Agents réellement branchés
UPDATE agents SET statut_catalogue = 'actif'
WHERE slug IN ('mehdi','yasmine','karim','ilyas','sofia','othmane','lina');

-- 2) Activation des agents par organisation
CREATE TABLE IF NOT EXISTS organisation_agents (
  id           bigserial PRIMARY KEY,
  org_id       text   NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE ON DELETE CASCADE,
  agent_id     integer NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  active       boolean NOT NULL DEFAULT true,
  activated_at timestamptz NOT NULL DEFAULT now(),
  activated_by text,
  UNIQUE (org_id, agent_id)
);
CREATE INDEX IF NOT EXISTS organisation_agents_org_idx ON organisation_agents (org_id);

-- Plateforme (SOCYTAY) : tous les agents
INSERT INTO organisation_agents (org_id, agent_id, activated_by)
SELECT t.org_id, a.id, 'migration 036'
FROM tenants t CROSS JOIN agents a
WHERE t.is_platform = true
ON CONFLICT (org_id, agent_id) DO NOTHING;

-- Autres organisations : seulement les agents déjà utilisés (exécutions existantes)
INSERT INTO organisation_agents (org_id, agent_id, activated_by)
SELECT DISTINCT r.org_id, r.agent_id, 'migration 036'
FROM agent_runs r
JOIN tenants t ON t.org_id = r.org_id AND t.is_platform = false
ON CONFLICT (org_id, agent_id) DO NOTHING;
