// Maintient la base Supabase en ligne active (le plan gratuit met en pause un projet inactif 7 jours).
// Lancé chaque jour par GitHub Actions (.github/workflows/maintenir-supabase.yml), ou à la main :
//   SUPABASE_URL=https://xxxx.supabase.co SUPABASE_ANON_KEY=... node scripts/maintenir-actif.mjs
// N'utilise que la clé publique (anon), jamais la clé service_role.
const url = process.env.SUPABASE_URL;
const cle = process.env.SUPABASE_ANON_KEY;
if (!url || !cle) { console.error('SUPABASE_URL et SUPABASE_ANON_KEY sont nécessaires.'); process.exit(1); }

process.exitCode = 1;
for (let essai = 1; essai <= 3; essai++) {
  try {
    const r = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/ping`, {
      method: 'POST',
      headers: { apikey: cle, Authorization: `Bearer ${cle}`, 'Content-Type': 'application/json' },
      body: '{}',
    });
    const texte = await r.text();
    if (r.ok) { console.log(`Base active : ${texte}`); process.exitCode = 0; break; }
    console.error(`Essai ${essai} : réponse ${r.status} ${texte.slice(0, 200)}`);
  } catch (e) {
    console.error(`Essai ${essai} : ${e.message}`);
  }
  if (essai < 3) await new Promise((ok) => setTimeout(ok, 10000 * essai));
}
if (process.exitCode !== 0) process.exitCode = 1;
