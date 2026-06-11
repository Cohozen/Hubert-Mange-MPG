# CLAUDE.md

Appli web pour gérer une ligue MPG (Mon Petit Gazon) entre amis : palmarès, cagnotte,
synchronisation des données depuis l'API MPG.

## Structure

- `backend/` — API Express + TypeScript, Prisma. SQLite en local, Postgres (Supabase) en prod.
- `frontend/` — Vite + React 18, React Router, TanStack Query, Tailwind + DaisyUI, Recharts
  (graphiques, ex. la frise de carrière du profil).
  - **Un seul composant par fichier, un seul fichier par composant.** Pas de sous-composant
    défini dans une page.
  - Composants **métier** → `src/components/business/<domaine>/` (ex. `cagnotte/`, `stats/`,
    `palmares/`, `admin/`, `profile/`, `settings/`) ; UI **générique réutilisable** (Avatar,
    ManagerLabel, Field, Empty…) → `src/components/ui/`. Les types partagés d'un domaine vont dans
    son `types.ts`.
  - Les `src/pages/*.tsx` ne font que **data-fetching + composition** (elles assemblent les
    composants métier, ne les définissent pas).
  - Imports via l'**alias `@/`** (`@/api/client`, `@/components/...`), configuré dans
    `tsconfig.json` (`paths`) et `vite.config.ts` (`resolve.alias`). Pas de chemins relatifs.
  - **Toujours utiliser le skill `daisyui`** avant de générer/modifier du HTML/JSX front : c'est la
    lib UI de référence (Tailwind v4 + daisyUI v5). Consulter le doc du composant concerné pour la
    markup exacte (ex. la syntaxe `dropdown` v5).

## Déploiement

- Frontend → Vercel · Backend → Railway · DB → Supabase (Postgres).
- Le cron auto-sync nécessite un **process Node persistant** (Railway), pas du serverless.

## Pièges & conventions (à connaître avant de toucher au code)

- **Base de données : `prisma db push`, PAS de migrations.** Ne jamais lancer `prisma migrate dev`
  (il détecte une dérive et propose de reset la base). Pour appliquer un changement de schéma :
  `cd backend && npx prisma db push`.
- **Cloner la prod en local : `npm run clone:prod`** (script `scripts/clone-prod.mjs`). Lit la prod
  Postgres via `PROD_DATABASE_URL` (jamais committée) et **purge puis remplace** la base SQLite
  locale (insertion dans l'ordre des FK). Garde-fou : refuse de tourner si `DATABASE_URL` local ne
  pointe pas sur `file:` (anti-écrasement de la prod). Pour la lecture seule de la prod, on a aussi
  le serveur MCP Supabase.
- **Montants en centimes (`Int`)** partout (cagnotte, contributions, payouts) — éviter les
  flottants. Convertir uniquement à l'affichage.
- **`backend/src/connector/` = flow OAuth MPG non officiel et fragile.** C'est le SEUL point de
  contact avec MPG. Si MPG/Ligue1 change son OAuth, on corrige UNIQUEMENT là. Le reste de l'appli
  ne dépend que de l'interface `MpgConnector` (`getData` cookie / `apiGet` token).
- **Authentification du sync :**
  - Sync manuel (`POST /api/sync`) + découverte/gestion ligues-tournois (`/leagues|tournaments...`) →
    token MPG de **l'admin connecté** (capturé au login, chiffré sur `Manager`). Ouvert au rôle
    **ADMIN** (pas seulement superadmin) via `requireLeagueAdmin`/`canManageLeagues`.
  - Cron auto-sync + CLI `npm run sync` → identifiants admin `.env` (`MPG_ADMIN_EMAIL/PASSWORD`).
  - **Tests / preview :** toute l'appli est derrière le login MPG (`App.tsx` : `if (!me)` →
    `LoginPage`). Pour se connecter en local (et atteindre les pages protégées comme Stats), les
    identifiants de test sont dans `backend/.env` (`MPG_ADMIN_EMAIL` / `MPG_ADMIN_PASSWORD`).
  - Token expiré → échec explicite « reconnecte-toi » (pas de fallback silencieux).
  - **Multi-admin** : les `TrackedLeague`/`TrackedTournament` sont globales (visibles par tous les
    admins). Le sync manuel est **résilient** : une ligue suivie non visible par le token de l'admin
    connecté est ignorée avec une note, sans planter (`try/catch` autour de `apiGet('/league/{id}')`).
- **`ENCRYPTION_KEY` (AES-256-GCM)** chiffre les IBAN ET le token MPG. Obligatoire en prod, à ne
  jamais perdre ni committer.
- **Rôles** : `SUPERADMIN` vient de `SUPERADMIN_MPG_USER_IDS` (config, recalculé par requête) ;
  `ADMIN`/`TREASURER` sont stockés sur `Manager`. **ADMIN** gère ligues/tournois suivis + sync +
  cagnotte. **SUPERADMIN seul** : backfill de structure, attribution des rôles, fusion de managers,
  et la **suppression** d'une ligue/tournoi suivi.
