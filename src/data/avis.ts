// Questionnaire anonyme pour les parents (version prototype, à valider).
// Réponses : 2 = Oui, 1 = Un peu, 0 = Non. L'ordre compte : il correspond aux scores renvoyés par le serveur.

export const QUESTIONS_AVIS = [
  'Mon enfant est content d’aller à la garderie.',
  'Je me sens bien accueilli(e) par l’équipe.',
  'Je reçois régulièrement des nouvelles de mon enfant.',
  'La garderie me paraît propre et sûre.',
  'Mon enfant apprend des choses nouvelles (chants, mots, jeux).',
];

export const COURT_AVIS = ['Enfant content', 'Accueil des parents', 'Nouvelles de l’enfant', 'Propreté et sécurité', 'Apprentissages'];

export const REPONSES_AVIS = [
  { v: 2, label: 'Oui' },
  { v: 1, label: 'Un peu' },
  { v: 0, label: 'Non' },
];
