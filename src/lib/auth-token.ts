// Web-standard JWT / Session Token signing and verification
// 100% Edge-compatible: Uses only globalThis.crypto.subtle, btoa, atob, TextEncoder, TextDecoder

export const SESSION_COOKIE_NAME = "servicemeow_session";
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60; // 7 days

function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.trim().length === 0) {
    if (process.env.NODE_ENV === "production") {
      throw new Error(
        "FATAL SECURITY ERROR: AUTH_SECRET environment variable is required in production. Please set AUTH_SECRET in your environment or .env file."
      );
    }
    return "servicemeow-dev-only-local-secret-key-32-chars-change-for-prod";
  }
  return secret;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getCryptoKey(): Promise<CryptoKey> {
  const enc = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    enc.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface SessionTokenPayload {
  sessionId: string;
  userId: string;
  role: string;
  impersonatedUserId: string | null;
  exp: number;
}

export async function signSessionToken(payload: SessionTokenPayload): Promise<string> {
  const key = await getCryptoKey();
  const payloadStr = JSON.stringify(payload);
  const enc = new TextEncoder();
  const payloadB64 = bytesToBase64Url(enc.encode(payloadStr));
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payloadB64));
  const sigB64 = bytesToBase64Url(new Uint8Array(sig));
  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 2) return null;
    const [payloadB64, sigB64] = parts;
    const key = await getCryptoKey();
    const enc = new TextEncoder();
    const sig = base64UrlToBytes(sigB64);
    const valid = await crypto.subtle.verify("HMAC", key, sig as BufferSource, enc.encode(payloadB64));
    if (!valid) return null;
    const payloadBytes = base64UrlToBytes(payloadB64);
    const dec = new TextDecoder();
    const payload = JSON.parse(dec.decode(payloadBytes)) as SessionTokenPayload;
    if (payload.exp && Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}
