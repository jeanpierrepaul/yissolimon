// Repères de développement de l'enfant, de la naissance à 6 ans.
// Adaptés en français simple de :
//  - 0 à 3 ans : Early Childhood Care and Development Standards (0-3 years), ministère du Genre, de l'Enfance
//    et de la Protection sociale du Ghana avec l'UNICEF, 2018 (compétences, gestes de l'adulte, signes d'alerte) ;
//  - 3 à 6 ans : CDC, « Learn the Signs. Act Early. », étapes du développement révisées en 2022.
// Contenus de démonstration, à faire valider par des professionnels de la petite enfance du Togo.
// Aucune donnée sur un enfant n'est saisie : ce sont des repères généraux pour toute l'équipe.

export type Tranche = 'bebes' | 'petits' | 'grands';
export type Domaine = 'corps' | 'pensee' | 'relations' | 'langage';

export const TRANCHES: Record<Tranche, { nom: string; ages: string; activite: '0-2' | '2-3' | '3-5' }> = {
  bebes: { nom: 'Bébés', ages: '0 à 1 an', activite: '0-2' },
  petits: { nom: 'Petits', ages: '1 à 3 ans', activite: '2-3' },
  grands: { nom: 'Grands', ages: '3 à 6 ans', activite: '3-5' },
};
export const ORDRE_TRANCHES: Tranche[] = ['bebes', 'petits', 'grands'];

/** Les 4 domaines du développement, nommés simplement (comme dans les standards ECCD). */
export const DOMAINES: Record<Domaine, { nom: string; detail: string; theme: string }> = {
  corps: { nom: 'Son corps', detail: 'bouger, manipuler, manger, être en bonne santé', theme: 'nutrition' },
  pensee: { nom: 'Sa pensée', detail: 'découvrir, comprendre, résoudre', theme: 'eveil' },
  relations: { nom: 'Ses relations', detail: 'émotions, confiance, vivre avec les autres', theme: 'bienetre' },
  langage: { nom: 'Son langage', detail: 'écouter, comprendre, parler', theme: 'familles' },
};
export const ORDRE_DOMAINES: Domaine[] = ['corps', 'pensee', 'relations', 'langage'];

export interface Repere {
  id: string;
  age: string;
  tranche: Tranche;
  /** Ce que la plupart des enfants savent faire à cet âge. */
  sait: Record<Domaine, string[]>;
  /** Ce que l'équipe de la garderie peut faire chaque jour. */
  aider: string[];
  /** Signes qui doivent faire réagir (en parler aux parents, orienter vers le centre de santé). */
  alerte: string[];
  /** Santé et services à ne pas oublier à cet âge. */
  sante: string[];
  source: 'ECCD' | 'CDC';
}

