'use client';

import { usePathname } from 'next/navigation';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { DesktopNav } from './DesktopNav';

/* Routes that supply their own chrome, or that need the full viewport.
   /admin has its own layout; /chats/[id] docks a composer to the bottom
   edge, where a tab bar would sit on top of it. */
const BARE_PREFIXES = ['/admin', '/maintenance'];

function isBare(pathname: string) {
    if (BARE_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
        return true;
    }
    // A specific chat thread, but not the /chats index.
    if (/^\/chats\/[^/]+$/.test(pathname)) return true;
    return false;
}

export function AppShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    if (isBare(pathname)) {
        return <>{children}</>;
    }

    return (
        <div id="dk-root" className="flex min-h-dvh flex-col">
            <TopBar />
            <DesktopNav />
            <main
                id="main"
                className="flex-1"
                /* Clear the fixed tab bar plus the home indicator, so the last
                   row of content is never trapped underneath it. */
                style={{
                    paddingBottom:
                        'calc(env(safe-area-inset-bottom, 0px) + var(--dk-nav-clearance, 0px))',
                }}
            >
                {children}
            </main>
            <BottomNav />
            {/* Tab bar is mobile-only, so only reserve space below md. */}
            <style>{`@media (max-width: 767px){#dk-root{--dk-nav-clearance:4rem}}`}</style>
        </div>
    );
}
