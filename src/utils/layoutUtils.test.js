import { describe, it, expect } from 'vitest';
import { getLayoutedElements } from './layoutUtils';

describe('getLayoutedElements', () => {
  it('assigns finite positions for person and smaller union nodes', () => {
    const nodes = [
      { id: 'p1', type: 'personNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'p2', type: 'personNode', position: { x: 0, y: 0 }, data: {} },
      { id: 'union:u1', type: 'unionNode', position: { x: 0, y: 0 }, data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'p1', target: 'union:u1' },
      { id: 'e2', source: 'p2', target: 'union:u1' },
    ];
    const { nodes: laid } = getLayoutedElements(nodes, edges);
    for (const n of laid) {
      expect(Number.isFinite(n.position.x)).toBe(true);
      expect(Number.isFinite(n.position.y)).toBe(true);
    }
    const union = laid.find((n) => n.type === 'unionNode');
    const person = laid.find((n) => n.id === 'p1');
    expect(union).toBeDefined();
    expect(person).toBeDefined();
    expect(Math.abs(union.position.x - person.position.x)).toBeLessThan(500);
  });
});
