import { migrateLegacyFamilyTree } from '../domain/migrateLegacyFamilyTree';
import { repairFamilyModel } from '../domain/repairFamilyModel';

/** Import v2 bundle or legacy React Flow export (no Supabase). */
export function parseFamilyImport(raw) {
  if (raw?.people && typeof raw.people === 'object') {
    return repairFamilyModel({
      people: raw.people,
      unions: raw.unions || {},
      unionSpouses: Array.isArray(raw.unionSpouses) ? raw.unionSpouses : [],
      unionChildren: Array.isArray(raw.unionChildren) ? raw.unionChildren : [],
    });
  }
  if (Array.isArray(raw?.nodes)) {
    return migrateLegacyFamilyTree(raw);
  }
  throw new Error('Unrecognized backup format');
}
