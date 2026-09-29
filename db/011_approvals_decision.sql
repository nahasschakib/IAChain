-- Approbations : motif de décision + échéances de démonstration
ALTER TABLE approvals ADD COLUMN IF NOT EXISTS decision_reason text;

-- Optionnel (démo) : échéances réalistes pour les demandes de départ
UPDATE approvals SET due_at = now() + interval '1 hour 30 minutes' WHERE id = 6 AND status = 'en_attente';
UPDATE approvals SET due_at = now() + interval '4 hours'           WHERE id = 3 AND status = 'en_attente';
UPDATE approvals SET due_at = now() + interval '6 hours'           WHERE id = 2 AND status = 'en_attente';
UPDATE approvals SET due_at = now() + interval '2 hours'           WHERE id = 1 AND status = 'en_attente';