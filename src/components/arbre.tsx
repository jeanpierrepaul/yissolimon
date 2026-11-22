import { Link } from 'react-router-dom';
import { GRILLE, dimensionTitre, scores } from '../data/grille';
import type { Action } from '../lib/db';
import type { DonneesGarderie } from '../pages/commun';
import { couleur } from './illustrations';
import { dateFr } from './ui';

const OR = 137.508 * (Math.PI / 180);

/**
 * L'arbre de la garderie : une feuille par action terminée (couleur du thème),
 * un bourgeon par action en cours, un fruit par autoévaluation terminée.
 * Il récompense les efforts, pas le niveau de départ.
 */
export function ArbreProgres({ actions, cycles, taille = 260 }: { actions: Action[]; cycles: number; taille?: number }) {
  const faites = actions.filter((a) => a.statut === 'terminee');
  const enCours = actions.filter((a) => a.statut !== 'terminee');
  const n = faites.length;
  const g = Math.min(1, n / 12);
  const sol = 214;
  const haut = 58 + 52 * g;
  const cx = 120, cy = sol - haut - 18 - 22 * g;
  const R = 34 + 42 * g;
  const feuilles = [...faites.map((a) => ({ a, fait: true })), ...enCours.map((a) => ({ a, fait: false }))].slice(0, 40);
  const places = Math.max(feuilles.length, 10);
  const fruits = Math.min(cycles, 6);
  const titre = n ? `Arbre de la garderie : ${n} feuille${n > 1 ? 's' : ''}, ${enCours.length} bourgeon${enCours.length > 1 ? 's' : ''}, ${fruits} fruit${fruits > 1 ? 's' : ''}` : 'Une jeune pousse : aucune action terminée pour l’instant';

  return (
    <svg className="arbre" viewBox="0 0 240 230" width={taille} height={taille * 230 / 240} role="img" aria-label={titre}>
      <ellipse cx="120" cy={sol + 4} rx="92" ry="10" fill="#E3F6EB" />
      {n === 0 ? (
        <g className="pousse">
          <path d={`M120 ${sol} C120 ${sol - 20} 118 ${sol - 34} 120 ${sol - 46}`} stroke="#5B8C3A" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d={`M120 ${sol - 30} C104 ${sol - 40} 96 ${sol - 30} 98 ${sol - 22} C108 ${sol - 20} 116 ${sol - 24} 120 ${sol - 30}z`} fill="#7CC36E" />
          <path d={`M120 ${sol - 42} C136 ${sol - 54} 146 ${sol - 44} 144 ${sol - 36} C134 ${sol - 34} 124 ${sol - 36} 120 ${sol - 42}z`} fill="#62B357" />
          {enCours.slice(0, 5).map((a, i) => (
            <circle key={a.id} className="bourgeon" cx={120 + (i % 2 ? 1 : -1) * (6 + i * 3)} cy={sol - 48 - i * 5} r="4.5" fill="#fff" stroke={couleur(a.dimension).c} strokeWidth="2" />
          ))}
        </g>
      ) : (
        <>
          <circle cx={cx} cy={cy} r={R + 8} fill="#E3F6EB" className="couronne" />
          <path d={`M${120 - 9 - 5 * g} ${sol} Q120 ${sol - haut * 0.5} ${120 - 3} ${cy + R * 0.2} L${120 + 3} ${cy + R * 0.2} Q120 ${sol - haut * 0.5} ${120 + 9 + 5 * g} ${sol}z`} fill="#8A5A3B" />
          {[-1, 1, -0.5, 0.6].slice(0, 2 + Math.min(2, Math.floor(n / 4))).map((d, i) => (
            <path key={i} d={`M120 ${cy + R * (0.45 - i * 0.12)} Q${120 + d * R * 0.35} ${cy + R * (0.2 - i * 0.1)} ${120 + d * R * 0.7} ${cy - R * (0.15 + i * 0.12)}`}
              stroke="#8A5A3B" strokeWidth={4 - i * 0.6} fill="none" strokeLinecap="round" />
          ))}
          {feuilles.map(({ a, fait }, i) => {
            const r = R * 0.92 * Math.sqrt((i + 0.5) / places);
            const x = cx + r * Math.cos(i * OR), y = cy + r * Math.sin(i * OR);
            const rot = (i * OR * 180) / Math.PI;
            const c = couleur(a.dimension).c;
            return fait
              ? <ellipse key={a.id} className="feuille" style={{ animationDelay: `${i * 35}ms` }} cx={x} cy={y} rx="10" ry="6" fill={c} transform={`rotate(${rot} ${x} ${y})`} />
              : <circle key={a.id} className="bourgeon" cx={x} cy={y} r="5" fill="#fff" stroke={c} strokeWidth="2" strokeDasharray="3 2" />;
          })}
          {Array.from({ length: fruits }, (_, i) => {
            const ang = -Math.PI / 2 + (i - (fruits - 1) / 2) * 0.55;
            const x = cx + (R + 4) * Math.cos(ang) * 0.95, y = cy + (R + 4) * Math.sin(ang) * 0.7 + R * 0.35;
            return <g key={i} className="fruit"><circle cx={x} cy={y} r="7" fill="#F2557F" /><path d={`M${x} ${y - 7} l2 -4`} stroke="#5B8C3A" strokeWidth="2" strokeLinecap="round" /></g>;
          })}
        </>
      )}
    </svg>
  );
}

