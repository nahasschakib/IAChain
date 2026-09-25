-- IAChain — schéma initial (agents, workflows, exécutions, approbations, activité)

CREATE TABLE agents (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,       -- ex: 'lead-qualification'
  name          TEXT NOT NULL,              -- ex: 'Lead Qualification Agent'
  short_name    TEXT NOT NULL,              -- ex: 'LQ' (badge sidebar/dashboard)
  status        TEXT NOT NULL DEFAULT 'actif', -- actif / inactif / pause
  category      TEXT,                       -- ex: 'Ventes', 'Marketing', 'Support'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflows (
  id            SERIAL PRIMARY KEY,
  slug          TEXT UNIQUE NOT NULL,       -- ex: 'prospect-to-cash'
  name          TEXT NOT NULL,              -- ex: 'Prospect to Cash'
  version       TEXT NOT NULL DEFAULT 'v1',
  status        TEXT NOT NULL DEFAULT 'actif',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE workflow_executions (
  id            SERIAL PRIMARY KEY,
  workflow_id   INTEGER NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'en_cours', -- en_cours / termine / erreur
  progress_done INTEGER NOT NULL DEFAULT 0,
  progress_total INTEGER NOT NULL DEFAULT 1,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ
);

CREATE TABLE approvals (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  tag           TEXT,                       -- ex: 'Envoi email', 'Modification donnée'
  agent_id      INTEGER REFERENCES agents(id),
  workflow_id   INTEGER REFERENCES workflows(id),
  status        TEXT NOT NULL DEFAULT 'en_attente', -- en_attente / approuve / rejete
  payload       JSONB,                      -- contenu à approuver (email, montant, etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at   TIMESTAMPTZ
);

CREATE TABLE activity_log (
  id            SERIAL PRIMARY KEY,
  agent_id      INTEGER REFERENCES agents(id),
  workflow_id   INTEGER REFERENCES workflows(id),
  action        TEXT NOT NULL,              -- ex: 'Qualification terminée — Atlas SARL'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE deliverables (
  id            SERIAL PRIMARY KEY,
  title         TEXT NOT NULL,
  agent_id      INTEGER REFERENCES agents(id),
  workflow_id   INTEGER REFERENCES workflows(id),
  kind          TEXT NOT NULL,              -- doc / list / chart / ticket
  version       TEXT NOT NULL DEFAULT 'v1',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Données de départ pour retrouver un Dashboard non vide
INSERT INTO agents (slug, name, short_name, status, category) VALUES
  ('lead-qualification', 'Lead Qualification Agent', 'LQ', 'actif', 'Ventes'),
  ('prospecting', 'Prospecting Agent', 'PR', 'actif', 'Ventes'),
  ('sales-strategy', 'Sales Strategy Agent', 'SL', 'actif', 'Ventes'),
  ('customer-support', 'Customer Support Agent', 'CS', 'actif', 'Support'),
  ('finance', 'Finance Agent', 'FN', 'actif', 'Finance'),
  ('marketing', 'Marketing Assistant', 'MK', 'actif', 'Marketing'),
  ('operations', 'Operations Assistant', 'OP', 'actif', 'Opérations');

INSERT INTO workflows (slug, name, version, status) VALUES
  ('prospect-to-cash', 'Prospect to Cash', 'v3', 'actif');