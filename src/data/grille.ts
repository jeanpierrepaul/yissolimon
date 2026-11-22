// Grille d'autoévaluation (version prototype, à valider avec des spécialistes de la petite enfance).
// Réponses : 2 = Oui, 1 = En partie, 0 = Pas encore, null = Je ne sais pas.

export type Reponse = 0 | 1 | 2 | null;

export interface Question {
  id: string; // "<dimension>.<n>"
  texte: string;
  aide: string;
  action: { titre: string; description: string; preuve: string };
  ressource: string;
}

export interface Dimension {
  id: string;
  titre: string;
  court: string;
  questions: Question[];
}

export const REPONSES: { v: Reponse; label: string }[] = [
  { v: 2, label: 'Oui' },
  { v: 1, label: 'En partie' },
  { v: 0, label: 'Pas encore' },
  { v: null, label: 'Je ne sais pas' },
];

export const GRILLE: Dimension[] = [
  {
    id: 'securite', titre: 'Sécurité des espaces', court: 'Sécurité',
    questions: [
      { id: 'securite.1', texte: 'Les produits dangereux (eau de javel, médicaments, allumettes) sont rangés hors de portée des enfants.', aide: 'Regardez à hauteur d’enfant : rien de dangereux ne doit être accessible.',
        action: { titre: 'Ranger les produits dangereux en hauteur', description: 'Faire le tour des pièces avec l’équipe, regrouper les produits dangereux dans un placard fermé ou en hauteur.', preuve: 'Aucun produit dangereux accessible lors d’une visite.' }, ressource: 'securite-tour' },
      { id: 'securite.2', texte: 'Les sorties vers la rue ou un point d’eau sont fermées ou surveillées en permanence.', aide: 'Portail, puits, bassine d’eau, fosse : tout ce qui présente un risque.',
        action: { titre: 'Sécuriser les accès à la rue et à l’eau', description: 'Identifier les points de sortie et les points d’eau, décider d’une fermeture ou d’une personne chargée de surveiller.', preuve: 'Portail fermé et points d’eau couverts pendant l’accueil.' }, ressource: 'securite-tour' },
      { id: 'securite.3', texte: 'Il y a toujours un adulte qui voit les enfants, y compris pendant les repas et la sieste.', aide: 'Pensez aux moments où l’équipe est occupée ailleurs.',
        action: { titre: 'Organiser un tour de surveillance', description: 'Répartir les moments de la journée entre les adultes pour qu’aucun groupe ne reste sans adulte.', preuve: 'Planning de surveillance affiché et suivi.' }, ressource: 'securite-surveillance' },
      { id: 'securite.4', texte: 'L’équipe sait quoi faire et qui appeler en cas d’accident.', aide: 'Numéros utiles, trousse de premiers secours, personne à prévenir.',
        action: { titre: 'Afficher la conduite à tenir en cas d’accident', description: 'Préparer avec l’équipe une affiche simple : gestes de base, numéros utiles, parents à prévenir.', preuve: 'Affiche visible et connue de toute l’équipe.' }, ressource: 'securite-urgence' },
    ],
  },
  {
    id: 'hygiene', titre: 'Hygiène et vie quotidienne', court: 'Hygiène',
    questions: [
      { id: 'hygiene.1', texte: 'Les enfants se lavent les mains avec du savon avant de manger et après les toilettes.', aide: 'Un point d’eau avec savon accessible aux enfants.',
        action: { titre: 'Installer un coin lavage des mains', description: 'Prévoir un récipient d’eau avec robinet, du savon et un moment fixe de lavage avant les repas.', preuve: 'Lavage des mains observé avant chaque repas.' }, ressource: 'hygiene-mains' },
      { id: 'hygiene.2', texte: 'L’eau donnée aux enfants est propre et conservée couverte.', aide: 'Récipient fermé, gobelets propres.',
        action: { titre: 'Organiser la conservation de l’eau de boisson', description: 'Utiliser un récipient couvert avec robinet ou louche dédiée, nettoyer les gobelets chaque jour.', preuve: 'Récipient couvert et gobelets propres chaque jour.' }, ressource: 'hygiene-eau' },
      { id: 'hygiene.3', texte: 'Les espaces (sol, nattes, toilettes) sont nettoyés chaque jour selon une routine connue.', aide: 'Qui nettoie quoi, et quand.',
        action: { titre: 'Mettre en place une routine de nettoyage visuelle', description: 'Faire avec l’équipe une affiche avec des dessins : quoi nettoyer, quand, par qui.', preuve: 'Routine affichée et appliquée.' }, ressource: 'hygiene-routine' },
      { id: 'hygiene.4', texte: 'Les repas et goûters sont pris dans de bonnes conditions (propreté, calme, temps suffisant).', aide: 'Lieu propre, enfants assis, adultes présents.',
        action: { titre: 'Améliorer le moment du repas', description: 'Définir un lieu et un déroulé du repas : lavage des mains, installation, accompagnement des plus petits.', preuve: 'Repas observés calmes et propres.' }, ressource: 'hygiene-repas' },
    ],
  },
  {
    id: 'nutrition', titre: 'Nutrition et alimentation', court: 'Nutrition',
    questions: [
      { id: 'nutrition.1', texte: 'Les repas et goûters donnés aux enfants sont variés (céréales, légumineuses, légumes, fruits, et poisson, œuf ou viande quand c’est possible).', aide: 'Pas toujours la même bouillie : des couleurs différentes dans l’assiette au fil de la semaine.',
        action: { titre: 'Préparer un menu varié de la semaine', description: 'Avec l’équipe et des parents, composer un menu de la semaine avec des produits locaux et de saison, et l’afficher.', preuve: 'Menu affiché et suivi la plupart des jours.' }, ressource: 'nutrition-menu' },
      { id: 'nutrition.2', texte: 'Les enfants mangent ou prennent un goûter à des heures fixes, sans rester trop longtemps le ventre vide.', aide: 'Un petit enfant a besoin de manger plusieurs fois par jour.',
        action: { titre: 'Fixer les heures des repas et des goûters', description: 'Décider avec l’équipe des heures de repas et de goûter, et prévoir une solution pour l’enfant arrivé sans manger.', preuve: 'Horaires affichés et respectés.' }, ressource: 'nutrition-menu' },
      { id: 'nutrition.3', texte: 'L’équipe sait repérer un enfant qui maigrit, mange mal ou semble affaibli, et conseille aux parents d’aller au centre de santé.', aide: 'Enfant qui maigrit, très fatigué, pieds ou visage gonflés, cheveux qui changent de couleur.',
        action: { titre: 'Apprendre à repérer les signes d’alerte', description: 'Lire la fiche avec l’équipe et convenir de qui parle aux parents quand un signe est remarqué.', preuve: 'L’équipe sait citer les signes et le centre de santé à conseiller.' }, ressource: 'nutrition-signes' },
      { id: 'nutrition.4', texte: 'Une maman qui allaite peut venir allaiter son bébé au calme ou laisser son lait.', aide: 'Le lait maternel reste l’aliment le plus important des bébés.',
        action: { titre: 'Préparer un coin calme pour l’allaitement', description: 'Prévoir un endroit propre et à l’abri des regards, et en informer les mamans.', preuve: 'Coin d’allaitement disponible et connu des parents.' }, ressource: 'nutrition-allaitement' },
    ],
  },
  {
    id: 'eveil', titre: 'Éveil et activités', court: 'Éveil',
    questions: [
      { id: 'eveil.1', texte: 'Des activités d’éveil sont prévues chaque jour (chants, contes, jeux, dessin).', aide: 'Pas seulement de la garde : des moments pour apprendre en jouant.',
        action: { titre: 'Préparer un programme d’activités de la semaine', description: 'Choisir avec l’équipe une activité par jour (conte, chant, jeu, dessin) et l’afficher.', preuve: 'Programme affiché et suivi.' }, ressource: 'eveil-programme' },
      { id: 'eveil.2', texte: 'Les activités sont adaptées à l’âge des enfants.', aide: 'Les bébés, les 2-3 ans et les plus grands n’ont pas les mêmes besoins.',
        action: { titre: 'Adapter les activités par tranche d’âge', description: 'Former deux ou trois petits groupes d’âge et prévoir une variante de chaque activité.', preuve: 'Activités différentes selon les âges observées.' }, ressource: 'eveil-age' },
      { id: 'eveil.3', texte: 'Les enfants ont accès à du matériel de jeu, même fait avec des objets locaux.', aide: 'Capsules, boîtes, tissus, calebasses, cailloux lavés…',
        action: { titre: 'Fabriquer des jeux avec des objets locaux', description: 'Organiser un atelier avec l’équipe et des parents pour fabriquer des jeux simples et sans danger.', preuve: 'Coin de jeux disponible et utilisé.' }, ressource: 'eveil-jeux-locaux' },
      { id: 'eveil.4', texte: 'Les adultes parlent, chantent et racontent des histoires aux enfants, y compris dans la langue de la maison.', aide: 'Le langage se développe en échangeant avec l’enfant.',
        action: { titre: 'Instaurer un moment quotidien de conte ou de chant', description: 'Fixer un moment chaque jour, dans la langue familière des enfants.', preuve: 'Moment de conte ou chant réalisé chaque jour.' }, ressource: 'eveil-langage' },
    ],
  },
  {
    id: 'bienetre', titre: 'Bien-être émotionnel', court: 'Bien-être',
    questions: [
      { id: 'bienetre.1', texte: 'Un nouvel enfant est accueilli en douceur, avec une adaptation progressive et un adulte qui s’occupe de lui en priorité.', aide: 'Les premiers jours loin des parents sont une grande épreuve pour un petit enfant.',
        action: { titre: 'Organiser une adaptation en douceur', description: 'Prévoir des premiers jours courts, un parent présent au début et un adulte de référence pour chaque nouvel enfant.', preuve: 'Chaque nouvel enfant a un adulte de référence.' }, ressource: 'bienetre-accueil' },
      { id: 'bienetre.2', texte: 'Quand un enfant pleure, a peur ou est triste, un adulte le réconforte au lieu de l’ignorer ou de le gronder.', aide: 'Se mettre à sa hauteur, le prendre contre soi, mettre des mots sur ce qu’il ressent.',
        action: { titre: 'Réconforter et nommer les émotions', description: 'Convenir en équipe des gestes de réconfort et de quelques phrases simples pour nommer les émotions.', preuve: 'Les pleurs sont accueillis par un adulte.' }, ressource: 'bienetre-emotions' },
      { id: 'bienetre.3', texte: 'L’équipe remarque quand un enfant change de comportement (se replie, devient agressif, ne joue plus, a peur des adultes).', aide: 'Un changement brusque peut signaler que l’enfant vit quelque chose de difficile.',
        action: { titre: 'Repérer les changements de comportement', description: 'Partager chaque semaine en équipe ce qui a changé chez un enfant, puis en parler avec les parents.', preuve: 'Point d’équipe hebdomadaire sur les enfants.' }, ressource: 'bienetre-signes' },
      { id: 'bienetre.4', texte: 'Chaque enfant a chaque jour un moment d’attention rien que pour lui, et un coin calme où se reposer.', aide: 'Un regard, un mot, un câlin, un coin avec une natte et un tissu doux.',
        action: { titre: 'Créer un coin calme et des moments individuels', description: 'Aménager un coin calme et veiller à ce que chaque enfant reçoive un moment d’attention individuelle par jour.', preuve: 'Coin calme utilisé, aucun enfant oublié.' }, ressource: 'bienetre-emotions' },
    ],
  },
  {
    id: 'inclusion', titre: 'Inclusion et besoins individuels', court: 'Inclusion',
    questions: [
      { id: 'inclusion.1', texte: 'Tous les enfants sont accueillis, y compris ceux qui ont un handicap ou une difficulté.', aide: 'Aucun enfant n’est laissé de côté.',
        action: { titre: 'Discuter en équipe de l’accueil de tous les enfants', description: 'Prendre un temps d’échange sur les enfants qui ont des besoins particuliers et sur ce qui peut être adapté.', preuve: 'Adaptations décidées et notées.' }, ressource: 'inclusion-accueil' },
      { id: 'inclusion.2', texte: 'L’équipe observe chaque enfant et remarque quand quelque chose l’inquiète.', aide: 'Un enfant qui ne parle pas, ne joue pas, maigrit…',
        action: { titre: 'Mettre en place un cahier d’observation', description: 'Noter simplement les observations importantes sur chaque enfant et en parler aux parents.', preuve: 'Cahier tenu à jour.' }, ressource: 'inclusion-observer' },
      { id: 'inclusion.3', texte: 'Les filles et les garçons ont accès aux mêmes jeux et activités.', aide: 'Pas de jeux « réservés ».',
        action: { titre: 'Veiller à l’égalité filles-garçons dans les jeux', description: 'Observer qui joue à quoi et encourager chaque enfant à essayer toutes les activités.', preuve: 'Filles et garçons participent à toutes les activités.' }, ressource: 'inclusion-accueil' },
      { id: 'inclusion.4', texte: 'Le rythme de chaque enfant est respecté (sommeil, repas, propreté).', aide: 'Chaque enfant a son rythme.',
        action: { titre: 'Respecter le rythme de chaque enfant', description: 'Échanger avec les parents sur les habitudes de l’enfant et adapter la journée.', preuve: 'Habitudes notées et respectées.' }, ressource: 'inclusion-observer' },
    ],
  },
  {
    id: 'protection', titre: 'Protection et respect de l’enfant', court: 'Protection',
    questions: [
      { id: 'protection.1', texte: 'L’équipe utilise des méthodes positives, sans punitions physiques ni humiliations.', aide: 'Expliquer, encourager, détourner l’attention.',
        action: { titre: 'Adopter des règles de discipline positive', description: 'Écrire avec l’équipe ce qu’on fait quand un enfant fait une bêtise, sans frapper ni humilier.', preuve: 'Règles écrites et connues de l’équipe.' }, ressource: 'protection-discipline' },
      { id: 'protection.2', texte: 'Les enfants ne sont remis qu’à des personnes connues et autorisées par les parents.', aide: 'Liste des personnes autorisées.',
        action: { titre: 'Tenir la liste des personnes autorisées', description: 'Demander aux parents qui peut venir chercher l’enfant et tenir la liste à jour.', preuve: 'Liste à jour pour chaque enfant.' }, ressource: 'protection-arrivee-depart' },
      { id: 'protection.3', texte: 'L’équipe sait vers qui se tourner si un enfant semble en danger.', aide: 'Personne ressource, services sociaux, autorités compétentes.',
        action: { titre: 'Identifier les contacts en cas d’inquiétude', description: 'Avec la personne ressource, lister les services à contacter en cas d’inquiétude pour un enfant.', preuve: 'Contacts connus de l’équipe.' }, ressource: 'protection-alerter' },
      { id: 'protection.4', texte: 'Les enfants peuvent s’exprimer et sont écoutés.', aide: 'On leur demande leur avis, on écoute leurs pleurs et leurs demandes.',
        action: { titre: 'Créer un moment de parole avec les enfants', description: 'Chaque jour, prendre un petit moment pour écouter les enfants (ce qu’ils ont aimé, ce qui ne va pas).', preuve: 'Moment de parole réalisé.' }, ressource: 'protection-discipline' },
    ],
  },
  {
    id: 'familles', titre: 'Communication avec les familles', court: 'Familles',
    questions: [
      { id: 'familles.1', texte: 'Les parents reçoivent des nouvelles de leur enfant régulièrement.', aide: 'Un mot à l’arrivée ou au départ, un message.',
        action: { titre: 'Mettre en place un bref échange avec les parents', description: 'Prévoir un mot à la sortie ou un message court chaque semaine sur la vie de l’enfant.', preuve: 'Échanges réalisés et retours recueillis.' }, ressource: 'familles-echanges' },
      { id: 'familles.2', texte: 'Les parents connaissent les règles et le programme de la garderie.', aide: 'Horaires, repas, activités.',
        action: { titre: 'Présenter les règles et le programme aux parents', description: 'Organiser une petite réunion ou afficher les règles et le programme à l’entrée.', preuve: 'Règles et programme partagés.' }, ressource: 'familles-reunion' },
      { id: 'familles.3', texte: 'Les parents sont invités à participer (réunions, fabrication de jeux, fêtes).', aide: 'La garderie est aussi la leur.',
        action: { titre: 'Organiser une activité avec les parents', description: 'Inviter les parents à une activité : fabrication de jeux, conte, nettoyage.', preuve: 'Activité réalisée avec des parents.' }, ressource: 'familles-reunion' },
      { id: 'familles.4', texte: 'L’équipe partage avec les parents des conseils simples pour la maison.', aide: 'Jeux, lecture, hygiène, en restant dans son rôle.',
        action: { titre: 'Partager une fiche conseil par mois', description: 'Choisir une fiche de la bibliothèque et l’expliquer aux parents.', preuve: 'Fiche partagée chaque mois.' }, ressource: 'familles-echanges' },
    ],
  },
  {
    id: 'services', titre: 'Liens avec les services', court: 'Services',
    questions: [
      { id: 'services.1', texte: 'La garderie connaît le centre de santé le plus proche et ses horaires.', aide: 'Adresse, téléphone, horaires.',
        action: { titre: 'Noter les coordonnées du centre de santé', description: 'Relever l’adresse, le téléphone et les horaires du centre de santé et les afficher.', preuve: 'Coordonnées affichées.' }, ressource: 'services-orienter' },
      { id: 'services.2', texte: 'L’équipe sait orienter une famille vers le bon service (santé, social, état civil).', aide: 'Sans remplacer les professionnels.',
        action: { titre: 'Préparer un petit annuaire des services', description: 'Lister avec la personne ressource les services utiles aux familles de la commune.', preuve: 'Annuaire disponible.' }, ressource: 'services-orienter' },
      { id: 'services.3', texte: 'La garderie a un contact avec une personne ressource (animatrice, agent social, autorité locale).', aide: 'Quelqu’un à qui demander conseil.',
        action: { titre: 'Établir un contact avec une personne ressource', description: 'Identifier une personne ressource et convenir d’un point régulier.', preuve: 'Point régulier convenu.' }, ressource: 'services-personne-ressource' },
      { id: 'services.4', texte: 'La garderie participe aux réunions ou formations proposées dans la commune.', aide: 'Réseau des garderies, formations, campagnes.',
        action: { titre: 'Participer à une réunion ou formation locale', description: 'Se renseigner sur les rencontres prévues et y envoyer au moins une personne de l’équipe.', preuve: 'Participation à au moins une rencontre.' }, ressource: 'services-personne-ressource' },
    ],
  },
];

