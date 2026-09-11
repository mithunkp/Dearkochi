/**
 * Turn a Firebase auth error into something worth showing a visitor.
 *
 * The previous code alerted `error.message` verbatim, which surfaced text
 * like "add this domain to the Authentication > Settings > Authorized
 * Domains list" — an instruction for the site's own developer, shown to the
 * public. Operator-facing detail stays in the console; users get this.
 */
export function authErrorMessage(error: unknown): string {
    const code =
        typeof error === 'object' && error !== null && 'code' in error
            ? String((error as { code: unknown }).code)
            : '';

    switch (code) {
        case 'auth/invalid-email':
            return 'That email address does not look right.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'Email or password is incorrect.';
        case 'auth/email-already-in-use':
            return 'An account already exists with that email. Try signing in.';
        case 'auth/weak-password':
            return 'Choose a password of at least 6 characters.';
        case 'auth/too-many-requests':
            return 'Too many attempts. Please wait a moment and try again.';
        case 'auth/popup-closed-by-user':
        case 'auth/cancelled-popup-request':
            return 'Sign-in was cancelled.';
        case 'auth/popup-blocked':
            return 'Your browser blocked the sign-in window. Allow pop-ups and try again.';
        case 'auth/network-request-failed':
            return 'Network problem. Check your connection and try again.';
        case 'auth/unauthorized-domain':
            // A misconfiguration on our side, not something the visitor did.
            return 'Sign-in is unavailable on this domain right now. Please try again later.';
        case 'auth/operation-not-allowed':
            return 'This sign-in method is not enabled.';
        default:
            return 'Something went wrong signing you in. Please try again.';
    }
}

/**
 * Only these destinations are allowed after sign-in. An open redirect would
 * let `?redirect=https://evil.example` bounce users off-site.
 */
export function safeRedirect(
    raw: string | null | undefined,
    fallback = '/profile',
): string {
    if (!raw) return fallback;
    // Must be a site-relative path, and not protocol-relative ("//host").
    if (!raw.startsWith('/') || raw.startsWith('//')) return fallback;
    return raw;
}
