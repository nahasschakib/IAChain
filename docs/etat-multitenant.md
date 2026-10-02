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
- Action serveur `runMehdi` (`src/app/agents/mehdi-actions.ts`, enveloppe de `executeMehdi` dans `src/lib/mehdi-core.ts`) : trace chaque exécution dans `agent_runs` (db/020 : tokens, modèle, résultat, erreur), puis historique (`agent_execution_history`) et livrable (`deliverables`, sauf fiche « À compléter »). Libellés d'estimation du commercial : db/021.
- Écran « Nouvelle tâche » : résultat affiché dans le panneau de droite (`MehdiResultPanel.tsx`).
- **Approbation go/no-go** : un verdict « Qualifié » crée une demande dans `approvals` (sans `workflow_id` ; page `/approvals` corrigée pour ce cas).
- **Coût réel** (`src/lib/cost.ts`, db/022) : tokens × tarif du modèle × taux USD/MAD du jour (open.er-api.com, repli 10). Stocké dans `deliverables.cost` (numeric(12,4)) et `agent_runs.result`, affiché dans le panneau et dans l'onglet Livrables.
- **Lien livrable ↔ approbation** (db/023) : `approvals.deliverable_id`. L'onglet Livrables de l'agent joint `approvals` et affiche le statut réel (En attente / Approuvé / Rejeté), avec repli sur `deliverables.approval_status` pour les anciens livrables. Les livrables antérieurs à db/023 ne sont pas rattachés.
- **Bibliothèque de livrables** (`/deliverables`) : panneau de catégories généré depuis `deliverables.kind` (effectifs réels par organisation) ; les liens filtrent via `?kind=` (`searchParams` est une `Promise` à attendre avec `await`, cf. guide Next.js dans `node_modules/next/dist/docs/`).
- **Nombre de workflows par agent** : calculé depuis `workflow_nodes.agent_slug` (workflows où l'agent est réellement placé), et plus depuis `agents.workflow_count` (colonne saisie à la main, désormais inutilisée). La liste d'usage de l'onglet Contrat (`agent_contract_workflow_usage`) reste une documentation en texte libre, sans lien avec les workflows.
- À prévoir : autres agents sur le même modèle (Yasmine est faite ; suite possible : Karim, qui devra lire le résultat de Mehdi dans agent_runs.result) ; `BRAVE_SEARCH_API_KEY` et `src/lib/search.ts` pour les agents qui font de la recherche web (veille marché, prospection).

## Agent Yasmine (capture de leads) — moteur IA réel

- Même principe que Mehdi : l'IA extrait, le code décide. Claude Haiku 4.5 via `runAiTool`, sortie par l'outil `rendre_fiche_prospect`.
- Fichiers : `src/lib/yasmine.ts` (consigne, outil, validation, verdict), `src/lib/yasmine-core.ts` (`executeYasmine`, cœur réutilisé par le workflow), `src/app/agents/yasmine-actions.ts` (`runYasmine`, enveloppe serveur), `YasmineLiveRun.tsx` et `YasmineResultPanel.tsx` (écran), branchement dans `NouvelleTacheTab.tsx` (indicateur `isLive`).
- Garde-fous en code : e-mail et téléphone conservés seulement s'ils figurent dans le signal ; complétude sur 4 éléments (société, contact, moyen de contact, besoin) ; verdict « Fiche complète » / « Fiche partielle » / « Signal insuffisant » ; informations manquantes calculées en code ; dédoublonnage CRM « Non vérifiable » sans compte CRM.
- Trace : `agent_runs`, historique, livrable de type `doc` (sauf signal insuffisant) et coût réel. Pas de demande d'approbation.
- Chaînage : le « texte prêt pour Mehdi » est affiché à titre d'information. Les agents restent indépendants dans le Studio ; l'enchaînement automatique Yasmine → Mehdi se fait dans le workflow Prospect to Cash (section suivante).

## Workflow Prospect to Cash — chaîne Yasmine → Mehdi (moteur réel)

- Bouton « + Nouvelle exécution » de la page `/workflows/prospect-to-cash` (`NewExecutionButton.tsx`, fenêtre rendue dans `document.body`) : canal, signal brut, compte CRM optionnel. Seul ce workflow a un lanceur ; le bouton générique de la barre du haut reste inactif.
- Action serveur `launchProspectToCash` (`src/app/workflows/launch-actions.ts`) → `runProspectToCash` (`src/lib/workflow-engine.ts`, hors « use server ») : crée l'exécution (`workflow_executions`, 2 étapes) et les étapes (`workflow_node_runs`), appelle `executeYasmine`, puis `executeMehdi` avec la fiche (`ficheToText`) et fit/budget/maturité à « Non précisé ». Chaque étape est reliée à son run d'agent par `workflow_node_runs.agent_run_id` (db/024).
- Statuts : étapes `pending/running/done/failed` (contrainte CHECK) ; exécutions `en_cours` (démo), `termine`, `echoue`. Signal insuffisant : Yasmine `failed`, la chaîne s'arrête avant Mehdi. `run_label` = `#<id>`.
- Le `mapping` des nœuds n'est pas interprété : le passage de la fiche est fait en code. La décision go/no-go reste humaine (un verdict « Qualifié » crée une approbation).
- Page du workflow : l'exécution affichée est la plus récente de l'organisation (tri par date) ; `WorkflowStudio` est remonté selon `?vue=` (clé) et affiche le statut réel dans le badge.
- Limites actuelles : chaîne limitée à Yasmine → Mehdi (Karim et les étapes suivantes restent « à venir ») ; les exécutions de démonstration restent `en_cours` (à purger avant la production) ; les agents lancés seuls dans le Studio ne déclenchent pas le workflow.

## Reste à faire

1. **Déploiement Vercel** : instance Clerk de production (pk_live/sk_live, domaine, webhooks), variables d'environnement (DATABASE_URL, Clerk, ANTHROPIC_API_KEY), passage à Vercel Pro avant les clients payants, base Neon séparée pour la production, organisation SOCYTAY en production puis mise à jour de `tenants.org_id`, purge des données de démonstration avant usage réel : dans deliverables, les origines « Simulation · … », « Génération automatique » et NULL (à vérifier aussi dans `activity_log` et `workflow_executions`).
2. **Dashboard `/admin`** (SOCYTAY, indicateurs agrégés, confidentialité loi 09-08) ; cycle de vie client (webhooks organization.created/deleted, essai 14 jours, validation manuelle du paiement, e-mails Resend).
3. **Délégation** : avis du délégué, retour au donneur d'ordre, délégués agents IA, e-mails, lier les experts aux utilisateurs Clerk, contrôle du droit de décider.
4. **Internationalisation** : marché/devise par tenant, catalogue de connecteurs, RGPD vs loi 09-08.
5. **Backlog produit** : « + Ajouter une intégration », « Connecter → », OAuth, « + Nouvelle exécution » du bouton global de la barre du haut (seul le workflow Prospect to Cash a son lanceur), « Éditer la fiche », « Voir l'usage en workflow », compteurs encore statiques (dashboard, agents.cost_estimate de 4,50 MAD pour les agents non branchés, etc.), nombre d'agents actifs par organisation, limite de 5 membres Clerk, e-mail de contact réel, jeu de démonstration Quality Management pour un nouveau client (tables `qm_*` vides), anciens scripts 005/006 à adapter (écrivaient dans les colonnes `run_*` supprimées), `pg_dump` pour 000_baseline.

## Conventions de travail

Un front à la fois ; code à coller directement (avant/après), SQL pour Neon, commandes git validées une à une ; commit après chaque groupe fonctionnel ; ne pas modifier le code adjacent qui fonctionne.