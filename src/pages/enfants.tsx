import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ACTIVITES } from '../data/activites';
import { CONSEIL_ALERTE, DOMAINES, ORDRE_DOMAINES, ORDRE_TRANCHES, SOURCES_REPERES, TRANCHES, reperesDe, type Tranche } from '../data/reperes';
import { getMeta, setMeta } from '../lib/db';
import { Icone, couleur } from '../components/illustrations';
import { Titre } from '../components/ui';

/** Nombre d'enfants par tranche d'âge : seulement des chiffres, jamais de nom. Gardé sur le téléphone. */
export type Effectifs = Record<Tranche, number>;
const cle = (garderieId: string) => `enfants-${garderieId}`;

export function useEffectifs(garderieId: string | null | undefined) {
  const [eff, setEff] = useState<Effectifs | null | undefined>(undefined);
  useEffect(() => {
    if (!garderieId) { setEff(null); return; }
    void getMeta<Effectifs>(cle(garderieId)).then((v) => setEff(v ?? null));
  }, [garderieId]);
  const enregistrer = async (v: Effectifs) => { if (garderieId) { await setMeta(cle(garderieId), v); setEff(v); } };
  return [eff, enregistrer] as const;
}
export const total = (e: Effectifs) => e.bebes + e.petits + e.grands;

/** Saisie rapide des effectifs : trois chiffres. */
export function FormEffectifs({ init, onFini }: { init: Effectifs | null; onFini: (e: Effectifs) => void }) {
  const [v, setV] = useState<Effectifs>(init ?? { bebes: 0, petits: 0, grands: 0 });
  const changer = (t: Tranche, d: number) => setV({ ...v, [t]: Math.max(0, Math.min(300, v[t] + d)) });
  return (
    <div className="effectifs-form">
      {ORDRE_TRANCHES.map((t) => (
        <div key={t} className="effectif-ligne">
          <span><strong>{TRANCHES[t].nom}</strong><small>{TRANCHES[t].ages}</small></span>
          <span className="compteur">
            <button type="button" onClick={() => changer(t, -1)} aria-label={`Un enfant de moins chez les ${TRANCHES[t].nom.toLowerCase()}`}>−</button>
            <input inputMode="numeric" value={v[t]} aria-label={`Nombre de ${TRANCHES[t].nom.toLowerCase()}`}
              onChange={(e) => setV({ ...v, [t]: Math.max(0, Math.min(300, Number(e.target.value.replace(/\D/g, '')) || 0)) })} />
            <button type="button" onClick={() => changer(t, 1)} aria-label={`Un enfant de plus chez les ${TRANCHES[t].nom.toLowerCase()}`}>+</button>
          </span>
        </div>
      ))}
      <p className="legende">Seulement des chiffres : aucun nom, aucune photo. Ils restent sur ce téléphone.</p>
      <button className="bouton" disabled={total(v) === 0} onClick={() => onFini(v)}>Enregistrer</button>
    </div>
  );
}

/** Une activité du jour pour une tranche : change chaque jour, sans rien enregistrer. */
export function activiteDuJour(t: Tranche) {
  const l = ACTIVITES.filter((a) => a.ages.includes(TRANCHES[t].activite));
  if (!l.length) return null;
  const jour = Math.floor(Date.now() / 864e5);
  return l[jour % l.length];
}

/** Page « Nos enfants » : repères de développement par âge, gestes utiles et signes d'alerte. */
export function MesEnfants() {
  const [params, setParams] = useSearchParams();
  const t = (ORDRE_TRANCHES.includes(params.get('tranche') as Tranche) ? params.get('tranche') : 'petits') as Tranche;
  return (
    <>
      <Titre sur="Le développement de l’enfant">Nos enfants, âge par âge</Titre>
      <p className="intro-enfants">Ce que la plupart des enfants savent faire, comment les aider chaque jour à la garderie, et les signes qui doivent faire réagir.</p>
      <Reperes tranche={t} choisir={(x) => setParams({ tranche: x }, { replace: true })} />
    </>
  );
}

/**
 * Repères par tranche d'âge. Côté parents (page publique) : pas de lien vers les pages de l'équipe,
 * le bouton « centre de santé » ouvre l'onglet Services de l'espace parents.
 */
