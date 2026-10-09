-- db/038_tri_stp.sql
ALTER TABLE emails_entrants
  ADD COLUMN IF NOT EXISTS tri_sentiment text
    CHECK (tri_sentiment IN ('positif','neutre','insatisfait','tres_mecontent')),
  ADD COLUMN IF NOT EXISTS tri_equipe text
    CHECK (tri_equipe IN ('support_n1','support_n2','finance','commercial','securite')),
  ADD COLUMN IF NOT EXISTS tri_traitement text
    CHECK (tri_traitement IN ('reponse_immediate','investigation','escalade','validation_humaine')),
  ADD COLUMN IF NOT EXISTS tri_justification text,
  ADD COLUMN IF NOT EXISTS canal text NOT NULL DEFAULT 'email',
  ADD COLUMN IF NOT EXISTS statut_traitement text NOT NULL DEFAULT 'nouveau'
    CHECK (statut_traitement IN ('nouveau','a_qualifier','en_cours','attente_client','attente_interne','resolu','ferme'));