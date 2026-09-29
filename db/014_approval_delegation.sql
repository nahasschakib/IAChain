-- Délégation des approbations à des experts métier + journal des événements
CREATE TABLE IF NOT EXISTS org_experts (
  id serial PRIMARY KEY,
  name text NOT NULL,
  role_title text NOT NULL,
  domain text NOT NULL,            -- même valeurs que agents.category (Qualité, Sales, Support...)
  clerk_user_id text UNIQUE,       -- à renseigner quand la personne a un compte Clerk
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE approvals ADD COLUMN IF NOT EXISTS delegated_to integer REFERENCES org_experts(id);
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS delegated_at timestamptz;
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS delegation_reason text;

CREATE TABLE IF NOT EXISTS approval_events (
  id serial PRIMARY KEY,
  approval_id integer NOT NULL REFERENCES approvals(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('delegated','approved','rejected')),
  actor_user_id text,
  target_expert_id integer REFERENCES org_experts(id),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Experts de démonstration (à remplacer par les vrais membres de l'organisation)
INSERT INTO org_experts (name, role_title, domain)
SELECT v.name, v.role_title, v.domain
FROM (VALUES
  ('A. Kettani', 'Responsable qualité',    'Qualité'),
  ('S. Idrissi', 'Manager opérations',     'Qualité'),
  ('S. Benali',  'Responsable commercial', 'Sales'),
  ('L. Amrani',  'Responsable support',    'Support')
) AS v(name, role_title, domain)
WHERE NOT EXISTS (SELECT 1 FROM org_experts);