// Appels à l'assistant (fonction serveur « ia »). L'application marche sans lui : chaque usage a un repli hors ligne.
import { supabase } from './supabase';
import type { Activite } from '../data/activites';

export interface ActionIA { dimension: string; titre: string; description: string; premier_pas: string; cout: 'gratuit' | 'faible' | 'moyen' }
export interface FicheIA {
  id?: string; dimension: string; titre: string; resume: string; pourquoi: string;
  etapes: string[]; eviter: string[]; signe: string; minutes: number; statut?: 'a_valider' | 'validee' | 'refusee';
}

async function appeler<T>(type: string, donnees: unknown): Promise<T> {
  if (!navigator.onLine) throw new Error('Il faut internet pour une idée sur mesure.');
  const { data, error } = await supabase.functions.invoke('ia', { body: { type, donnees } });
  if (error || !data || (data as { erreur?: string }).erreur) {
    let message = (data as { erreur?: string } | null)?.erreur;
    try { message ??= (await (error as { context?: Response })?.context?.json())?.erreur; } catch { /* réponse non JSON */ }
    throw new Error(message ?? 'L’assistant n’est pas disponible pour le moment.');
  }
  return data as T;
}

export const activiteIA = (d: { age: string; minutes: number; materiel: string[]; objectif: string; deja: string[] }) => appeler<Activite>('activite', d);
export const conseilsIA = (d: { scores: Record<string, number | null>; faibles: string[]; deja: string[] }) => appeler<{ actions: ActionIA[] }>('conseils', d);
export const ficheIA = (d: { dimension: string; sujet: string }) => appeler<FicheIA>('fiche', d);

// ---------- Idées gardées sur le téléphone (lisibles hors ligne) ----------
const CLE_IDEES = 'yissolimon-idees';
export function ideesGardees(): Activite[] {
  try { return JSON.parse(localStorage.getItem(CLE_IDEES) ?? '[]'); } catch { return []; }
}
export function garderIdee(a: Activite) {
  try { localStorage.setItem(CLE_IDEES, JSON.stringify([a, ...ideesGardees().filter((x) => x.id !== a.id)].slice(0, 30))); } catch { /* stockage plein */ }
}
export function oublierIdee(id: string) {
  try { localStorage.setItem(CLE_IDEES, JSON.stringify(ideesGardees().filter((x) => x.id !== id))); } catch { /* stockage indisponible */ }
}

// ---------- Fiches validées, mises en cache pour la lecture hors ligne ----------
const CLE_FICHES = 'yissolimon-fiches-ia';
export function fichesValideesCache(): FicheIA[] {
  try { return JSON.parse(localStorage.getItem(CLE_FICHES) ?? '[]'); } catch { return []; }
}
export async function chargerFichesIA(): Promise<FicheIA[]> {
  const { data, error } = await supabase.from('fiches_ia').select('*').neq('statut', 'refusee').order('created_at', { ascending: false });
  if (error || !data) return fichesValideesCache();
  try { localStorage.setItem(CLE_FICHES, JSON.stringify(data.filter((f) => f.statut === 'validee'))); } catch { /* stockage plein */ }
  return data as FicheIA[];
}
