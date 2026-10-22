-- P4-10h : séquence de nurturing réelle par Anas. Additif : relance de devis (066) inchangée.

-- 1. Séquences préparées : une par préparation, décidées via une approbation « Séquence de nurturing ».
CREATE TABLE IF NOT EXISTS sequences_nurturing (
  id           serial PRIMARY KEY,
  org_id       text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  client       text NOT NULL,
  theme        text,
  maturite     text NOT NULL CHECK (maturite IN ('Chaud', 'Tiède', 'Froid')),
  canaux       jsonb NOT NULL,
  nb_touches   integer NOT NULL CHECK (nb_touches BETWEEN 3 AND 7),
  registre     text NOT NULL,
  touches      jsonb NOT NULL,
  texte_source text NOT NULL CHECK (texte_source IN ('ia', 'modele', 'mixte')),
  statut       text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'a_valider', 'valide', 'rejete')),
  version      text,
  agent_run_id integer,
  created_by   text,
  decided_by   text,
  decided_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sequences_nurturing_org ON sequences_nurturing (org_id, created_at DESC);
-- Une seule séquence en attente d'approbation par client.
CREATE UNIQUE INDEX IF NOT EXISTS uq_sequences_nurturing_attente ON sequences_nurturing (org_id, lower(client)) WHERE statut = 'a_valider';

-- 2. Contrat d'Anas, entrée additive : le client (dérivable de Yasmine)
INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, 'client', 'derivable', 'text', 'Dérivé de Yasmine · Fiche prospect : société (saisie manuelle possible)',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_inputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'anas'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_inputs i WHERE i.agent_id = a.id AND i.field_key = 'client');

-- 3. Contrat d'Anas, sortie additive (sequence.* inchangées)
INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, 'sequence.messages', 'Message rédigé pour chaque touche (sans chiffre), soumis à approbation', 'line[]',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_outputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'anas'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = a.id AND o.field_key = 'sequence.messages');

-- 4. Version du contrat (changement additif, compatible)
UPDATE agent_contract_meta
SET version = 'v1.4',
    compatibility_note = compatibility_note || ' · v1.4 : séquence de nurturing réelle (entrée client, sortie sequence.messages), compatible avec v1.3.'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
  AND version = 'v1.3';

-- 5. Contrôle
SELECT 'input' k, field_key v FROM agent_contract_inputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
UNION ALL SELECT 'output', field_key FROM agent_contract_outputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
UNION ALL SELECT 'meta', version FROM agent_contract_meta WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
UNION ALL SELECT 'table', COUNT(*)::text FROM sequences_nurturing;