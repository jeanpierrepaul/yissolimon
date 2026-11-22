// Export Excel anonymisé pour la coordination.
// Les données arrivent déjà anonymisées du serveur (fonction export_anonyme) : ce fichier ne fait que la mise en forme.
import { COURT_AVIS } from '../data/avis';
import { GRILLE, QUESTIONS, scores, type Reponse } from '../data/grille';
import { supabase } from './supabase';

interface Export {
  garderies: { garderie: string; commune: string; taille: string; cycles_termines: number }[];
  evaluations: { garderie: string; cycle: number; mois: string; reponses: Record<string, Reponse> }[];
  actions: { garderie: string; theme: string; statut: string; besoin_appui: boolean; echeance_mois: string | null }[];
  orientations: { garderie: string; besoin: string; type_service: string; mois: string; statut: string }[];
  avis_parents: { garderie: string; nombre_avis: number; scores: number[] | null }[];
  genere_le: string;
}

const STATUT: Record<string, string> = { a_faire: 'À faire', en_cours: 'En cours', terminee: 'Terminée' };
const TYPE: Record<string, string> = { sante: 'Santé', nutrition: 'Nutrition', social: 'Social', protection: 'Protection', etat_civil: 'État civil', education: 'Préscolaire' };
const BESOIN: Record<string, string> = {
  sante: 'Santé / maladie', vaccination: 'Vaccination', nutrition: 'Nutrition / croissance', developpement: 'Développement',
  protection: 'Protection de l’enfant', etat_civil: 'Acte de naissance', social: 'Difficulté sociale', autre: 'Autre',
};
const REP: Record<string, string> = { '2': 'Oui', '1': 'En partie', '0': 'Pas encore' };
const theme = (id: string) => GRILLE.find((g) => g.id === id)?.court ?? id;

export async function exporterDonnees(): Promise<string | null> {
  const { data, error } = await supabase.rpc('export_anonyme');
  if (error || !data) return 'L’export a échoué. Vérifiez la connexion et réessayez.';
  const d = data as Export;
  const XLSX = await import('xlsx');

  const lisezMoi = [
    ['Yissolimon · données anonymisées pour l’analyse'],
    [`Généré le ${d.genere_le}`],
    [],
    ['Règles d’anonymisation'],
    ['• Chaque garderie est remplacée par un code (G01, G02…). La correspondance avec les noms n’est pas dans ce fichier.'],
    ['• Pas de nom de garderie, de quartier, de personne ni d’enfant. Taille des garderies donnée par tranche.'],
    ['• Dates données au mois seulement.'],
    ['• Aucun texte libre : ni prénoms des participants, ni notes de suivi, ni remarques des parents.'],
    ['• Avis des parents : moyennes seulement, masquées quand une garderie a moins de 3 avis.'],
    ['• Seules les garderies validées par la coordination sont incluses.'],
    [],
    ['Échelles'],
    ['Auto-évaluation : Oui = 2, En partie = 1, Pas encore = 0, vide = « Je ne sais pas ». Score d’un thème = points obtenus / points possibles × 100.'],
    ['Avis des parents : 100 % = tous les parents ont répondu « Oui », 50 % = « Un peu » en moyenne, 0 % = « Non ».'],
  ];

  const garderies = d.garderies.map((g) => ({ Garderie: g.garderie, Commune: g.commune, Taille: g.taille, 'Cycles terminés': g.cycles_termines }));

  const evaluations = d.evaluations.map((e) => {
    const s = scores(e.reponses);
    const ligne: Record<string, string | number | null> = { Garderie: e.garderie, Cycle: e.cycle, Mois: e.mois, 'Score global (%)': s.global };
    for (const g of GRILLE) ligne[`${g.court} (%)`] = s.parDim[g.id];
    return ligne;
  });

  const reponses = d.evaluations.map((e) => {
    const ligne: Record<string, string | number> = { Garderie: e.garderie, Cycle: e.cycle, Mois: e.mois };
    for (const q of QUESTIONS) { const v = e.reponses[q.id]; ligne[q.id] = v === undefined ? '' : v === null ? 'Je ne sais pas' : REP[String(v)]; }
    return ligne;
  });
  const questions = QUESTIONS.map((q) => ({ Code: q.id, Thème: theme(q.dimension), Question: q.texte }));

  const actions = d.actions.map((a) => ({ Garderie: a.garderie, Thème: theme(a.theme), Statut: STATUT[a.statut] ?? a.statut,
    'Besoin d’appui': a.besoin_appui ? 'Oui' : 'Non', 'Échéance (mois)': a.echeance_mois ?? '' }));

  const orientations = d.orientations.map((o) => ({ Garderie: o.garderie, Mois: o.mois, Besoin: BESOIN[o.besoin] ?? o.besoin,
    'Type de service': TYPE[o.type_service] ?? o.type_service, Statut: o.statut === 'confirmee' ? 'La famille y est allée' : 'Orientée' }));

  const avis = d.avis_parents.map((a) => {
    const ligne: Record<string, string | number> = { Garderie: a.garderie, 'Nombre d’avis': a.nombre_avis };
    COURT_AVIS.forEach((c, i) => { ligne[`${c} (%)`] = a.scores ? a.scores[i] : 'masqué (< 3 avis)'; });
    return ligne;
  });

  const classeur = XLSX.utils.book_new();
  const ajouter = (nom: string, lignes: object[], largeur = 16) => {
    const f = XLSX.utils.json_to_sheet(lignes.length ? lignes : [{ Info: 'Aucune donnée' }]);
    f['!cols'] = Object.keys(lignes[0] ?? { Info: '' }).map(() => ({ wch: largeur }));
    XLSX.utils.book_append_sheet(classeur, f, nom);
  };
  const fl = XLSX.utils.aoa_to_sheet(lisezMoi); fl['!cols'] = [{ wch: 120 }];
  XLSX.utils.book_append_sheet(classeur, fl, 'Lisez-moi');
  ajouter('Garderies', garderies, 20);
  ajouter('Scores par thème', evaluations, 14);
  ajouter('Réponses détaillées', reponses, 13);
  ajouter('Questions', questions, 30);
  ajouter('Actions', actions, 18);
  ajouter('Orientations', orientations, 22);
  ajouter('Avis des parents', avis, 20);
  XLSX.writeFile(classeur, `yissolimon-donnees-anonymes-${d.genere_le}.xlsx`);
  return null;
}
