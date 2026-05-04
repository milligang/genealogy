/**
 * Client-side tree limits (keep in sync with backend when you add server checks).
 * Change these in one place; backend can mirror MAX_PEOPLE_IN_TREE later.
 */
export const MAX_PEOPLE_IN_TREE = 500;

/** Minimum time between successful cloud saves (simple client throttle). */
export const MIN_MS_BETWEEN_CLOUD_SAVES = 60_000;

export function countPeople(model) {
  return Object.keys(model?.people || {}).length;
}

export function isAtOrOverPersonLimit(model) {
  return countPeople(model) >= MAX_PEOPLE_IN_TREE;
}
