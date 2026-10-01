UPDATE agent_task_fields
SET label = CASE field_key
  WHEN 'budget_estime'   THEN 'Fourchette budget · votre estimation'
  WHEN 'maturite_besoin' THEN 'Maturité du besoin · votre estimation'
  WHEN 'fit_icp'         THEN 'Fit ICP · votre estimation'
END
WHERE agent_id = (SELECT id FROM agents WHERE slug = 'mehdi')
  AND field_key IN ('budget_estime', 'maturite_besoin', 'fit_icp');