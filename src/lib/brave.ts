export type BraveResult = { title: string; url: string; description: string };
export type BraveFreshness = "pd" | "pw" | "pm";

async function braveFetch(query: string, count: number, freshness?: BraveFreshness): Promise<Response> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;
  if (!apiKey) {
    throw new Error("BRAVE_SEARCH_API_KEY manquante (.env.local ou variables Vercel)");
  }
  const url = new URL("https://api.search.brave.com/res/v1/web/search");
  url.searchParams.set("q", query);
  url.searchParams.set("count", String(count));
  url.searchParams.set("search_lang", "fr");
  if (freshness) url.searchParams.set("freshness", freshness);
  return fetch(url, {
    headers: { Accept: "application/json", "X-Subscription-Token": apiKey },
    cache: "no-store",
  });
}

// Recherche web via l'API Brave Search (sourcing Ilyas, veille Sofia).
export async function searchBrave(
  query: string,
  count = 8,
  opts?: { freshness?: BraveFreshness }
): Promise<BraveResult[]> {
  let res = await braveFetch(query, count, opts?.freshness);
  // Filtre de fraîcheur refusé par l'API : on retente sans lui plutôt que d'échouer.
  if (res.status === 422 && opts?.freshness) res = await braveFetch(query, count);

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Brave Search a répondu ${res.status}${body ? ` — ${body.slice(0, 300)}` : ""}`);
  }

  const data = (await res.json()) as {
    web?: { results?: { title: string; url: string; description?: string }[] };
  };

  const results = data.web?.results ?? [];
  return results.slice(0, count).map((r) => ({
    title: r.title,
    url: r.url,
    description: r.description ?? "",
  }));
}