- **Pages & navigation** : la page **Paramètres** (`/parametres` ; `/admin` redirige) regroupe le
  formulaire perso (visible par **tous**) + un encart **admin** (sync/ligues/tournois) et un encart
  **superadmin** (rôles), gatés par rôle. Le **profil public** d'un joueur est sur `/profil/:managerId`
  (`/profil` = soi), à onglets (Résumé / Salle des trophées / Stats / Confrontations). Pour lier vers
  un profil depuis un classement, passer `managerId` à `ManagerLabel` (rend l'identité cliquable).
  Stats H2H + frise de carrière (graphique Recharts, données via `/api/palmares/timeline/:managerId`)
  vivent dans le profil, pas sur la page Stats (qui ne garde que les stats globales).
- **Désactiver ≠ supprimer une ligue/tournoi** : stats/palmarès agrègent **toutes** les données
  synchronisées (pas de filtre `active`). Décocher une ligue = `active:false` → *gèle* le sync, les
  données **restent** au classement. La **supprimer** (`DELETE`, superadmin) efface ses `GameSeason`
  (cascade Division/Participation/Match/Award) ; les `Payout` survivent (`onDelete: SetNull`),
  cagnotte (`PrizePool`/`Contribution`) et `RealSeason` partagées préservées.
- **Coupes : 3 niveaux** comme en vrai — `competition` = `LDC` (Ligue des Crampons), `UEFA`
  (Europa, « Heureux papa's League »), `CONFERENCE` (« …League Conference »), sinon `OTHER`.
  Classification par **nom** dans `competitionFromName` (`sync.ts`, exporté) : tester **`conference`
  AVANT `papa`/`heureu`** (un nom Conference contient aussi « papa »). Le scope cagnotte
  (`PayoutRule`) suit les mêmes codes (`DIVISION|LDC|UEFA|CONFERENCE`). **Icônes d'affichage**
  (à garder cohérentes dans tout le front) : ⭐ `LDC` · 🎖️ `UEFA` (Europa) · 🍐 `CONFERENCE`.
- **Override manuel du type** : la détection par nom échoue si le type n'est identifiable qu'au logo
  (ex. coupe Conference nommée « Heureux Papa's League 🍐 » → classée UEFA par défaut). On peut forcer
  le type via `TrackedTournament.competitionOverride` (nullable ; `null` = détection auto). Le sync
  fait primer l'override (`tt.competitionOverride ?? competitionFromName(...)`). Le réglage se fait
  dans l'admin (select par tournoi) → `PUT /api/admin/tournaments/:id` `{ competitionOverride }`
  (rôle ADMIN) ; **la route met à jour immédiatement la ligne `Tournament` déjà synchronisée** (effet
  visible sans relancer un sync). L'override est **par environnement** (donnée DB) : à reposer dans
  l'admin prod après déploiement.
- **Année d'une coupe = `createdAt` MPG** (`/tournament/{id}`), pas le nom (l'année n'y est pas
  toujours) — `tournamentYear()` dans `sync.ts`, replis nom puis année courante. Convention
  inchangée : **coupe année N ↔ `RealSeason` N-1**. Pour corriger des données déjà en prod
  (reclasser/recalculer) : **relancer un sync** (upsert idempotent sur `mpgTournamentId`), pas de
  script dédié.
- **Classement all-time (`/api/palmares/all-time`)** : ordonné **façon JO** sur les seuls titres de
  **division** (départage sur D1, puis D2…). Les **coupes comptent dans le total de titres affiché**
  (côté front, helper `totalWithCups` dans `StatsPage`) **mais jamais dans l'ordre** (`rank` reste
  basé sur les divisions). La liste des **vainqueurs par saison** (`/winners`) est triée du plus
  récent au plus ancien : année desc, puis saison MPG desc, puis division asc.
- **Séries consécutives (`/fun-stats` : `d1Streak`, `titleStreak`)** : se calculent sur la
  carrière **triée chronologiquement (`year` → `index`), sans grouper par `mpgLeagueId`**. Piège :
  l'**ID de ligue MPG change dans le temps** (migrations *séquentielles*, pas des ligues parallèles) —
  grouper/reset par ligue casserait toute série traversant une migration. Même tri que le timeline
  du profil (`/timeline`). Une série n'est interrompue que par une saison hors-critère (rang ≠ 1
  pour les titres, division ≠ D1 pour `d1Streak`).
- **Formatage : Biome** (config racine `biome.json`, version épinglée). Lancer `npm run format`
  (écrit) ou `npm run format:check` (vérifie) **depuis la racine** — couvre front + back. Les deux
  scripts pointent sur **`biome check`** (pas `biome format`) : il formate **et** trie les imports.
  Style : 4 espaces, double quotes, point-virgules, largeur 120. **Tri des imports** = action
  d'« assist » `source.organizeImports` (PAS une règle de linter — l'IDE le signale même linter
  off ; appliqué par `biome check --write`). **Linter désactivé** pour l'instant. **Formateur CSS
  désactivé** (`styles.css` n'est jamais reformaté) ; le parseur CSS accepte la syntaxe Tailwind v4 /
  daisyUI via `css.parser.tailwindDirectives` (sinon `@plugin`/`@import` font planter `biome check`).

## Commandes

Racine du repo :
- `npm run format` — formate tout (front + back) avec Biome · `npm run format:check` — vérifie sans écrire

Backend (`cd backend`) :
- `npm run dev` — API en watch · `npm run build` — tsc · `npm start` — dist
- `npm run db:push` — applique le schéma · `npm run db:studio` — Prisma Studio
- `npm run clone:prod` — copie la prod (Postgres) → base SQLite locale (lit `PROD_DATABASE_URL`)
- `npm run sync` — sync CLI (utilise `.env`) · `npm run connector:test` / `npm run discover` —
  outils de debug du connecteur MPG

Frontend (`cd frontend`) :
- `npm run dev` · `npm run build` · `npm run preview`

## Git

- **Commits réguliers et petits**, ciblés sur un changement cohérent, pour la lisibilité dans le
  temps et faciliter les rollbacks.
- **Projet simple : travailler directement sur `main`.** Ne PAS créer de branche sauf demande
  explicite.
- **Committer proactivement** à chaque étape logique terminée (sans attendre qu'on le demande).
- **Pousser (`git push`) uniquement sur demande.**
