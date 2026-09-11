import { NextRequest, NextResponse } from 'next/server';
import {
    ADMIN_COOKIE,
    SESSION_MAX_AGE,
    adminCredentials,
    createSessionToken,
    usingDefaultCredentials,
} from '@/lib/admin-auth';

/** Length-independent string comparison for secrets. */
function safeEqual(a: string, b: string) {
    if (a.length !== b.length) return false;
    let mismatch = 0;
    for (let i = 0; i < a.length; i++) {
        mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return mismatch === 0;
}

export async function POST(request: NextRequest) {
    try {
        const { username, password } = await request.json();

        if (typeof username !== 'string' || typeof password !== 'string') {
            return NextResponse.json(
                { success: false, error: 'Invalid request' },
                { status: 400 },
            );
        }

        const expected = adminCredentials();

        // Evaluate both, then combine: returning early on a bad username
        // would confirm which accounts exist, and the old code reported
        // "Invalid username" and "Invalid password" separately.
        const userOk = safeEqual(username, expected.username);
        const passOk = safeEqual(password, expected.password);

        if (!userOk || !passOk) {
            return NextResponse.json(
                { success: false, error: 'Incorrect username or password' },
                { status: 401 },
            );
        }

        if (usingDefaultCredentials()) {
            console.warn(
                'Admin signed in with the default credentials committed to the repository. ' +
                'Set ADMIN_USERNAME, ADMIN_PASSWORD and ADMIN_SESSION_SECRET.',
            );
        }

        const response = NextResponse.json({ success: true });

        response.cookies.set(ADMIN_COOKIE, await createSessionToken(), {
            path: '/',
            maxAge: SESSION_MAX_AGE,
            // Was false, leaving the session readable by any script on the
            // page and transmittable over plain HTTP.
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
        });

        return response;
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 },
        );
    }
}
