import supabase from '../supabaseClient';

/**
 * Detects Supabase client auth errors where persisted tokens should be discarded.
 * (Stale refresh token, revoked session, etc.)
 */
export function isInvalidAuthStorageError(error) {
  if (!error) return false;
  const msg = String(error.message ?? '').toLowerCase();
  const name = String(error.name ?? '');
  if (name === 'AuthApiError') {
    if (msg.includes('refresh token')) return true;
    if (msg.includes('invalid jwt')) return true;
    if (msg.includes('jwt expired')) return true;
  }
  if (msg.includes('refresh token not found')) return true;
  if (error.code === 'refresh_token_not_found') return true;
  return false;
}

/** Short message for inline UI (banner, toast). */
export function humanAuthErrorMessage(error) {
  if (!error) return 'Something went wrong with sign-in. Please try again.';
  if (isInvalidAuthStorageError(error)) {
    return 'Your saved sign-in is no longer valid on this device. Please sign in again.';
  }
  const msg = String(error.message ?? '').trim();
  if (!msg) return 'Could not verify your account. Please sign in again.';
  const lower = msg.toLowerCase();
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Cannot reach the sign-in service. Check your connection and try again.';
  }
  if (lower.includes('404') || msg.includes('404')) {
    return 'Sign-in service URL may be misconfigured (404). Check VITE_SUPABASE_URL in your environment.';
  }
  return msg;
}

/**
 * Loads session from storage and validates with Supabase.
 * Clears local auth storage when refresh / validation fails with a stale-token class error.
 */
export async function recoverAuthSession() {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) {
    if (isInvalidAuthStorageError(sessionError)) {
      await supabase.auth.signOut({ scope: 'local' });
    }
    return {
      user: null,
      recoveredFromInvalidStorage: isInvalidAuthStorageError(sessionError),
      error: sessionError,
    };
  }
  if (!session) {
    return { user: null, recoveredFromInvalidStorage: false, error: null };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    if (isInvalidAuthStorageError(userError)) {
      await supabase.auth.signOut({ scope: 'local' });
      return {
        user: null,
        recoveredFromInvalidStorage: true,
        error: userError,
      };
    }
    // Network / transient server errors: keep locally stored user so we do not false-logout.
    return {
      user: session.user ?? null,
      recoveredFromInvalidStorage: false,
      error: userError,
    };
  }

  return { user, recoveredFromInvalidStorage: false, error: null };
}
