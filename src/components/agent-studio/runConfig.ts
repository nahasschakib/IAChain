export type RunConfig = {
  buttonLabel: string;
  doneLabel: string;
  inputsNote: string;
  steps: string[];
  actions: string[];
};

export const APPROVAL_ACTION = "Demander approbation";

const DEFAULT_CONFIG: RunConfig = {
  buttonLabel: "Lancer l'agent",
  doneLabel: "Livrable v1 · produit",
  inputsNote:
    "Chaque champ affiche sa provenance. Le studio résout d'abord ce qu'il peut : workflow amont → intégration → saisie.",
  steps: [
    "Entrées résolues — provenance vérifiée",
    "Intégrations consultées",
    "Règles de gouvernance appliquées",
    "Livrable rédigé",
    "Livrable publié — v1",
  ],
  actions: ["Éditer", "Exporter PDF", "Envoyer au CRM", "Envoyer au workflow", APPROVAL_ACTION],
};

const CONFIGS: Record<string, Partial<RunConfig>> = {
  zineb: {
    buttonLabel: "Générer la fiche",
    doneLabel: "Fiche v1 · produite",
    inputsNote:
      "Zineb lit le catalogue synchronisé, ne promet que ce que le stock confirme, et n'écrit sur WhatsApp qu'aux clients ayant déjà engagé la conversation.",
    steps: [
      "Entrées résolues — produit, canaux et langue",
      "Catalogue consulté — prix, stock et variantes lus en direct",
      "Garde-fous appliqués — aucune promesse hors stock",
      "Fiche, réponses FR/AR et relance rédigées",
      "Livrable publié — Fiche v1",
    ],
    actions: ["Éditer la fiche", "Publier sur la boutique", "Activer les réponses", "Programmer la relance", APPROVAL_ACTION],
  },
  ilyas: {
    buttonLabel: "Construire la liste",
    doneLabel: "Liste v1 · produite",
    inputsNote:
      "Ilyas part d'une requête, pas d'un signal reçu. Il n'interroge que des sources publiques ou sous contrat ; le dédoublonnage protège le portefeuille existant.",
    actions: ["Éditer la liste", "Exporter CSV", "Pousser vers le CRM", "Envoyer à Mehdi · Qualification", APPROVAL_ACTION],
  },
};

export function getRunConfig(slug: string): RunConfig {
  return { ...DEFAULT_CONFIG, ...CONFIGS[slug] };
}