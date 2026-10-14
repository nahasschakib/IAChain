-- db/044 : promotions en automatique par organisation, catégorie et canal (P4-06b)
-- Une ligne active (revoked_at IS NULL) = la catégorie est en automatique pour
-- cette organisation, cet agent, cette action et ce canal.

CREATE TABLE IF NOT EXISTS org_autonomie (
  id              serial PRIMARY KEY,
  org_id          text        NOT NULL,
  agent_id        integer     NOT NULL,
  action_key      text        NOT NULL,
  categorie       text        NOT NULL,
  canal           text        NOT NULL DEFAULT 'email',
  serie_atteinte  integer     NOT NULL DEFAULT 0,
  seuil_applique  integer     NOT NULL DEFAULT 30,
  granted_by      text        NOT NULL,
  granted_at      timestamptz NOT NULL DEFAULT now(),
  revoked_at      timestamptz,
  revoked_by      text,
  revoked_reason  text
);

CREATE UNIQUE INDEX IF NOT EXISTS org_autonomie_active_uniq
  ON org_autonomie (org_id, agent_id, action_key, categorie, canal)
  WHERE revoked_at IS NULL;