import { headers } from "next/headers";

type Bucket = { count: number; resetAt: number };

// Rate limit em memoria (por instancia do servidor). Suficiente para 1 servico
// no Render. Para multiplas instancias/regioes, troque por um store
// compartilhado (ex.: Redis / Upstash).
const buckets = new Map<string, Bucket>();

// Limpeza oportunista para evitar vazamento de memoria.
function cleanup(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.resetAt) buckets.delete(key);
  }
}

export type RateLimitResult = { ok: boolean; retryAfter: number };

export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  cleanup(now);
  const bucket = buckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (bucket.count >= limit) {
    return { ok: false, retryAfter: Math.ceil((bucket.resetAt - now) / 1000) };
  }
  bucket.count += 1;
  return { ok: true, retryAfter: 0 };
}

// Descobre o IP do cliente a partir dos headers (Render envia x-forwarded-for).
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return h.get("x-real-ip") || "local";
}
