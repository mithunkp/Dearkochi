This repository is a Next.js (App Router) TypeScript site with TailwindCSS and Supabase.

Keep instructions short and actionable. When editing, prefer small, focused PRs that change a single area (styles, data, or behavior).

Key facts (what an AI should know immediately)
- Framework: Next.js (app router). See `src/app/*` — pages are folders with `page.tsx`.
- Language: TypeScript (strict). See `tsconfig.json` (paths: `@/*` -> `src/*`).
- Styling: Tailwind v4 utilities with `src/app/globals.css` importing Tailwind. PostCSS is configured in `postcss.config.mjs`.
- Fonts: `next/font` (Geist) is loaded in `src/app/layout.tsx`.
- Data/backend: Supabase client is created in `src/lib/supabase.ts`. Environment variables required:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
- Database usage example: `src/app/AddPlaceForm.tsx` inserts into the `user_places` table via `supabase.from('user_places').insert(...)`. Use that file as the authoritative example for writing DB mutations.

Developer workflows and commands
- Local dev: `npm run dev` (Next dev server). Build: `npm run build`. Start prod: `npm run start`.
- Lint: `npm run lint` (project uses ESLint with Next presets in `eslint.config.mjs`).
- Typical quick tasks an AI will be asked to do: add a new client component, wire a Supabase query, update Tailwind styles, or add a new API route under `src/app/api/`.

Conventions & patterns to follow
- App Router: prefer server components by default; add `'use client'` at top of a file when the component uses state, effects, or browser-only APIs. Many UI files (e.g. `src/app/page.tsx`, `src/app/AddPlaceForm.tsx`) are client components.
- Styling: use Tailwind utility classes. Global tokens live in `src/app/globals.css` — keep new global CSS minimal and prefer Tailwind utility-first changes.
- Data access: use the single Supabase client from `src/lib/supabase.ts`. Do not create multiple clients or re-initialize in components.
- Paths: import project modules with `@/` alias (maps to `src/`), e.g. `import { supabase } from '@/lib/supabase'`.
- Small components: put them near usage under `src/app/*` (component files or subfolders). Larger shared components can go under `src/components/` if added.

Integration points & caveats
- Supabase env vars are required at runtime and build (for client anon key). Do not commit secrets; expect them set in Vercel or local env.
- Next 16 + React 19 are used (check `package.json`). Tailwind v4 plugin is present — watch for utility changes if upgrading.
- The project uses `next/font` (Geist). Avoid replacing font handling without testing layout changes.

Examples (concrete patterns)
- Add a new API route: create `src/app/api/<name>/route.ts` exporting handlers. Several examples exist under `src/app/api/`.
- Server fetch inside a server component: fetch directly or use Supabase server-side client (create a server-only client if needed). For client-side interactions use `src/lib/supabase.ts` as shown in `AddPlaceForm.tsx`.
- Database insert example (copy/modify):
  const { error } = await supabase.from('user_places').insert([{ name, description, type }]);

When to ask the user
- If an endpoint or DB table name is ambiguous (not present in code), ask for the intended table/schema or show the SQL/migration you plan to add.
- If a change affects fonts, global CSS, or Tailwind config — mention visual risk and provide a screenshot suggestion.

If you update this file, preserve the short 'Key facts' and 'Conventions' sections and keep the file <= ~50 lines.

Questions? Ask for the env variables, the desired DB table schema, or whether to deploy to Vercel (project README references Vercel deploy).
