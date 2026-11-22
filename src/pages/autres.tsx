import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Mascotte, PastilleTheme, couleur } from '../components/illustrations';
import { GRILLE, dimensionTitre, scores } from '../data/grille';
import { FICHES, fiche } from '../data/ressources';
import { db } from '../lib/db';
import { useSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { Barres, Chargement, Titre, dateFr, useEnLigne } from '../components/ui';
import { ListeActions, Notes, Progres, useGarderie } from './commun';
import { OrientationsGarderie, StatsOrientations } from './services';
import { AvisGarderie } from './avis';
import { AtelierFiches, useFichesIA } from './fichesia';
import { fichesValideesCache } from '../lib/ia';

const COMPTES_TEST = [
  { email: 'colibris@synergie.demo', role: 'Responsable · Les Colibris', detail: '2 cycles terminés, progrès visibles, avis des parents', dim: 'familles' },
  { email: 'mawuli@synergie.demo', role: 'Responsable · Mawuli', detail: '1er cycle en cours', dim: 'hygiene' },
  { email: 'akpe@synergie.demo', role: 'Responsable · Akpé', detail: 'Nouvelle garderie, tout est à faire', dim: 'eveil' },
  { email: 'accompagnatrice@synergie.demo', role: 'Accompagnatrice', detail: 'Personne ressource qui suit les 3 garderies', dim: 'inclusion' },
  { email: 'coordination@synergie.demo', role: 'Coordination communale', detail: 'Chiffres de la commune, validation des inscriptions', dim: 'protection' },
];

export function Connexion() {
  const { connecter } = useSession();
  const [email, setEmail] = useState('');
  const [mdp, setMdp] = useState('');
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [inscription, setInscription] = useState(false);
  const soumettre = async (e: FormEvent) => {
    e.preventDefault(); setEnvoi(true);
    setErreur(await connecter(email, mdp)); setEnvoi(false);
  };
  return (
    <div className="connexion">
      <div className="connexion-tete">
        <Mascotte taille={150} pose="salut" />
        <p className="sur">Hack4Children 2026 · Équipe Synergie</p>
        <h1>Yissolimon</h1>
        <p>Faire le point, choisir quelques actions, progresser ensemble pour les tout-petits de nos garderies communautaires.</p>
      </div>
      {inscription ? <Inscription retour={() => setInscription(false)} /> : <>
        <form onSubmit={(e) => void soumettre(e)} className="formulaire">
          <label className="champ">Adresse e-mail<input id="cx-email" type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
          <label className="champ">Mot de passe<input id="cx-mdp" type="password" autoComplete="current-password" value={mdp} onChange={(e) => setMdp(e.target.value)} required /></label>
          {erreur && <p className="erreur" role="alert">{erreur}</p>}
          <button className="bouton" disabled={envoi}>{envoi ? 'Connexion…' : 'Se connecter'}</button>
        </form>
        <div className="appel-inscription">
          <p><strong>Votre garderie n’a pas encore de compte ?</strong> L’inscription est gratuite et prend deux minutes.</p>
          <button className="bouton secondaire" onClick={() => setInscription(true)}>Inscrire ma garderie</button>
          <p className="parent-acces"><strong>Vous êtes parent ?</strong> Pas besoin de compte. <Link className="lien" to="/parents">Accéder à l’espace parents</Link></p>
        </div>
      </>}
      <section className="demo">
        <h2>Comptes de test</h2>
        <p className="legende">Touchez un compte pour entrer directement. Mot de passe de tous les comptes : <code>Demo2026!</code></p>
        <ul className="comptes-test">
          {COMPTES_TEST.map((c) => (
            <li key={c.email}>
              <button type="button" className="compte-test" disabled={envoi} onClick={() => { setEnvoi(true); void connecter(c.email, 'Demo2026!').then((e) => { setErreur(e); setEnvoi(false); }); }}>
                <PastilleTheme dim={c.dim} taille={42} />
                <span><strong>{c.role}</strong><span className="meta">{c.detail}</span><code>{c.email}</code></span>
              </button>
            </li>
          ))}
          <li>
            <Link className="compte-test" to="/avis/colibris-parents-demo">
              <PastilleTheme dim="bienetre" taille={42} />
              <span><strong>Parent (sans compte)</strong><span className="meta">Lien parents de la garderie Les Colibris : services pour l’enfant et avis anonyme, rattachés à cette garderie</span><code>/avis/colibris-parents-demo</code></span>
            </Link>
          </li>
        </ul>
      </section>
    </div>
  );
}

/** Inscription d'une garderie par sa responsable. La coordination valide ensuite. */
function Inscription({ retour }: { retour: () => void }) {
  const { inscrire } = useSession();
  const [d, setD] = useState({ garderie: '', commune: '', quartier: '', nbEnfants: '', responsable: '', email: '', mdp: '', mdp2: '' });
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const [confirmer, setConfirmer] = useState(false);
  const champ = (k: keyof typeof d) => ({ id: `ins-${k}`, value: d[k], onChange: (e: { target: { value: string } }) => setD({ ...d, [k]: e.target.value }) });

  const soumettre = async (e: FormEvent) => {
    e.preventDefault(); setErreur(null);
    if (d.mdp.length < 8) return setErreur('Le mot de passe doit faire au moins 8 caractères.');
    if (d.mdp !== d.mdp2) return setErreur('Les deux mots de passe ne sont pas identiques.');
    setEnvoi(true);
    const r = await inscrire(d);
    setEnvoi(false);
    if (r === 'confirmer') setConfirmer(true); else setErreur(r);
  };

  if (confirmer) return (
    <div className="encadre">
      <h2>Vérifiez votre boîte e-mail</h2>
      <p>Nous avons envoyé un lien de confirmation à <strong>{d.email}</strong>. Cliquez dessus, puis revenez vous connecter.</p>
      <button className="bouton secondaire" onClick={retour}>Retour à la connexion</button>
    </div>
  );
  return (
    <form onSubmit={(e) => void soumettre(e)} className="formulaire">
      <div><h2 style={{ margin: 0 }}>Inscrire ma garderie</h2>
        <p className="legende">Vous pourrez commencer tout de suite. La coordination de la commune valide ensuite l’inscription pour inclure votre garderie dans le suivi communal.</p></div>
      <label className="champ">Nom de la garderie<input {...champ('garderie')} required minLength={2} maxLength={120} placeholder="Ex. : Garderie Les Colibris" /></label>
      <div className="deux">
        <label className="champ">Commune<input {...champ('commune')} required minLength={2} maxLength={80} /></label>
        <label className="champ">Quartier <small>(facultatif)</small><input {...champ('quartier')} maxLength={80} /></label>
      </div>
      <div className="deux">
        <label className="champ">Nombre d’enfants <small>(environ)</small><input {...champ('nbEnfants')} type="number" min={0} max={500} inputMode="numeric" /></label>
        <label className="champ">Votre prénom<input {...champ('responsable')} required maxLength={80} autoComplete="given-name" /></label>
      </div>
      <label className="champ">Adresse e-mail<input {...champ('email')} type="email" required autoComplete="email" /></label>
      <div className="deux">
        <label className="champ">Mot de passe <small>(8 caractères minimum)</small><input {...champ('mdp')} type="password" required minLength={8} autoComplete="new-password" /></label>
        <label className="champ">Confirmer le mot de passe<input {...champ('mdp2')} type="password" required minLength={8} autoComplete="new-password" /></label>
      </div>
      <p className="legende">Aucune information sur les enfants n’est demandée, ni maintenant ni plus tard.</p>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <button className="bouton" disabled={envoi}>{envoi ? 'Inscription…' : 'Créer le compte de ma garderie'}</button>
      <button type="button" className="lien" onClick={retour}>J’ai déjà un compte : me connecter</button>
    </form>
  );
}

export function Bibliotheque() {
  const [params] = useSearchParams();
  const [dim, setDim] = useState<string>(params.get('theme') ?? '');
  const { profil } = useSession();
  const { fiches: fichesIA, recharger } = useFichesIA();
  const nouvelles = fichesIA.filter((f) => f.statut === 'validee' || f.statut === undefined)
    .map((f) => ({ ...f, id: `ia-${f.id}`, nouveau: true }));
  const toutes = [...nouvelles, ...FICHES.map((f) => ({ ...f, nouveau: false }))];
  const liste = toutes.filter((f) => !dim || f.dimension === dim);
  const equipe = profil?.role === 'accompagnateur' || profil?.role === 'coordination';
  return (
    <>
      <Titre sur={`${toutes.length} fiches · disponibles sans internet`}>Bibliothèque</Titre>
      <div className="filtres">
        <button className={!dim ? 'choisi' : ''} onClick={() => setDim('')}>Toutes</button>
        {GRILLE.map((g) => <button key={g.id} className={dim === g.id ? 'choisi' : ''} onClick={() => setDim(g.id)}>{g.court}</button>)}
      </div>
      <ul className="grille-fiches">
        {liste.map((f) => (
          <li key={f.id}><Link to={`/fiche/${f.id}`} className="carte-fiche">
            <PastilleTheme dim={f.dimension} taille={46} />
            <span>
              <span className="meta" style={{ color: couleur(f.dimension).c }}>{dimensionTitre(f.dimension)} · {f.minutes} min{f.nouveau && <span className="nouveau">Nouveau</span>}</span>
              <strong>{f.titre}</strong><span className="meta">{f.resume}</span>
            </span>
          </Link></li>
        ))}
      </ul>
      <p className="legende">Contenus de démonstration, à valider avec des spécialistes de la petite enfance. Version audio en langues locales prévue après validation.</p>
      {equipe && <AtelierFiches fiches={fichesIA} recharger={recharger} />}
    </>
  );
}

export function FichePage() {
  const { id } = useParams();
  const ia = id?.startsWith('ia-') ? fichesValideesCache().find((x) => `ia-${x.id}` === id) : undefined;
  const f = ia ? { ...ia, id: id! } : fiche(id!);
  const [lecture, setLecture] = useState(false);
  useEffect(() => () => speechSynthesis?.cancel(), []);
  if (!f) return <p className="vide">Fiche introuvable.</p>;
  const ecouter = () => {
    if (!('speechSynthesis' in window)) return;
    if (lecture) { speechSynthesis.cancel(); setLecture(false); return; }
    const u = new SpeechSynthesisUtterance(`${f.titre}. ${f.pourquoi} Comment faire. ${f.etapes.join(' ')} À éviter. ${f.eviter.join(' ')}`);
    u.lang = 'fr-FR'; u.rate = 0.95; u.onend = () => setLecture(false);
    speechSynthesis.speak(u); setLecture(true);
  };
  return (
    <article className="fiche">
      <div className="titre-theme"><PastilleTheme dim={f.dimension} taille={52} />
        <Titre retour sur={`${dimensionTitre(f.dimension)} · ${f.minutes} min de lecture`}>{f.titre}</Titre></div>
      <p className="chapo">{f.resume}</p>
      {'speechSynthesis' in window && <button className="bouton secondaire" onClick={ecouter}>{lecture ? '■ Arrêter' : '▶ Écouter la fiche'}</button>}
      <h2>Pourquoi</h2><p>{f.pourquoi}</p>
      <h2>Comment faire</h2><ol className="etapes">{f.etapes.map((e) => <li key={e}>{e}</li>)}</ol>
      <h2>À éviter</h2><ul className="eviter">{f.eviter.map((e) => <li key={e}>{e}</li>)}</ul>
      <p className="signe"><span className="sur">Signe que ça marche</span>{f.signe}</p>
      {f.dimension === 'services' && <p><Link className="bouton" to="/services">Ouvrir l’annuaire des services</Link></p>}
    </article>
  );
}

export function AccueilAccompagnateur() {
  const donnees = useLiveQuery(async () => {
    const gs = (await db.garderies.toArray()).sort((a, b) => a.nom.localeCompare(b.nom));
    return Promise.all(gs.map(async (g) => {
      const evals = (await db.evaluations.where('garderie_id').equals(g.id).toArray()).filter((e) => !e.supprime && e.statut === 'terminee').sort((a, b) => a.cycle - b.cycle);
      const actions = (await db.actions.where('garderie_id').equals(g.id).toArray()).filter((a) => !a.supprime);
      return {
        g, derniere: evals.at(-1), nbEval: evals.length,
        ouvertes: actions.filter((a) => a.statut !== 'terminee').length,
        finies: actions.filter((a) => a.statut === 'terminee').length,
        appuis: actions.filter((a) => a.besoin_appui && a.statut !== 'terminee'),
      };
    }));
  });
  if (!donnees) return <Chargement />;
  const appuis = donnees.flatMap((d) => d.appuis);
  return (
    <>
      <Titre sur="Personne ressource">Garderies accompagnées</Titre>
      {appuis.length > 0 && (
        <section className="alerte"><h2>Demandes d’appui <small>{appuis.length}</small></h2><ListeActions actions={appuis} /></section>
      )}
      <ul className="liste">
        {donnees.map(({ g, derniere, nbEval, ouvertes, finies, appuis }) => (
          <li key={g.id}><Link to={`/garderie/${g.id}`} className="ligne-garderie">
            <span className="initiale">{g.nom.replace(/^Garderie\s+/i, '').charAt(0)}</span>
            <span>
              <strong>{g.nom}</strong>
              <span className="meta">{[g.quartier, g.nb_enfants ? `${g.nb_enfants} enfants` : null, nbEval ? `${nbEval} cycle${nbEval > 1 ? 's' : ''}` : null, g.valide === false ? 'en attente de validation' : null].filter(Boolean).join(' · ')}</span>
              {derniere ? (
                <span className="mini-score"><span className="barre-piste"><span className="barre-val" style={{ width: `${scores(derniere.reponses).global ?? 0}%` }} /></span>
                  <b>{scores(derniere.reponses).global ?? '–'}{scores(derniere.reponses).global != null && ' %'}</b></span>
              ) : <span className="meta">Pas encore d’autoévaluation</span>}
              <span className="meta">{finies} action(s) terminée(s) · {ouvertes} ouverte(s)</span>
              {appuis.length > 0 && <span className="appui">{appuis.length} demande(s) d’appui</span>}
            </span>
          </Link></li>
        ))}
      </ul>
      {!donnees.length && <p className="vide">Aucune garderie pour l’instant. Vérifiez la connexion pour synchroniser.</p>}
    </>
  );
}

export function GarderieAccompagnee() {
  const { id } = useParams();
  const d = useGarderie(id);
  if (!d) return <Chargement />;
  return (
    <>
      <Titre retour sur={d.garderie?.quartier ?? ''}>{d.garderie?.nom}</Titre>
      <Progres d={d} />
      <section><h2>Plan d’amélioration</h2><ListeActions actions={d.actions} /></section>
      <OrientationsGarderie garderieId={id!} />
      <AvisGarderie garderieId={id!} />
      <Notes garderieId={id!} notes={d.notes} />
    </>
  );
}

interface Stat {
  garderie_id: string; nom: string; commune: string; nb_evaluations: number; derniere_eval: string | null;
  score_global: number | null; scores: Record<string, number>; actions_total: number;
  actions_terminees: number; actions_en_cours: number; besoins_appui: number;
}

export function Coordination() {
  const enLigne = useEnLigne();
  const [stats, setStats] = useState<Stat[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    if (!enLigne) return;
    supabase.rpc('stats_coordination').then(({ data, error }) => {
      if (error) setErreur(error.message); else { setStats(data as Stat[]); void db.meta.put({ cle: 'stats', valeur: data }); }
    });
  }, [enLigne]);
  useEffect(() => { if (!stats) void db.meta.get('stats').then((m) => m && setStats(m.valeur as Stat[])); }, [stats]);
  if (erreur) return <p className="erreur">{erreur}</p>;
  if (!stats) return enLigne ? <Chargement /> : <p className="vide">Hors ligne : connectez-vous une première fois pour voir les chiffres.</p>;

  const evaluees = stats.filter((s) => s.score_global !== null);
  const moyenne = (dim: string) => {
    const v = evaluees.map((s) => s.scores[dim]).filter((x) => typeof x === 'number');
    return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
  };
  const parDim = Object.fromEntries(GRILLE.map((g) => [g.id, moyenne(g.id)]));
  const tot = stats.reduce((a, s) => ({ t: a.t + s.actions_total, f: a.f + s.actions_terminees, b: a.b + s.besoins_appui }), { t: 0, f: 0, b: 0 });
  return (
    <>
      <Titre sur={stats[0]?.commune}>Vue communale</Titre>
      <BoutonExport />
      <EnAttente onValide={() => void supabase.rpc('stats_coordination').then(({ data }) => data && setStats(data as Stat[]))} />
      <section className="chiffres">
        <div><strong>{evaluees.length}/{stats.length}</strong><span>Garderies évaluées</span></div>
        <div><strong>{tot.f}/{tot.t}</strong><span>Actions terminées</span></div>
        <div><strong>{tot.b}</strong><span>Besoins d’appui ouverts</span></div>
      </section>
      <section><h2>Moyenne par dimension</h2><Barres scores={parDim} />
        <p className="legende">Besoins communs : les dimensions les plus basses indiquent où concentrer formations et ressources.</p></section>
      <section><h2>Par garderie</h2>
        <table className="tableau">
          <thead><tr><th>Garderie</th><th>Cycles</th><th>Score</th><th>Actions</th><th>Appui</th></tr></thead>
          <tbody>{stats.map((s) => (
            <tr key={s.garderie_id}><td>{s.nom}</td><td>{s.nb_evaluations}</td><td>{s.score_global ?? '–'}{s.score_global !== null && ' %'}</td>
              <td>{s.actions_terminees}/{s.actions_total}</td><td>{s.besoins_appui || ''}</td></tr>
          ))}</tbody>
        </table>
        <p className="legende">Chiffres agrégés uniquement : les réponses détaillées et les échanges restent dans chaque garderie. Pas de classement public.</p>
      </section>
      <StatsOrientations />
    </>
  );
}

