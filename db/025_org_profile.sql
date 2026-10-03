-- Profil commercial par organisation : offre + listes fermées (segments, enjeux).
CREATE TABLE IF NOT EXISTS org_profile (
  org_id      TEXT PRIMARY KEY REFERENCES tenants(org_id) ON UPDATE CASCADE,
  offer       TEXT NOT NULL DEFAULT '',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS org_options (
  id          SERIAL PRIMARY KEY,
  org_id      TEXT NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  kind        TEXT NOT NULL CHECK (kind IN ('segment', 'enjeu')),
  label       TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  active      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (org_id, kind, label)
);
CREATE INDEX IF NOT EXISTS org_options_org_idx ON org_options (org_id, kind, sort_order);

-- Valeurs actuelles de Karim, reprises pour chaque organisation existante.
INSERT INTO org_options (org_id, kind, label, sort_order)
SELECT t.org_id, v.kind, v.label, v.sort_order
FROM tenants t
CROSS JOIN (VALUES
  ('segment', 'PME', 1),
  ('segment', 'ETI', 2),
  ('segment', 'Grand compte', 3),
  ('segment', 'Secteur public', 4),
  ('enjeu', 'Réduction des coûts', 1),
  ('enjeu', 'Croissance', 2),
  ('enjeu', 'Conformité', 3),
  ('enjeu', 'Transformation digitale', 4)
) AS v(kind, label, sort_order)
ON CONFLICT (org_id, kind, label) DO NOTHING;