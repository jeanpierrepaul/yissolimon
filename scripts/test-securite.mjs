// Vérifie les règles d'accès par rôle sur le serveur Supabase local.
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
const URL = 'http://127.0.0.1:55621', CLE = process.env.CLE;
const G1 = '11111111-0000-0000-0000-000000000001', G2 = '11111111-0000-0000-0000-000000000002';
let ok = 0, ko = 0;
const verif = (nom, cond) => { cond ? ok++ : ko++; console.log(`${cond ? 'OK ' : 'ÉCHEC'}  ${nom}`); };
async function client(email) {
  const c = createClient(URL, CLE, { auth: { persistSession: false } });
  if (email) { const { error } = await c.auth.signInWithPassword({ email, password: 'Demo2026!' }); if (error) throw error; }
  return c;
}
const anon = await client();
verif('anonyme ne voit aucune garderie', ((await anon.from('garderies').select()).data ?? []).length === 0);
verif('anonyme ne voit aucune évaluation', ((await anon.from('evaluations').select()).data ?? []).length === 0);

const colibris = await client('colibris@synergie.demo');
const g = (await colibris.from('garderies').select('id')).data;
verif('responsable voit uniquement sa garderie', g.length === 1 && g[0].id === G1);
verif('responsable ne voit pas les actions des autres', (await colibris.from('actions').select('garderie_id')).data.every((a) => a.garderie_id === G1));
const idA = randomUUID(), now = new Date().toISOString();
let r = await colibris.from('actions').insert({ id: idA, garderie_id: G1, dimension: 'eveil', titre: 'Test', updated_at: now });
verif('responsable ajoute une action chez elle', !r.error);
r = await colibris.from('actions').insert({ id: randomUUID(), garderie_id: G2, dimension: 'eveil', titre: 'Intrus', updated_at: now });
verif('responsable ne peut pas écrire chez une autre garderie', !!r.error);
r = await colibris.from('actions').update({ garderie_id: G2, updated_at: new Date(Date.now() + 1000).toISOString() }).eq('id', idA).select();
verif('une action ne peut pas changer de garderie', r.data?.[0]?.garderie_id === G1);
r = await colibris.from('actions').update({ titre: 'Ancienne version', updated_at: '2020-01-01T00:00:00Z' }).eq('id', idA).select();
verif('une version plus ancienne ne remplace pas la plus récente', r.data?.[0]?.titre === 'Test');
r = await colibris.from('actions').delete().eq('id', idA);
verif('suppression physique interdite', !!r.error || (await colibris.from('actions').select('id').eq('id', idA)).data.length === 1);
r = await colibris.rpc('stats_coordination');
verif('responsable n’a pas accès aux statistiques communales', !!r.error);

const acc = await client('accompagnatrice@synergie.demo');
verif('accompagnatrice voit les 3 garderies suivies', (await acc.from('garderies').select()).data.length === 3);
r = await acc.from('actions').update({ titre: 'Modifié', updated_at: new Date(Date.now() + 5000).toISOString() }).eq('id', idA).select();
verif('accompagnatrice ne modifie pas les actions', (r.data ?? []).length === 0);
r = await acc.from('notes_suivi').insert({ id: randomUUID(), garderie_id: G2, auteur_id: '22222222-0000-0000-0000-000000000010', auteur_nom: 'Test', texte: 'Visite test', updated_at: now });
verif('accompagnatrice écrit une note de suivi', !r.error);
r = await acc.from('notes_suivi').insert({ id: randomUUID(), garderie_id: G2, auteur_id: '22222222-0000-0000-0000-000000000001', texte: 'Usurpation', updated_at: now });
verif('impossible d’écrire une note au nom d’une autre personne', !!r.error);

const coord = await client('coordination@synergie.demo');
verif('coordination ne lit pas les réponses détaillées', (await coord.from('evaluations').select()).data.length === 0);
verif('coordination ne lit pas les notes de suivi', (await coord.from('notes_suivi').select()).data.length === 0);
r = await coord.rpc('stats_coordination');
verif('coordination reçoit les chiffres agrégés', !r.error && r.data.length >= 3);
console.log(r.data?.map((s) => `   ${s.nom} : score ${s.score_global}, ${s.actions_terminees}/${s.actions_total} actions, appui ${s.besoins_appui}`).join('\n'));

