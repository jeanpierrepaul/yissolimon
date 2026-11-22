// Enregistre un clip d'écran par chapitre, calé sur la durée de la voix off. Écritures vers la base simulées.
import puppeteer from 'puppeteer-core';
import { readFileSync, mkdirSync } from 'node:fs';
const V = process.argv[2];
const SEULS = process.argv.slice(3);
mkdirSync(`${V}/clips`, { recursive: true });
const DUREE = Object.fromEntries(readFileSync(`${V}/durees.txt`, 'utf8').trim().split('\n').map((l) => { const [f, d] = l.split(' '); return [f.replace('.wav', ''), +d + 1.4]; }));
const URL = 'https://yissolimon.vercel.app';
const pause = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const TEL = { width: 390, height: 844, isMobile: true, hasTouch: true }, PC = { width: 1440, height: 900 };

async function session(email, vue) {
  const ctx = await b.createBrowserContext();
  const p = await ctx.newPage();
  await p.setViewport(vue);
  await p.setRequestInterception(true);
  p.on('request', (r) => (r.url().includes('/rest/v1/') && ['POST', 'PATCH', 'PUT', 'DELETE'].includes(r.method()) && !r.url().includes('/rpc/'))
    ? r.respond({ status: 201, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Expose-Headers': '*' }, contentType: 'application/json', body: '[]' }) : r.continue());
  await p.goto(URL, { waitUntil: 'networkidle0' });
  if (email) {
    await p.waitForSelector('#cx-email', { timeout: 30000 });
    await p.type('#cx-email', email); await p.type('#cx-mdp', 'Demo2026!'); await p.click('form button');
    await p.waitForSelector('.contenu', { timeout: 30000 }); await pause(3500);
  }
  return { p, ctx };
}
// Navigation interne sans recharger la page (pas d'écran de chargement).
const aller = (p, chemin) => p.evaluate((c) => { history.pushState({}, '', c); dispatchEvent(new PopStateEvent('popstate')); window.scrollTo(0, 0); }, chemin);
const defiler = async (p, dy, ms) => { const n = Math.max(1, Math.round(ms / 33)); for (let i = 0; i < n; i++) { await p.evaluate((d) => window.scrollBy(0, d), dy / n); await pause(33); } };
const clic = (p, texte, sel = 'a,button') => p.evaluate((t, s) => { const e = [...document.querySelectorAll(s)].find((x) => x.offsetParent !== null && x.textContent.trim().includes(t)); e?.click(); return !!e; }, texte, sel);

async function clip(id, p, actions) {
  if (SEULS.length && !SEULS.includes(id)) return;
  const rec = await p.screencast({ path: `${V}/clips/${id}.webm` });
  const t0 = Date.now();
  await actions();
  const reste = DUREE[id] * 1000 - (Date.now() - t0);
  if (reste > 0) await pause(reste);
  await rec.stop();
  console.log(id, 'enregistré', ((Date.now() - t0) / 1000).toFixed(1), 's pour', DUREE[id].toFixed(1));
}

// c00 : page de connexion
{ const { p, ctx } = await session(null, TEL);
  await clip('c00', p, async () => { await pause(3500); await defiler(p, 640, 4000); await pause(2500); await defiler(p, -640, 2500); });
  await ctx.close(); }

// c01, c02, c04 à c07 : responsable des Colibris (téléphone)
{ const { p, ctx } = await session('colibris@synergie.demo', TEL);
  await clip('c01', p, async () => { await pause(2500); await defiler(p, 520, 4500); await pause(2500); await defiler(p, -520, 3000); });
  await clip('c02', p, async () => {
    await pause(2500);
    for (let i = 0; i < 40; i++) { await p.evaluate(() => { const c = document.querySelector('.cycle'); if (c) c.scrollLeft += 12; }); await pause(40); }
    await pause(1200);
    for (let i = 0; i < 25; i++) { await p.evaluate(() => { const c = document.querySelector('.cycle'); if (c) c.scrollLeft -= 20; }); await pause(30); }
    await pause(800); await defiler(p, 330, 2500); await pause(3000);
  });
  await aller(p, '/suivi'); await pause(2500);
  const res = await p.evaluate(() => document.querySelector('.liste a[href*="resultats"]')?.getAttribute('href'));
  await aller(p, res); await pause(2500);
  await clip('c04', p, async () => {
    await pause(2500); await defiler(p, 420, 4000); await pause(2500);
    await clic(p, 'Plan', 'nav.nav-bas a'); await pause(2500); await defiler(p, 300, 2500);
  });
  await aller(p, '/activites'); await pause(2500);
  await clip('c05', p, async () => {
    await pause(1500); await defiler(p, 330, 1500);
    await clic(p, '10 min', 'button'); await pause(700);
    await clic(p, 'Gobelets', 'button'); await pause(500); await clic(p, 'Gros bouchons', 'button'); await pause(900);
    await p.evaluate(() => { const a = document.querySelector('.activite'); if (a) window.scrollTo({ top: a.getBoundingClientRect().top + scrollY - 70, behavior: 'smooth' }); });
    await pause(3500); await defiler(p, 300, 2500); await pause(1200);
    await aller(p, '/fiche/nutrition-menu'); await pause(2500); await defiler(p, 380, 3000);
  });
  await aller(p, '/suivi'); await pause(2500);
  await clip('c06', p, async () => { await pause(2500); await defiler(p, 700, 4500); await pause(1500); await defiler(p, 500, 2500); });
  await aller(p, '/services'); await pause(3000);
  await clip('c07', p, async () => {
    await pause(1500); await defiler(p, 360, 2500); await pause(800);
    await clic(p, 'Orienter une famille', 'button'); await pause(1200); await defiler(p, 260, 1800); await pause(2500);
    await clic(p, 'Annuler', 'button'); await pause(600); await defiler(p, 380, 2000);
  });
  await ctx.close(); }

// c03 : autoévaluation (garderie Akpé)
{ const { p, ctx } = await session('akpe@synergie.demo', TEL);
  await clic(p, 'Commencer l', 'button'); await pause(2500);
  const repondre = (i, rep) => p.evaluate((i, rep) => [...document.querySelectorAll('fieldset.question')[i].querySelectorAll('button')].find((x) => x.textContent.trim() === rep)?.click(), i, rep);
  await clip('c03', p, async () => {
    await pause(1500); await defiler(p, 260, 1200); await repondre(0, 'Oui'); await pause(1300);
    await defiler(p, 330, 1500); await repondre(1, 'En partie'); await pause(1200);
    await defiler(p, 330, 1500); await repondre(2, 'Oui'); await pause(1100);
    await defiler(p, 300, 1300); await repondre(3, 'Pas encore'); await pause(1200);
    await clic(p, 'Thème suivant', 'button'); await pause(1800); await repondre(0, 'Oui'); await pause(1000);
  });
  await ctx.close(); }

// c08 : espace parents
{ const { p, ctx } = await session(null, TEL);
  await p.goto(URL + '/avis/colibris-parents-demo', { waitUntil: 'networkidle0' }); await pause(2500);
  await clip('c08', p, async () => {
    await pause(1800); await p.click('#onglet-services'); await pause(1500); await defiler(p, 480, 3000); await pause(1200);
    await p.evaluate(() => window.scrollTo({ top: 0, behavior: 'smooth' })); await pause(900);
    await p.click('#onglet-avis'); await pause(1000); await defiler(p, 330, 1500);
    for (const [i, v] of [[0, 2], [1, 2], [2, 1]]) { await p.evaluate((i, v) => document.getElementById(`avis-${i}-${v}`)?.click(), i, v); await pause(700); }
  });
  await ctx.close(); }

// c09 : personne ressource
{ const { p, ctx } = await session('accompagnatrice@synergie.demo', TEL);
  await clip('c09', p, async () => {
    await pause(3000); await defiler(p, 420, 3000); await pause(800);
    await clic(p, 'Garderie Mawuli', 'a'); await pause(2000); await defiler(p, 400, 2500);
  });
  await ctx.close(); }

// c10 : coordination (ordinateur)
{ const { p, ctx } = await session('coordination@synergie.demo', PC);
  await clip('c10', p, async () => { await pause(3500); await defiler(p, 520, 4000); await pause(2500); await defiler(p, 560, 4000); });
  await ctx.close(); }

// c11 : accueil sur ordinateur
{ const { p, ctx } = await session('colibris@synergie.demo', PC);
  await clip('c11', p, async () => { await pause(3000); await defiler(p, 380, 4000); await pause(2000); await defiler(p, -380, 3000); });
  await ctx.close(); }

await b.close();
console.log('clips terminés');
