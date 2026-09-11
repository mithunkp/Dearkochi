import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifySessionToken } from '@/lib/admin-auth';

// Create a single supabase client for interacting with your database
// Note: In middleware, we should be careful with environment variables
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const pathname = req.nextUrl.pathname;

    // 1. Bypass static assets and critical paths
    // 0. Protect Admin Routes (Static Auth)
    if (pathname.startsWith('/admin')) {
        // Allow access to login page
        if (pathname === '/admin/login') {
            return res;
        }

        // Verify the cookie's signature, not merely its presence. Checking
        // existence alone meant `document.cookie = 'admin_session=true'`
        // was enough to reach every admin page.
        const token = req.cookies.get(ADMIN_COOKIE)?.value;

        if (!(await verifySessionToken(token))) {
            const redirect = NextResponse.redirect(
                new URL('/admin/login', req.url),
            );
            // Clear a stale or forged cookie on the way out.
            redirect.cookies.delete(ADMIN_COOKIE);
            return redirect;
        }
    }

    // 1. Bypass static assets and critical paths
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.startsWith('/api') ||
        pathname.includes('.') || // extension files
        // pathname.startsWith('/admin') || // REMOVED: Managed separately above
        pathname.startsWith('/auth') ||    // Auth routes always accessible
        process.env.NODE_ENV === 'development' // Bypass all checks in development
    ) {
        return res;
    }

    // 2. Check Maintenance Mode status from DB
    // We fetch this on every document request (navigation). 
    // Static assets are already bypassed above.
    try {
        const { data: settings } = await supabase
            .from('site_settings')
            .select('maintenance_mode')
            .eq('id', 1)
            .single();

        const isMaintenanceOn = settings?.maintenance_mode;

        // 3. Handle Redirection

        // Sceanrio A: Maintenance is ON
        if (isMaintenanceOn) {
            // If user is trying to access anything OTHER than /maintenance
            if (pathname !== '/maintenance') {
                return NextResponse.redirect(new URL('/maintenance', req.url));
            }
        }

        // Scenario B: Maintenance is OFF
        else {
            // If user is trying to access /maintenance while it's off
            if (pathname === '/maintenance') {
                return NextResponse.redirect(new URL('/', req.url));
            }
        }

    } catch (error) {
        console.error('Middleware maintenance check failed:', error);
        // Fallback: allow access if DB check fails to avoid accidental lockout
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
