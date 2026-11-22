import { db, getMeta, setMeta, type Action, type Evaluation, type Note, type Orientation } from './db';
import { supabase } from './supabase';

// Synchronisation différée :
// 1. on envoie ce qui a été modifié sur le téléphone (_sale = 1) ;
// 2. on récupère ce qui a changé sur le serveur depuis la dernière fois (curseur serveur_at).
// En cas de conflit, la modification la plus récente gagne (règle appliquée aussi côté serveur).

type Ligne = Evaluation | Action | Note | Orientation;

/** L'annuaire est petit : on le recopie entièrement sur le téléphone pour le consulter hors ligne. */
export async function rafraichirServices() {
  const { data, error } = await supabase.from('services').select('*').eq('actif', true);
  if (error) throw new Error(`Annuaire : ${error.message}`);
  await db.transaction('rw', db.services, async () => { await db.services.clear(); await db.services.bulkPut(data ?? []); });
}
const TABLES = [
  { local: db.evaluations, distant: 'evaluations' },
  { local: db.actions, distant: 'actions' },
  { local: db.notes, distant: 'notes_suivi' },
  { local: db.orientations, distant: 'orientations' },
] as const;

export type EtatSync = { enCours: boolean; derniere: string | null; erreur: string | null };
let etat: EtatSync = { enCours: false, derniere: null, erreur: null };
const abonnes = new Set<(e: EtatSync) => void>();
const publier = (e: Partial<EtatSync>) => { etat = { ...etat, ...e }; abonnes.forEach((f) => f(etat)); };
export const ecouterSync = (f: (e: EtatSync) => void) => { abonnes.add(f); f(etat); return () => { abonnes.delete(f); }; };

const sansLocal = (l: Ligne) => { const { _sale, ...reste } = l; void _sale; return reste; };

async function envoyer() {
  for (const t of TABLES) {
    const sales = (await (t.local as typeof db.actions).where('_sale').equals(1).toArray()) as Ligne[];
    if (!sales.length) continue;
    const { error } = await supabase.from(t.distant).upsert(sales.map(sansLocal), { onConflict: 'id' });
    if (error) throw new Error(`Envoi ${t.distant} : ${error.message}`);
    // On ne nettoie que les lignes qui n'ont pas été remodifiées pendant l'envoi.
    await db.transaction('rw', t.local, async () => {
      for (const s of sales) {
        const actuel = (await t.local.get(s.id)) as Ligne | undefined;
        if (actuel && actuel.updated_at === s.updated_at) await t.local.update(s.id, { _sale: 0 });
      }
    });
  }
}

async function recevoir() {
  const { data: g, error: eg } = await supabase.from('garderies').select('id, nom, commune, quartier, nb_enfants, valide');
  if (eg) throw new Error(`Garderies : ${eg.message}`);
  await db.garderies.bulkPut(g ?? []);
  await rafraichirServices();

  for (const t of TABLES) {
    const cle = `curseur:${t.distant}`;
    let curseur = (await getMeta<string>(cle)) ?? '1970-01-01T00:00:00Z';
    for (;;) {
      const { data, error } = await supabase.from(t.distant).select('*')
        .gt('serveur_at', curseur).order('serveur_at').limit(500);
      if (error) throw new Error(`Réception ${t.distant} : ${error.message}`);
      if (!data?.length) break;
      await db.transaction('rw', t.local, async () => {
        for (const r of data as (Ligne & { serveur_at: string })[]) {
          const local = (await t.local.get(r.id)) as Ligne | undefined;
          // Une modification locale plus récente, pas encore envoyée, est conservée.
          if (local?._sale === 1 && Date.parse(local.updated_at) > Date.parse(r.updated_at)) continue;
          const { serveur_at, ...ligne } = r; void serveur_at;
          await (t.local as typeof db.actions).put({ ...(ligne as Action), _sale: 0 });
        }
      });
      curseur = data[data.length - 1].serveur_at as string;
      await setMeta(cle, curseur);
      if (data.length < 500) break;
    }
  }
}

let enAttente: Promise<void> | null = null;
export function synchroniser(): Promise<void> {
  if (enAttente) return enAttente;
  if (!navigator.onLine) { publier({ erreur: 'Hors ligne' }); return Promise.resolve(); }
  publier({ enCours: true });
  enAttente = (async () => {
    try {
      await envoyer();
      await recevoir();
      const derniere = new Date().toISOString();
      await setMeta('derniereSync', derniere);
      publier({ enCours: false, derniere, erreur: null });
      window.dispatchEvent(new Event('donnees-modifiees'));
    } catch (e) {
      publier({ enCours: false, erreur: e instanceof Error ? e.message : String(e) });
    } finally {
      enAttente = null;
    }
  })();
  return enAttente;
}

let minuteur: number | undefined;
export function demarrerSyncAuto() {
  getMeta<string>('derniereSync').then((d) => d && publier({ derniere: d }));
  const lancer = () => { void synchroniser(); };
  window.addEventListener('online', lancer);
  // Après chaque saisie, on attend 2 secondes puis on tente l'envoi.
  let tempo: number | undefined;
  const apresSaisie = () => { clearTimeout(tempo); tempo = window.setTimeout(lancer, 2000); };
  window.addEventListener('donnees-modifiees-locales', apresSaisie);
  minuteur = window.setInterval(lancer, 60_000);
  lancer();
  return () => {
    window.removeEventListener('online', lancer);
    window.removeEventListener('donnees-modifiees-locales', apresSaisie);
    clearInterval(minuteur);
  };
}
