import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import { db, enregistrer, maintenant, nouvelId, type Besoin, type Orientation, type Service, type TypeService } from '../lib/db';
import { useSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { Icone, PastilleService, couleurService, rangService } from '../components/illustrations';
import { rafraichirServices } from '../lib/sync';
import { Chargement, Titre, dateFr, useEnLigne } from '../components/ui';
import { ProposerService, ServicesAVerifier } from './servicesproposes';

export const TYPES: Record<TypeService, string> = {
  sante: 'Santé', nutrition: 'Nutrition', social: 'Social', protection: 'Protection', etat_civil: 'État civil', education: 'Préscolaire', loisirs: 'Loisirs et sorties',
};
export const BESOINS: Record<Besoin, string> = {
  sante: 'Santé / maladie', vaccination: 'Vaccination', nutrition: 'Nutrition / croissance', developpement: 'Développement (langage, motricité)',
  protection: 'Protection de l’enfant', etat_civil: 'Acte de naissance', social: 'Difficulté sociale de la famille', autre: 'Autre',
};
// Besoin proposé par défaut selon le type de service.
const BESOIN_DEFAUT: Record<TypeService, Besoin> = {
  sante: 'sante', nutrition: 'nutrition', social: 'social', protection: 'protection', etat_civil: 'etat_civil', education: 'developpement', loisirs: 'developpement',
};

function FormService({ s, fermer, commune }: { s: Partial<Service>; fermer: () => void; commune?: string }) {
  const [retrait, setRetrait] = useState(false);
  const [f, setF] = useState<Partial<Service>>({ type: 'sante', ...s });
  const [err, setErr] = useState<string | null>(null);
  const maj = (p: Partial<Service>) => setF({ ...f, ...p });
  const sauver = async () => {
    const ligne = {
      nom: f.nom?.trim(), type: f.type, adresse: f.adresse || null, telephone: f.telephone || null,
      horaires: f.horaires || null, description: f.description || null, commune: f.commune ?? commune ?? 'Commune pilote (fictive)', updated_at: maintenant(),
    };
    const { error } = f.id ? await supabase.from('services').update(ligne).eq('id', f.id) : await supabase.from('services').insert(ligne);
    if (error) return setErr(error.message);
    await rafraichirServices(); fermer();
  };
  return (
    <div className="formulaire encadre">
      <label className="champ">Nom du service<input value={f.nom ?? ''} onChange={(e) => maj({ nom: e.target.value })} /></label>
      <label className="champ">Type
        <select value={f.type} onChange={(e) => maj({ type: e.target.value as TypeService })}>
          {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select></label>
      <div className="deux">
        <label className="champ">Téléphone<input type="tel" value={f.telephone ?? ''} onChange={(e) => maj({ telephone: e.target.value })} /></label>
        <label className="champ">Horaires<input value={f.horaires ?? ''} onChange={(e) => maj({ horaires: e.target.value })} /></label>
      </div>
      <label className="champ">Adresse<input value={f.adresse ?? ''} onChange={(e) => maj({ adresse: e.target.value })} /></label>
      <label className="champ">Ce que propose le service<textarea rows={2} value={f.description ?? ''} onChange={(e) => maj({ description: e.target.value })} /></label>
      {err && <p className="erreur">{err}</p>}
      <div className="pied-etapes">
        <button className="lien" onClick={fermer}>Annuler</button>
        {f.id && <button className="lien danger" onClick={() => { if (!retrait) return setRetrait(true); void supabase.from('services').update({ actif: false }).eq('id', f.id!).then(() => rafraichirServices()).then(fermer); }}>{retrait ? 'Confirmer le retrait' : 'Retirer de l’annuaire'}</button>}
        <button className="bouton" disabled={!f.nom?.trim()} onClick={() => void sauver()}>Enregistrer</button>
      </div>
    </div>
  );
}

export function Annuaire() {
  const { profil } = useSession();
  const enLigne = useEnLigne();
  const [type, setType] = useState<TypeService | ''>('');
  const [orienter, setOrienter] = useState<string | null>(null);
  const [besoin, setBesoin] = useState<Besoin>('sante');
  const [edition, setEdition] = useState<Partial<Service> | null>(null);
  const [fait, setFait] = useState<string | null>(null);
  const [toutes, setToutes] = useState(false);
  useEffect(() => { if (enLigne) void rafraichirServices().catch(() => undefined); }, [enLigne]);

  const services = useLiveQuery(() => db.services.toArray(), []);
  const orientations = useLiveQuery(async () => profil?.garderie_id
    ? (await db.orientations.where('garderie_id').equals(profil.garderie_id).toArray()).filter((o) => !o.supprime).sort((a, b) => b.date_orient.localeCompare(a.date_orient))
    : [], [profil]);
  if (!services) return <Chargement />;

  const responsable = profil?.role === 'responsable';
  const gestion = profil?.role === 'coordination' || profil?.role === 'accompagnateur';
  const liste = services.filter((s) => !type || s.type === type).sort((a, b) => rangService(a.type) - rangService(b.type) || a.nom.localeCompare(b.nom));
  const nomService = (id: string) => services.find((s) => s.id === id)?.nom ?? 'Service';

  const enregistrerOrientation = async (s: Service) => {
    await enregistrer(db.orientations, {
      id: nouvelId(), garderie_id: profil!.garderie_id!, service_id: s.id, besoin, date_orient: maintenant().slice(0, 10),
      statut: 'orientee', supprime: false, auteur_id: profil!.id, updated_at: '',
    } satisfies Orientation);
    setOrienter(null); setFait(`Orientation vers « ${s.nom} » notée.`);
  };

  return (
    <>
      <Titre sur={services[0]?.commune ?? 'Commune'}>Services de la commune</Titre>
      <p className="chapo-petit">Pour orienter une famille vers le bon service : santé, nutrition, protection, état civil, aide sociale. La garderie ne remplace pas ces services, elle fait le lien. Les lieux de loisirs donnent aussi des idées de sorties aux familles.</p>
      {fait && <p className="succes" role="status">{fait}</p>}
      {profil?.role === 'coordination' && <ServicesAVerifier />}
      {responsable && <ProposerService />}
      <div className="filtres">
        <button className={!type ? 'choisi' : ''} onClick={() => setType('')}>Tous <span className="compte">{services.length}</span></button>
        {(Object.keys(TYPES) as TypeService[]).sort((a, b) => rangService(a) - rangService(b)).map((t) => <button key={t} className={type === t ? 'choisi' : ''} onClick={() => setType(t)}>{TYPES[t]} <span className="compte">{services.filter((x) => x.type === t).length}</span></button>)}
      </div>
      {gestion && !edition && (
        <p><button className="bouton secondaire" disabled={!enLigne} onClick={() => setEdition({})}>+ Ajouter un service</button>
          {!enLigne && <span className="legende"> (nécessite internet)</span>}</p>
      )}
      {edition && !edition.id && <FormService s={edition} commune={services[0]?.commune} fermer={() => setEdition(null)} />}
      <ul className="grille-services">
        {liste.map((s) => {
          const { c, fond } = couleurService(s.type);
          const ouvert = orienter === s.id || edition?.id === s.id;
          return (
            <li key={s.id} className={ouvert ? 'ouvert' : ''} style={{ ['--c' as string]: c, ['--f' as string]: fond }}>
              {edition?.id === s.id ? <FormService s={edition} fermer={() => setEdition(null)} /> : (
                <>
                  <div className="service-tete">
                    <PastilleService type={s.type} taille={48} />
                    <span>
                      <span className="service-type">{TYPES[s.type]}</span>
                      <strong>{s.nom}</strong>
                    </span>
                  </div>
                  {s.description && <p className="service-desc">{s.description}</p>}
                  <ul className="service-infos">
                    {s.adresse && s.adresse !== '—' && <li><Icone nom="lieu" taille={17} /> {s.adresse}</li>}
                    {s.horaires && <li><Icone nom="horloge" taille={17} /> {s.horaires}</li>}
                    {s.telephone && <li><Icone nom="telephone" taille={17} /> {s.telephone}</li>}
                  </ul>
                  <div className="service-pied">
                    {s.telephone && <a className="bouton petit" href={`tel:${s.telephone.replace(/\s/g, '')}`}><Icone nom="telephone" taille={16} /> Appeler</a>}
                    {responsable && s.type !== 'loisirs' && <button className="bouton petit secondaire" onClick={() => { setOrienter(orienter === s.id ? null : s.id); setBesoin(BESOIN_DEFAUT[s.type]); setFait(null); }}>Orienter une famille</button>}
                    {gestion && enLigne && <button className="lien" onClick={() => setEdition(s)}>Modifier</button>}
                  </div>
                  {orienter === s.id && (
                    <div className="service-orienter">
                      <label className="champ">Pour quel besoin ?
                        <select value={besoin} onChange={(e) => setBesoin(e.target.value as Besoin)}>
                          {Object.entries(BESOINS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select></label>
                      <p className="legende">Aucun nom d’enfant ni de famille n’est enregistré : seulement le besoin et le service, pour suivre les liens entre la garderie et les services.</p>
                      <div className="pied-etapes">
                        <button className="lien" onClick={() => setOrienter(null)}>Annuler</button>
                        <button className="bouton" onClick={() => void enregistrerOrientation(s)}>Noter l’orientation</button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </li>
          );
        })}
      </ul>
      {!liste.length && <p className="vide">Aucun service {enLigne ? '' : '(connectez-vous une première fois pour charger l’annuaire)'}.</p>}

      {responsable && orientations && orientations.length > 0 && (
        <section>
          <h2>Familles orientées <small>{orientations.length}</small></h2>
          <ul className="liste">
            {orientations.slice(0, toutes ? undefined : 3).map((o) => (
              <li key={o.id}><div>
                <span className={`statut ${o.statut === 'confirmee' ? 'statut-terminee' : 'statut-en_cours'}`}>{o.statut === 'confirmee' ? 'La famille y est allée' : 'Orientée'}</span>
                <strong>{BESOINS[o.besoin]} → {nomService(o.service_id)}</strong>
                <span className="meta">{dateFr(o.date_orient)}{o._sale === 1 && ' · en attente d’envoi'}</span>
                {o.statut === 'orientee' && <button className="lien" onClick={() => void enregistrer(db.orientations, { ...o, statut: 'confirmee' })}>La famille y est allée</button>}
              </div></li>
            ))}
          </ul>
          {orientations.length > 3 && <p><button className="lien" onClick={() => setToutes(!toutes)}>{toutes ? 'Voir moins' : `Voir les ${orientations.length} orientations`}</button></p>}
        </section>
      )}
    </>
  );
}

/** Résumé des orientations d'une garderie (vue personne ressource). */
export function OrientationsGarderie({ garderieId }: { garderieId: string }) {
  const d = useLiveQuery(async () => {
    const o = (await db.orientations.where('garderie_id').equals(garderieId).toArray()).filter((x) => !x.supprime);
    const s = await db.services.toArray();
    return o.sort((a, b) => b.date_orient.localeCompare(a.date_orient)).map((x) => ({ ...x, service: s.find((y) => y.id === x.service_id)?.nom ?? 'Service' }));
  }, [garderieId]);
  if (!d) return null;
  return (
    <section><h2>Orientations vers les services <small>{d.length}</small></h2>
      {!d.length ? <p className="vide">Aucune orientation notée.</p> : (
        <ul className="liste">{d.map((o) => (
          <li key={o.id}><div><strong>{BESOINS[o.besoin]} → {o.service}</strong>
            <span className="meta">{dateFr(o.date_orient)} · {o.statut === 'confirmee' ? 'la famille y est allée' : 'orientée'}</span></div></li>
        ))}</ul>
      )}
    </section>
  );
}

/** Vue coordination : liens garderies → services, en chiffres. */
export function StatsOrientations() {
  const [d, setD] = useState<{ type: TypeService; total: number; confirmees: number }[] | null>(null);
  useEffect(() => { void supabase.rpc('stats_orientations').then(({ data }) => setD(data)); }, []);
  if (!d) return null;
  const total = d.reduce((a, x) => a + x.total, 0), conf = d.reduce((a, x) => a + x.confirmees, 0);
  return (
    <section><h2>Liens avec les services <small>{total} orientation(s), {conf} confirmée(s)</small></h2>
      <table className="tableau">
        <thead><tr><th>Service</th><th>Orientées</th><th>Confirmées</th></tr></thead>
        <tbody>{d.map((x) => <tr key={x.type}><td>{TYPES[x.type]}</td><td>{x.total}</td><td>{x.confirmees}</td></tr>)}</tbody>
      </table>
      <p className="legende">Montre si les garderies servent de porte d’entrée vers la santé, la nutrition, la protection et l’état civil. Aucune donnée sur les enfants.</p>
    </section>
  );
}
