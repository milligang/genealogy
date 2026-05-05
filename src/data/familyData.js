import dayjs from 'dayjs';
import supabase from '../supabaseClient';
import { createEmptyFamilyModel } from '../domain/familyModel';
import { addPerson, linkChildToParent } from '../domain/familyMutations';
import { finalizeSoloParentUnions } from '../domain/migrateLegacyFamilyTree';
import { repairFamilyModel } from '../domain/repairFamilyModel';

export { parseFamilyImport } from './parseFamilyImport.js';

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
  return repairFamilyModel(m);
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
      supabase.from('union_spouses').select('union_id, person_id'),
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
      });
    }
  }
  for (const row of children || []) {
    if (unionIds.has(row.union_id)) {
      model.unionChildren.push({ unionId: row.union_id, childPersonId: row.child_person_id });
    }
  }
  return repairFamilyModel(model);
}

export const SAVE_ERROR_CODES = {
  MISSING_EXPECTED_USER: 'MISSING_EXPECTED_USER',
  NOT_AUTHENTICATED: 'NOT_AUTHENTICATED',
  SESSION_MISMATCH: 'SESSION_MISMATCH',
  REMOTE_ERROR: 'REMOTE_ERROR',
};

/**
 * Persists the full tree for the current user. Call only from explicit Save, not on every edit.
 * @param {object} model — canonical family model
 * @param {{ expectedUserId: string }} options — caller’s signed-in user id; must match `getUser()` or save is rejected.
 */
export const saveFamilyData = async (model, options = {}) => {
  const { expectedUserId } = options;
  if (!expectedUserId || typeof expectedUserId !== 'string') {
    return {
      ok: false,
      code: SAVE_ERROR_CODES.MISSING_EXPECTED_USER,
      userMessage: 'Save could not run (missing account). Reload the page and sign in again.',
      error: new Error('expectedUserId required'),
    };
  }

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError) {
    console.error('saveFamilyData getUser error:', userError);
    return {
      ok: false,
      code: SAVE_ERROR_CODES.NOT_AUTHENTICATED,
      userMessage: userError.message || 'Could not verify your sign-in. Try signing in again.',
      error: userError,
    };
  }
  if (!user) {
    return {
      ok: false,
      code: SAVE_ERROR_CODES.NOT_AUTHENTICATED,
      userMessage: 'You are not signed in. Sign in to save to the cloud.',
      error: new Error('Not signed in'),
    };
  }
  if (user.id !== expectedUserId) {
    return {
      ok: false,
      code: SAVE_ERROR_CODES.SESSION_MISMATCH,
      userMessage: 'Your session does not match this page. Reload and sign in again.',
      error: new Error('Session user id mismatch'),
    };
  }

  try {
    await replaceUserFamilyRemote(user.id, model);
    return { ok: true };
  } catch (error) {
    console.error('Error saving to Supabase:', error);
    return {
      ok: false,
      code: SAVE_ERROR_CODES.REMOTE_ERROR,
      userMessage: error?.message || 'Save failed. Try again.',
      error,
    };
  }
};

export const loadFamilyData = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return createSeedFamilyModel();
  }

  try {
    const model = await loadRelationalFamily(user.id);
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
  } catch (error) {
    console.error('Error clearing data:', error);
  }
};
