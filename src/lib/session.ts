// Sessao assinada com HMAC-SHA256 usando a Web Crypto API (crypto.subtle).
// Funciona tanto no Edge runtime (middleware) quanto no Node runtime,
// diferente do modulo "crypto" do Node que NAO roda no Edge.

const SECRET = process.env.AUTH_SECRET || "dev-secret-troque-em-producao";
export const SESSION_COOKIE = "copa_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 dias

type Payload = { uid: string; exp: number };

function b64urlFromBytes(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

function b64urlFromString(str: string): string {
  return b64urlFromBytes(new TextEncoder().encode(str));
}

function stringFromB64url(input: string): string {
  const b64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

async function getKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signBody(body: string): Promise<string> {
  const key = await getKey();
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(body),
  );
  return b64urlFromBytes(new Uint8Array(sig));
}

// Comparacao em tempo constante para evitar timing attacks.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++)
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

// Cria um token assinado (HMAC-SHA256) tipo JWT minimalista, sem dependencias.
export async function signSession(
  userId: string,
): Promise<{ value: string; maxAge: number }> {
  const payload: Payload = {
    uid: userId,
    exp: Math.floor(Date.now() / 1000) + MAX_AGE_SECONDS,
  };
  const body = b64urlFromString(JSON.stringify(payload));
  const sig = await signBody(body);
  return { value: `${body}.${sig}`, maxAge: MAX_AGE_SECONDS };
}

export async function verifySession(
  token: string | undefined,
): Promise<string | null> {
  if (!token) return null;
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = await signBody(body);
  if (!timingSafeEqual(sig, expected)) return null;
  try {
    const payload = JSON.parse(stringFromB64url(body)) as Payload;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.uid;
  } catch {
    return null;
  }
}
