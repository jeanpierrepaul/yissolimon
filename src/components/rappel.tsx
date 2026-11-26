import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSession } from '../lib/session';
import { useGarderie } from '../pages/commun';
import { JOUR_RAPPEL, dateCourte, etatAutoeval, nouvelleAutoeval } from '../lib/autoeval';
import { Mascotte } from './illustrations';

const CLE = 'rappel-autoeval-plus-tard';
const lire = () => { try { return Number(localStorage.getItem(CLE)) || 0; } catch { return 0; } };
const ecrire = (v: number) => { try { localStorage.setItem(CLE, String(v)); } catch { /* stockage indisponible */ } };

/**
 * Rappel de l'autoévaluation mensuelle obligatoire (responsable de garderie).
 * Un bandeau reste en haut de chaque page tant que l'autoévaluation du mois n'est pas faite ;
 * une fenêtre revient de temps en temps (toutes les 3 h en retard, toutes les 6 h en fin de mois).
 */
export function RappelAutoeval() {
  const { profil } = useSession();
  const d = useGarderie(profil?.garderie_id);
  const { pathname } = useLocation();
  const nav = useNavigate();
  const [fenetre, setFenetre] = useState(false);
  const e = d ? etatAutoeval(d) : null;
  const surEvaluation = pathname.startsWith('/evaluation');

  useEffect(() => {
    if (!e || e.etat === 'fait' || surEvaluation) { setFenetre(false); return; }
    const pressant = e.etat === 'en_retard' || new Date().getDate() >= JOUR_RAPPEL;
    if (!pressant) return;
    const delai = (e.etat === 'en_retard' ? 3 : 6) * 3600e3;
    if (Date.now() - lire() > delai) setFenetre(true);
  }, [e?.etat, surEvaluation]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!d || !e || e.etat === 'fait' || surEvaluation || !profil?.garderie_id) return null;

  const commencer = async () => {
    ecrire(Date.now()); setFenetre(false);
    nav(`/evaluation/${e.brouillonId ?? await nouvelleAutoeval(d, profil.garderie_id!, profil.id)}`);
  };
  const plusTard = () => { ecrire(Date.now()); setFenetre(false); };
  const action = e.brouillonId ? 'Continuer l’autoévaluation' : 'Commencer l’autoévaluation';
  const retard = e.etat === 'en_retard';
  const jamais = !d.derniere;
  const texte = jamais
    ? 'Votre première autoévaluation est obligatoire : elle montre où en est la garderie et prépare votre plan d’actions.'
    : retard
      ? `L’autoévaluation du mois dernier n’a pas été faite. Elle est obligatoire chaque mois : faites-la avant le ${dateCourte(e.limite)}.`
      : `L’autoévaluation de ce mois est obligatoire. Il reste ${e.joursRestants} jour${e.joursRestants > 1 ? 's' : ''} : à faire avant le ${dateCourte(e.limite)}.`;

  return (
    <>
      <div className={`rappel-autoeval ${retard ? 'retard' : ''}`} role="status">
        <span><strong>{retard ? 'Autoévaluation en retard' : 'Autoévaluation du mois'}</strong>
          {retard ? ' · obligatoire' : ` · avant le ${dateCourte(e.limite)}`}</span>
        <button className="bouton petit" onClick={() => void commencer()}>{e.brouillonId ? 'Continuer' : 'Commencer'}</button>
      </div>
      {fenetre && (
        <>
          <div className="voile voile-rappel" aria-hidden="true" />
          <div className="fenetre-rappel" role="alertdialog" aria-modal="true" aria-labelledby="titre-rappel">
            <Mascotte taille={86} pose="salut" />
            <p className="sur">{retard ? 'Obligatoire · en retard' : 'Obligatoire · chaque mois'}</p>
            <h2 id="titre-rappel">{jamais ? 'Faisons le point ensemble' : 'C’est l’heure de l’autoévaluation'}</h2>
            <p>{texte}</p>
            <p className="legende">25 à 35 minutes avec l’équipe. Les réponses sont gardées sur le téléphone : vous pouvez vous arrêter et reprendre.</p>
            <button className="bouton" onClick={() => void commencer()}>{action}</button>
            <button className="lien" onClick={plusTard}>Me le rappeler plus tard</button>
          </div>
        </>
      )}
    </>
  );
}