export const REPERES: Repere[] = [
  {
    id: '6-mois', age: 'Vers 6 mois', tranche: 'bebes', source: 'ECCD',
    sait: {
      corps: ['Se retourne seul, du dos sur le ventre', 'Couché sur le ventre, lève la tête et les épaules', 'Attrape un objet et le porte à la bouche'],
      pensee: ['Explore les objets avec les mains et la bouche', 'Suit des yeux un objet qui bouge'],
      relations: ['Sourit aux personnes', 'Fait la différence entre un visage connu et un inconnu'],
      langage: ['Gazouille, rit, répond à la voix', 'Tourne la tête vers un bruit'],
    },
    aider: [
      'Posez le bébé sur le ventre quelques minutes, sur un pagne propre, sous surveillance.',
      'Donnez-lui des objets propres de formes et de matières différentes, trop gros pour être avalés.',
      'Parlez-lui, chantez, regardez-le dans les yeux pendant le change et le repas.',
      'Lavez ou faites bouillir régulièrement les objets qu’il met à la bouche.',
    ],
    alerte: [
      'Ne réagit pas aux bruits ni aux voix',
      'Ne sourit pas',
      'N’attrape pas les objets, ne les porte pas à la bouche',
      'Bras et jambes très raides, ou au contraire très mous',
      'Ne suit pas un objet des yeux',
      'Ne prend pas de poids',
    ],
    sante: ['Allaitement maternel seul jusqu’à 6 mois, puis début des repas complémentaires', 'Vaccins selon le carnet de santé', 'Pesée régulière'],
  },
  {
    id: '12-mois', age: 'Vers 1 an', tranche: 'bebes', source: 'ECCD',
    sait: {
      corps: ['Se met debout en se tenant', 'Ramasse un petit morceau entre le pouce et l’index', 'Mange seul des morceaux avec les doigts'],
      pensee: ['Cherche un objet caché sous un tissu', 'Imite des gestes simples'],
      relations: ['Pleure quand la maman ou l’adulte de confiance s’en va', 'Montre du doigt ce qu’il veut'],
      langage: ['Comprend « non » et son prénom', 'Dit « mama », « papa » ou un premier mot'],
    },
    aider: [
      'Laissez-le se déplacer à quatre pattes dans un coin sûr, sans objet dangereux à portée.',
      'Jouez à cacher un objet sous un pagne et à le retrouver.',
      'Nommez les objets et les personnes qu’il montre du doigt.',
      'Proposez des morceaux mous à manger seul, toujours assis et surveillé.',
    ],
    alerte: [
      'Ne montre pas du doigt pour demander',
      'Ne rampe pas, ne tient pas debout même avec appui',
      'Ne ramasse pas les petits objets',
      'Ne réagit pas quand l’adulte de confiance s’en va',
      'Corps très mou ou très raide par rapport aux autres enfants',
    ],
    sante: ['Vaccins de 9 mois (dont la rougeole) selon le carnet', 'Moustiquaire imprégnée pour la sieste', 'Repas variés en plus du lait maternel'],
  },
  {
    id: '18-mois', age: 'Vers 18 mois', tranche: 'petits', source: 'ECCD',
    sait: {
      corps: ['Marche seul', 'Gribouille avec un gros crayon', 'Mange seul avec les doigts ou une cuillère'],
      pensee: ['Joue à faire semblant (donner à manger à une poupée)', 'Empile deux ou trois objets'],
      relations: ['S’intéresse aux autres enfants', 'Fait « au revoir » de la main'],
      langage: ['Dit plusieurs mots', 'Montre une partie du corps quand on la nomme'],
    },
    aider: [
      'Prévoyez chaque jour un temps pour marcher, pousser, tirer, dehors si possible.',
      'Donnez du papier et un gros crayon ou un bâton pour tracer dans le sable.',
      'Chantez des comptines avec des gestes et laissez-le les imiter.',
      'Laissez-le essayer de manger seul, même si cela salit.',
    ],
    alerte: [
      'Ne marche pas seul',
      'Ne dit aucun mot',
      'N’imite pas les gestes (comme « au revoir »)',
      'Ne joue ni avec les objets ni avec les autres enfants',
      'Ne mange pas seul',
    ],
    sante: ['Rappels de vaccins selon le carnet', 'Lavage des mains avant de manger, avec de l’aide', 'Déparasitage selon le centre de santé'],
  },
  {
    id: '2-ans', age: 'Vers 2 ans', tranche: 'petits', source: 'ECCD',
    sait: {
      corps: ['Court, monte quelques marches', 'Empile des gobelets ou des cubes', 'Lance un ballon'],
      pensee: ['Range des objets par forme ou par couleur avec aide', 'Reste quelques minutes sur un même jeu'],
      relations: ['Cherche l’affection et l’approbation de l’adulte', 'Commence à jouer à côté des autres enfants'],
      langage: ['Dit des phrases de deux mots (« encore eau »)', 'Comprend des consignes simples'],
    },
    aider: [
      'Proposez des jeux d’empilage avec des gobelets, des boîtes ou des bouchons.',
      'Posez des questions simples et laissez le temps de répondre.',
      'Félicitez ses efforts plutôt que le résultat.',
      'Gardez les mêmes repères chaque jour : arrivée, jeu, repas, sieste.',
    ],
    alerte: [
      'Ne gribouille pas, n’empile rien',
      'Ne s’intéresse pas aux jouets',
      'Évite le regard des autres',
      'Reste longtemps fixé sur un objet plutôt que sur les personnes',
      'Colères violentes tous les jours',
      'Ne cherche pas l’affection de l’adulte',
    ],
    sante: ['Repas variés : céréales, légumineuses, légumes, fruits, œufs ou poisson', 'Eau potable', 'Moustiquaire imprégnée'],
  },
  {
    id: '3-ans', age: 'Vers 3 ans', tranche: 'petits', source: 'ECCD',
    sait: {
      corps: ['Court, saute, grimpe', 'Tient un crayon pour dessiner et colorier', 'Mange seul, est souvent propre le jour'],
      pensee: ['Joue à faire semblant (le marché, le docteur)', 'Récite des nombres en comptine'],
      relations: ['Essaie de s’habiller seul', 'Joue avec d’autres enfants'],
      langage: ['Parle en petites phrases', 'Peut apprendre plusieurs langues à la fois'],
    },
    aider: [
      'Organisez des jeux de rôle : le marché, le docteur, la cuisine.',
      'Comptez en chantant : les marches, les bouchons, les doigts.',
      'Laissez-le s’habiller et se laver les mains seul, en l’accompagnant.',
      'Parlez-lui dans sa langue et dans la langue de la garderie, clairement.',
    ],
    alerte: [
      'Parle très peu, ou ne se fait pas comprendre',
      'Ne court pas, ne saute pas',
      'Ne mange pas seul, ne sait pas s’habiller même un peu',
      'Crises où il ne peut pas être consolé, ou se balance seul longtemps',
      'Très gêné par les bruits ou les odeurs',
      'N’est pas propre le jour',
    ],
    sante: ['Lavage des mains au savon : avant le repas, après les toilettes', 'Dormir sous moustiquaire imprégnée', 'Consulter si la parole ne vient pas'],
  },
  {
    id: '4-ans', age: 'Vers 4 ans', tranche: 'grands', source: 'CDC',
    sait: {
      corps: ['Attrape un gros ballon', 'Tient un crayon entre les doigts et le pouce', 'Se sert à manger ou verse de l’eau, surveillé'],
      pensee: ['Nomme quelques couleurs', 'Dit ce qui vient ensuite dans une histoire connue', 'Dessine un bonhomme avec 3 parties du corps ou plus'],
      relations: ['Console un enfant qui pleure', 'Aime aider', 'Évite les dangers (ne saute pas de trop haut)'],
      langage: ['Fait des phrases de 4 mots ou plus', 'Raconte une chose de sa journée', 'Répond à « à quoi sert… ? »'],
    },
    aider: [
      'Racontez une histoire puis demandez : « et après ? ».',
      'Donnez de petites responsabilités : distribuer les gobelets, ranger.',
      'Jouez au ballon dehors, chaque jour.',
      'Nommez les émotions : « tu es triste parce que… ».',
    ],
    alerte: [
      'Ne fait pas de phrases',
      'Ne joue pas à faire semblant',
      'Ne s’intéresse pas aux autres enfants',
      'Ne comprend pas une consigne simple',
      'Perd des capacités qu’il avait',
    ],
    sante: ['Vue et audition : signaler un enfant qui plisse les yeux ou n’entend pas bien', 'Repas variés et collation', 'Acte de naissance : vérifier avec les parents avant l’école'],
  },
  {
    id: '5-ans', age: 'Vers 5 ans', tranche: 'grands', source: 'CDC',
    sait: {
      corps: ['Saute sur un pied', 'Boutonne quelques boutons', 'Écrit quelques lettres de son prénom'],
      pensee: ['Compte jusqu’à 10', 'Reste attentif 5 à 10 minutes', 'Utilise « hier », « demain »'],
      relations: ['Respecte son tour et les règles d’un jeu', 'Chante, danse ou joue un rôle devant les autres'],
      langage: ['Raconte une histoire avec au moins deux événements', 'Tient une conversation', 'Reconnaît des rimes'],
    },
    aider: [
      'Proposez des jeux à règles : attendre son tour, gagner et perdre.',
      'Lisez ou racontez une histoire, puis posez des questions.',
      'Jouez avec les lettres de son prénom, dans le sable ou sur une ardoise.',
      'Préparez le passage à l’école avec les parents.',
    ],
    alerte: [
      'Ne raconte pas ce qu’il a fait',
      'Ne joue pas avec les autres enfants',
      'Ne reste attentif à rien, même quelques minutes',
      'Parole difficile à comprendre pour un adulte qu’il ne connaît pas',
      'Perd des capacités qu’il avait',
    ],
    sante: ['Acte de naissance indispensable pour l’inscription à l’école', 'Vaccins à jour selon le carnet', 'Lavage des mains devenu un réflexe'],
  },
];

export const reperesDe = (t: Tranche) => REPERES.filter((r) => r.tranche === t);

/** Rappel affiché avec chaque liste de signes d'alerte. */
export const CONSEIL_ALERTE = 'Chaque enfant a son rythme. Un signe n’est pas un diagnostic. Si vous le remarquez plusieurs semaines, parlez-en calmement aux parents et proposez un rendez-vous au centre de santé. Ne notez jamais le nom de l’enfant dans l’application.';

export const SOURCES_REPERES = 'D’après les standards ECCD 0-3 ans (Ghana, UNICEF, 2018) et les étapes du développement du CDC (2022). À valider par des spécialistes du Togo.';
