import { useId } from 'react';

/** Couleur et fond pastel de chaque thème de la grille. */
export const COULEURS: Record<string, { c: string; fond: string }> = {
  securite: { c: '#F2762E', fond: '#FFEFE4' },
  hygiene: { c: '#1FA6DB', fond: '#E2F5FD' },
  nutrition: { c: '#2FA866', fond: '#E3F6EB' },
  eveil: { c: '#E8A300', fond: '#FFF5D6' },
  bienetre: { c: '#F2557F', fond: '#FFE7EE' },
  inclusion: { c: '#8656F0', fond: '#F0E9FE' },
  protection: { c: '#4767E8', fond: '#E7EBFD' },
  familles: { c: '#12A594', fond: '#DDF6F2' },
  services: { c: '#DC4C4C', fond: '#FDE6E6' },
};
export const couleur = (dim: string) => COULEURS[dim] ?? { c: '#6C4CF1', fond: '#EFEBFF' };

/** Tracés des icônes (24 × 24, traits arrondis). */
const TRACES: Record<string, string[]> = {
  // Thèmes
  securite: ['M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z', 'M9 12l2 2 4-4'],
  hygiene: ['M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z', 'M9.5 14.5A2.5 2.5 0 0 0 12 17'],
  nutrition: ['M4 11h16a8 8 0 0 1-16 0z', 'M9 4c-1 1.5 1 2.5 0 4', 'M13 4c-1 1.5 1 2.5 0 4'],
  eveil: ['M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.9l-5.3 2.5 1.2-6-4.5-4.1 6-.7z'],
  bienetre: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  inclusion: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M16.5 11.5a2.5 2.5 0 1 0 0-5', 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M16 14.5c2.8.3 5 2.6 5 5.5'],
  protection: ['M3 12a9 9 0 0 1 18 0z', 'M12 12v6a2 2 0 0 0 4 0', 'M12 3v0'],
  familles: ['M4 11l8-7 8 7v9H4z', 'M10 20v-5h4v5'],
  services: ['M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z', 'M12 7.5v5', 'M9.5 10h5'],
  // Navigation et divers
  accueil: ['M4 11l8-7 8 7v9h-5v-6H9v6H4z'],
  plan: ['M10 6h10', 'M10 12h10', 'M10 18h10', 'M4 6l1.2 1.2L7.5 5', 'M4 12l1.2 1.2 2.3-2.2', 'M4 18l1.2 1.2 2.3-2.2'],
  fiches: ['M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z', 'M4 20.5V5.5', 'M9 8h7'],
  suivi: ['M4 20V11', 'M10 20V5', 'M16 20v-7', 'M2 20h20'],
  compte: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z', 'M4 21c0-4 3.6-7 8-7s8 3 8 7'],
  garderies: ['M3 21V9l9-5 9 5v12', 'M9 21v-6h6v6', 'M3 21h18'],
  commune: ['M4 20V11', 'M10 20V5', 'M16 20v-7', 'M2 20h20'],
  activites: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M3.5 9.5c3 1 6 1 8.5-1s5.5-2 8.5-1', 'M3.5 14.5c3-1 6-1 8.5 1s5.5 2 8.5 1'],
  horloge: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', 'M12 7v5l3 2'],
  lieu: ['M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z', 'M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z'],
  telephone: ['M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z'],
  fleche: ['M5 12h14', 'M13 6l6 6-6 6'],
  coche: ['M5 12.5l4.5 4.5L19 7.5'],
  coeur: ['M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z'],
  parents: ['M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6z', 'M16.5 11.5a2.5 2.5 0 1 0 0-5', 'M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6', 'M16 14.5c2.8.3 5 2.6 5 5.5'],
};

