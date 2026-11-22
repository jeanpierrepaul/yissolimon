import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { GRILLE, REPONSES, TOTAL_QUESTIONS, dimensionTitre, scores, suggestions, type Reponse } from '../data/grille';
import { fiche } from '../data/ressources';
import { db, enregistrer, maintenant, nouvelId, type Action, type Evaluation, type StatutAction } from '../lib/db';
import { useSession } from '../lib/session';
import { Barres, Chargement, STATUTS, Titre, dateFr, useEnLigne } from '../components/ui';
import { ListeActions, Notes, Progres, evalProgression, useGarderie } from './commun';
import { AvisGarderie } from './avis';
import { Icone, Mascotte, PastilleTheme, couleur } from '../components/illustrations';
import { MonArbre, Parcours } from '../components/arbre';
import { conseilsIA, type ActionIA } from '../lib/ia';

const ETAPES = [
  ['Observer', 'Autoévaluation avec l’équipe'],
  ['Prioriser', 'Choisir quelques actions'],
  ['Agir', 'Mettre en œuvre avec les fiches'],
  ['Accompagner', 'Échanger avec la personne ressource'],
  ['Réévaluer', 'Mesurer les progrès'],
];

export function AccueilResponsable() {
  const { profil } = useSession();
  const d = useGarderie(profil?.garderie_id);
  const nav = useNavigate();
  if (!d) return <Chargement />;

  const actionsCycle = d.derniere ? d.actions.filter((a) => a.evaluation_id === d.derniere!.id) : [];
  const ouvertes = d.actions.filter((a) => a.statut !== 'terminee');
  let etape = 0;
  if (d.brouillon) etape = 0;
  else if (d.derniere && !actionsCycle.length) etape = 1;
  else if (d.derniere && ouvertes.some((a) => a.besoin_appui)) etape = 3;
  else if (d.derniere && ouvertes.length) etape = 2;
  else if (d.derniere) etape = 4;

  const nouvelle = async () => {
    const id = nouvelId();
    await enregistrer(db.evaluations, {
      id, garderie_id: profil!.garderie_id!, cycle: (d.evals.at(-1)?.cycle ?? 0) + 1,
      date_eval: maintenant().slice(0, 10), statut: 'brouillon', reponses: {}, participants: null,
      supprime: false, auteur_id: profil!.id, updated_at: '',
    } satisfies Evaluation);
    nav(`/evaluation/${id}`);
  };

  const prenom = (profil?.nom ?? '').split(/[\s(]/)[0];
  const sc = d.derniere ? scores(d.derniere.reponses) : null;
  return (
    <>
      <section className="hero">
        <div className="hero-texte">
          <p className="sur">{d.garderie?.nom ?? 'Ma garderie'}{d.garderie?.commune && ` · ${d.garderie.commune}`}</p>
          <h1>Bonjour{prenom && `, ${prenom}`} !</h1>
          <p>{sc ? <>Score de votre garderie : <strong>{sc.global} %</strong>. Continuons à progresser ensemble.</> : 'Prête à faire le point avec votre équipe ?'}</p>
        </div>
        <Mascotte taille={150} pose="salut" className="hero-mascotte" />
      </section>
      {d.garderie?.valide === false && (
        <p className="bandeau-attente"><strong>Inscription en attente de validation.</strong> Vous pouvez déjà tout utiliser. La coordination de la commune validera votre garderie pour l’inclure dans le suivi communal.</p>
      )}
      <ol className="cycle">
        {ETAPES.map(([t, s], i) => (
          <li key={t} className={i === etape ? 'actif' : i < etape ? 'fait' : ''}>
            <span className="num">0{i + 1}</span><strong>{t}</strong><span>{s}</span>
          </li>
        ))}
      </ol>

      <section className="prochaine">
        <p className="sur">Prochaine étape</p>
        {d.brouillon ? (
          <>
            <h2>Terminer l’autoévaluation du cycle {d.brouillon.cycle}</h2>
            <p>{evalProgression(d.brouillon, TOTAL_QUESTIONS)} questions répondues. Vos réponses sont enregistrées sur le téléphone, même sans internet.</p>
            <Link className="bouton" to={`/evaluation/${d.brouillon.id}`}>Continuer</Link>
          </>
        ) : !d.derniere ? (
          <>
            <h2>Faire le point avec votre équipe</h2>
            <p>{TOTAL_QUESTIONS} questions courtes sur {GRILLE.length} thèmes. Comptez 25 à 35 minutes. Ce n’est ni une inspection ni une note : c’est un point de départ pour progresser.</p>
            <button className="bouton" onClick={() => void nouvelle()}>Commencer l’autoévaluation</button>
          </>
        ) : !actionsCycle.length ? (
          <>
            <h2>Choisir vos priorités</h2>
            <p>À partir de vos réponses, choisissez 3 à 5 actions réalistes pour les prochaines semaines.</p>
            <Link className="bouton" to={`/evaluation/${d.derniere.id}/resultats`}>Voir les résultats et choisir</Link>
          </>
        ) : ouvertes.length ? (
          <>
            <h2>{ouvertes.length} action{ouvertes.length > 1 ? 's' : ''} en cours</h2>
            <ListeActions actions={ouvertes.slice(0, 3)} />
            <Link className="bouton" to="/plan">Voir tout le plan</Link>
          </>
        ) : (
          <>
            <h2>Toutes les actions sont terminées</h2>
            <p>C’est le moment de refaire l’autoévaluation pour mesurer vos progrès et lancer un nouveau cycle.</p>
            <button className="bouton" onClick={() => void nouvelle()}>Commencer le cycle {(d.evals.at(-1)?.cycle ?? 0) + 1}</button>
          </>
        )}
      </section>

      <Link to="/activites" className="carte-idee">
        <span className="carte-idee-icone"><Icone nom="activites" taille={30} /></span>
        <span><strong>Que puis-je faire aujourd’hui avec les enfants ?</strong>
          <span>Une activité prête en 5, 10 ou 15 minutes, avec le matériel que vous avez.</span></span>
        <Icone nom="fleche" />
      </Link>

      <MonArbre d={d} compact />

      {d.derniere && !d.brouillon && ouvertes.length > 0 && (
        <p className="discret"><button className="lien" onClick={() => void nouvelle()}>Refaire une autoévaluation maintenant</button></p>
      )}

      <section>
        <h2>Vos thèmes <small>touchez un thème pour voir ses fiches</small></h2>
        <div className="tuiles">
          {GRILLE.map((g) => {
            const v = sc?.parDim[g.id];
            return (
              <Link key={g.id} to={`/bibliotheque?theme=${g.id}`} className="tuile" style={{ background: couleur(g.id).fond }}>
                <PastilleTheme dim={g.id} taille={42} />
                <span><strong>{g.court}</strong><small>{v != null ? `${v} %` : 'À évaluer'}</small></span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}

export function EvaluationPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const ev = useLiveQuery(() => db.evaluations.get(id!), [id]);
  const [i, setI] = useState(0);
  const [participants, setParticipants] = useState<string | null>(null);
  useEffect(() => { window.scrollTo(0, 0); }, [i]);
  if (ev === undefined) return <Chargement />;
  if (!ev) return <p className="vide">Évaluation introuvable.</p>;
  if (ev.statut === 'terminee') { nav(`/evaluation/${ev.id}/resultats`, { replace: true }); return null; }

  const dim = GRILLE[i];
  const repondre = (qid: string, v: Reponse) =>
    enregistrer(db.evaluations, { ...ev, reponses: { ...ev.reponses, [qid]: v } });
  const nbRep = Object.keys(ev.reponses).length;
  const terminer = async () => {
    await enregistrer(db.evaluations, { ...ev, statut: 'terminee', date_eval: maintenant().slice(0, 10) });
    nav(`/evaluation/${ev.id}/resultats`, { replace: true });
  };

  return (
    <>
      <div className="titre-theme"><PastilleTheme dim={dim.id} taille={52} />
        <Titre sur={`Autoévaluation · cycle ${ev.cycle} · thème ${i + 1} sur ${GRILLE.length}`}>{dim.titre}</Titre></div>
      <div className="progression"><span style={{ width: `${(nbRep / TOTAL_QUESTIONS) * 100}%` }} /></div>
      {i === 0 && (
        <label className="champ">Qui participe ? <small>(prénoms, facultatif)</small>
          <input value={participants ?? ev.participants ?? ''} onChange={(e) => setParticipants(e.target.value)}
            onBlur={() => participants !== null && void enregistrer(db.evaluations, { ...ev, participants })} />
        </label>
      )}
      {dim.questions.map((q, n) => (
        <fieldset className="question" key={q.id}>
          <legend><span className="num">{i * 4 + n + 1}</span>{q.texte}</legend>
          <p className="aide">{q.aide}</p>
          <div className="choix">
            {REPONSES.map((r) => (
              <button key={String(r.v)} type="button"
                className={q.id in ev.reponses && ev.reponses[q.id] === r.v ? 'choisi' : ''}
                aria-pressed={q.id in ev.reponses && ev.reponses[q.id] === r.v}
                onClick={() => void repondre(q.id, r.v)}>{r.label}</button>
            ))}
          </div>
        </fieldset>
      ))}
      <div className="pied-etapes">
        {i > 0 && <button className="bouton secondaire" onClick={() => setI(i - 1)}>← Précédent</button>}
        {i < GRILLE.length - 1
          ? <button className="bouton" onClick={() => setI(i + 1)}>Thème suivant →</button>
          : <button className="bouton" onClick={() => void terminer()} disabled={nbRep < TOTAL_QUESTIONS}
              title={nbRep < TOTAL_QUESTIONS ? 'Répondez à toutes les questions' : ''}>Terminer ({nbRep}/{TOTAL_QUESTIONS})</button>}
      </div>
      <p className="legende">Chaque réponse est enregistrée immédiatement. Vous pouvez quitter et reprendre plus tard.</p>
    </>
  );
}

export function ResultatsPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profil } = useSession();
  const data = useLiveQuery(async () => {
    const ev = await db.evaluations.get(id!);
    if (!ev) return null;
    const toutes = (await db.evaluations.where('garderie_id').equals(ev.garderie_id).toArray())
      .filter((e) => e.statut === 'terminee' && !e.supprime && e.cycle < ev.cycle).sort((a, b) => a.cycle - b.cycle);
    const actions = await db.actions.where('evaluation_id').equals(ev.id).toArray();
    return { ev, avant: toutes.at(-1) ?? null, actions };
  }, [id]);
  const [choix, setChoix] = useState<string[]>([]);
  if (data === undefined) return <Chargement />;
  if (!data) return <p className="vide">Évaluation introuvable.</p>;

  const { ev, avant, actions } = data;
  const s = scores(ev.reponses), sa = avant ? scores(avant.reponses) : null;
  const deja = new Set(actions.filter((a) => !a.supprime).map((a) => a.titre));
  const sugg = suggestions(ev.reponses).filter((q) => !deja.has(q.action.titre));
  const lecture = profil?.role !== 'responsable';
  const basculer = (qid: string) => setChoix((c) => c.includes(qid) ? c.filter((x) => x !== qid) : c.length >= 5 ? c : [...c, qid]);
  const ajouter = async () => {
    const echeance = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
    for (const q of sugg.filter((q) => choix.includes(q.id))) {
      await enregistrer(db.actions, {
        id: nouvelId(), garderie_id: ev.garderie_id, evaluation_id: ev.id, dimension: q.dimension,
        constat: q.texte, titre: q.action.titre, description: q.action.description, responsable: null,
        echeance, ressource_ids: [q.ressource], statut: 'a_faire', preuve: null, difficulte: null,
        besoin_appui: false, supprime: false, auteur_id: profil!.id, updated_at: '',
      } satisfies Action);
    }
    nav('/plan');
  };

  return (
    <>
      <Titre retour sur={`Cycle ${ev.cycle} · ${dateFr(ev.date_eval)}`}>Résultats de l’autoévaluation</Titre>
      <section className="chiffres">
        <div><strong>{s.global ?? '–'}{s.global != null && ' %'}</strong><span>Score global{sa?.global != null && s.global != null &&
          <em className={s.global >= sa.global ? 'hausse' : 'baisse'}> {s.global >= sa.global ? '+' : ''}{s.global - sa.global} depuis le cycle {avant!.cycle}</em>}</span></div>
      </section>
      <Barres scores={s.parDim} avant={sa?.parDim} />
      <p className="legende">Ces résultats servent à choisir quoi améliorer. Ils ne sont pas publiés et ne servent pas à classer les garderies.</p>

      {!lecture && (
        <section>
          <h2>Choisir les priorités <small>{choix.length}/5 sélectionnées</small></h2>
          {sugg.length === 0 ? <p className="vide">Aucune suggestion : toutes les réponses sont « Oui » ou déjà dans le plan.</p> : (
            <ul className="liste choix-actions">
              {sugg.map((q) => (
                <li key={q.id}>
                  <label className={choix.includes(q.id) ? 'coche' : ''}>
                    <input type="checkbox" checked={choix.includes(q.id)} onChange={() => basculer(q.id)}
                      disabled={!choix.includes(q.id) && choix.length >= 5} />
                    <span>
                      <span className={`statut ${ev.reponses[q.id] === 0 ? 'statut-a_faire' : 'statut-en_cours'}`}>{ev.reponses[q.id] === 0 ? 'Pas encore' : 'En partie'}</span>
                      <strong>{q.action.titre}</strong>
                      <span className="meta">{dimensionTitre(q.dimension)} · fiche « {fiche(q.ressource)?.titre} »</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          <div className="pied-etapes">
            <button className="bouton" disabled={!choix.length} onClick={() => void ajouter()}>Ajouter {choix.length || ''} action{choix.length > 1 ? 's' : ''} au plan</button>
          </div>
          {actions.length > 0 && <p className="legende">{actions.length} action(s) déjà dans le plan pour ce cycle.</p>}
        </section>
      )}
      {!lecture && <IdeesActions ev={ev} parDim={s.parDim} faibles={sugg.map((q) => q.texte)} deja={[...deja]} />}
    </>
  );
}

const COUTS = { gratuit: 'Gratuit', faible: 'Faible coût', moyen: 'Coût moyen' };

/** Idées d'actions préparées par l'assistant à partir des résultats (scores par thème seulement, aucune donnée sur les enfants). */
function IdeesActions({ ev, parDim, faibles, deja }: { ev: Evaluation; parDim: Record<string, number | null>; faibles: string[]; deja: string[] }) {
  const { profil } = useSession();
  const enLigne = useEnLigne();
  const [idees, setIdees] = useState<ActionIA[] | null>(null);
  const [ajoutees, setAjoutees] = useState<string[]>([]);
  const [attente, setAttente] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);
  const demander = async () => {
    setAttente(true); setErreur(null);
    try { setIdees((await conseilsIA({ scores: parDim, faibles, deja })).actions); }
    catch (e) { setErreur(e instanceof Error ? e.message : 'Assistant indisponible.'); }
    setAttente(false);
  };
  const ajouter = async (a: ActionIA) => {
    await enregistrer(db.actions, {
      id: nouvelId(), garderie_id: ev.garderie_id, evaluation_id: ev.id, dimension: a.dimension,
      constat: null, titre: a.titre, description: [a.description, a.premier_pas && `Premier pas : ${a.premier_pas}`].filter(Boolean).join(' '),
      responsable: null, echeance: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10), ressource_ids: [],
      statut: 'a_faire', preuve: null, difficulte: null, besoin_appui: false, supprime: false, auteur_id: profil!.id, updated_at: '',
    } satisfies Action);
    setAjoutees([...ajoutees, a.titre]);
  };
  return (
    <section className="idees-actions">
      <h2>Idées adaptées à votre garderie</h2>
      {!idees ? (
        <div className="bandeau-ia">
          <span className="bandeau-ia-icone"><Icone nom="eveil" taille={24} /></span>
          <p>À partir de vos résultats, Yissolimon propose 3 actions concrètes, réalisables avec les moyens du bord.</p>
          <button className="bouton petit" disabled={attente || !enLigne} onClick={() => void demander()}>{attente ? 'Préparation…' : 'Voir des idées'}</button>
          {!enLigne && <span className="legende">Disponible avec internet.</span>}
          {erreur && <span className="erreur">{erreur}</span>}
        </div>
      ) : (
        <>
          <ul className="liste">{idees.map((a) => (
            <li key={a.titre}><div className="ligne-action">
              <PastilleTheme dim={a.dimension} taille={40} />
              <span>
                <span className="statut statut-terminee">{COUTS[a.cout]}</span>
                <strong>{a.titre}</strong>
                <span className="meta">{dimensionTitre(a.dimension)}</span>
                <span>{a.description}</span>
                {a.premier_pas && <span className="meta">Dès aujourd’hui : {a.premier_pas}</span>}
                {ajoutees.includes(a.titre)
                  ? <span className="succes">Ajoutée au plan</span>
                  : <button className="bouton petit secondaire" onClick={() => void ajouter(a)}>Ajouter au plan</button>}
              </span>
            </div></li>
          ))}</ul>
          <p className="legende">Idées préparées automatiquement à partir de vos scores : gardez seulement celles qui ont du sens pour votre équipe.</p>
        </>
      )}
    </section>
  );
}

export function PlanPage() {
  const { profil } = useSession();
  const d = useGarderie(profil?.garderie_id);
  const nav = useNavigate();
  if (!d) return <Chargement />;
  const libre = async () => {
    const id = nouvelId();
    await enregistrer(db.actions, {
      id, garderie_id: profil!.garderie_id!, evaluation_id: d.derniere?.id ?? null, dimension: 'eveil',
      constat: null, titre: 'Nouvelle action', description: null, responsable: null, echeance: null,
      ressource_ids: [], statut: 'a_faire', preuve: null, difficulte: null, besoin_appui: false,
      supprime: false, auteur_id: profil!.id, updated_at: '',
    } satisfies Action);
    nav(`/action/${id}`);
  };
  return (
    <>
      <Titre sur={d.garderie?.nom}>Plan d’amélioration</Titre>
      {(['en_cours', 'a_faire', 'terminee'] as StatutAction[]).map((st) => {
        const l = d.actions.filter((a) => a.statut === st);
        return l.length ? <section key={st}><h2>{STATUTS[st]} <small>{l.length}</small></h2><ListeActions actions={l} /></section> : null;
      })}
      {!d.actions.length && <p className="vide">Aucune action. Terminez une autoévaluation pour recevoir des suggestions.</p>}
      <p><button className="bouton secondaire" onClick={() => void libre()}>+ Ajouter une action libre</button></p>
    </>
  );
}

export function ActionPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const { profil } = useSession();
  const a = useLiveQuery(() => db.actions.get(id!), [id]);
  const [f, setF] = useState<Action | null>(null);
  useEffect(() => { if (a && !f) setF(a); }, [a, f]);
  if (a === undefined) return <Chargement />;
  if (!a || !f) return <p className="vide">Action introuvable.</p>;
  const lecture = profil?.role !== 'responsable';
  const maj = (p: Partial<Action>) => setF({ ...f, ...p });
  const sauver = async () => { await enregistrer(db.actions, { ...a, ...f, updated_at: '' }); nav(-1); };
  const supprimer = async () => { await enregistrer(db.actions, { ...a, supprime: true }); nav('/plan', { replace: true }); };

  return (
    <>
      <Titre retour sur={dimensionTitre(f.dimension)}>{lecture ? f.titre : 'Action'}</Titre>
      {f.constat && <p className="constat"><span className="sur">Constat</span>{f.constat}</p>}
      <fieldset className="formulaire" disabled={lecture}>
        {!lecture && <label className="champ">Titre<input value={f.titre} onChange={(e) => maj({ titre: e.target.value })} /></label>}
        {!f.evaluation_id || !f.constat ? (
          <label className="champ">Thème
            <select value={f.dimension} onChange={(e) => maj({ dimension: e.target.value })}>
              {GRILLE.map((g) => <option key={g.id} value={g.id}>{g.titre}</option>)}
            </select>
          </label>
        ) : null}
        <label className="champ">Description<textarea rows={3} value={f.description ?? ''} onChange={(e) => maj({ description: e.target.value })} /></label>
        <div className="deux">
          <label className="champ">Qui s’en occupe ?<input value={f.responsable ?? ''} onChange={(e) => maj({ responsable: e.target.value })} /></label>
          <label className="champ">Échéance<input type="date" value={f.echeance ?? ''} onChange={(e) => maj({ echeance: e.target.value || null })} /></label>
        </div>
        <div className="champ">Avancement
          <div className="choix">
            {(Object.keys(STATUTS) as StatutAction[]).map((s) => (
              <button type="button" key={s} className={f.statut === s ? 'choisi' : ''} aria-pressed={f.statut === s} onClick={() => maj({ statut: s })}>{STATUTS[s]}</button>
            ))}
          </div>
        </div>
        {f.statut === 'terminee' && (
          <label className="champ">Preuve de réalisation <small>(ce qu’on peut constater)</small>
            <textarea rows={2} value={f.preuve ?? ''} onChange={(e) => maj({ preuve: e.target.value })} /></label>
        )}
        <label className="champ">Difficultés rencontrées<textarea rows={2} value={f.difficulte ?? ''} onChange={(e) => maj({ difficulte: e.target.value })} /></label>
        <label className="case"><input type="checkbox" checked={f.besoin_appui} onChange={(e) => maj({ besoin_appui: e.target.checked })} />
          J’ai besoin de l’appui de la personne ressource</label>
      </fieldset>
      {f.ressource_ids.length > 0 && (
        <section><h2>Fiches utiles</h2>
          <ul className="liste">{f.ressource_ids.map((r) => fiche(r) && <li key={r}><Link to={`/fiche/${r}`}><strong>{fiche(r)!.titre}</strong><span className="meta">{fiche(r)!.resume}</span></Link></li>)}</ul>
        </section>
      )}
      {!lecture && (
        <div className="pied-etapes">
          <button className="lien danger" onClick={() => void supprimer()}>Retirer du plan</button>
          <button className="bouton" onClick={() => void sauver()} disabled={!f.titre.trim()}>Enregistrer</button>
        </div>
      )}
    </>
  );
}

export function SuiviResponsable() {
  const { profil } = useSession();
  const d = useGarderie(profil?.garderie_id);
  if (!d) return <Chargement />;
  const terminees = d.evals.filter((e) => e.statut === 'terminee');
  return (
    <>
      <Titre sur={d.garderie?.nom}>Suivi des progrès</Titre>
      <MonArbre d={d} />
      <Parcours d={d} />
      <Progres d={d} />
      {terminees.length > 0 && (
        <section><h2>Historique des autoévaluations</h2>
          <ul className="liste">{terminees.slice().reverse().map((e) => (
            <li key={e.id}><Link to={`/evaluation/${e.id}/resultats`}><strong>Cycle {e.cycle} · {scores(e.reponses).global ?? '–'}{scores(e.reponses).global != null && ' %'}</strong>
              <span className="meta">{dateFr(e.date_eval)}{e.participants && ` · ${e.participants}`}</span></Link></li>
          ))}</ul>
        </section>
      )}
      <AvisGarderie garderieId={profil!.garderie_id!} />
      <Notes garderieId={profil!.garderie_id!} notes={d.notes} />
    </>
  );
}
