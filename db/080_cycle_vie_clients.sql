-- 080 : cycle de vie des clients (essai, paiement manuel)
-- essai_fin : fin de l'essai gratuit, fixée à l'activation par SOCYTAY
-- paye_jusqu_au : fin de la période payée (mensuelle ou annuelle)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS essai_fin timestamptz;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS paye_jusqu_au timestamptz;

CREATE TABLE IF NOT EXISTS tenant_paiements (
  id bigserial PRIMARY KEY,
  org_id text NOT NULL REFERENCES tenants(org_id),
  montant_mad numeric(12,2) NOT NULL CHECK (montant_mad > 0),
  mode text NOT NULL CHECK (mode IN ('virement', 'especes')),
  periodicite text NOT NULL CHECK (periodicite IN ('mensuel', 'annuel')),
  reference text NOT NULL,
  paye_le date NOT NULL DEFAULT CURRENT_DATE,
  couvre_jusqu_au timestamptz NOT NULL,
  saisi_par text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tenant_paiements_org_idx ON tenant_paiements (org_id, created_at DESC);