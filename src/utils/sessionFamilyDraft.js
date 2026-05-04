const keyFor = (userId) => `genealogy:sessionDraft:v1:${userId ?? 'anon'}`;

/**
 * Session draft: survives refresh in the same tab; cleared when the tab closes.
 * Positions are stored so manual layout survives refresh without pressing Auto layout.
 */
export function writeSessionDraft(userId, payload) {
  try {
    sessionStorage.setItem(
      keyFor(userId),
      JSON.stringify({
        savedAt: Date.now(),
        familyModel: payload.familyModel,
        positions: payload.positions,
      }),
    );
  } catch (e) {
    console.warn('Could not write session draft (quota or private mode):', e);
  }
}

export function readSessionDraft(userId) {
  try {
    const raw = sessionStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.familyModel) return null;
    return {
      savedAt: parsed.savedAt,
      familyModel: parsed.familyModel,
      positions: parsed.positions && typeof parsed.positions === 'object' ? parsed.positions : {},
    };
  } catch {
    return null;
  }
}

export function clearSessionDraft(userId) {
  try {
    sessionStorage.removeItem(keyFor(userId));
  } catch {
    /* ignore */
  }
}
