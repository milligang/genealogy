import dayjs from 'dayjs';
import supabase from '../supabaseClient';
import { createEmptyFamilyModel } from '../domain/familyModel';
import { addPerson, linkChildToParent } from '../domain/familyMutations';
import { migrateLegacyFamilyTree, finalizeSoloParentUnions } from '../domain/migrateLegacyFamilyTree';

/** Import v2 bundle or legacy React Flow export */
export function parseFamilyImport(raw) {
  if (raw?.people && typeof raw.people === 'object') {
    return {
      people: raw.people,
      unions: raw.unions || {},
      unionSpouses: Array.isArray(raw.unionSpouses) ? raw.unionSpouses : [],
      unionChildren: Array.isArray(raw.unionChildren) ? raw.unionChildren : [],
    };
  }
  if (Array.isArray(raw?.nodes)) {
    return migrateLegacyFamilyTree(raw);
  }
  throw new Error('Unrecognized backup format');
}

const SEED = {
  john: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0001',
  sarah: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0002',
  michael: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaa0003',
};

export function createSeedFamilyModel() {
  let m = createEmptyFamilyModel();
  m = addPerson(m, {
    id: SEED.john,
    firstName: 'John',
    middleName: 'Robert',
    lastName: 'Smith',
    goesBy: 'John',
    gender: 'male',
    birthDate: dayjs('1950-01-15').toISOString(),
    deathDate: null,
    photo: '',
    notes: 'Family patriarch',
  });
  m = addPerson(m, {
    id: SEED.sarah,
    firstName: 'Sarah',
    middleName: 'Marie',
    lastName: 'Smith',
    goesBy: 'Sarah',
    gender: 'female',
    birthDate: dayjs('1975-05-20').toISOString(),
    deathDate: null,
    photo: '',
    notes: '',
  });
  m = addPerson(m, {
    id: SEED.michael,
    firstName: 'Michael',
    middleName: 'James',
    lastName: 'Smith',
    goesBy: 'Mike',
    gender: 'male',
    birthDate: dayjs('1978-08-10').toISOString(),
    deathDate: null,
    photo: '',
    notes: '',
  });
  m = linkChildToParent(m, SEED.sarah, SEED.john);
  m = linkChildToParent(m, SEED.michael, SEED.john);
  m = finalizeSoloParentUnions(m);
  return m;
}

function personToRow(userId, person) {
  const { id, ...profile } = person;
  return {
    id,
    user_id: userId,
    profile,
    updated_at: new Date().toISOString(),
  };
}

function rowToPerson(row) {
  return { id: row.id, ...(row.profile || {}) };
}

async function replaceUserFamilyRemote(userId, model) {
  const { data: existingUnions } = await supabase.from('unions').select('id').eq('user_id', userId);
  const unionIds = (existingUnions || []).map((r) => r.id);
  if (unionIds.length) {
    await supabase.from('union_children').delete().in('union_id', unionIds);
    await supabase.from('union_spouses').delete().in('union_id', unionIds);
    await supabase.from('unions').delete().eq('user_id', userId);
  }
  await supabase.from('people').delete().eq('user_id', userId);

  const peopleRows = Object.values(model.people).map((p) => personToRow(userId, p));
  const unionRows = Object.values(model.unions).map((u) => ({
    id: u.id,
    user_id: userId,
    label: u.label ?? null,
    updated_at: new Date().toISOString(),
  }));
  const spouseRows = model.unionSpouses.map((s) => ({
    union_id: s.unionId,
    person_id: s.personId,
    spouse_order: s.spouseOrder,
  }));
  const childRows = model.unionChildren.map((c) => ({
    union_id: c.unionId,
    child_person_id: c.childPersonId,
  }));

  if (peopleRows.length) {
    const { error: pe } = await supabase.from('people').insert(peopleRows);
    if (pe) throw pe;
  }
  if (unionRows.length) {
    const { error: ue } = await supabase.from('unions').insert(unionRows);
    if (ue) throw ue;
  }
  if (spouseRows.length) {
    const { error: se } = await supabase.from('union_spouses').insert(spouseRows);
    if (se) throw se;
  }
  if (childRows.length) {
    const { error: ce } = await supabase.from('union_children').insert(childRows);
    if (ce) throw ce;
  }
}

async function loadRelationalFamily(userId) {
  const [{ data: people, error: pe }, { data: unions, error: ue }, { data: spouses, error: se }, { data: children, error: ce }] =
    await Promise.all([
      supabase.from('people').select('id, profile').eq('user_id', userId),
      supabase.from('unions').select('id, label').eq('user_id', userId),
      supabase.from('union_spouses').select('union_id, person_id, spouse_order'),
      supabase.from('union_children').select('union_id, child_person_id'),
    ]);

  if (pe || ue) {
    console.error(pe || ue);
    return null;
  }
  if (se || ce) {
    console.error(se || ce);
    return null;
  }

  if (!people?.length && !unions?.length) return null;

  const unionIds = new Set((unions || []).map((u) => u.id));
  const model = createEmptyFamilyModel();
  for (const row of people || []) {
    model.people[row.id] = rowToPerson(row);
  }
  for (const row of unions || []) {
    model.unions[row.id] = { id: row.id, label: row.label };
  }
  for (const row of spouses || []) {
    if (unionIds.has(row.union_id)) {
      model.unionSpouses.push({
        unionId: row.union_id,
        personId: row.person_id,
        spouseOrder: row.spouse_order ?? 0,
      });
    }
  }
  for (const row of children || []) {
    if (unionIds.has(row.union_id)) {
      model.unionChildren.push({ unionId: row.union_id, childPersonId: row.child_person_id });
    }
  }
  return model;
}

async function tryMigrateLegacyFamilyTrees(userId) {
  const { data, error } = await supabase.from('family_trees').select('nodes, edges').eq('user_id', userId).maybeSingle();
  if (error && error.code !== 'PGRST116') {
    console.error(error);
    return null;
  }
  if (!data?.nodes) return null;

  const model = migrateLegacyFamilyTree({ nodes: data.nodes, edges: data.edges });
  try {
    await replaceUserFamilyRemote(userId, model);
    await supabase.from('family_trees').delete().eq('user_id', userId);
  } catch (e) {
    console.error('Failed to migrate legacy family_trees row:', e);
    return null;
  }
  return model;
}

export const saveFamilyData = async (model) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('User not authenticated');
    return;
  }
  try {
    await replaceUserFamilyRemote(user.id, model);
  } catch (error) {
    console.error('Error saving to Supabase:', error);
  }
};

export const loadFamilyData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createSeedFamilyModel();
  }

  try {
    let model = await loadRelationalFamily(user.id);
    if (!model || (!Object.keys(model.people).length && !Object.keys(model.unions).length)) {
      model = await tryMigrateLegacyFamilyTrees(user.id);
    }
    if (!model || (!Object.keys(model.people).length && !Object.keys(model.unions).length)) {
      return createSeedFamilyModel();
    }
    return model;
  } catch (error) {
    console.error('Error loading from Supabase:', error);
    return createSeedFamilyModel();
  }
};

export const clearFamilyData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  try {
    const { data: existingUnions } = await supabase.from('unions').select('id').eq('user_id', user.id);
    const unionIds = (existingUnions || []).map((r) => r.id);
    if (unionIds.length) {
      await supabase.from('union_children').delete().in('union_id', unionIds);
      await supabase.from('union_spouses').delete().in('union_id', unionIds);
      await supabase.from('unions').delete().eq('user_id', user.id);
    }
    await supabase.from('people').delete().eq('user_id', user.id);
    await supabase.from('family_trees').delete().eq('user_id', user.id);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
