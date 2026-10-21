-- db/064_contrat_salma.sql
-- P4-09 (4/4) : contrat de Salma v2.2 (additif : aucune entrée ni sortie supprimée ou modifiée).
-- Entrées ajoutées : remise (saisie), catalogue (configuration de l'organisation).
-- Sorties ajoutées : proposal.total_ht, proposal.remise_pct, proposal.lignes, proposal.delai_jours,
-- que Nadia lira pour contrôler la remise. Idempotent. S'arrête avec une erreur si Salma ou sa version attendue manque.

BEGIN;

DO $$
DECLARE
  salma int;
  v text;
BEGIN
  SELECT id INTO salma FROM agents WHERE slug = 'salma';
  IF salma IS NULL THEN
    RAISE EXCEPTION 'agent salma introuvable';
  END IF;

  -- Entrées
  INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
  SELECT salma, x.field_key, x.requirement, x.data_type, x.chain, x.ord
  FROM (VALUES
    ('remise',    'optional', 'number',
     'Saisie manuelle · le plafond admissible est fourni par Karim (politique tarifaire de l''organisation)', 4),
    ('catalogue', 'required', 'line[]',
     'Configuration de l''organisation · catalogue de prestations (Paramètres)', 5)
  ) AS x(field_key, requirement, data_type, chain, ord)
  WHERE NOT EXISTS (
    SELECT 1 FROM agent_contract_inputs i WHERE i.agent_id = salma AND i.field_key = x.field_key
  );

  -- Sorties
  INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
  SELECT salma, x.field_key, x.description, x.data_type, x.ord
  FROM (VALUES
    ('proposal.total_ht',     'Montant total HT de la proposition, avant remise', 'number', 4),
    ('proposal.remise_pct',   'Remise appliquée en pourcentage, contrôlée ensuite par Nadia', 'number', 5),
    ('proposal.lignes',       'Lignes du devis issues du catalogue : prestation, quantité, prix unitaire HT, total HT', 'line[]', 6),
    ('proposal.delai_jours',  'Délai de mise en service en jours (vide si une ligne n''a pas de délai)', 'number', 7)
  ) AS x(field_key, description, data_type, ord)
  WHERE NOT EXISTS (
    SELECT 1 FROM agent_contract_outputs o WHERE o.agent_id = salma AND o.field_key = x.field_key
  );

  -- Version du contrat : v2.1 -> v2.2 (sans effet si déjà v2.2)
  UPDATE agent_contract_meta SET version = 'v2.2' WHERE agent_id = salma AND version = 'v2.1';
  SELECT version INTO v FROM agent_contract_meta WHERE agent_id = salma;
  IF v IS DISTINCT FROM 'v2.2' THEN
    RAISE EXCEPTION 'version du contrat de Salma : % trouvée, v2.1 ou v2.2 attendue', v;
  END IF;
END $$;

COMMIT;

-- Vérification (lecture seule)
SELECT 'meta' AS t, version::text AS a, '' AS b
FROM agent_contract_meta WHERE agent_id = (SELECT id FROM agents WHERE slug = 'salma')
UNION ALL
SELECT 'entree', field_key::text, sort_order::text || ' · ' || requirement::text || ' · ' || data_type::text
FROM agent_contract_inputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'salma')
UNION ALL
SELECT 'sortie', field_key::text, sort_order::text || ' · ' || data_type::text
FROM agent_contract_outputs WHERE agent_id = (SELECT id FROM agents WHERE slug = 'salma')
ORDER BY 1, 3;