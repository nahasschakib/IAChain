-- db/071_karima_contrat_facture.sql
-- P4-10i (2/n) : contrat de Karima v4.0 (facture issue du devis validé) et colonnes de facture manquantes.
-- Décision du 23/10 : la retenue à la source relève du paiement, pas de la facture.
-- Idempotent.

BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM agents WHERE slug = 'karima') <> 1 THEN
    RAISE EXCEPTION 'Agent karima introuvable';
  END IF;
END $$;

-- 1. Factures : net HT dans total_ht ; total avant remise, montant de remise, références du devis.
ALTER TABLE factures
  ADD COLUMN IF NOT EXISTS total_brut_ht numeric(14,2),
  ADD COLUMN IF NOT EXISTS remise_montant numeric(14,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reference_commande text,
  ADD COLUMN IF NOT EXISTS devis_version text;

-- 2. Entrées du contrat de Karima
-- 2a. La retenue à la source n'est plus une entrée de la facture (elle relève du paiement).
DELETE FROM agent_contract_inputs
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND field_key = 'retenue_source';

-- 2b. La commande signée devient une référence facultative.
UPDATE agent_contract_inputs
SET requirement = 'optional',
    resolution_chain = 'Saisie manuelle (référence de commande du client, facultative)'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND field_key = 'commande';

-- 2c. Le taux de TVA est celui du devis validé.
UPDATE agent_contract_inputs
SET requirement = 'derivable',
    resolution_chain = 'Dérivé de Salma · Proposition commerciale (PRP-04) : taux de TVA du devis validé'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND field_key = 'taux_tva';

-- 2d. Nouvelle entrée : le devis validé.
INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, 'devis_valide', 'derivable', 'text',
       'Dérivé de Nadia · validation du devis : lignes, remise, TVA et totaux de la proposition validée par un humain',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_inputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'karima'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_inputs i WHERE i.agent_id = a.id AND i.field_key = 'devis_valide');

-- 3. Sorties du contrat
UPDATE agent_contract_outputs
SET description = 'XML structuré UBL 2.1 (profil DGI non publié) ; non transmis à la plateforme'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND field_key = 'facture.xml';

INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, 'facture.remise', 'Montant de la remise accordée, repris du devis validé', 'number',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_outputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'karima'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = a.id AND o.field_key = 'facture.remise');

INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, 'facture.echeance', 'Date d''échéance de paiement', 'text',
       (SELECT COALESCE(MAX(sort_order), 0) + 1 FROM agent_contract_outputs WHERE agent_id = a.id)
FROM agents a
WHERE a.slug = 'karima'
  AND NOT EXISTS (SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = a.id AND o.field_key = 'facture.echeance');

-- 4. Version du contrat : v4.0 (une entrée est retirée, donc changement majeur).
UPDATE agent_contract_meta
SET version = 'v4.0',
    compatibility_note = compatibility_note
      || ' · v4.0 : facture issue du devis validé (entrée devis_valide, taux_tva dérivé du devis, commande facultative) ; entrée retenue_source retirée (la retenue à la source relève du paiement) ; sorties facture.remise et facture.echeance.'
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND version = 'v3.0';

-- 5. Contrôle
SELECT 'input' k, field_key || ' / ' || requirement v FROM agent_contract_inputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
UNION ALL SELECT 'output', field_key FROM agent_contract_outputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
UNION ALL SELECT 'meta', version FROM agent_contract_meta WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
UNION ALL SELECT 'colonnes factures', count(*)::text FROM information_schema.columns WHERE table_name = 'factures';

COMMIT;