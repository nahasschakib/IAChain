-- P4-10b : relance de devis par Anas (déclencheur « proposition envoyée »). Additif : la séquence de nurturing est inchangée.

-- 1. Brouillons de relance : un par préparation, décidés via une approbation « Relance de devis ».
CREATE TABLE IF NOT EXISTS relances_devis (
  id            serial PRIMARY KEY,
  org_id        text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  salma_run_id  integer NOT NULL,
  client        text NOT NULL,
  jours_silence integer NOT NULL CHECK (jours_silence BETWEEN 1 AND 90),
  niveau        text NOT NULL CHECK (niveau IN ('rappel', 'relance', 'derniere')),
  registre      text NOT NULL,
  canal         text NOT NULL DEFAULT 'email',
  objet         text NOT NULL,
  texte         text NOT NULL,
  texte_source  text NOT NULL CHECK (texte_source IN ('ia', 'modele')),
  statut        text NOT NULL DEFAULT 'brouillon' CHECK (statut IN ('brouillon', 'a_valider', 'valide', 'rejete')),
  version       text,
  agent_run_id  integer,
  created_by    text,
  decided_by    text,
  decided_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_relances_devis_org ON relances_devis (org_id, created_at DESC);
-- Une seule relance en attente d'approbation par proposition.
CREATE UNIQUE INDEX IF NOT EXISTS uq_relances_devis_attente ON relances_devis (org_id, salma_run_id) WHERE statut = 'a_valider';

-- 2. Contrat d'Anas, entrées additives
INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, 'proposition', 'derivable', 'text', 'Dérivé de Salma · Proposition commerciale (PRP-04) : client, version, total TTC, délai (déclencheur « proposition envoyée »)',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_inputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'anas'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_inputs i WHERE i.agent_id = a.id AND i.field_key = 'proposition');

INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, 'jours_silence', 'required', 'number', 'Saisie manuelle uniquement',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_inputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'anas'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_inputs i WHERE i.agent_id = a.id AND i.field_key = 'jours_silence');

-- 3. Contrat d'Anas, sorties additives (sequence.* inchangées)
INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, 'relance.brouillon', 'Message de relance de devis (objet et texte), soumis à approbation', 'text',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_outputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'anas'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = a.id AND o.field_key = 'relance.brouillon');

INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, 'relance.version', 'Incrémentée à chaque relance préparée', 'semver',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_outputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'anas'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = a.id AND o.field_key = 'relance.version');

-- 4. Version du contrat (changement additif, compatible)
UPDATE agent_contract_meta
SET version = 'v1.3',
    compatibility_note = compatibility_note || ' · v1.3 : relance de devis (entrées proposition et jours_silence, sorties relance.*), compatible avec v1.2.'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
  AND version = 'v1.2';

-- 5. Contrôle
SELECT 'input' k, field_key v FROM agent_contract_inputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
UNION ALL SELECT 'output', field_key FROM agent_contract_outputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
UNION ALL SELECT 'meta', version FROM agent_contract_meta WHERE agent_id = (SELECT id FROM agents WHERE slug = 'anas')
UNION ALL SELECT 'table', COUNT(*)::text FROM relances_devis;