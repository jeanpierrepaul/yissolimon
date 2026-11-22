import { useEffect, useState } from 'react';
import { ACTIVITES, AGES, MATERIELS, OBJECTIFS, THEME_OBJECTIF, activitesPossibles, type Activite, type Age, type Materiel, type Objectif } from '../data/activites';
import { Icone, Mascotte, couleur } from '../components/illustrations';
import { useEnLigne } from '../components/ui';
import { activiteIA, garderIdee, ideesGardees, oublierIdee } from '../lib/ia';

const DUREES = [5, 10, 15];
const CLE = 'yissolimon-activites';

interface Choix { age: Age; minutes: number; dispo: Materiel[]; objectif: Objectif | '' }
function lireChoix(): Choix {
  const defaut: Choix = { age: '3-5', minutes: 15, dispo: [], objectif: '' };
  try { return { ...defaut, ...JSON.parse(localStorage.getItem(CLE) ?? '{}') }; } catch { return defaut; }
}

function CarteActivite({ a, surMesure = false }: { a: Activite; surMesure?: boolean }) {
  const { c, fond } = couleur(THEME_OBJECTIF[a.objectif]);
  return (
    <article className="activite" style={{ ['--c' as string]: c, ['--f' as string]: fond }}>
      <header>
        <span className="activite-tag">{OBJECTIFS[a.objectif]}</span>
        {surMesure && <span className="activite-tag sur-mesure">Idée sur mesure</span>}
        <h2>{a.titre}</h2>
        <p className="activite-infos">
          <span><Icone nom="horloge" taille={16} /> {a.minutes} min</span>
          <span><Icone nom="parents" taille={16} /> {a.ages.map((x) => AGES[x]).join(', ')}</span>
        </p>
      </header>
      <p className="activite-but"><strong>Objectif :</strong> {a.but}</p>
      <p><strong>Matériel :</strong> {a.materiel.length ? a.materiel.map((m) => MATERIELS[m].toLowerCase()).join(', ') : 'aucun'}.</p>
      <h3>Déroulement</h3>
      <ol className="activite-etapes">{a.etapes.map((e) => <li key={e}>{e}</li>)}</ol>
      <div className="activite-encarts">
        <p><strong>Adapter</strong>{a.adaptation}</p>
        <p className="securite"><strong>Sécurité</strong>{a.securite}</p>
        <p><strong>Pas ce matériel ?</strong>{a.variante}</p>
      </div>
      {surMesure && <p className="legende">Idée préparée automatiquement pour vos choix : relisez le matériel et la sécurité avant de la faire.</p>}
    </article>
  );
}

