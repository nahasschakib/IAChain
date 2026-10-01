// Coût réel d'un appel IA, en MAD. Tarifs en USD par million de tokens (docs Anthropic).
const PRICES: Record<string, { in: number; out: number }> = {
  "claude-haiku-4-5-20251001": { in: 1, out: 5 },
  "claude-sonnet-5-5": { in: 2, out: 10 },
};

const FALLBACK_USD_MAD = 10;
const TTL_MS = 24 * 60 * 60 * 1000;
let cached: { rate: number; at: number } | null = null;

// Taux USD→MAD du jour (source gratuite, mise à jour quotidienne), repli à 10.
export async function getUsdMad(): Promise<{ rate: number; live: boolean }> {
  if (cached && Date.now() - cached.at < TTL_MS) return { rate: cached.rate, live: true };
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      const j = (await res.json()) as { result?: string; rates?: { MAD?: number } };
      const rate = Number(j.rates?.MAD);
      if (j.result === "success" && rate > 5 && rate < 20) {
        cached = { rate, at: Date.now() };
        return { rate, live: true };
      }
    }
  } catch {}
  return { rate: FALLBACK_USD_MAD, live: false };
}

export async function computeCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): Promise<{ usd: number; mad: number; rate: number; live: boolean } | null> {
  const p = PRICES[model];
  if (!p) return null;
  const usd = (inputTokens * p.in + outputTokens * p.out) / 1_000_000;
  const { rate, live } = await getUsdMad();
  return { usd, mad: usd * rate, rate, live };
}