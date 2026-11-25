import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { COURT_AVIS, QUESTIONS_AVIS, REPONSES_AVIS } from '../data/avis';
import { supabase } from '../lib/supabase';
import { useEnLigne } from '../components/ui';
import { Mascotte, PastilleService, couleurService, rangService } from '../components/illustrations';
import type { TypeService } from '../lib/db';
import { TYPES } from './services';
import { useLiveQuery } from 'dexie-react-hooks';
import { oublierGarderieParent, retenirGarderieParent } from './choixgarderie';
import { db } from '../lib/db';
import { useSession } from '../lib/session';
import { Reperes } from './enfants';
import type { Tranche } from '../data/reperes';

const cleDeja = (code: string) => `avis-donne-${code}`;
function lire(cle: string) { try { return localStorage.getItem(cle); } catch { return null; } }
function ecrire(cle: string, v: string) { try { localStorage.setItem(cle, v); } catch { /* stockage indisponible */ } }

/** Page publique : le parent répond sans compte. Aucune donnée personnelle n'est demandée. */
export function AvisParent() {
  const { code = '' } = useParams();
  const enLigne = useEnLigne();
  const [nom, setNom] = useState<string | null | undefined>(undefined);
  const [rep, setRep] = useState<(number | null)[]>(QUESTIONS_AVIS.map(() => null));
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'merci' | 'deja'>(lire(cleDeja(code)) ? 'deja' : 'saisie');
  const [erreur, setErreur] = useState<string | null>(null);
  const [onglet, setOnglet] = useState<'grandir' | 'services' | 'loisirs' | 'avis'>(etat === 'deja' ? 'grandir' : 'avis');
  const [tranche, setTranche] = useState<Tranche>('petits');
  const [remarque, setRemarque] = useState('');

  useEffect(() => {
    if (!enLigne) return;
    void supabase.rpc('garderie_avis', { p_code: code }).then(({ data }) => {
      const n = (data as string | null) ?? null;
      setNom(n);
      if (n) retenirGarderieParent(code, n); // le parent arrivera directement ici la prochaine fois
      else oublierGarderieParent(); // lien changé ou désactivé : on ne le retient plus
    });
  }, [code, enLigne]);

  async function envoyer() {
    setEtat('envoi'); setErreur(null);
    const { error } = await supabase.rpc('donner_avis', { p_code: code, p_reponses: rep, p_remarque: remarque.trim() || null });
    if (error) { setErreur(enLigne ? 'L’avis n’a pas pu être envoyé. Réessayez dans un instant.' : 'Pas de connexion. Réessayez quand vous avez du réseau.'); setEtat('saisie'); return; }
    ecrire(cleDeja(code), new Date().toISOString().slice(0, 10));
    setEtat('merci');
  }

  const complet = rep.every((v) => v !== null);
  return (
    <div className="appli appli-seule">
      <header className="entete entete-seule"><span className="marque"><Mascotte taille={34} /> Yissolimon <span>· Espace parents</span></span></header>
      <main className="contenu">
        {nom === null ? (
          <><h1>Lien introuvable</h1><p>Ce lien n’est plus valable, ou la garderie n’est pas encore validée. Demandez le lien à jour à la garderie de votre enfant.</p></>
        ) : <>
          <section className="hero">
            <div className="hero-texte">
              <p className="sur">{nom ?? (enLigne ? 'Chargement…' : 'Hors connexion')}</p>
              <h1>Bienvenue, chers parents !</h1>
              <p>Suivez comment grandit votre enfant, trouvez les services utiles pour lui, des idées de sorties en famille, et donnez votre avis sur la garderie. <strong>Sans compte et sans donner votre nom.</strong></p>
            </div>
            <Mascotte taille={130} pose="salut" className="hero-mascotte" />
          </section>
          <div className="onglets" role="tablist">
            <button role="tab" id="onglet-grandir" aria-selected={onglet === 'grandir'} className={onglet === 'grandir' ? 'choisi' : ''} onClick={() => setOnglet('grandir')}>Il grandit</button>
            <button role="tab" id="onglet-services" aria-selected={onglet === 'services'} className={onglet === 'services' ? 'choisi' : ''} onClick={() => setOnglet('services')}>Services</button>
            <button role="tab" id="onglet-loisirs" aria-selected={onglet === 'loisirs'} className={onglet === 'loisirs' ? 'choisi' : ''} onClick={() => setOnglet('loisirs')}>Sorties et loisirs</button>
            <button role="tab" id="onglet-avis" aria-selected={onglet === 'avis'} className={onglet === 'avis' ? 'choisi' : ''} onClick={() => setOnglet('avis')}>Mon avis</button>
          </div>
          {onglet === 'grandir' ? (
            <>
              <p className="intro-enfants">Que sait faire votre enfant à son âge ? Comment l’aider à grandir ? Quels signes doivent vous alerter ?</p>
              <Reperes tranche={tranche} choisir={setTranche} versServices={() => setOnglet('services')} />
            </>
          ) : onglet !== 'avis' ? <ServicesParents code={code} loisirs={onglet === 'loisirs'} /> : etat === 'merci' || etat === 'deja' ? (
          <div className="merci"><Mascotte taille={150} pose="bravo" className="centre" /><h1>Merci !</h1>
            <p>{etat === 'merci' ? 'Votre avis a bien été envoyé.' : 'Vous avez déjà donné votre avis depuis ce téléphone.'} Il aide l’équipe de la garderie à s’améliorer.</p>
            <div className="boutons-merci">
              <button className="bouton" onClick={() => setOnglet('services')}>Voir les services pour mon enfant</button>
              {etat === 'deja' && <button className="bouton secondaire" onClick={() => setEtat('saisie')}>Donner un nouvel avis</button>}
            </div></div>
        ) : (
          <>
            <p>5 questions, moins d’une minute. <strong>C’est anonyme</strong> : on ne vous demande ni votre nom ni celui de votre enfant.</p>
            {QUESTIONS_AVIS.map((q, i) => (
              <fieldset className="question" key={i}>
                <legend><span className="num">{i + 1}</span>{q}</legend>
                <div className="choix choix-3">
                  {REPONSES_AVIS.map((r) => (
                    <button key={r.v} type="button" id={`avis-${i}-${r.v}`} className={rep[i] === r.v ? 'choisi' : ''} aria-pressed={rep[i] === r.v}
                      onClick={() => setRep(rep.map((x, j) => (j === i ? r.v : x)))}>{r.label}</button>
                  ))}
                </div>
              </fieldset>
            ))}
            <label className="champ remarque">Une remarque pour la garderie ? <small>(facultatif)</small>
              <textarea id="avis-remarque" rows={3} maxLength={500} value={remarque} onChange={(e) => setRemarque(e.target.value)}
                placeholder="Une idée, un merci, quelque chose à améliorer…" />
              <small className="avertissement">N’écrivez aucun nom (ni le vôtre, ni celui d’un enfant). Pour un problème grave concernant un enfant, parlez-en directement à la responsable ou contactez un service de l’onglet « Services ». {remarque.length}/500</small>
            </label>
            {erreur && <p className="erreur" role="alert">{erreur}</p>}
            <button className="bouton" disabled={!complet || etat === 'envoi'} onClick={() => void envoyer()}>
              {etat === 'envoi' ? 'Envoi…' : complet ? 'Envoyer mon avis' : `Répondez aux ${QUESTIONS_AVIS.length} questions`}
            </button>
          </>
        )}
        </>}
      </main>
    </div>
  );
}

