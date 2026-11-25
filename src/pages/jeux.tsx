import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mascotte } from '../components/illustrations';

// Espace jeux : petits jeux éducatifs et comptines, par âge, sur le téléphone de l'éducatrice.
// Sans compte, sans internet, rien n'est enregistré. Durée limitée (repères de l'OMS sur les écrans).

type Age = 'bebe' | 'petit' | 'grand';
const AGES: Record<Age, [string, string]> = { bebe: ['Moins de 2 ans', 'Comptines'], petit: ['2 à 3 ans', 'Jeux et comptines'], grand: ['3 à 6 ans', 'Jeux et comptines'] };
const LIMITE_MIN = 10;

/* ---------- Sons et voix (Web Audio + synthèse vocale du téléphone, hors ligne) ---------- */
let ctx: AudioContext | null = null;
function note(freq: number, dur = 0.22, quand = 0, type: OscillatorType = 'sine', vol = 0.25) {
  try {
    ctx ??= new AudioContext();
    if (ctx.state === 'suspended') void ctx.resume();
    const t = ctx.currentTime + quand;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + dur + 0.05);
  } catch { /* son indisponible */ }
}
const bravo = () => [523, 659, 784, 1047].forEach((f, i) => note(f, 0.2, i * 0.1, 'triangle'));
const oups = () => { note(330, 0.18, 0, 'sine', 0.18); note(262, 0.25, 0.15, 'sine', 0.18); };
const pop = () => note(500 + Math.random() * 500, 0.12, 0, 'triangle');
function dire(t: string) {
  try {
    const s = window.speechSynthesis;
    if (!s) return;
    s.cancel();
    const u = new SpeechSynthesisUtterance(t);
    u.lang = 'fr-FR'; u.rate = 0.9; u.pitch = 1.15;
    const v = s.getVoices().find((x) => x.lang.toLowerCase().startsWith('fr'));
    if (v) u.voice = v;
    s.speak(u);
  } catch { /* voix indisponible */ }
}
const hasard = <T,>(l: T[]) => l[Math.floor(Math.random() * l.length)];
const melanger = <T,>(l: T[]) => [...l].sort(() => Math.random() - 0.5);

/* ---------- Bouton réservé à l'adulte : il faut garder le doigt appuyé ---------- */
function BoutonAdulte({ onFini, children, className = '' }: { onFini: () => void; children: ReactNode; className?: string }) {
  const [p, setP] = useState(0);
  const minuteur = useRef<number | null>(null);
  const arreter = () => { if (minuteur.current) window.clearInterval(minuteur.current); minuteur.current = null; setP(0); };
  const demarrer = () => {
    arreter();
    const debut = Date.now();
    minuteur.current = window.setInterval(() => {
      const v = Math.min(100, ((Date.now() - debut) / 1500) * 100);
      setP(v);
      if (v >= 100) { arreter(); onFini(); }
    }, 50);
  };
  useEffect(() => arreter, []);
  return (
    <button type="button" className={`bouton-adulte ${className}`} onPointerDown={demarrer} onPointerUp={arreter} onPointerLeave={arreter}
      onContextMenu={(e) => e.preventDefault()} aria-label="Bouton adulte : garder le doigt appuyé">
      <span className="bouton-adulte-jauge" style={{ width: `${p}%` }} />
      <span className="bouton-adulte-texte">{children}</span>
    </button>
  );
}

/* ---------- Jeu 1 : les bulles (2-3 ans) — cause et effet, motricité fine ---------- */
const TEINTES = ['#6C4CF1', '#F2557F', '#FFC93C', '#2FA866', '#1FA6DB', '#F2762E'];
function Bulles() {
  const [bulles, setBulles] = useState<{ id: number; x: number; d: number; c: string; dur: number }[]>([]);
  const [n, setN] = useState(0);
  const id = useRef(0);
  useEffect(() => {
    const t = window.setInterval(() => setBulles((b) => b.length >= 9 ? b : [...b,
      { id: id.current++, x: 5 + Math.random() * 75, d: 60 + Math.random() * 50, c: hasard(TEINTES), dur: 5 + Math.random() * 4 }]), 800);
    return () => window.clearInterval(t);
  }, []);
  const eclater = (k: number) => {
    pop(); setBulles((b) => b.filter((x) => x.id !== k));
    const w = n + 1; setN(w);
    if (w % 10 === 0) { bravo(); dire(`Bravo ! ${w} bulles !`); }
  };
  return (
    <div className="jeu-bulles">
      <p className="jeu-score">Bulles éclatées : <strong>{n}</strong></p>
      {bulles.map((b) => (
        <button key={b.id} className="bulle" aria-label="Bulle"
          style={{ left: `${b.x}%`, width: b.d, height: b.d, background: `radial-gradient(circle at 30% 30%, #fff, ${b.c})`, animationDuration: `${b.dur}s` }}
          onPointerDown={() => eclater(b.id)}
          onAnimationEnd={() => setBulles((l) => l.filter((x) => x.id !== b.id))} />
      ))}
    </div>
  );
}

