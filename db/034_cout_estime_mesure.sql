-- P2-07 : coût estimé du catalogue = moyenne des coûts mesurés (agents branchés)
-- Les agents sans exécution chiffrée gardent leur estimation actuelle (4,50 MAD).
UPDATE agents a
SET cost_estimate = m.avg_cost
FROM (
  SELECT agent_id, ROUND(AVG(cost_mad)::numeric, 3) AS avg_cost
  FROM agent_runs
  WHERE status = 'ok' AND cost_mad IS NOT NULL
  GROUP BY agent_id
) m
WHERE a.id = m.agent_id;