import Anthropic from "@anthropic-ai/sdk";

// Modèles par usage : léger pour les tâches simples, fort pour l'analyse.
export const MODELS = {
  fast: "claude-haiku-4-5-20251001",
  smart: "claude-sonnet-5-5",
} as const;

export type ModelTier = keyof typeof MODELS;

let client: Anthropic | null = null;

function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY manquante (.env.local ou variables Vercel)");
  }
  client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export type AiResult = {
  text: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
};

// Appel simple : un système + un message utilisateur -> texte + consommation.
export async function runAi(opts: {
  system: string;
  prompt: string;
  tier?: ModelTier;
  maxTokens?: number;
}): Promise<AiResult> {
  const model = MODELS[opts.tier ?? "fast"];
  const res = await getClient().messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    messages: [{ role: "user", content: opts.prompt }],
  });
  const text = res.content
    .map((b) => (b.type === "text" ? b.text : ""))
    .join("");
  return {
    text,
    model,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
  };
}

// Appel avec sortie structurée : le modèle doit remplir l'outil `tool`.
export async function runAiTool(opts: {
  system: string;
  prompt: string;
  tool: Anthropic.Tool;
  tier?: ModelTier;
  maxTokens?: number;
}): Promise<{ data: unknown; model: string; inputTokens: number; outputTokens: number }> {
  const model = MODELS[opts.tier ?? "fast"];
  const res = await getClient().messages.create({
    model,
    max_tokens: opts.maxTokens ?? 1024,
    system: opts.system,
    tools: [opts.tool],
    tool_choice: { type: "tool", name: opts.tool.name },
    messages: [{ role: "user", content: opts.prompt }],
  });
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Réponse IA sans sortie structurée");
  }
  return {
    data: block.input,
    model,
    inputTokens: res.usage.input_tokens,
    outputTokens: res.usage.output_tokens,
  };
}