-- db/074_factures_controle.sql
-- P4-10g : second contrôle de Nadia sur la facture. Le verdict est conservé sur la facture. Idempotent.
BEGIN;
ALTER TABLE factures ADD COLUMN IF NOT EXISTS controle jsonb;
SELECT count(*) AS colonnes_factures FROM information_schema.columns WHERE table_name = 'factures';
COMMIT;