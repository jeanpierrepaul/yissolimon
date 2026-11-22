import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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

export function Cadre({ children }: { children: ReactNode }) {
  const { profil } = useSession();
  const liens: [string, string, string][] = profil?.role === 'responsable'
    ? [['/', 'Accueil', 'accueil'], ['/activites', 'Activités', 'activites'], ['/plan', 'Plan', 'plan'], ['/services', 'Services', 'services'], ['/bibliotheque', 'Fiches', 'fiches'], ['/suivi', 'Suivi', 'suivi']]
    : profil?.role === 'accompagnateur'
      ? [['/', 'Garderies', 'garderies'], ['/activites', 'Activités', 'activites'], ['/services', 'Services', 'services'], ['/bibliotheque', 'Fiches', 'fiches']]
      : [['/', 'Commune', 'commune'], ['/activites', 'Activités', 'activites'], ['/services', 'Services', 'services'], ['/bibliotheque', 'Fiches', 'fiches']];
  const initiale = (profil?.nom ?? '?').trim().charAt(0).toUpperCase();
  return (
    <div className="appli">
      <aside className="cote">
        <NavLink to="/" className="marque"><Mascotte taille={38} /> Yissolimon</NavLink>
        <nav className="nav-cote">
          {liens.map(([to, l, ic]) => <NavLink key={to} to={to} end><Icone nom={ic} /> {l}</NavLink>)}
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
      <nav className="nav-bas">
        {liens.map(([to, l, ic]) => <NavLink key={to} to={to} end><Icone nom={ic} /><span>{l}</span></NavLink>)}
      </nav>
    </div>
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
