import Dexie, { type EntityTable } from 'dexie';
import type { Reponse } from '../data/grille';

// _sale = 1 : modifié sur le téléphone, pas encore envoyé au serveur.
export interface Garderie { id: string; nom: string; commune: string; quartier: string | null; nb_enfants: number | null; valide?: boolean }

export interface Evaluation {
  id: string; garderie_id: string; cycle: number; date_eval: string;
  statut: 'brouillon' | 'terminee'; reponses: Record<string, Reponse>; participants: string | null;
  supprime: boolean; auteur_id: string | null; updated_at: string; _sale?: 0 | 1;
}

export type StatutAction = 'a_faire' | 'en_cours' | 'terminee';
export interface Action {
  id: string; garderie_id: string; evaluation_id: string | null; dimension: string;
  constat: string | null; titre: string; description: string | null; responsable: string | null;
  echeance: string | null; ressource_ids: string[]; statut: StatutAction; preuve: string | null;
  difficulte: string | null; besoin_appui: boolean; supprime: boolean; auteur_id: string | null;
  updated_at: string; _sale?: 0 | 1;
}

export interface Note {
  id: string; garderie_id: string; auteur_id: string | null; auteur_nom: string | null;
  texte: string; supprime: boolean; updated_at: string; _sale?: 0 | 1;
}

export type TypeService = 'sante' | 'nutrition' | 'social' | 'protection' | 'etat_civil' | 'education' | 'loisirs';
export interface Service {
  id: string; commune: string; nom: string; type: TypeService; adresse: string | null;
  telephone: string | null; horaires: string | null; description: string | null; actif: boolean; updated_at: string;
}

export type Besoin = 'sante' | 'vaccination' | 'nutrition' | 'developpement' | 'protection' | 'etat_civil' | 'social' | 'autre';
export interface Orientation {
  id: string; garderie_id: string; service_id: string; besoin: Besoin; date_orient: string;
  statut: 'orientee' | 'confirmee'; supprime: boolean; auteur_id: string | null; updated_at: string; _sale?: 0 | 1;
}

export interface Meta { cle: string; valeur: unknown }

export const db = new Dexie('synergie-garderies') as Dexie & {
  garderies: EntityTable<Garderie, 'id'>;
  evaluations: EntityTable<Evaluation, 'id'>;
  actions: EntityTable<Action, 'id'>;
  notes: EntityTable<Note, 'id'>;
  meta: EntityTable<Meta, 'cle'>;
  services: EntityTable<Service, 'id'>;
  orientations: EntityTable<Orientation, 'id'>;
};

db.version(1).stores({
  garderies: 'id',
  evaluations: 'id, garderie_id, _sale',
  actions: 'id, garderie_id, evaluation_id, _sale',
  notes: 'id, garderie_id, _sale',
  meta: 'cle',
});
db.version(2).stores({
  services: 'id, type',
  orientations: 'id, garderie_id, service_id, _sale',
});

export const maintenant = () => new Date().toISOString();

export function nouvelId(): string {
  if (typeof crypto.randomUUID === 'function' && window.isSecureContext) return crypto.randomUUID();
  // Repli pour les navigateurs anciens ou les pages non sécurisées.
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function getMeta<T>(cle: string): Promise<T | undefined> {
  return (await db.meta.get(cle))?.valeur as T | undefined;
}
export const setMeta = (cle: string, valeur: unknown) => db.meta.put({ cle, valeur });

export async function enregistrer<T extends { id: string; updated_at: string; _sale?: 0 | 1 }>(
  table: EntityTable<T, 'id'>, ligne: NoInfer<T>,
) {
  await table.put({ ...ligne, updated_at: maintenant(), _sale: 1 });
  window.dispatchEvent(new Event('donnees-modifiees'));
  window.dispatchEvent(new Event('donnees-modifiees-locales'));
}

export async function aEnvoyer(): Promise<number> {
  const n = await Promise.all([db.evaluations, db.actions, db.notes, db.orientations]
    .map((t) => (t as typeof db.actions).where('_sale').equals(1).count()));
  return n.reduce((a, b) => a + b, 0);
}

export async function viderTout() {
  await Promise.all(db.tables.map((t) => t.clear()));
  // Le lien parents retenu reste : il ne contient rien de personnel.
  for (const cle of ['yissolimon-idees', 'yissolimon-activites', 'yissolimon-fiches-ia']) {
    try { localStorage.removeItem(cle); } catch { /* stockage indisponible */ }
  }
}