// Annuaire des services et orientations.
const S1 = '66666666-0000-0000-0000-000000000001';
verif('anonyme ne voit pas l’annuaire', ((await anon.from('services').select()).data ?? []).length === 0);
verif('responsable lit l’annuaire', (await colibris.from('services').select()).data.length >= 8);
r = await colibris.from('services').insert({ commune: 'X', nom: 'Faux service', type: 'sante' });
verif('responsable ne peut pas modifier l’annuaire', !!r.error);
r = await acc.from('services').insert({ commune: 'Commune pilote (fictive)', nom: 'Service test', type: 'social' }).select();
verif('personne ressource ajoute un service', !r.error);
r = await colibris.from('orientations').insert({ id: randomUUID(), garderie_id: G1, service_id: S1, besoin: 'sante', updated_at: now });
verif('responsable note une orientation', !r.error);
r = await colibris.from('orientations').insert({ id: randomUUID(), garderie_id: G2, service_id: S1, besoin: 'sante', updated_at: now });
verif('pas d’orientation au nom d’une autre garderie', !!r.error);
verif('accompagnatrice voit les orientations suivies', (await acc.from('orientations').select()).data.length >= 3);
verif('coordination ne voit pas les orientations détaillées', (await coord.from('orientations').select()).data.length === 0);
r = await coord.rpc('stats_orientations');
verif('coordination reçoit les orientations agrégées par type', !r.error && r.data.length > 0);
console.log(r.data?.map((s) => `   ${s.type} : ${s.total} orientée(s), ${s.confirmees} confirmée(s)`).join('\n'));
verif('responsable n’a pas les statistiques d’orientation', !!(await colibris.rpc('stats_orientations')).error);

// Avis des parents (anonymes).
const code = (await colibris.from('garderies').select('code_avis')).data?.[0]?.code_avis;
verif('le lien d’avis est un code long et imprévisible', typeof code === 'string' && code.length >= 16);
r = await anon.rpc('garderie_avis', { p_code: code });
verif('un parent sans compte voit le nom de la garderie', r.data === 'Garderie Les Colibris');
r = await anon.rpc('donner_avis', { p_code: code, p_reponses: [2, 1, 2, 0, 2] });
verif('un parent sans compte dépose un avis', !r.error);
r = await anon.rpc('donner_avis', { p_code: 'faux-code', p_reponses: [2, 2, 2, 2, 2] });
verif('un faux lien est refusé', !!r.error);
r = await anon.rpc('donner_avis', { p_code: code, p_reponses: [9, 2, 2, 2, 2] });
verif('une réponse hors échelle est refusée', !!r.error);
r = await anon.rpc('donner_avis', { p_code: code, p_reponses: [2, 2] });
verif('un avis incomplet est refusé', !!r.error);
verif('personne ne lit les avis un par un (anonyme)', ((await anon.from('avis_parents').select()).data ?? []).length === 0);
verif('personne ne lit les avis un par un (responsable)', ((await colibris.from('avis_parents').select()).data ?? []).length === 0);
r = await colibris.rpc('resume_avis', { p_garderie: G1 });
verif('la responsable reçoit le résumé et son lien', !r.error && r.data[0].total >= 1 && r.data[0].code === code && r.data[0].scores.length === 5);
console.log(`   ${r.data?.[0]?.total} avis, scores ${r.data?.[0]?.scores?.join(' / ')}`);
r = await colibris.rpc('resume_avis', { p_garderie: G2 });
verif('une responsable ne voit pas les avis d’une autre garderie', !!r.error);
r = await anon.rpc('resume_avis', { p_garderie: G1 });
verif('un anonyme ne voit pas le résumé', !!r.error);
r = await acc.rpc('resume_avis', { p_garderie: G1 });
verif('la personne ressource voit le résumé sans le lien', !r.error && r.data[0].code === null);

// Inscription libre d'une garderie, puis validation par la coordination.
const mail = `test-${randomUUID().slice(0, 8)}@synergie.demo`;
const nouvelle = createClient(URL, CLE, { auth: { persistSession: false } });
r = await nouvelle.auth.signUp({ email: mail, password: 'Inscription2026!', options: { data: {
  inscription: 'garderie', garderie: 'Garderie Test Inscription', commune: 'Commune pilote (fictive)', quartier: 'Ouest', nb_enfants: '15', responsable: 'Essi' } } });