interface ServicePublic { nom: string; type: TypeService; adresse: string | null; telephone: string | null; horaires: string | null; description: string | null }

/** Services liés à l'enfance dans la commune de la garderie (vue parents, publique). */
function ServicesParents({ code, loisirs }: { code: string; loisirs: boolean }) {
  const enLigne = useEnLigne();
  const [liste, setListe] = useState<ServicePublic[] | null>(null);
  const [type, setType] = useState('');
  useEffect(() => {
    if (!enLigne) return;
    void supabase.rpc('services_parents', { p_code: code }).then(({ data }) => setListe((data as ServicePublic[]) ?? []));
  }, [code, enLigne]);
  if (!liste) return <p className="vide">{enLigne ? 'Chargement des services…' : 'Connectez-vous à internet pour voir les services.'}</p>;
  const choisis = liste.filter((s) => (s.type === 'loisirs') === loisirs);
  if (!choisis.length) return <p className="vide">{loisirs ? 'Aucun lieu de loisirs n’est encore enregistré pour votre commune.' : 'Aucun service n’est encore enregistré pour votre commune.'} Demandez conseil à la garderie.</p>;
  const tries = [...choisis].sort((a, b) => rangService(a.type) - rangService(b.type) || a.nom.localeCompare(b.nom));
  const types = [...new Set(tries.map((s) => s.type))];
  const visibles = tries.filter((s) => !type || s.type === type);
  return (
    <>
      <p>{loisirs ? 'Des lieux pour jouer, découvrir et s’épanouir en famille, près de chez vous. Jouer dehors, écouter des histoires, faire de la musique : tout cela aide votre enfant à grandir.' : 'Les services publics pour la santé, la croissance, la protection et les papiers de votre enfant, près de chez vous.'}</p>
      {!loisirs && <div className="filtres">
        <button className={!type ? 'choisi' : ''} onClick={() => setType('')}>Tous</button>
        {types.map((t) => <button key={t} className={type === t ? 'choisi' : ''} onClick={() => setType(t)}>{TYPES[t]}</button>)}
      </div>}
      <ul className="grille-fiches">
        {visibles.map((s, i) => {
          const { c } = couleurService(s.type);
          return (
            <li key={`${s.nom}-${i}`}><div className="carte-fiche">
              <PastilleService type={s.type} taille={46} />
              <span>
                <span className="meta" style={{ color: c }}>{TYPES[s.type]}</span>
                <strong>{s.nom}</strong>
                {s.description && <span className="meta">{s.description}</span>}
                <span className="meta">{[s.adresse !== '—' ? s.adresse : null, s.horaires].filter(Boolean).join(' · ')}</span>
                {s.telephone && <span className="tel"><a href={`tel:${s.telephone.replace(/\s/g, '')}`}>{s.telephone}</a></span>}
              </span>
            </div></li>
          );
        })}
      </ul>
      <p className="legende">{loisirs ? 'Restez toujours avec votre enfant pendant les sorties.' : 'En cas d’urgence pour un enfant, rendez-vous directement au centre de santé le plus proche.'}</p>
    </>
  );
}

