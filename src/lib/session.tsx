import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { aEnvoyer, getMeta, setMeta, viderTout } from './db';
import { supabase } from './supabase';
import { demarrerSyncAuto, synchroniser } from './sync';

export type Role = 'responsable' | 'accompagnateur' | 'coordination';
export interface Profil { id: string; nom: string; role: Role; garderie_id: string | null }

interface Ctx {
  profil: Profil | null;
  chargement: boolean;
  connecter: (email: string, mdp: string) => Promise<string | null>;
  deconnecter: (forcer?: boolean) => Promise<string | null>;
  inscrire: (d: Inscription) => Promise<string | null | 'confirmer'>;
}

export interface Inscription {
  garderie: string; commune: string; quartier: string; nbEnfants: string; responsable: string; email: string; mdp: string;
}

const SessionCtx = createContext<Ctx>(null as unknown as Ctx);
export const useSession = () => useContext(SessionCtx);

async function chargerProfil(uid: string): Promise<Profil | null> {
  // Hors ligne : on reprend le profil enregistré sur le téléphone.
  const cache = await getMeta<Profil>('profil');
  if (!navigator.onLine && cache?.id === uid) return cache;
  const { data, error } = await supabase.from('profils').select('id, nom, role, garderie_id').eq('id', uid).single();
  if (error || !data) return cache?.id === uid ? cache : null;
  await setMeta('profil', data);
  return data as Profil;
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profil, setProfil] = useState<Profil | null>(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    let actif = true;
    supabase.auth.getSession().then(async ({ data }) => {
      const uid = data.session?.user.id;
      const p = uid ? await chargerProfil(uid) : null;
      if (actif) { setProfil(p); setChargement(false); }
    });
    return () => { actif = false; };
  }, []);

  useEffect(() => {
    if (!profil || profil.role === 'coordination') return;
    return demarrerSyncAuto();
  }, [profil]);

  const connecter = async (email: string, mdp: string) => {
    if (!navigator.onLine) return 'La première connexion demande internet. Ensuite, l’application fonctionne hors ligne.';
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: mdp });
    if (error && (error.name === 'AuthRetryableFetchError' || !error.status)) return 'Le serveur ne répond pas. Vérifiez internet ou le Wi-Fi, puis réessayez.';
    if (error || !data.user) return 'Adresse ou mot de passe incorrect.';
    const precedent = await getMeta<Profil>('profil');
    if (precedent && precedent.id !== data.user.id) await viderTout(); // autre personne sur ce téléphone
    const p = await chargerProfil(data.user.id);
    if (!p) { await supabase.auth.signOut(); return 'Ce compte n’a pas encore de rôle attribué.'; }
    setProfil(p);
    if (p.role !== 'coordination') await synchroniser();
    return null;
  };

  const deconnecter = async (forcer = false) => {
    if (!forcer) {
      await synchroniser();
      const n = await aEnvoyer();
      if (n > 0) return `${n} modification(s) ne sont pas encore envoyées. Reconnectez-vous à internet avant de vous déconnecter, sinon elles seront perdues.`;
    }
    await supabase.auth.signOut({ scope: 'local' });
    await viderTout(); // téléphone partagé : on n'y laisse aucune donnée
    setProfil(null);
    return null;
  };

  const inscrire = async (d: Inscription): Promise<string | null | 'confirmer'> => {
    if (!navigator.onLine) return 'L’inscription demande internet.';
    const { data, error } = await supabase.auth.signUp({
      email: d.email.trim(), password: d.mdp,
      options: { data: { inscription: 'garderie', garderie: d.garderie.trim(), commune: d.commune.trim(),
        quartier: d.quartier.trim(), nb_enfants: d.nbEnfants, responsable: d.responsable.trim() } },
    });
    if (error) return /already|registered|exists/i.test(error.message) ? 'Cette adresse e-mail a déjà un compte. Connectez-vous.' : 'L’inscription n’a pas abouti. Vérifiez les informations et réessayez.';
    if (!data.session || !data.user) return 'confirmer'; // le serveur demande de confirmer l'adresse e-mail
    await viderTout();
    const p = await chargerProfil(data.user.id);
    if (!p) return 'Le compte est créé mais la garderie n’a pas pu être enregistrée. Contactez la coordination.';
    setProfil(p);
    await synchroniser();
    return null;
  };

  return <SessionCtx.Provider value={{ profil, chargement, connecter, deconnecter, inscrire }}>{children}</SessionCtx.Provider>;
}
