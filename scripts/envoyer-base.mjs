// Envoie toutes les migrations (et les données de démonstration) vers la base Supabase en ligne.
// Le mot de passe est lu dans le fichier texte local, jamais affiché ni enregistré dans le projet.
//   node scripts/envoyer-base.mjs            -> envoie les migrations + le seed
//   node scripts/envoyer-base.mjs --essai    -> montre seulement ce qui serait envoyé
//   node scripts/envoyer-base.mjs --sans-donnees -> envoie seulement les nouvelles migrations
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';

const REF = 'zhixyikcfuoedidhilfc';
const HOTE = 'aws-1-eu-west-1.pooler.supabase.com';
const fichier = process.env.FICHIER_MDP ?? join(homedir(), 'Documents', 'yissolimon-mot-de-passe-bd.txt');

const mdp = readFileSync(fichier, 'utf8').trim().split(/\r?\n/).at(-1).trim();
if (!mdp) { console.error(`Mot de passe introuvable dans ${fichier}`); process.exit(1); }

const url = `postgresql://postgres.${REF}:${encodeURIComponent(mdp)}@${HOTE}:5432/postgres`;
const args = ['supabase', 'db', 'push', `--remote=${url}`, '--yes'];
// Les données de démo ne sont envoyées qu'à la première mise en ligne (sinon : doublons).
if (!process.argv.includes('--sans-donnees')) args.push('--include-seed');
if (process.argv.includes('--essai')) args.push('--dry-run');

const r = spawnSync('npx', args, { stdio: ['inherit', 'pipe', 'pipe'], shell: process.platform === 'win32', encoding: 'utf8' });
const masquer = (t) => (t ?? '').split(mdp).join('***').split(encodeURIComponent(mdp)).join('***');
process.stdout.write(masquer(r.stdout));
process.stderr.write(masquer(r.stderr));
process.exit(r.status ?? 1);
