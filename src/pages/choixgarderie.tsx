import { Navigate } from 'react-router-dom';
import { Mascotte } from '../components/illustrations';

const CLE = 'yissolimon-garderie-parent';

/** Garderie du parent, retenue sur son téléphone dès qu'il ouvre le lien de sa garderie. */
export function garderieParent(): { code: string; nom: string } | null {
  try { return JSON.parse(localStorage.getItem(CLE) ?? 'null'); } catch { return null; }
}
export function retenirGarderieParent(code: string, nom: string) {
  try { localStorage.setItem(CLE, JSON.stringify({ code, nom })); } catch { /* stockage indisponible */ }
}
export function oublierGarderieParent() {
  try { localStorage.removeItem(CLE); } catch { /* stockage indisponible */ }
}

/**
 * Page publique /parents. Chaque garderie validée a son propre lien parents : c'est lui qui rattache
 * les avis à la bonne garderie. Si le parent a déjà ouvert ce lien sur ce téléphone, il y retourne directement.
 */
export function ChoixGarderie() {
  const deja = garderieParent();
  if (deja) return <Navigate to={`/avis/${deja.code}`} replace />;
  return (
    <div className="appli appli-seule">
      <header className="entete entete-seule"><span className="marque"><Mascotte taille={34} /> Yissolimon <span>· Espace parents</span></span></header>
      <main className="contenu">
        <section className="hero">
          <div className="hero-texte">
            <p className="sur">Bienvenue, chers parents</p>
            <h1>Ouvrez le lien de votre garderie</h1>
            <p>Chaque garderie a son propre espace parents. Pour y accéder, ouvrez le lien que la garderie de votre enfant vous a envoyé (WhatsApp, SMS). <strong>Sans compte et sans donner votre nom.</strong></p>
          </div>
          <Mascotte taille={130} pose="salut" className="hero-mascotte" />
        </section>
        <section className="encadre">
          <h2>Vous n’avez pas le lien ?</h2>
          <p>Demandez-le à la responsable de la garderie : elle le trouve dans Yissolimon et peut vous l’envoyer en un clic.</p>
          <p className="legende">Une fois le lien ouvert sur ce téléphone, il est retenu : la prochaine fois, vous arriverez directement sur l’espace de votre garderie.</p>
        </section>
      </main>
    </div>
  );
}
