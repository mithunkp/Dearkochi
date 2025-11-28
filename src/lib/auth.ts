import { supabase } from './supabase';

export async function signInWithMagicLink(email: string) {
  return supabase.auth.signInWithOtp({ email });
}

export async function signOut() {
  return supabase.auth.signOut();
}

export async function getUserFromToken(accessToken: string | null) {
  if (!accessToken) return null;
  // Create a client scoped to the token to retrieve the user
  try {
    const supabaseClient = await import('@supabase/supabase-js').then(m => m.createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    ));

    const { data, error } = await supabaseClient.auth.getUser();
    if (error) return null;
    return data.user || null;
  } catch (err) {
    console.error('getUserFromToken error', err);
    return null;
  }
}

export async function getSession() {
  return supabase.auth.getSession();
}
