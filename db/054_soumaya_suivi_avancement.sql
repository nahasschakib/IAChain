-- db/054 — Soumaya (SUI-17) : agent transversal de suivi d'avancement (P4-07)
-- Catalogue seulement : fiche, contrat générique, permissions. Aucun nœud de workflow (ils viendront en P4-10d, P4-10e).
-- Idempotent : ne fait rien pour ce qui existe déjà.
BEGIN;

-- 1. Fiche agent
INSERT INTO agents
  (slug, name, short_name, status, category, code, role, version, icon,
   input_label, output_label, workflow_count, description)
SELECT
  'soumaya', 'Soumaya', 'Soumaya', 'actif', 'Ops', 'SUI-17', 'Suivi d''avancement', 'v1.0', 'bell',
  'Étape validée', 'Message d''avancement', 0,
  'Informe le client ou l''interlocuteur de l''avancement d''un dossier (devis, cotation, achat, intervention) dès qu''une étape est validée.'
WHERE NOT EXISTS (SELECT 1 FROM agents WHERE slug = 'soumaya');

-- 2. Contrat générique : entrées
INSERT INTO agent_contract_inputs (agent_id, field_key, requirement, data_type, resolution_chain, sort_order)
SELECT a.id, v.field_key, v.requirement, v.data_type, v.chain, v.ord
FROM agents a
CROSS JOIN (VALUES
  ('type_objet',   'required',  'text', 'Fourni par le workflow appelant : type d''objet suivi (devis, cotation, achat, intervention)', 1),
  ('reference',    'required',  'text', 'Fourni par le workflow appelant : référence du dossier suivi', 2),
  ('etape_validee','required',  'text', 'Événement « étape validée » émis par la validation humaine d''une étape du workflow appelant', 3),
  ('destinataire', 'derivable', 'text', 'Dérivé du dossier suivi : contact du client ou de l''interlocuteur concerné', 4),
  ('canal',        'optional',  'text', 'Configuration de l''organisation : e-mail par défaut, WhatsApp si connecté', 5)
) AS v(field_key, requirement, data_type, chain, ord)
WHERE a.slug = 'soumaya'
  AND NOT EXISTS (
    SELECT 1 FROM agent_contract_inputs x WHERE x.agent_id = a.id AND x.field_key = v.field_key
  );

-- 3. Contrat générique : sorties
INSERT INTO agent_contract_outputs (agent_id, field_key, description, data_type, sort_order)
SELECT a.id, v.field_key, v.description, v.data_type, v.ord
FROM agents a
CROSS JOIN (VALUES
  ('suivi.brouillon',    'Message d''information rédigé pour le destinataire', 'text',   1),
  ('suivi.canal',        'Canal retenu pour l''envoi (e-mail ou WhatsApp)',   'text',   2),
  ('suivi.destinataire', 'Destinataire du message',                           'text',   3),
  ('suivi.version',      'Incrémentée à chaque régénération',                 'semver', 4)
) AS v(field_key, description, data_type, ord)
WHERE a.slug = 'soumaya'
  AND NOT EXISTS (
    SELECT 1 FROM agent_contract_outputs x WHERE x.agent_id = a.id AND x.field_key = v.field_key
  );

-- 4. Usages prévus (aucun workflow branché pour l'instant)
INSERT INTO agent_contract_workflow_usage (agent_id, workflow_name, status, sort_order)
SELECT a.id, v.workflow_name, 'non configuré', v.ord
FROM agents a
CROSS JOIN (VALUES ('Prospect to Cash', 1), ('Support Client', 2)) AS v(workflow_name, ord)
WHERE a.slug = 'soumaya'
  AND NOT EXISTS (
    SELECT 1 FROM agent_contract_workflow_usage x
    WHERE x.agent_id = a.id AND x.workflow_name = v.workflow_name
  );

-- 5. Permissions : l'envoi reste soumis à approbation, promotion possible comme pour Imane
INSERT INTO agent_permissions (agent_id, action_label, mode, stats_text, promotion_suggestion, sort_order, action_key)
SELECT a.id, v.action_label, v.mode, NULL, v.promo, v.ord, v.action_key
FROM agents a
CROSS JOIN (VALUES
  ('Lecture de l''événement et du dossier suivi', 'AUTO', NULL, 1, NULL),
  ('Rédaction du message d''avancement', 'AUTO', NULL, 2, NULL),
  ('Envoi du message au destinataire', 'APPROBATION_REQUISE',
     'Peut passer en automatique après validation de 30 messages sans correction', 3, 'envoi_suivi')
) AS v(action_label, mode, promo, ord, action_key)
WHERE a.slug = 'soumaya'
  AND NOT EXISTS (
    SELECT 1 FROM agent_permissions x WHERE x.agent_id = a.id AND x.action_label = v.action_label
  );

COMMIT;

-- Vérification
SELECT id, slug, name, code, category, role, status FROM agents WHERE slug = 'soumaya';
SELECT field_key, requirement, sort_order FROM agent_contract_inputs
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'soumaya') ORDER BY sort_order;
SELECT field_key, data_type, sort_order FROM agent_contract_outputs
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'soumaya') ORDER BY sort_order;
SELECT workflow_name, status FROM agent_contract_workflow_usage
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'soumaya') ORDER BY sort_order;
SELECT action_label, mode, action_key FROM agent_permissions
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'soumaya') ORDER BY sort_order;