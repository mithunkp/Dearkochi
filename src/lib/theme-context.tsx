'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'dk-theme';

type ThemeContextType = {
    /** What the user picked, including "follow the OS". */
    preference: ThemePreference;
    /** What is actually on screen right now. */
    theme: ResolvedTheme;
    setPreference: (next: ThemePreference) => void;
    /** Flips between light and dark, leaving "system" behind. */
    toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * Runs before first paint (see ThemeScript) and again on every change, so the
 * class on <html> and the rendered tree never disagree.
 */
function applyTheme(resolved: ResolvedTheme) {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    // Lets the browser theme form controls, scrollbars and the URL bar.
    root.style.colorScheme = resolved;
}

function systemTheme(): ResolvedTheme {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
}

function readStoredPreference(): ThemePreference {
    if (typeof window === 'undefined') return 'system';
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === 'light' || raw === 'dark' || raw === 'system') return raw;
    } catch {
        // Private mode / blocked storage — fall back to following the OS.
    }
    return 'system';
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    // Start at the SSR-safe default; the effect below syncs to the real value
    // on mount. ThemeScript has already set the class, so there is no flash.
    const [preference, setPreferenceState] = useState<ThemePreference>('system');
    const [systemResolved, setSystemResolved] = useState<ResolvedTheme>('light');

    useEffect(() => {
        setPreferenceState(readStoredPreference());
        setSystemResolved(systemTheme());
    }, []);

    // Track OS changes so "system" stays live rather than sampling once.
    useEffect(() => {
        const mq = window.matchMedia('(prefers-color-scheme: dark)');
        const onChange = (e: MediaQueryListEvent) => {
            setSystemResolved(e.matches ? 'dark' : 'light');
        };
        mq.addEventListener('change', onChange);
        return () => mq.removeEventListener('change', onChange);
    }, []);

    const theme: ResolvedTheme =
        preference === 'system' ? systemResolved : preference;

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    const setPreference = useCallback((next: ThemePreference) => {
        setPreferenceState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Non-fatal: the theme still applies for this session.
        }
    }, []);

    const toggle = useCallback(() => {
        setPreference(theme === 'dark' ? 'light' : 'dark');
    }, [theme, setPreference]);

    const value = useMemo(
        () => ({ preference, theme, setPreference, toggle }),
        [preference, theme, setPreference, toggle],
    );

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
    return ctx;
}

/**
 * Inlined in <head> so the correct theme is on <html> before the first paint.
 * Without this the page renders light, then snaps to dark once React hydrates.
 */
export const themeInitScript = `
(function(){
  try {
    var p = localStorage.getItem('${STORAGE_KEY}');
    var dark = p === 'dark' || ((!p || p === 'system') &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);
    var r = document.documentElement;
    r.classList.toggle('dark', dark);
    r.style.colorScheme = dark ? 'dark' : 'light';
  } catch (e) {}
})();
`;