export function Activites() {
  const [choix, setChoix] = useState<Choix>(lireChoix);
  const [index, setIndex] = useState(0);
  useEffect(() => { try { localStorage.setItem(CLE, JSON.stringify(choix)); } catch { /* stockage indisponible */ } }, [choix]);
  const maj = (p: Partial<Choix>) => { setChoix({ ...choix, ...p }); setIndex(0); setPerso(null); };
  const basculer = (m: Materiel) => maj({ dispo: choix.dispo.includes(m) ? choix.dispo.filter((x) => x !== m) : [...choix.dispo, m] });

  const liste = activitesPossibles(choix.age, choix.minutes, choix.dispo, choix.objectif);
  const courante = liste.length ? liste[index % liste.length] : null;
  const autres = liste.filter((a) => a !== courante);

  // Idée sur mesure (assistant, en ligne) et idées gardées sur le téléphone (hors ligne).
  const enLigne = useEnLigne();
  const [perso, setPerso] = useState<Activite | null>(null);
  const [attente, setAttente] = useState(false);
  const [erreurIA, setErreurIA] = useState<string | null>(null);
  const [gardees, setGardees] = useState<Activite[]>(ideesGardees);
  const surMesure = async () => {
    setAttente(true); setErreurIA(null);
    try {
      const a = await activiteIA({ age: choix.age, minutes: choix.minutes, materiel: choix.dispo, objectif: choix.objectif,
        deja: [...ACTIVITES, ...gardees].map((x) => x.titre) });
      if (!a.titre || !a.etapes?.length) throw new Error('Réponse incomplète, réessayez.');
      setPerso(a); window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setErreurIA(e instanceof Error ? e.message : 'Assistant indisponible.'); }
    setAttente(false);
  };
  const garder = (a: Activite) => { garderIdee(a); setGardees(ideesGardees()); };
  const oublier = (id: string) => { oublierIdee(id); setGardees(ideesGardees()); if (perso?.id === id) setPerso(null); };
  const estGardee = (id: string) => gardees.some((x) => x.id === id);

  return (
    <>
      <section className="hero hero-activite">
        <div className="hero-texte">
          <p className="sur">Idée du jour</p>
          <h1>Que puis-je faire aujourd’hui ?</h1>
          <p>Dites-nous l’âge des enfants, le temps et le matériel que vous avez : on vous propose une activité prête à faire, avec ce que vous avez déjà.</p>
        </div>
        <Mascotte taille={130} pose="bravo" className="hero-mascotte" />
      </section>

      <section className="choix-activite">
        <div><p className="etiquette">Âge des enfants</p>
          <div className="filtres">{(Object.keys(AGES) as Age[]).map((k) =>
            <button key={k} className={choix.age === k ? 'choisi' : ''} onClick={() => maj({ age: k })}>{AGES[k]}</button>)}</div></div>
        <div><p className="etiquette">Temps disponible</p>
          <div className="filtres">{DUREES.map((m) =>
            <button key={m} className={choix.minutes === m ? 'choisi' : ''} onClick={() => maj({ minutes: m })}>{m === 15 ? '15 min ou plus' : `${m} min`}</button>)}</div></div>
        <div><p className="etiquette">Ce que j’ai sous la main <small>(plusieurs choix)</small></p>
          <div className="filtres filtres-multi">{(Object.keys(MATERIELS) as Materiel[]).map((m) =>
            <button key={m} className={choix.dispo.includes(m) ? 'choisi' : ''} aria-pressed={choix.dispo.includes(m)} onClick={() => basculer(m)}>
              {choix.dispo.includes(m) && <Icone nom="coche" taille={15} />} {MATERIELS[m]}</button>)}</div></div>
        <div><p className="etiquette">Je veux travailler <small>(facultatif)</small></p>
          <div className="filtres">
            <button className={!choix.objectif ? 'choisi' : ''} onClick={() => maj({ objectif: '' })}>Peu importe</button>
            {(Object.keys(OBJECTIFS) as Objectif[]).map((o) =>
              <button key={o} className={choix.objectif === o ? 'choisi' : ''} onClick={() => maj({ objectif: o })}>{OBJECTIFS[o]}</button>)}</div></div>
      </section>

      <div className="bandeau-ia">
        <span className="bandeau-ia-icone"><Icone nom="eveil" taille={24} /></span>
        <p><strong>Envie d’une nouvelle idée ?</strong> Yissolimon prépare une activité rien que pour vos choix (âge, temps, matériel).</p>
        <button className="bouton petit" disabled={attente || !enLigne} onClick={() => void surMesure()}>
          {attente ? 'Préparation…' : 'Créer une idée sur mesure'}</button>
        {!enLigne && <span className="legende">Disponible avec internet. Les idées gardées restent lisibles hors ligne.</span>}
        {erreurIA && <span className="erreur">{erreurIA}</span>}
      </div>

      {perso && (
        <div id="idee-perso">
          <CarteActivite a={perso} surMesure />
          <div className="pied-etapes actions-idee">
            <button className="lien" onClick={() => setPerso(null)}>Fermer</button>
            {estGardee(perso.id)
              ? <span className="succes">Idée gardée sur ce téléphone</span>
              : <button className="bouton secondaire petit" onClick={() => garder(perso)}>Garder cette idée</button>}
            <button className="bouton petit" disabled={attente || !enLigne} onClick={() => void surMesure()}>{attente ? 'Préparation…' : 'Une autre idée sur mesure'}</button>
          </div>
        </div>
      )}

      {!perso && (courante ? (
        <>
          <div className="activite-barre">
            <p><strong>{liste.length}</strong> activité{liste.length > 1 ? 's' : ''} possible{liste.length > 1 ? 's' : ''} avec vos choix</p>
            {liste.length > 1 && <button className="bouton secondaire petit" onClick={() => setIndex(index + 1)}>Une autre idée</button>}
          </div>
          <CarteActivite a={courante} />
          {autres.length > 0 && (
            <section>
              <h2>Autres idées <small>{autres.length}</small></h2>
              <ul className="liste">{autres.map((a) => (
                <li key={a.id}><button className="ligne-bouton" onClick={() => { setIndex(liste.indexOf(a)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                  <strong>{a.titre}</strong><span className="meta">{a.minutes} min · {OBJECTIFS[a.objectif]}</span></button></li>
              ))}</ul>
            </section>
          )}
        </>
      ) : (
        <p className="vide encadre">Aucune activité de la bibliothèque ne correspond à tous ces choix. Essayez « Peu importe » pour l’objectif, ajoutez du matériel, ou créez une idée sur mesure ci-dessus.</p>
      ))}

      {gardees.length > 0 && (
        <section>
          <h2>Mes idées gardées <small>{gardees.length} · lisibles sans internet</small></h2>
          <ul className="liste">{gardees.map((a) => (
            <li key={a.id} className="ligne-gardee">
              <button className="ligne-bouton" onClick={() => { setPerso(a); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
                <strong>{a.titre}</strong><span className="meta">{a.minutes} min · {OBJECTIFS[a.objectif] ?? ''} · {a.ages.map((x) => AGES[x]).join(', ')}</span></button>
              <button className="lien" onClick={() => oublier(a.id)}>Retirer</button>
            </li>
          ))}</ul>
        </section>
      )}
      <p className="legende">Activités de démonstration, à faire valider par des professionnels de la petite enfance. Elles restent disponibles sans internet.</p>
    </>
  );
}

