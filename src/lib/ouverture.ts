/**
 * Écran d'ouverture (défini dans index.html, visible dès le premier instant).
 * Première ouverture de la session : il se ferme quand la barre de progression est pleine
 * (environ 2,7 s) et que la session est prête, après un court instant sur « C'est prêt ! ».
 * Rechargement dans la même session : 1 s seulement, pour ne pas lasser.
 */
const CLE = 'yissolimon-ouverture-vue';
let fermeture = false;

function dejaVue(): boolean {
  try { return sessionStorage.getItem(CLE) === '1'; } catch { return false; }
}

/** Promesse résolue à la fin du remplissage de la barre (sécurité : 4 s au plus). */
function barrePleine(el: HTMLElement): Promise<void> {
  return new Promise(resolve => {
    const barre = el.querySelector<HTMLElement>('.barre i');
    const securite = setTimeout(resolve, 4000);
    if (!barre || getComputedStyle(barre).animationName === 'none') { clearTimeout(securite); resolve(); return; }
    barre.addEventListener('animationend', () => { clearTimeout(securite); resolve(); }, { once: true });
  });
}

export function fermerOuverture() {
  const el = document.getElementById('ouverture');
  if (!el || fermeture) return;
  fermeture = true;
  const attente = dejaVue()
    ? new Promise<void>(r => setTimeout(r, Math.max(0, 1000 - performance.now())))
    : barrePleine(el).then(() => new Promise<void>(r => setTimeout(r, 350)));
  attente.then(() => {
    try { sessionStorage.setItem(CLE, '1'); } catch { /* stockage indisponible */ }
    el.classList.add('sortie');
    setTimeout(() => el.remove(), 600);
  });
}