/** Message d'encouragement selon l'état de l'arbre. */
function message(fait: number, ouvertes: Action[]) {
  if (!fait && !ouvertes.length) return 'Votre arbre est une jeune pousse. Choisissez une première action : elle deviendra sa première feuille.';
  if (!fait) return `Votre première feuille poussera quand « ${ouvertes[0].titre} » sera terminée.`;
  if (ouvertes.length) return `Bravo, ${fait} action${fait > 1 ? 's' : ''} réalisée${fait > 1 ? 's' : ''} ! Prochaine feuille : « ${ouvertes[0].titre} ».`;
  return `Bravo, ${fait} action${fait > 1 ? 's' : ''} réalisée${fait > 1 ? 's' : ''} ! Une nouvelle autoévaluation fera pousser un fruit.`;
}

/** Bloc complet : arbre, légende et message (page Suivi). */
export function MonArbre({ d, compact = false }: { d: DonneesGarderie; compact?: boolean }) {
  const fait = d.actions.filter((a) => a.statut === 'terminee').length;
  const ouvertes = d.actions.filter((a) => a.statut !== 'terminee');
  const cycles = d.evals.filter((e) => e.statut === 'terminee').length;
  return (
    <section className={`mon-arbre ${compact ? 'compact' : ''}`}>
      <ArbreProgres actions={d.actions} cycles={cycles} taille={compact ? 150 : 260} />
      <div>
        <p className="sur">L’arbre de ma garderie</p>
        <h2>{fait ? `${fait} feuille${fait > 1 ? 's' : ''}` : 'Une jeune pousse'}</h2>
        <p>{message(fait, ouvertes)}</p>
        {!compact && (
          <ul className="legende-arbre">
            <li><span className="l-feuille" /> une action terminée (couleur du thème)</li>
            <li><span className="l-bourgeon" /> une action en cours</li>
            <li><span className="l-fruit" /> une autoévaluation terminée</li>
          </ul>
        )}
        {compact && <Link className="lien" to="/suivi">Voir mon parcours</Link>}
        {!compact && <p className="legende">L’arbre grandit avec vos efforts, pas avec vos moyens : chaque petite action compte.</p>}
      </div>
    </section>
  );
}

/** « Il y a quelque temps / aujourd'hui » : comparaison du premier et du dernier cycle, et journal des réussites. */
export function Parcours({ d }: { d: DonneesGarderie }) {
  const terminees = d.evals.filter((e) => e.statut === 'terminee');
  const premiere = terminees[0], derniere = terminees.at(-1);
  const avant = premiere ? scores(premiere.reponses).parDim : null;
  const apres = derniere && derniere !== premiere ? scores(derniere.reponses).parDim : null;
  const progres = avant && apres ? GRILLE.map((g) => ({ g, a: avant[g.id], b: apres[g.id] }))
    .filter((x) => x.a != null && x.b != null && x.b > x.a).sort((x, y) => (y.b! - y.a!) - (x.b! - x.a!)) : [];
  const reussites = d.actions.filter((a) => a.statut === 'terminee').sort((a, b) => b.updated_at.localeCompare(a.updated_at));

  return (
    <section>
      <h2>Mon parcours <small>ce qui a changé</small></h2>
      {progres.length > 0 && (
        <ul className="avant-apres">
          {progres.slice(0, 4).map(({ g, a, b }) => (
            <li key={g.id} style={{ ['--c' as string]: couleur(g.id).c }}>
              <strong>{g.court}</strong>
              <span className="evolution">{a} % <i>→</i> <b>{b} %</b></span>
              <span className="meta">cycle {premiere!.cycle} → cycle {derniere!.cycle} · +{b! - a!} points</span>
            </li>
          ))}
        </ul>
      )}
      {reussites.length ? (
        <ol className="journal">
          {reussites.map((a) => (
            <li key={a.id} style={{ ['--c' as string]: couleur(a.dimension).c }}>
              <strong>{a.titre}</strong>
              <span className="meta">{dimensionTitre(a.dimension)}{a.updated_at && ` · notée terminée le ${dateFr(a.updated_at.slice(0, 10))}`}</span>
              {a.preuve && <span className="meta">« {a.preuve} »</span>}
            </li>
          ))}
        </ol>
      ) : <p className="vide">Les actions terminées s’afficheront ici, comme un journal de vos réussites.</p>}
    </section>
  );
}
