-- db/037_email_gmail.sql
CREATE TABLE IF NOT EXISTS email_connexions (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id                text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  fournisseur           text NOT NULL DEFAULT 'gmail',
  compte_email          text NOT NULL,
  refresh_token_chiffre text NOT NULL,
  scopes                text NOT NULL,
  statut                text NOT NULL DEFAULT 'actif'
                        CHECK (statut IN ('actif','expire','revoque')),
  dernier_history_id    text,
  derniere_sync_at      timestamptz,
  cree_le               timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, fournisseur, compte_email)
);

CREATE TABLE IF NOT EXISTS emails_entrants (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id           text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  connexion_id     uuid NOT NULL REFERENCES email_connexions(id) ON DELETE CASCADE,
  gmail_message_id text NOT NULL,
  gmail_thread_id  text,
  expediteur       text,
  objet            text,
  extrait          text,
  recu_le          timestamptz,
  tri_categorie    text,
  tri_priorite     text,
  tri_par          text DEFAULT 'Imane',
  tri_le           timestamptz,
  cree_le          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (connexion_id, gmail_message_id)
);

CREATE INDEX IF NOT EXISTS idx_emails_entrants_org_recu
  ON emails_entrants (org_id, recu_le DESC);