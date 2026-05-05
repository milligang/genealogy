/**
 * Maps Supabase `onAuthStateChange` args to the next auth user for React state.
 *
 * GoTrueClient can emit `INITIAL_SESSION` with `session: null` when internal
 * session read fails (_emitInitialSession catch). That must not clear a user
 * already established by `recoverAuthSession`, or the app flashes then unmounts.
 *
 * @param {string} event
 * @param {{ user?: object } | null} session
 * @returns {{ kind: 'set', user: object } | { kind: 'clear' } | { kind: 'skip' }}
 */
export function deriveAuthUserFromChange(event, session) {
  if (event === 'SIGNED_OUT') {
    return { kind: 'clear' };
  }
  if (session?.user) {
    return { kind: 'set', user: session.user };
  }
  if (event === 'INITIAL_SESSION' && session === null) {
    return { kind: 'skip' };
  }
  return { kind: 'skip' };
}
