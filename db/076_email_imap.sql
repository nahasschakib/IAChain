-- P3-03e : connexion IMAP/SMTP (Nindomail) dans email_connexions, à côté de Gmail.
ALTER TABLE email_connexions
  ADD COLUMN IF NOT EXISTS identifiant text,
  ADD COLUMN IF NOT EXISTS imap_hote text,
  ADD COLUMN IF NOT EXISTS imap_port integer,
  ADD COLUMN IF NOT EXISTS smtp_hote text,
  ADD COLUMN IF NOT EXISTS smtp_port integer,
  ADD COLUMN IF NOT EXISTS mot_de_passe_chiffre text;

ALTER TABLE email_connexions ALTER COLUMN refresh_token_chiffre DROP NOT NULL;
ALTER TABLE email_connexions ALTER COLUMN scopes DROP NOT NULL;

ALTER TABLE email_connexions DROP CONSTRAINT IF EXISTS email_connexions_secret_par_fournisseur;
ALTER TABLE email_connexions
  ADD CONSTRAINT email_connexions_secret_par_fournisseur CHECK (
    (fournisseur = 'gmail' AND refresh_token_chiffre IS NOT NULL AND scopes IS NOT NULL)
    OR
    (fournisseur = 'imap' AND identifiant IS NOT NULL AND imap_hote IS NOT NULL
       AND imap_port IS NOT NULL AND mot_de_passe_chiffre IS NOT NULL)
  );