/* ---------- Jeu 2 : les animaux (2-6 ans) — vocabulaire, écoute ---------- */
const ANIMAUX: [string, string, string][] = [
  ['🐔', 'La poule', 'cot cot codet'], ['🐐', 'La chèvre', 'bê bê'], ['🐄', 'La vache', 'meuh'], ['🐑', 'Le mouton', 'bêêê'],
  ['🐶', 'Le chien', 'ouaf ouaf'], ['🐱', 'Le chat', 'miaou'], ['🦆', 'Le canard', 'coin coin'], ['🐒', 'Le singe', 'hou hou ha ha'],
  ['🐘', 'L’éléphant', 'pouuu'], ['🐟', 'Le poisson', 'bloub bloub'],
];
function Animaux() {
  const [actif, setActif] = useState<number | null>(null);
  return (
    <div className="grille-animaux">
      {ANIMAUX.map(([e, nom, cri], i) => (
        <button key={nom} className={`carte-animal ${actif === i ? 'actif' : ''}`}
          onClick={() => { setActif(i); note(440 + i * 40, 0.15, 0, 'triangle'); dire(`${nom} ! ${cri}`); }}>
          <span className="emoji">{e}</span><span>{nom}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Jeu 3 : les couleurs (2-3 ans) ---------- */
const COULEURS: [string, string][] = [['rouge', '#E04F4F'], ['bleu', '#1F7FDB'], ['jaune', '#FFC93C'], ['vert', '#2FA866'], ['orange', '#F2762E'], ['violet', '#6C4CF1']];
function Couleurs() {
  const tirer = () => { const choix = melanger(COULEURS).slice(0, 3); return { choix, cible: hasard(choix) }; };
  const [m, setM] = useState(tirer);
  const [faux, setFaux] = useState<string | null>(null);
  const [points, setPoints] = useState(0);
  useEffect(() => { dire(`Touche le ${m.cible[0]}`); }, [m]);
  const choisir = (c: [string, string]) => {
    if (c[0] === m.cible[0]) { bravo(); setPoints((p) => p + 1); dire(`Oui ! C’est le ${c[0]} !`); window.setTimeout(() => setM(tirer()), 1300); }
    else { oups(); setFaux(c[0]); window.setTimeout(() => setFaux(null), 500); dire(`Non, ça c’est le ${c[0]}. Touche le ${m.cible[0]}`); }
  };
  return (
    <div className="jeu-centre">
      <p className="consigne">Touche le <strong style={{ color: m.cible[1] }}>{m.cible[0]}</strong> <button className="rejouer" onClick={() => dire(`Touche le ${m.cible[0]}`)} aria-label="Répéter la consigne">🔊</button></p>
      <div className="rangee-choix">
        {m.choix.map((c) => <button key={c[0]} className={`rond-couleur ${faux === c[0] ? 'secoue' : ''}`} style={{ background: c[1] }} aria-label={c[0]} onClick={() => choisir(c)} />)}
      </div>
      <p className="jeu-score">⭐ {points}</p>
    </div>
  );
}

/* ---------- Jeu 4 : compter (3-6 ans) ---------- */
const FRUITS: [string, string][] = [['🥭', 'mangues'], ['🍌', 'bananes'], ['🍊', 'oranges'], ['🍍', 'ananas'], ['🥥', 'noix de coco']];
const de = (mot: string) => (/^[aeiouy]/i.test(mot) ? `d’${mot}` : `de ${mot}`);
function Compter() {
  const [max, setMax] = useState(5);
  const tirer = (mx: number) => {
    const n = 1 + Math.floor(Math.random() * mx);
    const autres = melanger([...Array(mx + 2).keys()].map((x) => x + 1).filter((x) => x !== n)).slice(0, 2);
    return { n, fruit: hasard(FRUITS), choix: melanger([n, ...autres]) };
  };
  const [m, setM] = useState(() => tirer(5));
  const [points, setPoints] = useState(0);
  const [faux, setFaux] = useState<number | null>(null);
  useEffect(() => { dire(`Combien ${de(m.fruit[1])} ?`); }, [m]);
  const choisir = (x: number) => {
    if (x === m.n) {
      bravo(); dire(`Oui ! ${m.n} ${m.fruit[1]} !`);
      const p = points + 1; setPoints(p);
      const mx = p >= 5 ? 10 : 5; setMax(mx);
      window.setTimeout(() => setM(tirer(mx)), 1500);
    } else { oups(); setFaux(x); window.setTimeout(() => setFaux(null), 500); dire('Essaie encore. Compte avec ton doigt.'); }
  };
  return (
    <div className="jeu-centre">
      <p className="consigne">Combien {de(m.fruit[1])} ? <button className="rejouer" onClick={() => dire(`Combien ${de(m.fruit[1])} ?`)} aria-label="Répéter la consigne">🔊</button></p>
      <div className="fruits">{[...Array(m.n)].map((_, i) => <span key={i} onClick={() => { note(400 + i * 60, 0.12); dire(String(i + 1)); }}>{m.fruit[0]}</span>)}</div>
      <div className="rangee-choix">
        {m.choix.map((x) => <button key={x} className={`chiffre ${faux === x ? 'secoue' : ''}`} onClick={() => choisir(x)}>{x}</button>)}
      </div>
      <p className="jeu-score">⭐ {points}{max === 10 && ' · niveau 2 : jusqu’à 10'}</p>
    </div>
  );
}

/* ---------- Jeu 5 : les formes (3-6 ans) ---------- */
const FORMES: Record<string, [string, string]> = {
  cercle: ['le rond', '<circle cx="50" cy="50" r="40"/>'],
  carre: ['le carré', '<rect x="12" y="12" width="76" height="76" rx="6"/>'],
  triangle: ['le triangle', '<path d="M50 8 92 88H8z"/>'],
  etoile: ['l’étoile', '<path d="M50 6l12 30 32 2-25 20 9 32-28-18-28 18 9-32L6 38l32-2z"/>'],
  coeur: ['le cœur', '<path d="M50 88S8 62 8 34a20 20 0 0 1 42-10 20 20 0 0 1 42 10c0 28-42 54-42 54z"/>'],
};
function Formes() {
  const tirer = () => { const choix = melanger(Object.keys(FORMES)).slice(0, 3); return { choix, cible: hasard(choix), teinte: hasard(TEINTES) }; };
  const [m, setM] = useState(tirer);
  const [points, setPoints] = useState(0);
  const [faux, setFaux] = useState<string | null>(null);
  useEffect(() => { dire(`Où est ${FORMES[m.cible][0]} ?`); }, [m]);
  const choisir = (f: string) => {
    if (f === m.cible) { bravo(); setPoints((p) => p + 1); dire(`Bravo ! C’est ${FORMES[f][0]} !`); window.setTimeout(() => setM(tirer()), 1300); }
    else { oups(); setFaux(f); window.setTimeout(() => setFaux(null), 500); dire(`Ça, c’est ${FORMES[f][0]}. Cherche ${FORMES[m.cible][0]}.`); }
  };
  return (
    <div className="jeu-centre">
      <p className="consigne">Où est <strong>{FORMES[m.cible][0]}</strong> ? <button className="rejouer" onClick={() => dire(`Où est ${FORMES[m.cible][0]} ?`)} aria-label="Répéter la consigne">🔊</button></p>
      <div className="rangee-choix">
        {m.choix.map((f) => (
          <button key={f} className={`forme ${faux === f ? 'secoue' : ''}`} onClick={() => choisir(f)} aria-label={FORMES[f][0]}>
            <svg viewBox="0 0 100 100" fill={m.teinte} dangerouslySetInnerHTML={{ __html: FORMES[f][1] }} />
          </button>
        ))}
      </div>
      <p className="jeu-score">⭐ {points}</p>
    </div>
  );
}

/* ---------- Jeu 6 : mémoire (3-6 ans) ---------- */
const IMAGES = ['🥭', '🐔', '🐘', '🍌', '🐟', '⚽', '🌞', '🥁'];
function Memoire() {
  const nouvelle = () => melanger(melanger(IMAGES).slice(0, 4).flatMap((e) => [e, e])).map((e, i) => ({ i, e }));
  const [cartes, setCartes] = useState(nouvelle);
  const [ouvertes, setOuvertes] = useState<number[]>([]);
  const [trouvees, setTrouvees] = useState<string[]>([]);
  const toucher = (k: number) => {
    if (ouvertes.length === 2 || ouvertes.includes(k) || trouvees.includes(cartes[k].e)) return;
    note(520, 0.1, 0, 'triangle');
    const o = [...ouvertes, k]; setOuvertes(o);
    if (o.length === 2) {
      if (cartes[o[0]].e === cartes[o[1]].e) {
        const t = [...trouvees, cartes[k].e];
        window.setTimeout(() => { setTrouvees(t); setOuvertes([]); bravo(); if (t.length === 4) dire('Bravo ! Tu as tout trouvé !'); }, 450);
      } else window.setTimeout(() => setOuvertes([]), 1000);
    }
  };
  const fini = trouvees.length === 4;
  return (
    <div className="jeu-centre">
      <p className="consigne">Trouve les paires</p>
      <div className="memoire">
        {cartes.map((c) => {
          const vue = ouvertes.includes(c.i) || trouvees.includes(c.e);
          return <button key={c.i} className={`carte-memoire ${vue ? 'vue' : ''} ${trouvees.includes(c.e) ? 'trouvee' : ''}`} onClick={() => toucher(c.i)} aria-label={vue ? c.e : 'Carte cachée'}>{vue ? c.e : '?'}</button>;
        })}
      </div>
      {fini && <button className="bouton" onClick={() => { setCartes(nouvelle()); setTrouvees([]); setOuvertes([]); }}>Rejouer</button>}
    </div>
  );
}

/* ---------- Comptines originales (paroles Yissolimon) avec mélodie simple ---------- */
const N: Record<string, number> = { C4: 262, D4: 294, E4: 330, F4: 349, G4: 392, A4: 440, B4: 494, C5: 523, D5: 587, E5: 659 };
interface Comptine { id: string; titre: string; theme: string; paroles: string[]; melodie: string[][] }
const COMPTINES: Comptine[] = [
  { id: 'mains', titre: 'Je lave mes mains', theme: 'Hygiène', paroles: ['Je lave, je lave, je lave mes mains,', 'Avec de l’eau et du savon,', 'Dessus, dessous, entre les doigts,', 'Et les microbes s’en vont !'],
    melodie: [['C4', 'E4', 'G4', 'E4', 'C4', 'E4', 'G4', 'G4'], ['A4', 'G4', 'E4', 'G4', 'A4', 'G4', 'E4'], ['F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'E4'], ['G4', 'E4', 'D4', 'E4', 'C4', 'C4']] },
  { id: 'compte', titre: 'Un, deux, trois', theme: 'Compter', paroles: ['Un, deux, trois, je tape des mains,', 'Quatre, cinq, six, je tape des pieds,', 'Sept, huit, neuf, je tourne en rond,', 'Et dix ! Je m’assois tout doux.'],
    melodie: [['C4', 'D4', 'E4', 'G4', 'G4', 'E4', 'C4', 'C4'], ['D4', 'E4', 'F4', 'A4', 'A4', 'F4', 'D4', 'D4'], ['E4', 'F4', 'G4', 'C5', 'B4', 'A4', 'G4'], ['C5', 'G4', 'E4', 'D4', 'C4']] },
  { id: 'bonjour', titre: 'Bonjour les amis', theme: 'Bien-être', paroles: ['Bonjour, bonjour, bonjour les amis,', 'Je suis content, je suis ici,', 'On va jouer, on va chanter,', 'Ensemble on va bien s’amuser !'],
    melodie: [['G4', 'E4', 'G4', 'E4', 'G4', 'A4', 'G4', 'E4'], ['F4', 'F4', 'E4', 'D4', 'E4', 'F4', 'E4'], ['G4', 'G4', 'A4', 'G4', 'C5', 'B4', 'A4'], ['G4', 'E4', 'F4', 'D4', 'E4', 'C4', 'C4']] },
  { id: 'corps', titre: 'Mon corps', theme: 'Langage', paroles: ['J’ai deux yeux pour regarder,', 'Un petit nez pour respirer,', 'Une bouche pour bien chanter,', 'Et deux mains pour applaudir !'],
    melodie: [['E4', 'E4', 'G4', 'G4', 'A4', 'G4', 'E4'], ['D4', 'D4', 'F4', 'F4', 'G4', 'F4', 'D4'], ['E4', 'E4', 'G4', 'G4', 'C5', 'B4', 'A4'], ['G4', 'E4', 'D4', 'D4', 'E4', 'C4']] },
];
const TEMPS = 0.36;
function Comptines() {
  const [en, setEn] = useState<{ id: string; ligne: number } | null>(null);
  const minuteurs = useRef<number[]>([]);
  const stop = () => { minuteurs.current.forEach((t) => window.clearTimeout(t)); minuteurs.current = []; setEn(null); };
  useEffect(() => stop, []);
  const jouer = (c: Comptine) => {
    stop();
    let t = 0;
    c.melodie.forEach((ligne, li) => {
      minuteurs.current.push(window.setTimeout(() => setEn({ id: c.id, ligne: li }), t * 1000));
      ligne.forEach((n, k) => note(N[n], TEMPS * 0.9, t + k * TEMPS, 'triangle', 0.22));
      t += ligne.length * TEMPS + 0.25;
    });
    minuteurs.current.push(window.setTimeout(() => setEn(null), t * 1000));
  };
  return (
    <div className="comptines">
      {COMPTINES.map((c) => (
        <article key={c.id} className={`comptine ${en?.id === c.id ? 'en-cours' : ''}`}>
          <header><strong>{c.titre}</strong><small>{c.theme}</small></header>
          <ol>{c.paroles.map((p, i) => <li key={p} className={en?.id === c.id && en.ligne === i ? 'chantee' : ''}>{p}</li>)}</ol>
          <div className="comptine-boutons">
            {en?.id === c.id
              ? <button className="bouton petit secondaire" onClick={stop}>Arrêter</button>
              : <button className="bouton petit" onClick={() => jouer(c)}>▶ Mélodie</button>}
            <button className="bouton petit secondaire" onClick={() => { stop(); dire(c.paroles.join(' ')); }}>🔊 Dire les paroles</button>
          </div>
        </article>
      ))}
      <p className="legende">Paroles originales Yissolimon, à chanter avec les enfants, en français ou dans votre langue.</p>
    </div>
  );
}

/* ---------- La page ---------- */
const JEUX: Record<string, { titre: string; emoji: string; ages: Age[]; apprend: string; rendu: () => ReactNode }> = {
  bulles: { titre: 'Les bulles', emoji: '🫧', ages: ['petit'], apprend: 'Coordonner l’œil et la main', rendu: () => <Bulles /> },
  animaux: { titre: 'Les animaux', emoji: '🐐', ages: ['petit', 'grand'], apprend: 'Écouter et nommer', rendu: () => <Animaux /> },
  couleurs: { titre: 'Les couleurs', emoji: '🎨', ages: ['petit'], apprend: 'Reconnaître les couleurs', rendu: () => <Couleurs /> },
  compter: { titre: 'Compter', emoji: '🥭', ages: ['grand'], apprend: 'Compter jusqu’à 10', rendu: () => <Compter /> },
  formes: { titre: 'Les formes', emoji: '🔺', ages: ['grand'], apprend: 'Reconnaître les formes', rendu: () => <Formes /> },
  memoire: { titre: 'Mémoire', emoji: '🃏', ages: ['grand'], apprend: 'Se souvenir, se concentrer', rendu: () => <Memoire /> },
  comptines: { titre: 'Comptines', emoji: '🎵', ages: ['bebe', 'petit', 'grand'], apprend: 'Chanter, parler, bouger', rendu: () => <Comptines /> },
};

export function EspaceJeux() {
  const nav = useNavigate();
  const [age, setAge] = useState<Age | null>(null);
  const [jeu, setJeu] = useState<string | null>(null);
  const [debut, setDebut] = useState<number | null>(null);
  const [pause, setPause] = useState(false);
  const [limite, setLimite] = useState(LIMITE_MIN);

  // Temps d'écran : au bout de la limite, Dévi propose d'aller jouer autrement.
  useEffect(() => {
    if (debut === null) return;
    const t = window.setInterval(() => { if (Date.now() - debut >= limite * 60000) { setPause(true); setJeu(null); bravo(); dire('Bravo ! Maintenant, on pose le téléphone et on va jouer avec les copains !'); } }, 5000);
    return () => window.clearInterval(t);
  }, [debut, limite]);

  const ouvrir = (k: string) => { setJeu(k); if (debut === null) setDebut(Date.now()); };
  const sortir = () => { window.speechSynthesis?.cancel(); if (window.history.length > 1) nav(-1); else nav('/'); };

  if (pause) {
    return (
      <div className="espace-jeux pause-jeux">
        <Mascotte taille={170} pose="bravo" className="centre" />
        <h1>Bravo, tu as bien joué !</h1>
        <p>Maintenant, on pose le téléphone et on va jouer avec les copains.</p>
        <BoutonAdulte onFini={() => { setPause(false); setDebut(Date.now()); setLimite(5); }}>Adulte : 5 minutes de plus (garder appuyé)</BoutonAdulte>
        <BoutonAdulte onFini={sortir} className="sortie">Adulte : quitter l’espace jeux (garder appuyé)</BoutonAdulte>
      </div>
    );
  }

  return (
    <div className="espace-jeux">
      <header className="jeux-tete">
        {jeu ? <button className="retour-jeux" onClick={() => { window.speechSynthesis?.cancel(); setJeu(null); }} aria-label="Retour aux jeux">←</button>
          : age ? <button className="retour-jeux" onClick={() => setAge(null)} aria-label="Changer d’âge">←</button> : <Mascotte taille={44} />}
        <strong>{jeu ? `${JEUX[jeu].emoji} ${JEUX[jeu].titre}` : 'Espace jeux'}</strong>
        <BoutonAdulte onFini={sortir} className="petit-adulte">Sortir</BoutonAdulte>
      </header>

      {jeu ? <main className="jeu-zone">{JEUX[jeu].rendu()}</main> : !age ? (
        <main className="jeux-accueil">
          <Mascotte taille={120} pose="salut" className="centre" />
          <h1>Quel âge a l’enfant ?</h1>
          <div className="ages-jeux">
            {(Object.keys(AGES) as Age[]).map((a) => (
              <button key={a} className={`age-jeu age-${a}`} onClick={() => setAge(a)}><strong>{AGES[a][0]}</strong><span>{AGES[a][1]}</span></button>
            ))}
          </div>
          <p className="legende">Pour l’adulte : sans internet, sans compte, rien n’est enregistré. Pour sortir, gardez le doigt appuyé sur « Sortir ». Les parties s’arrêtent après {LIMITE_MIN} minutes.</p>
        </main>
      ) : (
        <main className="jeux-accueil">
          {age === 'bebe' ? (
            <div className="conseil-ecran">
              <strong>Avant 2 ans : pas d’écran pour jouer.</strong>
              <p>C’est la recommandation de l’OMS. L’enfant apprend avec vous : chantez ces comptines en le regardant, et jouez sans téléphone.</p>
              <ul>
                <li>Coucou, caché ! avec un pagne</li>
                <li>Empiler et faire tomber des gobelets</li>
                <li>Nommer les parties du corps en les touchant</li>
                <li>Taper des mains en rythme en chantant</li>
              </ul>
            </div>
          ) : (
            <p className="conseil-ecran court">De 2 à 5 ans : pas plus d’une heure d’écran par jour, et toujours avec un adulte à côté (OMS).</p>
          )}
          <div className="grille-jeux">
            {Object.entries(JEUX).filter(([, j]) => j.ages.includes(age)).map(([k, j]) => (
              <button key={k} className="tuile-jeu" onClick={() => ouvrir(k)}>
                <span className="emoji">{j.emoji}</span><strong>{j.titre}</strong><small>{j.apprend}</small>
              </button>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
