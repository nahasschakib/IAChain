-- P2-08 : retirer les compteurs de démonstration saisis en dur dans agent_permissions.stats_text
-- (ex. « 410 exécutions · 0 incident », « 12 envois · 2 en attente »).
-- Les textes de règle (« Interdit — … », « Hors périmètre : … », « Toujours à jour … ») sont conservés.
-- Les compteurs affichés sont désormais calculés depuis l'historique réel de chaque organisation.
UPDATE agent_permissions
SET stats_text = NULL
WHERE stats_text ~ '^[0-9]+ .*(exécutions|envois|soumissions|émissions|fusions|signalements|mises en demeure|transmissions|ce mois|en attente)';