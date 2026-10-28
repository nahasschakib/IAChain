-- P7-16 : une seule analyse de Hamza en attente de validation par organisation.
-- Les brouillons restent multiples (conservés volontairement).
CREATE UNIQUE INDEX IF NOT EXISTS uq_analyses_causes_org_a_valider
  ON analyses_causes (org_id)
  WHERE statut = 'a_valider';