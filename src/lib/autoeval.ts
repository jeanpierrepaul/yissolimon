import { db, enregistrer, maintenant, nouvelId, type Evaluation } from './db';
import type { DonneesGarderie } from '../pages/commun';

/**
 * Autoévaluation obligatoire : une par mois, à terminer au plus tard le dernier jour du mois.
 *  - « fait »      : une autoévaluation terminée ce mois-ci ;
 *  - « a_faire »   : rien ce mois-ci, mais le mois dernier était fait ;
 *  - « en_retard » : jamais faite, ou ni ce mois-ci ni le mois dernier.
 */
export type EtatAutoeval = { etat: 'fait' | 'a_faire' | 'en_retard'; limite: Date; joursRestants: number; brouillonId: string | null };

const moisDe = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const finDeMois = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0);
/** À partir de ce jour du mois, le rappel s'affiche en grand (fenêtre). */
export const JOUR_RAPPEL = 20;

export function etatAutoeval(d: DonneesGarderie, aujourdhui = new Date()): EtatAutoeval {
  const ce = moisDe(aujourdhui);
  const avant = moisDe(new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() - 1, 1));
  const terminees = d.evals.filter((e) => e.statut === 'terminee').map((e) => e.date_eval.slice(0, 7));
  const brouillonId = d.brouillon?.id ?? null;
  const jour = new Date(aujourdhui.getFullYear(), aujourdhui.getMonth(), aujourdhui.getDate());
  if (terminees.includes(ce)) {
    const limite = finDeMois(new Date(aujourdhui.getFullYear(), aujourdhui.getMonth() + 1, 1));
    return { etat: 'fait', limite, joursRestants: Math.round((+limite - +jour) / 864e5), brouillonId };
  }
  const limite = finDeMois(aujourdhui);
  return {
    etat: terminees.includes(avant) ? 'a_faire' : 'en_retard',
    limite, joursRestants: Math.round((+limite - +jour) / 864e5), brouillonId,
  };
}

/** Crée le brouillon du cycle suivant et renvoie son identifiant. */
export async function nouvelleAutoeval(d: DonneesGarderie, garderieId: string, auteurId: string) {
  const id = nouvelId();
  await enregistrer(db.evaluations, {
    id, garderie_id: garderieId, cycle: (d.evals.at(-1)?.cycle ?? 0) + 1,
    date_eval: maintenant().slice(0, 10), statut: 'brouillon', reponses: {}, participants: null,
    supprime: false, auteur_id: auteurId, updated_at: '',
  } satisfies Evaluation);
  return id;
}

export const dateCourte = (d: Date) => d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
