# IAChain — état au 1er oct. 2026 (multi-tenant)

## Stack

Next.js App Router, Clerk (auth + organisations), Neon Postgres (`sql` de `@/lib/db`), dépôt github.com/nahasschakib/IAChain, local ~/IAChain. Montants en MAD.

## Fait (poussé sur main)

- `tenants` (org_id = id d'organisation Clerk, statut en_attente/actif/suspendu, is_platform). SOCYTAY = opérateur ET premier tenant (actif, is_platform).
- `src/lib/tenant.ts` : `resolveTenant()` (sans redirection, pour actions serveur/AppShell) et `getTenantContext()` (redirige vers `/en-attente?raison=…`).
- `org_id NOT NULL` sur 25 tables clientes (db/018), `ON UPDATE CASCADE` vers `tenants.org_id`.
- Pages cloisonnées par organisation : approbations (+ délégation, badge via `@/components/AppShell`), dashboard, livrables, tâches, analytics, intégrations, agents (historique, livrables, lancements), workflows, Quality Management (requêtes `qm_*`), menu latéral (badge, nom d'organisation).
- Catalogue partagé en lecture seule (agents, contrats, workflows, nœuds, processes). État d'exécution par organisation : `workflow_executions` (+ `banner`, `run_label`) et `workflow_node_runs` (db/017) ; colonnes `run_*` retirées du catalogue (db/019). Sans exécution, les nœuds sont « à venir ».
- Scripts SQL idempotents dans `db/` : 001–003, 005, 005b, 006–015, 017–019. Manquants : 004/004b, 000_baseline, 000b_seed. 016 (marché/devise) abandonné.

## Agent Mehdi (qualification de prospects) — moteur IA réel

- Branché sur Claude Haiku 4.5 via `@anthropic-ai/sdk` (clé `ANTHROPIC_API_KEY` dans `.env.local` et Vercel). L'IA ne fait que classer 3 critères (fit ICP, budget, maturité) et extraire le nom du prospect ; le score est calculé en code (`src/lib/mehdi.ts`).
- Action serveur `runMehdi` (`src/app/agents/mehdi-actions.ts`) : trace chaque exécution dans `agent_runs` (tokens, modèle, résultat, erreur), puis historique (`agent_execution_history`) et livrable (`deliverables`, sauf fiche « À compléter »).
- Écran « Nouvelle tâche » : résultat affiché dans le panneau de droite (`MehdiResultPanel.tsx`).
- **Approbation go/no-go** : un verdict « Qualifié » crée une demande dans `approvals` (sans workflow ; page `/approvals` corrigée pour ce cas).
- **Coût réel** (`src/lib/cost.ts`, db/022) : tokens × tarif du modèle × taux USD/MAD du jour (open.er-api.com, repli 10). Stocké dans `deliverables.cost` (numeric(12,4)) et `agent_runs.result`, affiché dans le panneau et dans l'onglet Livrables.
- **Lien livrable ↔ approbation** (db/023) : `approvals.deliverable_id`. L'onglet Livrables de l'agent joint `approvals` et affiche le statut réel (En attente / Approuvé / Rejeté), avec repli sur `deliverables.approval_status` pour les anciens livrables. Les livrables antérieurs à db/023 ne sont pas rattachés.
- À prévoir : autres agents sur le même modèle ; `BRAVE_SEARCH_API_KEY` et `src/lib/search.ts` pour les agents qui font de la recherche web (veille marché, prospection).

## Reste à faire

1. **Déploiement Vercel** : instance Clerk de production (pk_live/sk_live, domaine, webhooks), Après : variables d'environnement (DATABASE_URL, Clerk, ANTHROPIC_API_KEY), passage à Vercel Pro avant les clients payants, base Neon séparée pour la production, organisation SOCYTAY en production puis mise à jour de `tenants.org_id`, purge des simulations (« Simulation · ») avant usage réel.
2. **Dashboard `/admin`** (SOCYTAY, indicateurs agrégés, confidentialité loi 09-08) ; cycle de vie client (webhooks organization.created/deleted, essai 14 jours, validation manuelle du paiement, e-mails Resend).
3. **Délégation** : avis du délégué, retour au donneur d'ordre, délégués agents IA, e-mails, lier les experts aux utilisateurs Clerk, contrôle du droit de décider.
4. **Internationalisation** : marché/devise par tenant, catalogue de connecteurs, RGPD vs loi 09-08.
5. **Backlog produit** : « + Ajouter une intégration », « Connecter → », OAuth, « + Nouvelle exécution » (création d'une exécution pour une organisation), « Éditer la fiche », « Voir l'usage en workflow », Après : compteurs encore statiques (« 31 scores calculés ce mois », bibliothèque de livrables, etc.), nombre d'agents actifs par organisation, limite de 5 membres Clerk, e-mail de contact réel, jeu de démonstration Quality Management pour un nouveau client (tables `qm_*` vides), anciens scripts 005/006 à adapter (écrivaient dans les colonnes `run_*` supprimées), `pg_dump` pour 000_baseline.

## Conventions de travail

Un front à la fois ; code à coller directement (avant/après), SQL pour Neon, commandes git validées une à une ; commit après chaque groupe fonctionnel ; ne pas modifier le code adjacent qui fonctionne.