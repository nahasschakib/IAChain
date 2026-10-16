-- db/047_roi_referentiel.sql
-- P2-09 : référentiel ROI par organisation (profils et coût horaire, tâches de référence par agent)
-- Tables vides au départ : aucune valeur n'est inventée. Toute valeur saisie porte sa source.

CREATE TABLE IF NOT EXISTS roi_profils (
  id                 bigserial PRIMARY KEY,
  org_id             text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  profil             text NOT NULL,
  cout_mensuel_mad   numeric(12,2) NOT NULL CHECK (cout_mensuel_mad > 0),
  heures_mensuelles  integer NOT NULL DEFAULT 140 CHECK (heures_mensuelles BETWEEN 1 AND 300),
  source             text NOT NULL DEFAULT 'hypothese' CHECK (source IN ('hypothese','mesure','client')),
  modifie_par        text,
  modifie_le         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, profil)
);

CREATE TABLE IF NOT EXISTS roi_taches (
  id                  bigserial PRIMARY KEY,
  org_id              text NOT NULL REFERENCES tenants(org_id) ON UPDATE CASCADE,
  agent_id            integer NOT NULL REFERENCES agents(id),
  tache               text NOT NULL,
  profil              text NOT NULL,
  temps_humain_min    numeric(8,2) NOT NULL CHECK (temps_humain_min > 0),
  temps_controle_min  numeric(8,2) NOT NULL DEFAULT 0 CHECK (temps_controle_min >= 0),
  source              text NOT NULL DEFAULT 'hypothese' CHECK (source IN ('hypothese','mesure','client')),
  modifie_par         text,
  modifie_le          timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, agent_id),
  FOREIGN KEY (org_id, profil) REFERENCES roi_profils(org_id, profil) ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_runs_roi ON agent_runs (org_id, agent_id, status, created_at);









