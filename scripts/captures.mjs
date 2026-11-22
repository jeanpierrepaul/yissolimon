// Captures d'écran locales des interfaces en version téléphone (comptes de démo).
// Usage : node scripts/captures.mjs <dossier> [responsable|accompagnatrice|coordination]
import puppeteer from 'puppeteer-core';
const dossier = process.argv[2] ?? '.';
const qui = process.argv[3] ?? 'responsable';
const URL = process.env.CAPTURE_URL ?? 'http://localhost:5196';
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
const COMPTES = { responsable: 'colibris@synergie.demo', accompagnatrice: 'accompagnatrice@synergie.demo', coordination: 'coordination@synergie.demo' };
const ECRANS = {
  responsable: [['/', 'accueil'], ['/plan', 'plan'], ['/suivi', 'suivi'], ['/services', 'services'], ['/bibliotheque', 'fiches'], ['/fiche/nutrition-menu', 'fiche'], ['/compte', 'compte']],
  accompagnatrice: [['/', 'garderies']],
  coordination: [['/', 'commune']],
};

const navigateur = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await navigateur.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(URL, { waitUntil: 'networkidle0' });
await page.waitForSelector('#cx-email', { timeout: 20000 });
await page.type('#cx-email', COMPTES[qui]);
await page.type('#cx-mdp', 'Demo2026!');
await page.click('form button');
await page.waitForSelector('.contenu', { timeout: 20000 });
await attendre(2500);

for (const [chemin, nom] of ECRANS[qui]) {
  await page.goto(URL + chemin, { waitUntil: 'networkidle0' });
  await attendre(2600);
  await page.screenshot({ path: `${dossier}/tel-${qui}-${nom}.png`, fullPage: true });
}
if (qui === 'responsable') {
  // Une action du plan, puis la première page d'une auto-évaluation existante (résultats).
  await page.goto(URL + '/plan', { waitUntil: 'networkidle0' }); await attendre(2600);
  const lien = await page.$('.liste a');
  if (lien) { await lien.click(); await attendre(1200); await page.screenshot({ path: `${dossier}/tel-${qui}-action.png`, fullPage: true }); }
  await page.goto(URL + '/suivi', { waitUntil: 'networkidle0' }); await attendre(2600);
  const res = await page.$('.liste a[href*="resultats"]');
  if (res) { await res.click(); await attendre(1200); await page.screenshot({ path: `${dossier}/tel-${qui}-resultats.png`, fullPage: true }); }
}
if (qui === 'accompagnatrice') {
  const g = await page.$('.liste a[href*="garderie"]');
  if (g) { await g.click(); await attendre(1500); await page.screenshot({ path: `${dossier}/tel-${qui}-garderie.png`, fullPage: true }); }
}
await navigateur.close();
console.log('captures faites :', qui);
