# Hubert Mange MPG

Appli web pour résumer l'organisation d'une grande ligue Mon Petit Gazon entre amis
(6 divisions, 3 saisons jeu par saison réelle, coupe, cagnotte commune).

**Idée directrice** : l'appli possède sa propre base de données historique. MPG n'est
qu'une source qu'on synchronise ; la cagnotte est 100 % maison.

## Stack

- **backend/** — API Node + TypeScript (Express), Prisma, SQLite en local (portable Postgres).
- **frontend/** — React + Vite + TypeScript, React Router, TanStack Query, Tailwind v4 + shadcn/ui
  (design system « Broadcast », dark-only), Recharts (graphiques).
- Seul `backend/src/connector/` parle à MPG (flow OAuth Ligue1, voir le gist de référence).

## Démarrage

### Backend

```bash
cd backend
npm install
cp .env.example .env          # renseigner SESSION_SECRET, et MPG_ADMIN_* pour le sync
npx prisma db push            # crée la base SQLite
npx tsx src/db/seed.ts        # (optionnel) données de démo
npm run dev                   # API sur http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173 (proxy /api et /auth vers le backend)
```

## Scripts utiles (backend)

- `npm run connector:test` — se connecte à MPG (identifiants `.env`) et imprime le dashboard.
  Sert à **découvrir la structure des données** (leagues/divisions/IDs) avant de finaliser le sync.
- `npm run sync` — lance le sync admin (identifiants `.env`), voir `src/sync/sync.ts`.
- `npm run db:studio` — explorer la base avec Prisma Studio.
- `npm run clone:prod` — copie les données de la **prod** (Postgres/Supabase) vers la base
  **SQLite locale** (purge puis réinsertion dans l'ordre des clés étrangères). Pratique pour
  bidouiller en local sur de vraies données. Prérequis : `PROD_DATABASE_URL` dans `.env`
  (connection string Supabase, cf. `DEPLOY.md`). ⚠️ Les champs chiffrés (IBAN, token MPG) ne
  se déchiffrent que si ta `ENCRYPTION_KEY` locale est identique à celle de prod.
- `npx tsx src/db/seed.ts` — données de démonstration.
- `npx tsx src/db/verify.ts` — contrôle des 16 endpoints de lecture (forge une session
  superadmin, backend démarré). Sort en échec si l'un d'eux tombe : à lancer avant un push.

## État actuel

- ✅ **Refonte UI V2 « Broadcast »** (design system dark-first : shadcn/ui + Tailwind v4, polices
  Archivo/Inter, palette violet/rose/orange/menthe, dégradés & halos ; maquettes dans
  `docs/mockups/`). Coquille responsive **sidebar desktop / bottom nav mobile** ; **Accueil** (`/`)
  branchée sur `GET /api/dashboard` (rang et zone, prochain match daté, forme, mercato, cagnotte,
  palmarès perso) — plus aucune donnée factice ; Palmarès sur `/palmares`, page Stats relabellée
  **« Rétro »**.
- ✅ **Installable et partageable** : manifest PWA + icônes (ajout à l'écran d'accueil), carte
  Open Graph pour l'aperçu du lien envoyé dans le groupe.
- ✅ **Coquille desktop sans barre du haut** : la sidebar porte la navigation et, en bas, le compte
  connecté (profil + déconnexion) ; les pages détail affichent leur bouton retour dans le contenu.
- ✅ Connecteur MPG (flow OAuth), auth applicative "Sign in with MPG", sessions JWT.
- ✅ Modèle de données complet (Manager / RealSeason / GameSeason / Division / Participation /
  Match / Tournament / DivisionAward / PrizePool / Contribution / Payout / TrackedLeague·Tournament).
- ✅ Cagnotte : API lecture + édition admin, page de consultation.
- ✅ Palmarès : coupes (3 niveaux : Ligue des Crampons ⭐ / Heureux papa's League 🎖️ / Conference 🍐)
  + vainqueurs par saison (filtres) + classement all-time + stats fun. Les classements lient vers
  le profil des joueurs.
- ✅ Paramètres : formulaire perso (visible par tous) + encart admin (déclenchement du sync,
  ligues/tournois suivis) + encart superadmin (attribution des rôles).
- ✅ **Profil public par joueur** (`/profil/:managerId`) à onglets : **Résumé** (bilan H2H : bête
  noire, victime préférée, plus large victoire/défaite), **Salle des trophées** (championnats +
  coupes), **Stats** (frise de carrière en graphique Recharts — niveau de division au fil des
  saisons, titres marqués — + montées/descentes, %victoires, meilleure/pire saison), **Confrontations**
  (tous les adversaires). En-tête avec étoiles ⭐ par titre de LDC.
- ✅ **Sync fonctionnel** : `npm run sync` rapatrie les vraies données MPG (ligues,
  saisons, divisions, managers, classements/participations) — historique des saisons
  passées inclus. Endpoints confirmés sur `api.mpg.football` (voir `src/sync/sync.ts`).
- ✅ **Sync automatique** : planifié par défaut lundi 08:30 Europe/Paris
  (`AUTO_SYNC`, `SYNC_CRON`, `SYNC_TZ` dans `.env`). Chaque exécution (auto ou manuelle)
  est tracée en base (`SyncRun`) et visible sur la page Admin. ⚠️ Nécessite un process
  Node persistant (Railway/Render/VPS), pas du serverless.
- ✅ **Cagnotte par saison réelle** : mise annuelle unique, suivi « a payé » par le banquier,
  reversements (saisons jeu + coupe), **verrou des années passées** (seule l'année courante
  est éditable). UI banquier dans la page Cagnotte.
- ✅ **Profil & paiement** : tél + IBAN (chiffré au repos), visibles par le membre + banquier.
  **QR Wero** (lien `share.weropay.eu` perso de chaque membre) affiché au banquier pour le virement.
  `ENCRYPTION_KEY` requis.
- ✅ **Ligues & tournois suivis** : on ne synchronise que les ligues/tournois sélectionnés (page
  Admin). Liste à cocher **toujours affichée**, partagée par tous les admins (chacun ajoute les
  siens depuis son compte). Décocher = **mettre le sync en pause** (les données restent au
  classement) ; **Supprimer** (superadmin) efface la ligue et ses données. Sync ponctuel d'une
  ligue par `POST /api/sync { leagueId }`.
- ✅ **Rôles** : SUPERADMIN / ADMIN / TREASURER / MEMBER, attribués depuis la page Admin.
  ADMIN gère les ligues/tournois + sync + cagnotte ; suppression et attribution des rôles =
  superadmin seul.
- ✅ **Gains automatisés** : grille de **montants fixes** par division + chaque coupe (LDC / Europa /
  Conference) ; bouton
  « Générer les reversements » qui crée les gains des vainqueurs depuis les classements
  (idempotent, préserve le statut « versé »).
- ✅ **Classement all-time « façon JO »** : tableau des médailles par division — on compte les
  titres (1re place) et on classe sur les titres de D1 d'abord, puis D2, etc. (les podiums ont leur
  propre classement dans les stats fun).
- ✅ **Design system « Broadcast »** (shadcn/ui + Tailwind v4) : **dark-only** au départ (tokens de
  marque en `@theme`, plus de toggle clair/sombre — le light mode viendra plus tard). UI responsive
  mobile-first (sidebar desktop / bottom nav mobile, classements en cartes sur petit écran).
  Bannière promotionnelle en tête de la page « Rétro ».

## Suite

Les pistes pour la V2 (résumé de journée par un agent, notifications, badges, rivalités, thème
clair, tests…) vivent dans **[docs/ROADMAP-V2.md](docs/ROADMAP-V2.md)**, avec ce sur quoi chacune
peut déjà s'appuyer.
