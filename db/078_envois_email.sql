-- P3-03h : journal des envois d'e-mails (quota quotidien par connexion) et plafond par connexion.

ALTER TABLE email_connexions
  ADD COLUMN IF NOT EXISTS plafond_jour integer NOT NULL DEFAULT 100
  CHECK (plafond_jour >= 1);

CREATE TABLE IF NOT EXISTS envois_email (
  id          bigserial PRIMARY KEY,
  org_id      text NOT NULL REFERENCES tenants(org_id),
  connexion_id uuid NOT NULL REFERENCES email_connexions(id) ON DELETE CASCADE,
  email_id    uuid REFERENCES emails_entrants(id) ON DELETE SET NULL,
  destinataire text NOT NULL,
  objet       text,
  statut      text NOT NULL CHECK (statut IN ('envoye', 'echec')),
  erreur      text,
  jour        date NOT NULL DEFAULT ((now() AT TIME ZONE 'utc')::date),
  envoye_at   timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_envois_email_connexion_jour
  ON envois_email (connexion_id, jour);
CREATE INDEX IF NOT EXISTS idx_envois_email_org
  ON envois_email (org_id, envoye_at DESC);