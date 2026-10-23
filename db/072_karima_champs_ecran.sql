-- db/072_karima_champs_ecran.sql
-- P4-10i (3/n) : champs d'écran de Karima alignés sur le contrat v4.0.
-- La TVA vient du devis, la retenue à la source relève du paiement, l'identité légale vient du brand kit
-- et de la fiche client : plus de cases « mentions légales ». Seule reste la référence de commande du client.
-- Idempotent.

BEGIN;

DO $$
BEGIN
  IF (SELECT count(*) FROM agents WHERE slug = 'karima') <> 1 THEN
    RAISE EXCEPTION 'Agent karima introuvable';
  END IF;
END $$;

DELETE FROM agent_task_fields
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND field_key IN ('mentions_legales', 'taux_tva', 'retenue_source');

UPDATE agent_task_fields
SET label = 'Référence de commande du client (facultatif)',
    field_type = 'text',
    required = false,
    provenance = 'MANUEL',
    default_value = NULL
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
  AND field_key = 'commande';

-- Contrôle : une seule ligne attendue (commande, text, false)
SELECT field_key, label, field_type, required, provenance
FROM agent_task_fields
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'karima')
ORDER BY sort_order;

COMMIT;