interface Resume { code: string | null; total: number; depuis: string | null; scores: (number | null)[] }

/** Bloc « Avis des parents » : lien à partager (responsable) et résultats agrégés. Nécessite une connexion. */
export function AvisGarderie({ garderieId }: { garderieId: string }) {
  const enLigne = useEnLigne();
  const [r, setR] = useState<Resume | null>(null);
  const [copie, setCopie] = useState(false);
  const [remarques, setRemarques] = useState<{ mois: string; remarque: string }[] | null>(null);
  const { profil } = useSession();
  const garderie = useLiveQuery(() => db.garderies.get(garderieId), [garderieId]);
  const enAttente = profil?.role === 'responsable' && garderie?.valide === false;

  useEffect(() => {
    if (!enLigne) return;
    void supabase.rpc('resume_avis', { p_garderie: garderieId }).then(({ data }) => setR((data as Resume[] | null)?.[0] ?? null));
    void supabase.rpc('remarques_avis', { p_garderie: garderieId }).then(({ data }) => setRemarques((data as { mois: string; remarque: string }[]) ?? []));
  }, [garderieId, enLigne]);

  if (!enLigne && !r) return <section><h2>Avis des parents</h2><p className="vide">Connectez-vous à internet pour voir les avis.</p></section>;
  if (!r) return null;
  const lien = r.code ? `${window.location.origin}/avis/${r.code}` : null;
  const message = lien ? `Bonjour, voici l’espace parents de la garderie : les services utiles pour votre enfant près de chez vous, et un avis anonyme en moins d’une minute : ${lien}` : '';

  async function copier() {
    try { await navigator.clipboard.writeText(lien!); setCopie(true); setTimeout(() => setCopie(false), 2000); }
    catch { window.prompt('Copiez ce lien :', lien!); }
  }

  return (
    <section><h2>Avis des parents <small>{r.total} avis{r.depuis ? ` depuis le ${new Date(r.depuis).toLocaleDateString('fr-FR')}` : ''}</small></h2>
      {enAttente && !lien && (
        <p className="bandeau-attente">Votre <strong>lien parents</strong> sera créé dès que la coordination aura validé votre garderie. Il apparaîtra ici, prêt à envoyer.</p>
      )}
      {lien && (
        <div className="partage">
          <p className="sur">Lien parents de votre garderie</p>
          <p>Envoyez ce lien aux parents. Sans compte et sans donner leur nom, ils y trouvent les services pour leur enfant et peuvent donner leur avis.</p>
          <code className="lien">{lien}</code>
          <div className="boutons">
            <a className="bouton petit" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">Envoyer par WhatsApp</a>
            <button className="bouton petit secondaire" onClick={() => void copier()}>{copie ? 'Lien copié' : 'Copier le lien'}</button>
          </div>
        </div>
      )}
      {r.total === 0 ? <p className="vide">Aucun avis pour l’instant.</p> : (
        <>
          <div className="barres">{COURT_AVIS.map((c, i) => {
            const v = r.scores[i];
            return (
              <div className="barre" key={c}><span className="barre-nom">{c}</span>
                <span className="barre-piste">{v !== null && <span className="barre-val" style={{ width: `${v}%` }} />}</span>
                <span className="barre-chiffre">{v ?? '–'}{v !== null && ' %'}</span></div>
            );
          })}</div>
          <p className="legende">100 % = tous les parents ont répondu « Oui ». Les réponses individuelles ne sont jamais affichées.</p>
        </>
      )}
      {remarques && remarques.length > 0 && (
        <>
          <h3 className="sous-titre">Remarques des parents <small>{remarques.length}</small></h3>
          <ul className="notes">{remarques.map((x, i) => (
            <li key={i}><p>{x.remarque}</p><span className="meta">{new Date(`${x.mois}-01`).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span></li>
          ))}</ul>
        </>
      )}
    </section>
  );
}
