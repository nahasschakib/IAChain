-- Intégrations : dernière synchro, mapping CRM <-> Agent, journal
ALTER TABLE integrations ADD COLUMN IF NOT EXISTS last_sync_at timestamptz;

CREATE TABLE IF NOT EXISTS integration_mappings (
  id serial PRIMARY KEY,
  integration_id integer NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  position integer NOT NULL DEFAULT 0,
  source_field text NOT NULL,
  agent_field text NOT NULL,
  transform text
);

CREATE TABLE IF NOT EXISTS integration_logs (
  id serial PRIMARY KEY,
  integration_id integer NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
  level text NOT NULL CHECK (level IN ('ok','warn','error')),
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Données de démonstration (uniquement si les tables sont vides)
UPDATE integrations SET last_sync_at = now() - interval '8 minutes'  WHERE name ILIKE 'CRM%'      AND last_sync_at IS NULL;
UPDATE integrations SET last_sync_at = now() - interval '2 minutes'  WHERE name ILIKE 'WhatsApp%' AND last_sync_at IS NULL;
UPDATE integrations SET last_sync_at = now() - interval '25 minutes' WHERE name ILIKE 'Email%'    AND last_sync_at IS NULL;

INSERT INTO integration_mappings (integration_id, position, source_field, agent_field, transform)
SELECT (SELECT id FROM integrations WHERE name ILIKE 'CRM%' LIMIT 1), v.pos, v.src, v.agt, v.tr
FROM (VALUES
  (1, 'account.name',      'entreprise',    NULL),
  (2, 'account.industry',  'secteur',       'Normalisé (liste IAChain)'),
  (3, 'account.employees', 'taille',        'Tranche : 1-10 / 11-50 / 51+'),
  (4, 'contact.email',     'email_contact', 'Minuscules'),
  (5, 'deal.amount',       'montant_mad',   'Converti en MAD'),
  (6, 'lead.source',       'origine',       NULL)
) AS v(pos, src, agt, tr)
WHERE NOT EXISTS (SELECT 1 FROM integration_mappings);

INSERT INTO integration_logs (integration_id, level, message, created_at)
SELECT (SELECT id FROM integrations WHERE name ILIKE v.pattern LIMIT 1), v.lvl, v.msg, now() - v.ago
FROM (VALUES
  ('CRM%',      'ok',    'Synchronisation terminée · 38 fiches mises à jour',       interval '8 minutes'),
  ('WhatsApp%', 'ok',    'Webhook reçu · 4 messages entrants',                      interval '2 minutes'),
  ('Email%',    'warn',  'Latence élevée sur l''envoi (3,2 s)',                     interval '25 minutes'),
  ('CRM%',      'error', 'Écriture refusée · champ « secteur » invalide',           interval '3 hours'),
  ('Email%',    'ok',    'Boîte de réception synchronisée',                         interval '5 hours'),
  ('ERP%',      'error', 'Connexion impossible · identifiants non configurés',      interval '1 day')
) AS v(pattern, lvl, msg, ago)
WHERE NOT EXISTS (SELECT 1 FROM integration_logs);