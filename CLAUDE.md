# CLAUDE.md

Appli web pour gérer une ligue MPG (Mon Petit Gazon) entre amis : palmarès, cagnotte,
synchronisation des données depuis l'API MPG.

## Structure

- `backend/` — API Express + TypeScript, Prisma. SQLite en local, Postgres (Supabase) en prod.
- `frontend/` — Vite + React 18, React Router, TanStack Query, Tailwind + DaisyUI.

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
- **Désactiver ≠ supprimer une ligue/tournoi** : stats/palmarès agrègent **toutes** les données
  synchronisées (pas de filtre `active`). Décocher une ligue = `active:false` → *gèle* le sync, les
  données **restent** au classement. La **supprimer** (`DELETE`, superadmin) efface ses `GameSeason`
  (cascade Division/Participation/Match/Award) ; les `Payout` survivent (`onDelete: SetNull`),
  cagnotte (`PrizePool`/`Contribution`) et `RealSeason` partagées préservées.

## Commandes

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
