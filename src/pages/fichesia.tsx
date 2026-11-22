import { useEffect, useState } from 'react';
import { GRILLE, dimensionTitre } from '../data/grille';
import { PastilleTheme } from '../components/illustrations';
import { useEnLigne } from '../components/ui';
import { chargerFichesIA, ficheIA, fichesValideesCache, type FicheIA } from '../lib/ia';
import { useSession } from '../lib/session';
import { supabase } from '../lib/supabase';

/** Fiches de l'assistant : validées (tout le monde, lisibles hors ligne) et brouillons (accompagnement, coordination). */
export function useFichesIA() {
  const enLigne = useEnLigne();
  const [fiches, setFiches] = useState<FicheIA[]>(fichesValideesCache);
  const recharger = () => { void chargerFichesIA().then(setFiches); };
  useEffect(() => { if (enLigne) void chargerFichesIA().then(setFiches); }, [enLigne]);
  return { fiches, recharger };
}

function Apercu({ f }: { f: FicheIA }) {
  return (
    <div className="apercu-fiche">
      <p className="meta">{dimensionTitre(f.dimension)} · {f.minutes} min de lecture</p>
      <h3>{f.titre}</h3>
      <p><strong>{f.resume}</strong></p>
      <p>{f.pourquoi}</p>
      <ol>{f.etapes.map((e) => <li key={e}>{e}</li>)}</ol>
      {f.eviter.length > 0 && <><p className="meta">À éviter</p><ul>{f.eviter.map((e) => <li key={e}>{e}</li>)}</ul></>}
      {f.signe && <p className="meta">Signe que ça marche : {f.signe}</p>}
    </div>
  );
}

/** Atelier : proposer une fiche avec l'assistant, puis relecture humaine obligatoire avant publication. */
export function AtelierFiches({ fiches, recharger }: { fiches: FicheIA[]; recharger: () => void }) {
  const { profil } = useSession();
  const enLigne = useEnLigne();
  const [dimension, setDimension] = useState(GRILLE[0].id);
  const [sujet, setSujet] = useState('');
  const [brouillon, setBrouillon] = useState<FicheIA | null>(null);
  const [attente, setAttente] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const aValider = fiches.filter((f) => f.statut === 'a_valider');

  const generer = async () => {
    setAttente(true); setMsg(null);
    try {
      const f = await ficheIA({ dimension, sujet });
      if (!f.titre || !f.etapes?.length) throw new Error('Réponse incomplète, réessayez.');
      setBrouillon(f);
    } catch (e) { setMsg(e instanceof Error ? e.message : 'Assistant indisponible.'); }
    setAttente(false);
  };
  const envoyer = async () => {
    if (!brouillon) return;
    const { dimension: d, titre, resume, pourquoi, etapes, eviter, signe, minutes } = brouillon;
    const { error } = await supabase.from('fiches_ia').insert({ dimension: d, titre, resume, pourquoi, etapes, eviter, signe, minutes, auteur_id: profil!.id });
    if (error) return setMsg(error.message);
    setBrouillon(null); setSujet(''); setMsg('Fiche envoyée en relecture.'); recharger();
  };
  const decider = async (id: string, statut: 'validee' | 'refusee') => {
    const { error } = await supabase.from('fiches_ia').update({ statut, valide_par: profil!.id, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) return setMsg(error.message);
    setMsg(statut === 'validee' ? 'Fiche publiée pour toutes les garderies.' : 'Fiche refusée.'); recharger();
  };

  return (
    <section className="atelier">
      <h2>Proposer une nouvelle fiche</h2>
      <p className="legende">L’assistant rédige un brouillon à partir d’un sujet. Une personne le relit et le valide avant qu’il soit visible par les garderies.</p>
      <div className="deux">
        <label className="champ">Thème
          <select value={dimension} onChange={(e) => setDimension(e.target.value)}>
            {GRILLE.map((g) => <option key={g.id} value={g.id}>{g.titre}</option>)}
          </select></label>
        <label className="champ">Sujet de la fiche
          <input value={sujet} maxLength={140} placeholder="Ex. : apaiser un enfant qui pleure à l’arrivée" onChange={(e) => setSujet(e.target.value)} /></label>
      </div>
      <button className="bouton" disabled={!sujet.trim() || attente || !enLigne} onClick={() => void generer()}>{attente ? 'Rédaction…' : 'Rédiger le brouillon'}</button>
      {!enLigne && <p className="legende">Disponible avec internet.</p>}
      {msg && <p className="succes" role="status">{msg}</p>}
      {brouillon && (
        <div className="encadre">
          <p className="sur">Brouillon à relire</p>
          <Apercu f={brouillon} />
          <div className="pied-etapes">
            <button className="lien" onClick={() => setBrouillon(null)}>Jeter</button>
            <button className="bouton secondaire" disabled={attente} onClick={() => void generer()}>Rédiger une autre version</button>
            <button className="bouton" onClick={() => void envoyer()}>Envoyer en relecture</button>
          </div>
        </div>
      )}
      {aValider.length > 0 && (
        <>
          <h2>Fiches à relire <small>{aValider.length}</small></h2>
          <ul className="liste">{aValider.map((f) => (
            <li key={f.id}><div>
              <div className="ligne-action"><PastilleTheme dim={f.dimension} taille={40} /><span><Apercu f={f} /></span></div>
              <div className="pied-etapes">
                <button className="lien danger" onClick={() => void decider(f.id!, 'refusee')}>Refuser</button>
                <button className="bouton" onClick={() => void decider(f.id!, 'validee')}>Valider et publier</button>
              </div>
            </div></li>
          ))}</ul>
        </>
      )}
    </section>
  );
}