export function Reperes({ tranche: t, choisir, versServices }: { tranche: Tranche; choisir: (t: Tranche) => void; versServices?: () => void }) {
  const parent = !!versServices;
  const reperes = reperesDe(t);
  const [ouvert, setOuvert] = useState<string | undefined>(reperes[0]?.id);
  useEffect(() => { setOuvert(reperesDe(t)[0]?.id); }, [t]);
  const act = parent ? null : activiteDuJour(t);

  return (
    <>
      <div className="onglets onglets-ages" role="tablist">
        {ORDRE_TRANCHES.map((x) => (
          <button key={x} role="tab" aria-selected={t === x} className={t === x ? 'choisi' : ''}
            onClick={() => choisir(x)}>{TRANCHES[x].nom}<small className="onglet-age">{TRANCHES[x].ages}</small></button>
        ))}
      </div>

      {parent && (
        <Link to="/jeux" className="carte-jeux">
          <span className="carte-idee-icone"><img src="/rubriques/puzzle.png" alt="" width={46} height={46} className="icone-personnage" /></span>
          <span><strong>Espace jeux pour mon enfant</strong><span>Jeux éducatifs et comptines selon son âge, sans internet.</span></span>
          <Icone nom="fleche" />
        </Link>
      )}
      {act && (
        <Link to={`/activites?age=${TRANCHES[t].activite}`} className="carte-idee">
          <span className="carte-idee-icone"><Icone nom="activites" taille={30} /></span>
          <span><strong>Activité du jour : {act.titre}</strong><span>{act.minutes} min · {act.but}</span></span>
          <Icone nom="fleche" />
        </Link>
      )}

      {reperes.map((r) => {
        const o = ouvert === r.id;
        return (
          <section key={r.id} className={`repere ${o ? 'ouvert' : ''}`}>
            <button className="repere-tete" aria-expanded={o} onClick={() => setOuvert(o ? undefined : r.id)}>
              <strong>{r.age}</strong><span>{o ? 'Réduire' : 'Voir'}</span>
            </button>
            {o && (
              <div className="repere-corps">
                <h3>Ce qu’il sait faire, le plus souvent</h3>
                <div className="domaines">
                  {ORDRE_DOMAINES.map((d) => {
                    const { c, fond } = couleur(DOMAINES[d].theme);
                    return (
                      <div key={d} className="domaine" style={{ background: fond }}>
                        <strong style={{ color: c }}>{DOMAINES[d].nom}</strong>
                        <small>{DOMAINES[d].detail}</small>
                        <ul>{r.sait[d].map((s) => <li key={s}>{s}</li>)}</ul>
                      </div>
                    );
                  })}
                </div>
                <h3>{parent ? 'Comment l’aider, à la maison aussi' : 'Comment l’aider à la garderie'}</h3>
                <ul className="puces-coche">{r.aider.map((s) => <li key={s}><Icone nom="coche" taille={18} /> {s}</li>)}</ul>
                <div className="alerte-dev">
                  <h3>Signes qui doivent faire réagir</h3>
                  <ul>{r.alerte.map((s) => <li key={s}>{s}</li>)}</ul>
                  <p>{parent ? CONSEIL_PARENTS : CONSEIL_ALERTE}</p>
                  {parent
                    ? <button className="bouton petit" onClick={versServices}>Trouver un centre de santé</button>
                    : <Link className="bouton petit" to="/services">Trouver un centre de santé</Link>}
                </div>
                <h3>Santé à ne pas oublier</h3>
                <ul className="puces-coche">{r.sante.map((s) => <li key={s}><Icone nom="services" taille={18} /> {s}</li>)}</ul>
              </div>
            )}
          </section>
        );
      })}
      <p className="legende">{SOURCES_REPERES}</p>
    </>
  );
}

const CONSEIL_PARENTS = 'Chaque enfant a son rythme. Un signe n’est pas un diagnostic. S’il dure plusieurs semaines, parlez-en à la responsable de la garderie et montrez votre enfant au centre de santé : plus on agit tôt, plus on l’aide.';
