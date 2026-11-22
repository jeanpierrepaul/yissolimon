import { useLiveQuery } from 'dexie-react-hooks';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { dimensionTitre, scores } from '../data/grille';
import { db, enregistrer, nouvelId, type Action, type Evaluation } from '../lib/db';
import { useSession } from '../lib/session';
import { Barres, dateFr, STATUTS } from '../components/ui';
import { PastilleTheme } from '../components/illustrations';

/** Données d'une garderie, lues sur le téléphone (fonctionne hors ligne). */
export function useGarderie(garderieId: string | null | undefined) {
  return useLiveQuery(async () => {
    if (!garderieId) return null;
    const garderie = await db.garderies.get(garderieId);
    const evals = (await db.evaluations.where('garderie_id').equals(garderieId).toArray())
      .filter((e) => !e.supprime).sort((a, b) => a.cycle - b.cycle || a.date_eval.localeCompare(b.date_eval));
    const actions = (await db.actions.where('garderie_id').equals(garderieId).toArray())
      .filter((a) => !a.supprime).sort((a, b) => (a.echeance ?? '9').localeCompare(b.echeance ?? '9'));
    const notes = (await db.notes.where('garderie_id').equals(garderieId).toArray())
      .filter((n) => !n.supprime).sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    const terminees = evals.filter((e) => e.statut === 'terminee');
    return {
      garderie, evals, actions, notes,
      derniere: terminees.at(-1) ?? null,
      precedente: terminees.at(-2) ?? null,
      brouillon: evals.find((e) => e.statut === 'brouillon') ?? null,
    };
  }, [garderieId]);
}

export type DonneesGarderie = NonNullable<ReturnType<typeof useGarderie>>;

export function Progres({ d }: { d: DonneesGarderie }) {
  const s = d.derniere ? scores(d.derniere.reponses) : null;
  const avant = d.precedente ? scores(d.precedente.reponses) : null;
  const total = d.actions.length, fini = d.actions.filter((a) => a.statut === 'terminee').length;
  const enCours = d.actions.filter((a) => a.statut === 'en_cours').length;
  return (
    <>
      <section className="chiffres">
        <div><strong>{s?.global ?? '–'}{s?.global != null && ' %'}</strong><span>Score global{avant?.global != null && s?.global != null &&
          <em className={s.global >= avant.global ? 'hausse' : 'baisse'}> {s.global >= avant.global ? '+' : ''}{s.global - avant.global} depuis le cycle {d.precedente!.cycle}</em>}</span></div>
        <div><strong>{fini}/{total}</strong><span>Actions terminées</span></div>
        <div><strong>{enCours}</strong><span>En cours</span></div>
        <div><strong>{d.evals.filter((e) => e.statut === 'terminee').length}</strong><span>Évaluations</span></div>
      </section>
      {s ? (
        <section>
          <h2>Par dimension <small>cycle {d.derniere!.cycle} · {dateFr(d.derniere!.date_eval)}</small></h2>
          <Barres scores={s.parDim} avant={avant?.parDim} />
          {avant && <p className="legende">Le trait fin indique le résultat du cycle {d.precedente!.cycle}.</p>}
        </section>
      ) : <p className="vide">Aucune autoévaluation terminée pour l’instant.</p>}
    </>
  );
}

export function ListeActions({ actions, lien = true }: { actions: Action[]; lien?: boolean }) {
  if (!actions.length) return <p className="vide">Aucune action.</p>;
  return (
    <ul className="liste">
      {actions.map((a) => {
        const contenu = (
          <span className="ligne-action">
            <PastilleTheme dim={a.dimension} taille={40} />
            <span>
              <span className={`statut statut-${a.statut}`}>{STATUTS[a.statut]}</span>
              <strong>{a.titre}</strong>
              <span className="meta">{dimensionTitre(a.dimension)}{a.responsable && ` · ${a.responsable}`}{a.echeance && ` · avant le ${dateFr(a.echeance)}`}</span>
              {a.besoin_appui && a.statut !== 'terminee' && <span className="appui">Besoin d’appui{a.difficulte && ` : ${a.difficulte}`}</span>}
            </span>
          </span>
        );
        return <li key={a.id}>{lien ? <Link to={`/action/${a.id}`}>{contenu}</Link> : <div>{contenu}</div>}</li>;
      })}
    </ul>
  );
}

export function Notes({ garderieId, notes }: { garderieId: string; notes: DonneesGarderie['notes'] }) {
  const { profil } = useSession();
  const [texte, setTexte] = useState('');
  const ajouter = async () => {
    if (!texte.trim() || !profil) return;
    await enregistrer(db.notes, {
      id: nouvelId(), garderie_id: garderieId, auteur_id: profil.id, auteur_nom: profil.nom,
      texte: texte.trim().slice(0, 2000), supprime: false, updated_at: '',
    });
    setTexte('');
  };
  return (
    <section>
      <h2>Échanges de suivi</h2>
      <p className="legende">Entre la responsable et la personne ressource. N’écrivez pas d’informations sensibles sur un enfant.</p>
      <div className="saisie-note">
        <textarea value={texte} onChange={(e) => setTexte(e.target.value)} rows={3} maxLength={2000}
          placeholder="Une visite, un besoin, un conseil…" />
        <button className="bouton" onClick={() => void ajouter()} disabled={!texte.trim()}>Ajouter</button>
      </div>
      <ul className="notes">
        {notes.map((n) => (
          <li key={n.id}>
            <p>{n.texte}</p>
            <span className="meta">{n.auteur_nom} · {new Date(n.updated_at).toLocaleDateString('fr-FR')}{n._sale === 1 && ' · en attente d’envoi'}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export const evalProgression = (e: Evaluation, total: number) => `${Object.keys(e.reponses).length}/${total}`;
