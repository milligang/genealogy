import { describe, it, expect } from 'vitest';
import {
  MAX_PEOPLE_IN_TREE,
  countPeople,
  isAtOrOverPersonLimit,
  MIN_MS_BETWEEN_CLOUD_SAVES,
} from './treePolicy';

describe('treePolicy', () => {
  it('countPeople handles empty model', () => {
    expect(countPeople({ people: {} })).toBe(0);
    expect(countPeople({})).toBe(0);
    expect(countPeople(null)).toBe(0);
  });

  it('isAtOrOverPersonLimit is false just below max', () => {
    const people = {};
    for (let i = 0; i < MAX_PEOPLE_IN_TREE - 1; i += 1) {
      people[`p${i}`] = { id: `p${i}`, goesBy: `P${i}` };
    }
    expect(isAtOrOverPersonLimit({ people, unions: {}, unionSpouses: [], unionChildren: [] })).toBe(
      false,
    );
  });

  it('isAtOrOverPersonLimit is true at max', () => {
    const people = {};
    for (let i = 0; i < MAX_PEOPLE_IN_TREE; i += 1) {
      people[`p${i}`] = { id: `p${i}`, goesBy: `P${i}` };
    }
    expect(isAtOrOverPersonLimit({ people, unions: {}, unionSpouses: [], unionChildren: [] })).toBe(
      true,
    );
  });

  it('exports a positive cooldown window', () => {
    expect(MIN_MS_BETWEEN_CLOUD_SAVES).toBeGreaterThanOrEqual(60_000);
  });
});
