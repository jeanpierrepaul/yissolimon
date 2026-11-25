import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { GRILLE } from '../data/grille';
import { aEnvoyer } from '../lib/db';
import { useSession } from '../lib/session';
import { ecouterSync, synchroniser, type EtatSync } from '../lib/sync';
import { Icone, Mascotte, PastilleTheme, couleur } from './illustrations';

export function useEnLigne() {
  const [enLigne, setEnLigne] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setEnLigne(true), off = () => setEnLigne(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);
  return enLigne;
}

function EtatConnexion() {
  const enLigne = useEnLigne();
  const [sync, setSync] = useState<EtatSync>({ enCours: false, derniere: null, erreur: null });
  const [attente, setAttente] = useState(0);
  useEffect(() => ecouterSync(setSync), []);
  useEffect(() => {
    const maj = () => { void aEnvoyer().then(setAttente); };
    maj();
    window.addEventListener('donnees-modifiees', maj);
    return () => window.removeEventListener('donnees-modifiees', maj);
  }, [sync]);

  let texte = 'À jour';
  if (!enLigne) texte = attente ? `Hors ligne · ${attente} en attente` : 'Hors ligne';
  else if (sync.enCours) texte = 'Synchronisation…';
  else if (sync.erreur) texte = 'Envoi en échec · réessayer';
  else if (attente) texte = `${attente} en attente`;

  return (
    <button className={`etat ${enLigne ? '' : 'etat-hors'}`} onClick={() => void synchroniser()}
      title={sync.erreur ?? (sync.derniere ? `Dernière synchronisation : ${new Date(sync.derniere).toLocaleString('fr-FR')}` : '')}>
      <span className="point" aria-hidden /> {texte}
    </button>
  );
}

/** Les 4 petits personnages (public/rubriques) remplacent l'icône de certaines rubriques. */
const PERSONNAGES: Record<string, string> = {
  accueil: 'batiment', garderies: 'batiment', fiches: 'cahier', activites: 'lampe', jeux: 'puzzle',
};
export function IconeRubrique({ nom, taille = 22 }: { nom: string; taille?: number }) {
  const p = PERSONNAGES[nom];
  return p
    ? <img src={`/rubriques/${p}.png`} alt="" width={taille} height={taille} className="icone-personnage" />
    : <Icone nom={nom} taille={taille} />;
}

export function Cadre({ children }: { children: ReactNode }) {
  const { profil } = useSession();
  const liens: [string, string, string][] = profil?.role === 'responsable'
    ? [['/', 'Accueil', 'accueil'], ['/enfants', 'Enfants', 'enfants'], ['/activites', 'Activités', 'activites'], ['/plan', 'Plan', 'plan'], ['/suivi', 'Suivi', 'suivi'], ['/services', 'Services', 'services'], ['/bibliotheque', 'Fiches', 'fiches'], ['/jeux', 'Jeux', 'jeux']]
    : profil?.role === 'accompagnateur'
      ? [['/', 'Garderies', 'garderies'], ['/enfants', 'Enfants', 'enfants'], ['/activites', 'Activités', 'activites'], ['/services', 'Services', 'services'], ['/bibliotheque', 'Fiches', 'fiches'], ['/jeux', 'Jeux', 'jeux']]
      : [['/', 'Commune', 'commune'], ['/enfants', 'Enfants', 'enfants'], ['/activites', 'Activités', 'activites'], ['/services', 'Services', 'services'], ['/bibliotheque', 'Fiches', 'fiches'], ['/jeux', 'Jeux', 'jeux']];
  const initiale = (profil?.nom ?? '?').trim().charAt(0).toUpperCase();
  return (
    <div className="appli">
      <aside className="cote">
        <NavLink to="/" className="marque"><Mascotte taille={38} /> Yissolimon</NavLink>
        <nav className="nav-cote">
          {liens.map(([to, l, ic]) => <NavLink key={to} to={to} end><IconeRubrique nom={ic} taille={28} /> {l}</NavLink>)}
          <NavLink to="/compte"><Icone nom="compte" /> Compte</NavLink>
        </nav>
        <div className="carte-cote">
          <Mascotte taille={72} pose="salut" />
          <p><strong>Grandir ensemble</strong>Chaque petit pas compte pour les enfants.</p>
        </div>
      </aside>
      <div className="principal">
        <header className="entete">
          <NavLink to="/" className="marque marque-mobile"><Mascotte taille={34} /> Yissolimon</NavLink>
          <span className="entete-droite">
            {profil?.role !== 'coordination' && <EtatConnexion />}
            <NavLink to="/compte" className="avatar" aria-label="Mon compte">{initiale}</NavLink>
          </span>
        </header>
        <main className="contenu">{children}</main>
      </div>
      <NavMobile liens={liens} />
    </div>
  );
}

/** Couleurs des tuiles du panneau « Plus » (une par rubrique). */
const TUILES: Record<string, { c: string; fond: string }> = {
  services: { c: '#DC4C4C', fond: '#FDE6E6' }, fiches: { c: '#2FA866', fond: '#E3F6EB' },
  suivi: { c: '#F2762E', fond: '#FFEFE4' }, compte: { c: '#F2557F', fond: '#FFE7EE' },
  plan: { c: '#4767E8', fond: '#E7EBFD' }, activites: { c: '#E8A300', fond: '#FFF5D6' },
  accueil: { c: '#6C4CF1', fond: '#EFEBFF' }, enfants: { c: '#F2557F', fond: '#FFE7EE' }, jeux: { c: '#6C4CF1', fond: '#EFEBFF' }, garderies: { c: '#12A594', fond: '#DDF6F2' }, commune: { c: '#1FA6DB', fond: '#E2F5FD' },
};

