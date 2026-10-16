-- db/048_blurb_ilyas.sql
-- P4-09f : le blurb du nœud d'Ilyas (Prospect to Cash) affichait « Omar »
UPDATE workflow_nodes
SET blurb = replace(blurb, 'Omar — ', 'Ilyas — ')
WHERE id = 81
  AND workflow_slug = 'prospect-to-cash'
  AND agent_slug = 'ilyas'
  AND blurb LIKE 'Omar — %';