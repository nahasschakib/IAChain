# Base de données IAChain

## Construire une base neuve

Exécuter, dans cet ordre, sur une base Neon vide :

1. `000_baseline.sql` : schéma complet (41 tables, clés, index, valeurs par défaut).
2. `000b_seed_agents.sql` : catalogue partagé (agents, contrats, permissions, champs de tâche, workflows, nœuds, processus).

Puis, dans l'ordre des numéros, les migrations `026` et suivantes (voir ci-dessous).

Chaque fichier est idempotent : le rejouer ne provoque aucune erreur ni doublon.
La baseline et le seed ne contiennent aucune donnée propre à une organisation (ni exécutions, ni livrables, ni comptes CRM).

## Nouvelles migrations

Elles commencent à **026** : `026_description.sql`, puis 027, etc.
Chaque migration doit être idempotente (IF NOT EXISTS, ON CONFLICT) et ne modifier qu'un sujet à la fois.

## Dossier `historique/`

Les scripts 001 à 025 ont servi à construire la base pas à pas. Ils sont conservés pour
mémoire mais **ne doivent plus être rejoués** : la baseline contient leur résultat final.
Les références `db/0xx` de `docs/etat-multitenant.md` désignent ces migrations.

## Origine de la baseline

Générée le 06/10/2026 à partir de la base vivante (information_schema, pg_constraint,
pg_indexes), puis vérifiée par rejeu sur une base vide.