export function Icone({ nom, taille = 22, className }: { nom: string; taille?: number; className?: string }) {
  const t = TRACES[nom] ?? TRACES.eveil;
  return (
    <svg className={className} width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {t.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/** Pastille colorée avec l'icône d'un thème. */
export function PastilleTheme({ dim, taille = 44 }: { dim: string; taille?: number }) {
  const { c, fond } = couleur(dim);
  return (
    <span className="pastille-theme" style={{ background: fond, color: c, width: taille, height: taille }}>
      <Icone nom={dim} taille={Math.round(taille * 0.52)} />
    </span>
  );
}

/** Icône et couleur d'un type de service de l'annuaire. */
const SERVICE: Record<string, [string, string]> = {
  sante: ['services', 'services'], nutrition: ['nutrition', 'nutrition'], social: ['familles', 'familles'],
  protection: ['protection', 'protection'], etat_civil: ['fiches', 'eveil'], education: ['eveil', 'inclusion'],
};
export const ORDRE_SERVICES = ['sante', 'nutrition', 'protection', 'etat_civil', 'social', 'education'];
export const rangService = (t: string) => ORDRE_SERVICES.indexOf(t) + 1 || 99;
export const couleurService = (type: string) => couleur(SERVICE[type]?.[1] ?? 'services');
export function PastilleService({ type, taille = 44 }: { type: string; taille?: number }) {
  const { c, fond } = couleurService(type);
  return (
    <span className="pastille-theme" style={{ background: fond, color: c, width: taille, height: taille }}>
      <Icone nom={SERVICE[type]?.[0] ?? 'services'} taille={Math.round(taille * 0.52)} />
    </span>
  );
}

/**
 * Dévi, la mascotte : un petit tisserin, l'oiseau qui construit son nid en communauté.
 * pose : « normal », « salut » (aile levée) ou « bravo » (avec une étoile).
 */
export function Mascotte({ taille = 140, pose = 'normal', className }: { taille?: number; pose?: 'normal' | 'salut' | 'bravo'; className?: string }) {
  const id = useId().replace(/:/g, '');
  const aileDroite = pose === 'normal'
    ? <ellipse cx="157" cy="126" rx="15" ry="27" transform="rotate(22 157 126)" fill={`url(#aile${id})`} />
    : <ellipse cx="160" cy="84" rx="15" ry="28" transform="rotate(38 160 84)" fill={`url(#aile${id})`} />;
  return (
    <svg className={className} width={taille} height={taille} viewBox="0 0 200 200" role="img" aria-label="Dévi, la mascotte de Yissolimon">
      <defs>
        <radialGradient id={`corps${id}`} cx="40%" cy="35%" r="70%">
          <stop offset="0" stopColor="#FFE680" /><stop offset=".55" stopColor="#FFC93C" /><stop offset="1" stopColor="#F29E1F" />
        </radialGradient>
        <linearGradient id={`aile${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#F7B52C" /><stop offset="1" stopColor="#D9861A" />
        </linearGradient>
        <linearGradient id={`bec${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FF9A4D" /><stop offset="1" stopColor="#F2661F" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="186" rx="44" ry="7" fill="#2B1F66" opacity=".1" />
      {/* pattes */}
      <g stroke="#F2661F" strokeWidth="5" strokeLinecap="round" fill="none">
        <path d="M84 166v14M84 180l-7 4M84 180l7 4" /><path d="M116 166v14M116 180l-7 4M116 180l7 4" />
      </g>
      {/* aile gauche */}
      <ellipse cx="43" cy="126" rx="15" ry="27" transform="rotate(-22 43 126)" fill={`url(#aile${id})`} />
      {/* corps */}
      <path d="M92 50c3-14 13-16 14-4 5-10 14-7 10 6" fill="#F7B52C" />
      <ellipse cx="100" cy="112" rx="62" ry="60" fill={`url(#corps${id})`} />
      <ellipse cx="100" cy="134" rx="38" ry="31" fill="#FFF3CF" />
      {aileDroite}
      {/* yeux */}
      <ellipse cx="81" cy="100" rx="14" ry="16" fill="#fff" /><ellipse cx="119" cy="100" rx="14" ry="16" fill="#fff" />
      <circle cx="83" cy="103" r="8.5" fill="#2B1F4D" /><circle cx="117" cy="103" r="8.5" fill="#2B1F4D" />
      <circle cx="86.5" cy="99" r="3" fill="#fff" /><circle cx="120.5" cy="99" r="3" fill="#fff" />
      {/* joues et bec */}
      <ellipse cx="64" cy="121" rx="8" ry="5" fill="#FF7E8A" opacity=".55" /><ellipse cx="136" cy="121" rx="8" ry="5" fill="#FF7E8A" opacity=".55" />
      <path d="M90 117q10-6 20 0-4 12-10 13-6-1-10-13z" fill={`url(#bec${id})`} />
      {pose === 'bravo' && (
        <g transform="translate(150 30)">
          <path d="M18 0l5.3 11.4 12.4 1.5-9.1 8.6 2.4 12.3L18 27.7 7 33.8l2.4-12.3L.3 12.9l12.4-1.5z" fill="#FFC93C" stroke="#E8A300" strokeWidth="2" strokeLinejoin="round" />
        </g>
      )}
    </svg>
  );
}
