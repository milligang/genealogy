import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { writeSessionDraft, readSessionDraft, clearSessionDraft } from './sessionFamilyDraft';

function mockSessionStorage() {
  const map = new Map();
  const api = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
    clear: () => map.clear(),
  };
  vi.stubGlobal('sessionStorage', api);
  return map;
}

describe('sessionFamilyDraft', () => {
  let realSessionStorage;

  beforeEach(() => {
    realSessionStorage = globalThis.sessionStorage;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    if (realSessionStorage !== undefined) {
      globalThis.sessionStorage = realSessionStorage;
    }
  });

  it('writes and reads round-trip for a user id', () => {
    mockSessionStorage();
    const model = { people: { x: { id: 'x' } }, unions: {}, unionSpouses: [], unionChildren: [] };
    const positions = { x: { x: 10, y: 20 } };
    writeSessionDraft('user-1', { familyModel: model, positions });
    const back = readSessionDraft('user-1');
    expect(back.familyModel.people.x.id).toBe('x');
    expect(back.positions.x).toEqual({ x: 10, y: 20 });
  });

  it('clearSessionDraft removes stored draft', () => {
    mockSessionStorage();
    writeSessionDraft('u2', {
      familyModel: { people: {}, unions: {}, unionSpouses: [], unionChildren: [] },
      positions: {},
    });
    clearSessionDraft('u2');
    expect(readSessionDraft('u2')).toBeNull();
  });

  it('uses distinct keys per user', () => {
    const map = mockSessionStorage();
    writeSessionDraft('a', {
      familyModel: { people: { p: { id: 'p' } }, unions: {}, unionSpouses: [], unionChildren: [] },
      positions: {},
    });
    writeSessionDraft('b', {
      familyModel: { people: { q: { id: 'q' } }, unions: {}, unionSpouses: [], unionChildren: [] },
      positions: {},
    });
    expect(map.size).toBe(2);
    expect(readSessionDraft('a').familyModel.people.p).toBeDefined();
    expect(readSessionDraft('b').familyModel.people.q).toBeDefined();
  });
});
