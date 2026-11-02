-- Plafonne les relances automatiques d'une étape de suivi en échec (évite de refacturer un échec durable).
ALTER TABLE etapes_validees
  ADD COLUMN IF NOT EXISTS tentatives integer NOT NULL DEFAULT 0;