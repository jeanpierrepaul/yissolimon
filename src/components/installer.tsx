import { useEffect, useState } from 'react';
import { Mascotte } from './illustrations';

// Invitation à installer Yissolimon comme une application (PWA).
// - Android, Chrome, Edge : le navigateur fournit l'événement « beforeinstallprompt » ; notre bouton ouvre sa fenêtre d'installation.
// - iPhone / iPad (Safari) : pas d'installation automatique possible, on montre les deux gestes à faire.
// - Déjà installée (ouverte depuis l'écran d'accueil) : rien ne s'affiche.

interface EvenementInstallation extends Event { prompt: () => Promise<void>; userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }> }
declare global { interface Window { __installation?: EvenementInstallation | null } }

/** À appeler au tout début (main.tsx) : le navigateur peut envoyer l'événement avant l'affichage de React. */
export function ecouterInstallation() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // on garde la main : c'est notre bandeau qui propose l'installation
    window.__installation = e as EvenementInstallation;
    window.dispatchEvent(new Event('installation-possible'));
  });
  window.addEventListener('appinstalled', () => { window.__installation = null; window.dispatchEvent(new Event('installation-faite')); });
}

const CLE = 'yissolimon-installation-plus-tard';
const DELAI_RAPPEL = 3 * 24 * 3600 * 1000; // on repropose après 3 jours

export const estInstallee = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
const estIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function remisAPlusTard() {
  try { return Date.now() - Number(localStorage.getItem(CLE) ?? 0) < DELAI_RAPPEL; } catch { return false; }
}

export function InviterInstallation() {
  const [evt, setEvt] = useState<EvenementInstallation | null>(() => window.__installation ?? null);
  const [visible, setVisible] = useState(false);
  const [aideIOS, setAideIOS] = useState(false);
  const ios = estIOS();

  useEffect(() => {
    if (estInstallee() || remisAPlusTard()) return;
    const possible = () => setEvt(window.__installation ?? null);
    const faite = () => setVisible(false);
    window.addEventListener('installation-possible', possible);
    window.addEventListener('installation-faite', faite);
    const t = setTimeout(() => setVisible(true), 2500); // après l'écran de chargement
    return () => { clearTimeout(t); window.removeEventListener('installation-possible', possible); window.removeEventListener('installation-faite', faite); };
  }, []);

  if (!visible || (!evt && !ios)) return null; // navigateur qui ne permet pas l'installation : on n'insiste pas

  const plusTard = () => { try { localStorage.setItem(CLE, String(Date.now())); } catch { /* stockage indisponible */ } setVisible(false); };
  const installer = async () => {
    if (!evt) { setAideIOS(true); return; }
    await evt.prompt();
    const { outcome } = await evt.userChoice;
    window.__installation = null; setEvt(null);
    if (outcome === 'accepted') setVisible(false); else plusTard();
  };

  return (
    <div className="installer" role="dialog" aria-labelledby="installer-titre">
      <Mascotte taille={58} pose="salut" />
      <div className="installer-texte">
        <strong id="installer-titre">Installez Yissolimon sur votre téléphone</strong>
        {aideIOS ? (
          <ol className="installer-ios">
            <li>Touchez <span className="picto-partager" aria-label="Partager">
              <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden="true"><path d="M8 1v11M4 5l4-4 4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /><path d="M5 8H2.5A1.5 1.5 0 001 9.5v6A1.5 1.5 0 002.5 17h11a1.5 1.5 0 001.5-1.5v-6A1.5 1.5 0 0013.5 8H11" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>
            </span> en bas de Safari</li>
            <li>puis <b>« Sur l’écran d’accueil »</b>.</li>
          </ol>
        ) : <span>Elle s’ouvre en un geste depuis l’écran d’accueil et fonctionne même sans internet.</span>}
      </div>
      <div className="installer-boutons">
        {!aideIOS && <button className="bouton petit" onClick={() => void installer()}>Installer</button>}
        <button className="lien" onClick={plusTard}>{aideIOS ? 'Compris' : 'Plus tard'}</button>
      </div>
    </div>
  );
}
