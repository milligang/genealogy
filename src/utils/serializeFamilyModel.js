/** Stable-enough snapshot for dirty detection vs last cloud save. */
export function serializeFamilyModel(model) {
  return JSON.stringify({
    people: model.people,
    unions: model.unions,
    unionSpouses: [...model.unionSpouses].sort((a, b) => {
      const k = `${a.unionId}:${a.personId}`;
      const k2 = `${b.unionId}:${b.personId}`;
      return k.localeCompare(k2);
    }),
    unionChildren: [...model.unionChildren].sort((a, b) => {
      const k = `${a.unionId}:${a.childPersonId}`;
      const k2 = `${b.unionId}:${b.childPersonId}`;
      return k.localeCompare(k2);
    }),
  });
}
