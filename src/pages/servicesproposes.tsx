import { useEffect, useState } from 'react';
import type { TypeService } from '../lib/db';
import { useSession } from '../lib/session';
import { supabase } from '../lib/supabase';
import { rafraichirServices } from '../lib/sync';
import { PastilleService } from '../components/illustrations';
import { dateFr, useEnLigne } from '../components/ui';
import { TYPES } from './services';

interface Proposition {
  id: string; garderie_id: string; nom: string; type: TypeService; adresse: string | null; telephone: string | null;
  horaires: string | null; description: string | null; remarque: string | null; statut: 'a_verifier' | 'publie' | 'refuse';
  created_at: string; garderies?: { nom: string; commune: string } | null;
}
const STATUT = { a_verifier: 'En cours de vérification', publie: 'Publié dans l’annuaire', refuse: 'Non retenu' };
const VIDE = { nom: '', type: 'sante' as TypeService, telephone: '', horaires: '', adresse: '', description: '', remarque: '' };

/** Responsable : proposer un service de son quartier. Il n'apparaît qu'après vérification par la coordination. */
export function ProposerService() {
  const { profil } = useSession();
  const enLigne = useEnLigne();
  const [ouvert, setOuvert] = useState(false);
  const [f, setF] = useState(VIDE);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [mes, setMes] = useState<Proposition[]>([]);
  const charger = () => {
    if (!profil?.garderie_id) return;
    void supabase.from('services_proposes').select('*').eq('garderie_id', profil.garderie_id)
      .order('created_at', { ascending: false }).limit(10).then(({ data }) => setMes((data as Proposition[]) ?? []));
  };
  useEffect(() => { if (enLigne) charger(); }, [enLigne]);
  const maj = (p: Partial<typeof VIDE>) => setF({ ...f, ...p });

  const envoyer = async () => {
    setErr(null);
    const vide = (t: string) => t.trim() || null;
    const { error } = await supabase.from('services_proposes').insert({
      garderie_id: profil!.garderie_id, propose_par: profil!.id, nom: f.nom.trim(), type: f.type,
      telephone: vide(f.telephone), horaires: vide(f.horaires), adresse: vide(f.adresse), description: vide(f.description), remarque: vide(f.remarque),
    });
    if (error) return setErr(error.message);
    setF(VIDE); setOuvert(false); setMsg('Merci ! La coordination va vérifier ce service avant de l’ajouter à l’annuaire.'); charger();
  };

  return (
    <section className="proposer-service">
      {msg && <p className="succes" role="status">{msg}</p>}
      {!ouvert ? (
        <div className="bandeau-ia">
          <p><strong>Vous connaissez un service utile près de chez vous ?</strong> Proposez-le : la coordination le vérifie, puis il apparaît pour toutes les garderies et les parents de la commune.</p>
          <button className="bouton petit secondaire" disabled={!enLigne} onClick={() => { setOuvert(true); setMsg(null); }}>+ Proposer un service</button>
          {!enLigne && <span className="legende">Disponible avec internet.</span>}
        </div>
      ) : (
        <div className="formulaire encadre">
          <h2 style={{ margin: 0 }}>Proposer un service</h2>
          <label className="champ">Nom du service<input value={f.nom} maxLength={120} onChange={(e) => maj({ nom: e.target.value })} placeholder="Ex. : Centre de santé de Kodjoviakopé" /></label>
          <label className="champ">Type
            <select value={f.type} onChange={(e) => maj({ type: e.target.value as TypeService })}>
              {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select></label>
          <div className="deux">
            <label className="champ">Téléphone<input type="tel" maxLength={40} value={f.telephone} onChange={(e) => maj({ telephone: e.target.value })} /></label>
            <label className="champ">Horaires<input maxLength={120} value={f.horaires} onChange={(e) => maj({ horaires: e.target.value })} /></label>
          </div>
          <label className="champ">Adresse ou repère<input maxLength={200} value={f.adresse} onChange={(e) => maj({ adresse: e.target.value })} placeholder="Ex. : à côté du marché" /></label>
          <label className="champ">Ce que propose le service<textarea rows={2} maxLength={400} value={f.description} onChange={(e) => maj({ description: e.target.value })} /></label>
          <label className="champ">Pour la coordination (facultatif)<textarea rows={2} maxLength={400} value={f.remarque} onChange={(e) => maj({ remarque: e.target.value })} placeholder="Comment le connaissez-vous ? Des familles y sont-elles allées ?" /></label>
          {err && <p className="erreur">{err}</p>}
          <div className="pied-etapes">
            <button className="lien" onClick={() => setOuvert(false)}>Annuler</button>
            <button className="bouton" disabled={f.nom.trim().length < 2} onClick={() => void envoyer()}>Envoyer à la coordination</button>
          </div>
        </div>
      )}
      {mes.length > 0 && (
        <details className="mes-propositions">
          <summary>Mes propositions ({mes.length})</summary>
          <ul className="liste">{mes.map((p) => (
            <li key={p.id}><div>
              <span className={`statut ${p.statut === 'publie' ? 'statut-terminee' : p.statut === 'refuse' ? 'statut-a_faire' : 'statut-en_cours'}`}>{STATUT[p.statut]}</span>
              <strong>{p.nom}</strong><span className="meta">{TYPES[p.type]} · proposé le {dateFr(p.created_at)}</span>
            </div></li>
          ))}</ul>
        </details>
      )}
    </section>
  );
}

/** Coordination : vérifier les services proposés par les garderies, puis publier ou refuser. */
export function ServicesAVerifier() {
  const enLigne = useEnLigne();
  const [liste, setListe] = useState<Proposition[] | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const charger = () => {
    void supabase.from('services_proposes').select('*, garderies(nom, commune)').eq('statut', 'a_verifier')
      .order('created_at').then(({ data }) => setListe((data as Proposition[]) ?? []));
  };
  useEffect(() => { if (enLigne) charger(); }, [enLigne]);
  if (!liste?.length && !msg) return null;

  const traiter = async (p: Proposition, publier: boolean) => {
    const { error } = await supabase.rpc('traiter_service_propose', { p_id: p.id, p_publier: publier });
    if (error) return setMsg(error.message);
    if (publier) await rafraichirServices().catch(() => undefined);
    setMsg(publier ? `« ${p.nom} » est publié dans l’annuaire.` : `« ${p.nom} » n’est pas retenu.`); charger();
  };

  return (
    <section className="alerte">
      <h2>Services proposés par les garderies <small>{liste?.length ?? 0} à vérifier</small></h2>
      <p className="legende">Appelez le numéro ou demandez à la personne ressource de confirmer que le service existe et accueille les familles, puis publiez-le.</p>
      {msg && <p className="succes" role="status">{msg}</p>}
      <ul className="liste">{(liste ?? []).map((p) => (
        <li key={p.id}><div>
          <div className="carte-service">
            <PastilleService type={p.type} taille={44} />
            <span>
              <span className="meta">{TYPES[p.type]} · proposé par {p.garderies?.nom ?? 'une garderie'} le {dateFr(p.created_at)}</span>
              <strong>{p.nom}</strong>
              {p.description && <span className="meta">{p.description}</span>}
              <span className="meta">{[p.adresse, p.horaires, p.telephone].filter(Boolean).join(' · ') || 'Pas d’adresse ni de téléphone'}</span>
              {p.remarque && <span className="meta">Note de la garderie : « {p.remarque} »</span>}
            </span>
          </div>
          <div className="pied-etapes">
            <button className="lien danger" onClick={() => void traiter(p, false)}>Ne pas retenir</button>
            <button className="bouton petit" onClick={() => void traiter(p, true)}>Vérifié : publier</button>
          </div>
        </div></li>
      ))}</ul>
    </section>
  );
}