function BoutonExport() {
  const [etat, setEtat] = useState<string | null>(null);
  const exporter = async () => {
    setEtat('Préparation du fichier…');
    const { exporterDonnees } = await import('../lib/export');
    const err = await exporterDonnees();
    setEtat(err ?? 'Fichier téléchargé.');
  };
  return (
    <section className="export">
      <div><strong>Données pour l’analyse</strong>
        <span className="meta">Fichier Excel anonymisé : codes à la place des noms, dates au mois, aucun texte libre.</span></div>
      <button className="bouton petit" onClick={() => void exporter()}>Télécharger (Excel)</button>
      {etat && <p className="legende" role="status">{etat}</p>}
    </section>
  );
}

interface Attente { id: string; nom: string; commune: string; quartier: string | null; nb_enfants: number | null; inscrite_le: string }

/** Coordination : garderies inscrites qui attendent une validation. */
function EnAttente({ onValide }: { onValide: () => void }) {
  const [liste, setListe] = useState<Attente[] | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const charger = () => void supabase.rpc('garderies_en_attente').then(({ data }) => setListe((data as Attente[]) ?? []));
  useEffect(charger, []);
  if (!liste?.length) return null;
  const valider = async (id: string) => {
    const { error } = await supabase.rpc('valider_garderie', { p_garderie: id });
    if (error) return setErreur('La validation n’a pas abouti. Vérifiez la connexion et réessayez.');
    setErreur(null); charger(); onValide();
  };
  return (
    <section className="alerte"><h2>Nouvelles garderies à valider <small>{liste.length}</small></h2>
      <p className="legende">Vérifiez que la garderie existe (visite, personne ressource) avant de la valider. Elle entre alors dans les chiffres de la commune, et son lien parents est créé : la responsable le retrouve dans son Suivi pour l’envoyer aux familles.</p>
      {erreur && <p className="erreur" role="alert">{erreur}</p>}
      <ul className="liste">{liste.map((g) => (
        <li key={g.id}><div className="ligne-validation">
          <span><strong>{g.nom}</strong>
            <span className="meta">{g.commune}{g.quartier && ` · ${g.quartier}`}{g.nb_enfants != null && ` · ${g.nb_enfants} enfants`} · inscrite le {dateFr(g.inscrite_le)}</span></span>
          <button className="bouton petit" onClick={() => void valider(g.id)}>Valider</button>
        </div></li>
      ))}</ul>
    </section>
  );
}

export function Compte() {
  const { profil, deconnecter } = useSession();
  const [msg, setMsg] = useState<string | null>(null);
  const garderie = useLiveQuery(async () => (profil?.garderie_id ? (await db.garderies.get(profil.garderie_id)) ?? null : null), [profil?.garderie_id]);
  return (
    <>
      <Titre sur="Compte">{profil?.nom}</Titre>
      <p>Rôle : {profil?.role === 'responsable' ? 'responsable de garderie' : profil?.role === 'accompagnateur' ? 'personne ressource (accompagnatrice)' : 'coordination communale'}</p>
      {garderie && <p>Garderie : <strong>{garderie.nom}</strong>{garderie.commune && ` · ${garderie.commune}`}</p>}
      {msg && <p className="erreur" role="alert">{msg}</p>}
      <div className="pied-etapes">
        <button className="bouton secondaire" onClick={() => void deconnecter().then(setMsg)}>Se déconnecter</button>
        {msg && <button className="lien danger" onClick={() => void deconnecter(true)}>Déconnecter quand même</button>}
      </div>
      <p className="legende">À la déconnexion, les données sont effacées de ce téléphone (après envoi au serveur).</p>
    </>
  );
}