/**
 * Barre du bas sur téléphone : 4 onglets dans une bulle flottante, et Dévi au centre.
 * Dévi ouvre un panneau de grandes tuiles pour les autres rubriques et le compte.
 */
function NavMobile({ liens }: { liens: [string, string, string][] }) {
  const [ouvert, setOuvert] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setOuvert(false); }, [pathname]);
  useEffect(() => {
    if (!ouvert) return;
    const echap = (e: KeyboardEvent) => { if (e.key === 'Escape') setOuvert(false); };
    window.addEventListener('keydown', echap);
    return () => window.removeEventListener('keydown', echap);
  }, [ouvert]);

  const barre = liens.slice(0, 4);
  const autres: [string, string, string][] = [...liens.slice(4), ['/compte', 'Compte', 'compte']];
  // Le panneau montre toutes les rubriques, en grandes tuiles colorées.
  const toutes: [string, string, string][] = [...liens, ['/compte', 'Compte', 'compte']];
  const autreActif = autres.some(([to]) => pathname === to || (to !== '/' && pathname.startsWith(to)));
  const onglet = ([to, l, ic]: [string, string, string]) => (
    <NavLink key={to} to={to} end className="onglet-bas"><span className="onglet-icone"><IconeRubrique nom={ic} taille={PERSONNAGES[ic] ? 30 : 23} /></span><span className="onglet-nom">{l}</span></NavLink>
  );

  return (
    <>
      {ouvert && <div className="voile" onClick={() => setOuvert(false)} aria-hidden="true" />}
      {ouvert && (
        <div className="panneau-plus" role="dialog" aria-label="Autres rubriques">
          <div className="panneau-tete">
            <Mascotte taille={52} pose="salut" />
            <p><strong>Où veux-tu aller ?</strong>Touche une tuile.</p>
          </div>
          <div className="tuiles-plus">
            {toutes.map(([to, l, ic]) => {
              const t = TUILES[ic] ?? { c: '#6C4CF1', fond: '#EFEBFF' };
              return (
                <NavLink key={to} to={to} end className="tuile-plus" style={{ background: t.fond, color: t.c }}>
                  {PERSONNAGES[ic]
                    ? <span className="tuile-plus-icone tuile-personnage"><IconeRubrique nom={ic} taille={52} /></span>
                    : <span className="tuile-plus-icone" style={{ background: t.c }}><Icone nom={ic} taille={26} /></span>}
                  <span className="tuile-plus-nom">{l}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      )}
      <nav className="nav-bas" aria-label="Navigation principale">
        {barre.slice(0, 2).map(onglet)}
        <button type="button" className={`bouton-devi ${ouvert ? 'ouvert' : ''} ${autreActif ? 'actif' : ''}`}
          onClick={() => setOuvert(o => !o)} aria-expanded={ouvert} aria-label={ouvert ? 'Fermer le menu' : 'Plus de rubriques'}>
          <span className="devi-rond"><Mascotte taille={46} pose={ouvert ? 'salut' : 'normal'} /></span>
          <span className="onglet-nom">{ouvert ? 'Fermer' : 'Plus'}</span>
        </button>
        {barre.slice(2).map(onglet)}
      </nav>
    </>
  );
}

export function Titre({ sur, children, retour }: { sur?: string; children: ReactNode; retour?: boolean }) {
  const nav = useNavigate();
  return (
    <div className="titre">
      {retour && <button className="retour" onClick={() => nav(-1)}>← Retour</button>}
      {sur && <p className="sur">{sur}</p>}
      <h1>{children}</h1>
    </div>
  );
}

/** Barres horizontales par dimension ; « avant » affiché en trait fin pour comparer deux cycles. */
export function Barres({ scores, avant }: { scores: Record<string, number | null>; avant?: Record<string, number | null> }) {
  return (
    <div className="barres">
      {GRILLE.map((d) => {
        const v = scores[d.id], a = avant?.[d.id];
        return (
          <div className="barre" key={d.id}>
            <span className="barre-nom"><PastilleTheme dim={d.id} taille={30} /> {d.court}</span>
            <span className="barre-piste">
              {v !== null && v !== undefined && <span className="barre-val" style={{ width: `${v}%`, background: couleur(d.id).c }} />}
              {a !== null && a !== undefined && <span className="barre-avant" style={{ left: `${a}%` }} title={`Avant : ${a} %`} />}
            </span>
            <span className="barre-chiffre">{v ?? '–'}{v !== null && v !== undefined && ' %'}
              {a !== null && a !== undefined && v !== null && v !== undefined && v !== a &&
                <em className={v > a ? 'hausse' : 'baisse'}> {v > a ? '+' : ''}{v - a}</em>}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export const STATUTS = { a_faire: 'À faire', en_cours: 'En cours', terminee: 'Terminée' } as const;

export const dateFr = (d: string | null) => (d ? new Date(d).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '');

/** Animation de chargement (Dévi animé : public/chargement-devi.svg). */
export function Chargement({ texte = 'Chargement' }: { texte?: string }) {
  return (
    <div className="chargement" role="status" aria-live="polite">
      <img src="/chargement-devi.svg" alt="" className="chargement-perso" width={160} height={160} />
      <span className="chargement-ombre" aria-hidden="true" />
      <p>{texte}<span className="points" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></p>
    </div>
  );
}
