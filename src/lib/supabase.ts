import { createClient } from '@supabase/supabase-js';

let url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
// Test sur téléphone (même Wi-Fi) : la base locale passe par le relais /sb du serveur de développement,
// donc seul le port de l'appli doit être joignable.
if (import.meta.env.DEV && url && /\/\/(127\.0\.0\.1|localhost)[:/]/.test(url) && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
  url = `${window.location.origin}/sb`;
}
const cle = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !cle) {
  throw new Error('Configuration manquante : VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY (fichier .env.local).');
}

// La session reste enregistrée sur le téléphone : l'application s'ouvre même sans connexion.
export const supabase = createClient(url, cle, {
  auth: { persistSession: true, autoRefreshToken: true, storageKey: 'synergie-session' },
});
