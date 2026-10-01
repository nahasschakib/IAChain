import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const res = await client.messages.create({
  model: "claude-haiku-4-5-20251001",
  max_tokens: 200,
  system: "Tu es un agent de qualification de leads pour une PME marocaine. Réponds en français, en 3 lignes maximum.",
  messages: [
    {
      role: "user",
      content:
        "Prospect : Cabinet comptable à Casablanca, 8 employés, cherche à automatiser la relance des factures clients. Est-il qualifié ? Pourquoi ?",
    },
  ],
});

console.log(res.content[0].text);
console.log("tokens :", res.usage.input_tokens, "entrée /", res.usage.output_tokens, "sortie");