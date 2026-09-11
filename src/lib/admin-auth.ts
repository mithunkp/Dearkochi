/**
 * Signed admin session tokens.
 *
 * The previous implementation set `admin_session=true` and the middleware
 * only checked that the cookie existed, so anyone could grant themselves
 * admin by typing `document.cookie = 'admin_session=true'` into devtools —
 * no password involved. Tokens are now HMAC-signed and carry an expiry, so
 * a cookie the server did not issue is rejected.
 *
 * Uses Web Crypto so the same code runs in the Edge middleware and in the
 * Node route handler.
 */

export const ADMIN_COOKIE = 'admin_session';
const SESSION_TTL_SECONDS = 60 * 60 * 24; // 1 day

/* Falls back to a build-time constant so existing deployments keep working
   before ADMIN_SESSION_SECRET is configured. Set it in the environment —
   without it, anyone who knows this source can mint a token. */
function secret(): string {
    return (
        process.env.ADMIN_SESSION_SECRET ??
        process.env.ADMIN_PASSWORD ??
        'dearkochi-unset-secret'
    );
}

export function adminCredentials() {
    return {
        username: process.env.ADMIN_USERNAME ?? 'admin',
        password: process.env.ADMIN_PASSWORD ?? 'p@ssw0rd@dmin',
    };
}

/** True when credentials are still the committed defaults. */
export function usingDefaultCredentials() {
    return !process.env.ADMIN_USERNAME || !process.env.ADMIN_PASSWORD;
}

function toHex(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');
}

async function sign(payload: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret()),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign'],
    );
    return toHex(await crypto.subtle.sign('HMAC', key, encoder.encode(payload)));
}

/** `<expiryEpochSeconds>.<hmac>` */
export async function createSessionToken(): Promise<string> {
    const expiry = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
    const payload = String(expiry);
    return `${payload}.${await sign(payload)}`;
}

export async function verifySessionToken(
    token: string | undefined | null,
): Promise<boolean> {
    if (!token) return false;

    const separator = token.lastIndexOf('.');
    if (separator <= 0) return false;

    const payload = token.slice(0, separator);
    const provided = token.slice(separator + 1);

    const expiry = Number.parseInt(payload, 10);
    if (!Number.isFinite(expiry) || expiry * 1000 < Date.now()) return false;

    const expected = await sign(payload);

    // Constant-time comparison: a length-dependent early return would leak
    // how much of the signature matched.
    if (expected.length !== provided.length) return false;
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) {
        mismatch |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
    }
    return mismatch === 0;
}

export const SESSION_MAX_AGE = SESSION_TTL_SECONDS;