export const QUESTIONS = GRILLE.flatMap((d) => d.questions.map((q) => ({ ...q, dimension: d.id })));
export const TOTAL_QUESTIONS = QUESTIONS.length;

/** Score d'une dimension en % (les « Je ne sais pas » sont exclus). null si aucune réponse. */
export function scoreDimension(reponses: Record<string, Reponse>, dimId: string): number | null {
  const vals = Object.entries(reponses)
    .filter(([k, v]) => k.startsWith(dimId + '.') && typeof v === 'number')
    .map(([, v]) => v as number);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / (vals.length * 2)) * 100);
}

export function scores(reponses: Record<string, Reponse>) {
  const parDim: Record<string, number | null> = {};
  for (const d of GRILLE) parDim[d.id] = scoreDimension(reponses, d.id);
  const valides = Object.values(parDim).filter((v): v is number => v !== null);
  const global = valides.length ? Math.round(valides.reduce((a, b) => a + b, 0) / valides.length) : null;
  return { parDim, global };
}

/** Suggestions d'actions : les points « Pas encore » d'abord, puis « En partie ». */
export function suggestions(reponses: Record<string, Reponse>) {
  return QUESTIONS.filter((q) => reponses[q.id] === 0 || reponses[q.id] === 1)
    .sort((a, b) => (reponses[a.id] as number) - (reponses[b.id] as number));
}

export const dimensionTitre = (id: string) => GRILLE.find((d) => d.id === id)?.titre ?? id;
