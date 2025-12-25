import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { username, password } = body;

        console.log('API Route: Login attempt for username:', username);

        if (username !== 'admin') {
            return NextResponse.json(
                { success: false, error: 'Invalid username' },
                { status: 401 }
            );
        }

        if (password !== 'p@ssw0rd@dmin') {
            return NextResponse.json(
                { success: false, error: 'Invalid password' },
                { status: 401 }
            );
        }

        console.log('API Route: Login successful, setting cookie');

        const response = NextResponse.json({ success: true });

        // Set cookie directly on response
        // minimal options for debugging
        response.cookies.set('admin_session', 'true', {
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
            httpOnly: false, // False for now so we can see it in client debug
            secure: false,
            sameSite: 'lax'
        });

        return response;
    } catch (error) {
        console.error('API Route error:', error);
        return NextResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
        );
    }
}