verif('une garderie s’inscrit seule', !r.error && !!r.data.session);
const gn = (await nouvelle.from('garderies').select('id, nom, valide')).data ?? [];
verif('elle voit sa garderie, en attente de validation', gn.length === 1 && gn[0].nom === 'Garderie Test Inscription' && gn[0].valide === false);
const pn = (await nouvelle.from('profils').select('role, garderie_id')).data?.[0];
verif('elle a le rôle responsable de sa garderie', pn?.role === 'responsable' && pn.garderie_id === gn[0]?.id);
r = await nouvelle.from('actions').insert({ id: randomUUID(), garderie_id: gn[0]?.id, dimension: 'eveil', titre: 'Première action', updated_at: new Date().toISOString() });
verif('elle peut travailler avant la validation', !r.error);
verif('elle ne voit pas les autres garderies', !(await nouvelle.from('garderies').select('id')).data.some((x) => x.id === G1));
r = await coord.rpc('stats_coordination');
verif('une garderie non validée n’entre pas dans les statistiques', !r.data.some((s) => s.garderie_id === gn[0]?.id));
r = await coord.rpc('garderies_en_attente');
verif('la coordination voit la garderie en attente', !r.error && r.data.some((x) => x.id === gn[0]?.id));
verif('une responsable ne voit pas la liste d’attente', !!(await colibris.rpc('garderies_en_attente')).error);
verif('une responsable ne peut pas se valider elle-même', !!(await nouvelle.rpc('valider_garderie', { p_garderie: gn[0]?.id })).error);
r = await coord.rpc('valider_garderie', { p_garderie: gn[0]?.id });
r = await coord.rpc('stats_coordination');
verif('après validation, la garderie entre dans les statistiques', r.data.some((s) => s.garderie_id === gn[0]?.id));
r = await createClient(URL, CLE, { auth: { persistSession: false } }).auth.signUp({ email: `test-${randomUUID().slice(0, 8)}@synergie.demo`, password: 'Inscription2026!',
  options: { data: { inscription: 'garderie', garderie: 'X'.repeat(300), commune: 'C', responsable: 'A' } } });
verif('une inscription aux données invalides est refusée', !!r.error);
const sansRole = createClient(URL, CLE, { auth: { persistSession: false } });
await sansRole.auth.signUp({ email: `test-${randomUUID().slice(0, 8)}@synergie.demo`, password: 'Inscription2026!' });
verif('un compte créé sans inscription de garderie n’a aucun rôle', ((await sansRole.from('profils').select()).data ?? []).length === 0);
verif('un compte sans rôle ne voit aucune garderie', ((await sansRole.from('garderies').select()).data ?? []).length === 0);

// Espace parents : services liés à l'enfance de la commune.
r = await anon.rpc('services_parents', { p_code: code });
verif('un parent sans compte voit les services de sa commune', !r.error && r.data.length >= 8 && !('id' in r.data[0]));
verif('un faux lien ne donne pas accès aux services', !!(await anon.rpc('services_parents', { p_code: 'faux-code' })).error);

// Remarques libres des parents.
r = await anon.rpc('donner_avis', { p_code: code, p_reponses: [2, 2, 2, 1, 2], p_remarque: 'Merci pour les chansons, mon enfant les chante à la maison.' });
verif('un parent laisse une remarque avec son avis', !r.error);
r = await anon.rpc('donner_avis', { p_code: code, p_reponses: [2, 2, 2, 2, 2], p_remarque: 'x'.repeat(501) });
verif('une remarque trop longue est refusée', !!r.error);
r = await colibris.rpc('remarques_avis', { p_garderie: G1 });
verif('la responsable lit les remarques (au mois, sans date précise)', !r.error && r.data.some((x) => x.remarque.startsWith('Merci pour les chansons')) && /^\d{4}-\d{2}$/.test(r.data[0].mois));
verif('une autre responsable ne lit pas ces remarques', !!(await (await client('mawuli@synergie.demo')).rpc('remarques_avis', { p_garderie: G1 })).error);
verif('un anonyme ne lit pas les remarques', !!(await anon.rpc('remarques_avis', { p_garderie: G1 })).error);

// Export anonymisé.
r = await coord.rpc('export_anonyme');
const texte = JSON.stringify(r.data ?? {});
verif('la coordination obtient l’export', !r.error && r.data.garderies.length >= 3 && r.data.evaluations.length >= 1);
verif('export : aucun nom de garderie', !/Colibris|Mawuli|Akp/i.test(texte));
verif('export : aucun prénom, e-mail ni identifiant', !/Afi|Kossi|Yawa|@|11111111-|22222222-/.test(texte));
verif('export : aucune remarque ni note libre', !/chansons|Visite du/.test(texte));
verif('export : aucun quartier', !/Quartier|Marché/i.test(texte));
verif('export : dates au mois seulement', !/\d{4}-\d{2}-\d{2}/.test(texte.replace(/"genere_le":"[^"]+"/, '')));
verif('export : avis masqués sous 3 avis', r.data.avis_parents.every((a) => a.nombre_avis >= 3 || a.scores === null));
verif('une responsable ne peut pas exporter', !!(await colibris.rpc('export_anonyme')).error);
verif('un anonyme ne peut pas exporter', !!(await anon.rpc('export_anonyme')).error);

console.log(`\n${ok} réussis, ${ko} échecs`);
process.exit(ko ? 1 : 0);
