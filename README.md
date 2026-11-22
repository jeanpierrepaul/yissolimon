# Yissolimon

Plateforme d'amélioration continue des garderies communautaires.
Projet de l'équipe **Synergie** (ADJANFELE Jean-Pierre Paul, MONDO Yissolimon Lydie) pour le **Hack4Children 2026 – UNICEF Togo**.

**En ligne :** https://yissolimon.vercel.app

## Ce que fait l'application

La garderie suit un cycle simple : **Observer → Prioriser → Agir → Accompagner → Réévaluer**.

| Profil | Ce qu'il fait |
|---|---|
| **Responsable de garderie** | Autoévaluation (36 questions, 9 thèmes), plan d'actions, idées d'activités du jour, arbre de progrès, annuaire des services, orientation des familles (sans nom), lien parents à partager, proposition de nouveaux services |
| **Accompagnatrice (personne ressource)** | Suit les garderies, reçoit les demandes d'appui, échange avec les responsables, prépare de nouvelles fiches avec l'assistant |
| **Coordination communale** | Chiffres agrégés de la commune, validation des garderies inscrites, vérification des services proposés, relecture des fiches, export Excel anonymisé |
| **Parent (sans compte)** | Par le lien de sa garderie : services utiles pour l'enfant et avis anonyme en 5 questions |

Points clés :
- **Fonctionne sans internet** : les données sont gardées sur le téléphone puis envoyées dès que le réseau revient (application installable, PWA).
- **Aucune donnée nominative sur les enfants**, ni dans l'application ni dans l'export.
- **Assistant discret** (DeepSeek, côté serveur) : idées d'activités sur mesure, idées d'actions à partir des résultats, brouillons de fiches. Une fiche n'est publiée qu'après relecture humaine. Sans internet, la bibliothèque hors ligne prend le relais.
- **Chaque garderie validée a son propre lien parents** : les avis reçus par ce lien lui sont rattachés.

## Comptes de démonstration

Mot de passe de tous les comptes : `Demo2026!`

| Compte | Profil |
|---|---|
| `colibris@synergie.demo` | Responsable, garderie Les Colibris (2 cycles, progrès visibles) |
| `mawuli@synergie.demo` | Responsable, garderie Mawuli (1er cycle en cours) |
| `akpe@synergie.demo` | Responsable, garderie Akpé (nouvelle garderie) |
| `accompagnatrice@synergie.demo` | Accompagnatrice des 3 garderies |
| `coordination@synergie.demo` | Coordination communale |
| Lien `/avis/colibris-parents-demo` | Parent de la garderie Les Colibris |

Les données de démonstration sont fictives (commune pilote fictive).

## Technique

- Interface : React 19, TypeScript, Vite, stockage hors ligne Dexie (IndexedDB), PWA.
- Serveur : Supabase (PostgreSQL, authentification, règles d'accès par rôle au niveau des lignes, fonction `ia`).
- Hébergement : Vercel.

```
src/pages        écrans (responsable, accompagnatrice, coordination, parents, services, activités)
src/data         grille d'autoévaluation, fiches, activités (contenus hors ligne)
src/lib          session, synchronisation, base locale, assistant
supabase/        migrations SQL, données de démo, fonction serveur « ia »
scripts/         envoi de la base en ligne, tests de sécurité, captures d'écran
```

## Lancer en local

Prérequis : Node 20+, Docker (pour Supabase local).

```bash
npm install
npx supabase start          # base locale
npx vite --host             # http://localhost:5196
```

Variables (fichier `.env.local`, jamais publié) : `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
Clé de l'assistant : `DEEPSEEK_API_KEY` dans `supabase/functions/.env` (local) ou dans les secrets Supabase (en ligne).

## Sécurité et données

- Chaque rôle ne voit que ce qui le concerne (règles RLS testées : `scripts/test-securite.mjs`).
- Les parents n'ont aucun compte ; leurs avis sont anonymes et seuls les résultats agrégés sont affichés.
- À la déconnexion, les données sont effacées du téléphone (après envoi au serveur).
- Les contenus (fiches, activités) sont des contenus de démonstration, à valider avec des spécialistes de la petite enfance.
