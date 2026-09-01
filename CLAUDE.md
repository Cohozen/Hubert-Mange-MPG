# CLAUDE.md

Appli web pour gérer une ligue MPG (Mon Petit Gazon) entre amis : palmarès, cagnotte,
synchronisation des données depuis l'API MPG.

## Structure

- `backend/` — API Express + TypeScript, Prisma. SQLite en local, Postgres (Supabase) en prod.
- `frontend/` — Vite + React 18, React Router, TanStack Query, Tailwind v4 + shadcn/ui, Recharts
  (graphiques, ex. la frise de carrière du profil).
  - **Un seul composant par fichier, un seul fichier par composant.** Pas de sous-composant
    défini dans une page.
  - Composants **métier** → `src/components/business/<domaine>/` (ex. `accueil/`, `cagnotte/`,
    `stats/`, `palmares/`, `admin/`, `profile/`, `settings/`, `login/`) ; UI **générique réutilisable**
    (`InitialsAvatar`, `Field`, `Empty`…) → `src/components/ui/`. Les types partagés d'un domaine vont
    dans son `types.ts`.
  - Les `src/pages/*.tsx` ne font que **data-fetching + composition** (elles assemblent les
    composants métier, ne les définissent pas).
  - Imports via l'**alias `@/`** (`@/api/client`, `@/components/...`), configuré dans
    `tsconfig.json` (`paths`) et `vite.config.ts` (`resolve.alias`). Pas de chemins relatifs.
  - **UI = shadcn/ui (Radix + Tailwind v4)**. Primitives générées dans `src/components/ui/` en
    **minuscules** (`button.tsx`, `card.tsx`, `table.tsx`, `input.tsx`, `select.tsx`, `tabs.tsx`,
    `dialog.tsx`, `sheet.tsx`…), ajoutées via `npx shadcn@latest add <nom>`. Helper `cn()` dans
    `src/lib/utils.ts`, config `components.json` (style « new-york »). Les composants **maison**
    génériques (`InitialsAvatar`, `Field`, `Empty`, `Logo`, `SectionTitle`, `PillTabs`,
    `ConfirmDialog`, `ToggleSwitch`, `InfoHint`, `Loader`, `ErrorState`, `ErrorBoundary`) restent en
    **PascalCase** dans `ui/`. Les primitives réellement utilisées se limitent à `button`, `input`,
    `select`, `dialog` : les autres ont été supprimées (elles se régénèrent avec
    `npx shadcn@latest add <nom>`). **Exceptions gardées bien qu'inutilisées** : `badge.tsx`,
    `Field.tsx` et `SectionTitle.tsx` portent des variantes Broadcast maison que shadcn ne
    régénère pas.
  - **Composants génériques V2 réutilisés partout** : `PillTabs` (onglets pilules contrôlés, prop
    `width` = `auto|full|mobile-full|scroll` ; scroll horizontal safe — Palmarès/Rétro/Cagnotte),
    `ConfirmDialog` (**modale portale maison**, PAS le shadcn `dialog` — le `Dialog` radix contrôlé
    plantait sur un souci de ref ; remplace `window.confirm` pour les suppressions admin),
    `ToggleSwitch` (interrupteur on/off), `InfoHint` (petit ⓘ qui ouvre un popover au clic/tap —
    tap-friendly, fermeture au clic extérieur/Échap ; ex. explication de la note manager « MNG » sur
    le profil), `InitialsAvatar` (identité d'un manager : initiales + dégradé **déterministe** dérivé
    de son `managerId`, prop `ring` pour l'anneau du hero de profil). ⚠️ La couleur **de division**
    ne s'applique jamais à un joueur : elle est réservée aux pastilles D1…D6 et aux barres d'accent
    (les classements du Palmarès faisaient exception, corrigé). Côté métier : `SettingsCard`
    (`settings/`, carte à barre de dégradé + en-tête, réutilisée par settings ET admin) et
    `stats/playerStyle.ts` — `playerGradient(seed)` déterministe, `initials`, chips titres/coupes et
    **`divisionStyle(level)`, source unique de la palette D1→D6** (accent, fond, bordure, dégradé),
    consommée par la Rétro, le Palmarès et la salle des trophées.
  - **Onglets dans l'URL** : `lib/useTabParam.ts` (hook `useSearchParams`) porte l'onglet actif en
    query string — `?tab=` sur Profil/Palmarès/Rétro, `?saison=2025-2026` sur la Cagnotte (le nom de
    saison, pas l'id). Le bouton retour du navigateur reparcourt les onglets et une vue est
    partageable ; la valeur par défaut n'est jamais écrite dans l'URL.
  - **Design system « Broadcast » (V2)** défini dans `src/styles.css` — maquettes de référence dans
    `docs/mockups/`. Palette de marque en `@theme` (`--color-violet/rose/orange/menthe/jaune/
    violet-clair/rouge` + surfaces `nuit/carte/carte-2/bord` + `texte/texte-2`), rayons, polices
    `--font-display` (Archivo, via `font-display`) / `--font-ui` (Inter), dégradés (`grad-energy/
    banner/primary/lime/shield` + classes utilitaires), keyframes `lhmHalo/lhmPulse/lhmShine`.
    Variables sémantiques shadcn (`--background/--card/--primary/--border`…) mappées sur ces tokens.
    **Dark-only** au départ : classe `dark` forcée sur `<html>` (`useDarkTheme` dans `App.tsx`), pas
    de toggle clair/sombre (surfaces `light-*` réservées pour plus tard). Polices chargées via
    `@fontsource/{inter,archivo}` dans `main.tsx`. **Utiliser les tokens de marque** (`bg-carte`,
    `text-menthe`, `border-bord`, `grad-energy`…), pas de couleurs Tailwind brutes. Icônes coupes :
    ⭐ LDC · 🎖️ UEFA · 🍐 Conference. Variantes maison sur `Button` (`energy/violet/mint/danger/soft`
    + tailles `pill`) et `Badge` (`champ/ldc/europa/conf/admin/tres/member`). **Recharts** lit les
    `var(--color-*)` (ex. `--color-menthe`, `--color-bord`, `--color-texte-2`) → adapter là si les
    tokens changent.
  - **Assets `public/`** : icônes PWA (`icon-192/512.png`, `apple-touch-icon.png`) et carte de
    partage `og-image.png` — **régénérées depuis le design system**, pas retouchées à la main :
    page HTML de rendu (dégradés + logo + vraie Archivo servie par Vite) capturée en PNG via le
    Chromium de Playwright, puis redimensionnée. `stats-banner.jpg` est **conservé en réserve mais
    plus affiché** (la bannière de la Rétro est un dégradé CSS depuis la V2).
  - **Refonte « Broadcast V2 » : faite sur TOUTES les pages** (`docs/mockups/design/LHM *.dc.html`,
    frame mobile 430 + desktop 1320, valeurs px/hex en dur = source de vérité), Accueil comprise —
    elle consomme `GET /api/dashboard`, il n'y a plus de données factices. Conventions transverses
    tranchées avec Coco (cf. mémoire) : **initiales colorées partout, pas de photos d'avatar** (un
    joueur = une couleur, via `playerGradient(managerId)`) ; **pseudo (`username`) affiché à côté du
    nom partout** (d'où l'ajout de `username` au `ranking` de `/api/palmares/tournaments` et
    d'`opponentUsername` à `FormMatch`). Ce qui n'a pas de backend n'est pas affiché en placeholder :
    on le retire (card Préférences thème/notifications supprimée).

## Déploiement

- Frontend → Vercel (`www.ligue-hubert-mange.fr`) · Backend → Railway
  (`api.ligue-hubert-mange.fr`) · DB → Supabase (Postgres).
- Le cron auto-sync nécessite un **process Node persistant** (Railway), pas du serverless.
- **URL de l'API variabilisée** : le front appelle l'API **directement** via
  `VITE_API_BASE_URL` (préfixée dans `api()`, `frontend/src/api/client.ts`). En local la
  var est **vide** → proxy Vite (`/api`, `/auth` → `localhost:3001`) ; en prod c'est
  `https://api.ligue-hubert-mange.fr` (env Vercel, scope Production, injectée **au build**
  → redéployer après changement). **Plus de proxy dans `vercel.json`** (il ne garde que le
  fallback SPA). Front et API étant **same-site** (sous-domaines du même domaine), le
  cookie de session `SameSite=Lax` passe tel quel ; le CORS est piloté par `FRONTEND_ORIGIN`
  côté backend (= `https://www.ligue-hubert-mange.fr`).

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
- **`backend/src/connector/` = flow d'auth MPG non officiel et fragile.** C'est le SEUL point de
  contact avec MPG. Si MPG/Ligue1 change son auth, on corrige UNIQUEMENT là. Le reste de l'appli
  ne dépend que de `MpgConnector.apiGet(path)` (api.mpg.football, JWT en Bearer).
  **Depuis la refonte MPG d'août 2026** : mpg.football est une SPA Expo statique (les routes Remix
  `?_data=...` et `/auth/callback` ont disparu) et l'auth passe par **Auth0 Universal Login** sur
  `connect.ligue1.fr`. `auth.ts` rejoue donc un **Authorization Code + PKCE** côté serveur :
  `/authorize` → `/u/login` (POST `state`/`username`/`password`/`action`) → `/authorize/resume`
  → `/oauth/token`. Constantes (client_id web, audience `https://mpg.ligue1.fr`, `redirect_uri`
  `https://mpg.football/`) extraites de leur bundle. Détails : le grant Auth0 `password` est
  **désactivé** (pas de raccourci login/mot de passe → token) ; il y a du **Cloudflare** devant
  `connect.ligue1.fr`, d'où le `User-Agent` navigateur obligatoire ; les cookies (`did`, `auth0`,
  `__cf_bm`) doivent être propagés d'une étape à l'autre. `MpgAuthError.kind` distingue
  `credentials` (401) de `flow` (502) — ne jamais ré-avaler cette distinction, c'est ce qui rend
  la prochaine casse MPG diagnosticable. Headers du client v13 exigés par l'API :
  `platform: web`, `client-version`, `application: mpg`, `client-language: fr-FR`.
  **Diagnostic en 1 commande : `npm run connector:test`** (claims du JWT, TTL, refresh token, tuiles).
- **Authentification du sync :**
  - Sync manuel (`POST /api/sync`) + découverte/gestion ligues-tournois (`/leagues|tournaments...`) →
    token MPG de **l'admin connecté** (capturé au login, chiffré sur `Manager`). Ouvert au rôle
    **ADMIN** (pas seulement superadmin) via `requireLeagueAdmin`/`canManageLeagues`.
  - Cron auto-sync + CLI `npm run sync` → identifiants admin `.env` (`MPG_ADMIN_EMAIL/PASSWORD`).
  - **Tests / preview :** toute l'appli est derrière le login MPG (`App.tsx` : `if (!me)` →
    `LoginPage`). Pour se connecter en local (et atteindre les pages protégées comme Stats), les
    identifiants de test sont dans `backend/.env` (`MPG_ADMIN_EMAIL` / `MPG_ADMIN_PASSWORD`).
  - **Refresh token** : Auth0 accorde `offline_access` → le refresh token est stocké chiffré
    (`Manager.mpgRefreshTokenEncrypted`) et `connectorForManager` renouvelle l'access token tout
    seul quand le préflight `/user` échoue, puis re-persiste les deux (Auth0 fait tourner les
    refresh tokens). L'access token vit ~30 jours.
  - Token expiré ET refresh impossible → échec explicite « reconnecte-toi » (pas de fallback
    silencieux).
  - **Multi-admin** : les `TrackedLeague`/`TrackedTournament` sont globales (visibles par tous les
    admins). Le sync manuel est **résilient** : une ligue suivie non visible par le token de l'admin
    connecté est ignorée avec une note, sans planter (`try/catch` autour de `apiGet('/league/{id}')`).
- **`/api/public` = seul namespace SANS authentification** (`backend/src/modules/public/routes.ts`).
  Il existe parce que la page de connexion s'affiche **avant** le login et ne peut donc taper aucun
  endpoint protégé. Règle : **agrégats uniquement** (des compteurs), jamais de nom, d'email ni de
  donnée perso — la réponse est lisible par n'importe qui. Aujourd'hui une seule route,
  `GET /api/public/teaser` → `{ saison, equipes, editions, divisions }`, qui alimente le hero du
  Login (`business/login/LoginStatsTicker`) : **plus aucune valeur en dur à reposer chaque saison**.
  `editions` = nombre de **ligues MPG distinctes réellement synchronisées** (`GameSeason.mpgLeagueId`,
  pas `TrackedLeague` : on n'annonce pas une édition au palmarès vide) ; `equipes`/`divisions` =
  dernière saison jeu de la saison réelle la plus récente.
- **`ENCRYPTION_KEY` (AES-256-GCM)** chiffre les IBAN ET les tokens MPG (access + refresh).
  Obligatoire en prod, à ne jamais perdre ni committer.
- **Secrets obligatoires en prod, détectés via `DATABASE_URL`** : dès qu'elle ne commence pas par
  `file:` (donc Postgres), `config.ts` **refuse le démarrage** sans `SESSION_SECRET` (≠ repli de
  dev) ni `ENCRYPTION_KEY`. ⚠️ Ne jamais se fier à `NODE_ENV` pour ça : `DEPLOY.md` interdit de le
  poser sur Railway, `config.isProd` y est donc faux.
- **`POST /auth/login` est limité** (`http/rateLimit.ts`) : 10 **échecs** par IP et par quart
  d'heure, les connexions réussies ne comptant pas (plusieurs membres peuvent partager une IP
  d'opérateur mobile). Chaque tentative tape un vrai flow Auth0 chez Ligue1 : sans garde-fou, un
  bruteforce ferait blacklister l'IP du serveur et couperait login **et** sync. Nécessite
  `app.set("trust proxy", 1)` (proxy Railway) pour que `req.ip` ne soit pas le même pour tous.
- **Routes admin de lecture = superadmin** : `GET /api/admin/managers` (e-mails et userId MPG de
  tous les membres) et `/structure` ne sont PAS couvertes par le simple `requireAuth` du routeur.
- **Déclenchement de l'auto-sync : piloté par le calendrier, pas par un cron unique**
  (`sync/planner.ts`). Un tick (`SYNC_TICK_CRON`, 15 min) croise deux choses : une **grille de
  créneaux** calée sur les horaires L1 (ven 22:45 · sam 19:15 et 22:45 · dim 17:00, 19:15 et 22:45 ·
  mar–jeu 20:30 et 23:15, surchargeable par `SYNC_SLOTS`) et une **garde « journée en cours »**
  = « il existe un `Match` avec `kickoffAt` passé (< 4 j) et `played: false` ». C'est la garde qui
  rend le planning auto-adaptatif : silencieux en trêve et à l'intersaison, actif dès qu'une journée
  tourne, **y compris décalée en semaine** — un cron fixe raterait l'un ou taperait dans le vide.
  Deux créneaux sans garde : **lundi 08:30 = run `full`**, autres jours 08:30 = battement de cœur.
  Décision isolée dans `decide()` (pure) → rejouable par **`npm run sync:plan`**, qui simule 14
  jours de ticks depuis les vraies dates en base (le repo n'a pas de framework de test).
  `SYNC_MODE=cron` rejoue l'ancien comportement (`SYNC_CRON` hebdomadaire) sans redéployer.
- **Deux périmètres de sync** (`SyncRun.scope`) : `full` re-parcourt **toutes** les saisons MPG
  (mesuré ~130 s au 01/09/2026, et le coût croît chaque année), `current` la **seule saison en
  cours** (~45 s, ×3 plus rapide). Seule différence de parcours : la borne basse de la boucle des
  saisons dans `runSync`. Déclenchable partout : bouton « Saison en cours » de `/administration`,
  `POST /api/sync {scope:"current"}`, et `npm run sync -- --scope current`.
- **Un sync qui ne lit RIEN échoue** (`runSync` lève si des ligues/tournois étaient à traiter et que
  ni `gameSeasons` ni `tournaments` n'ont bougé). Chaque appel MPG est avalé en note, donc sans ce
  garde-fou une panne MPG produisait un « succès » vide — qui faisait avancer le `lastSuccess` du
  planner et **supprimait tout retry**. Un run échoué est retenté au tick suivant pendant 2 h
  (`CATCH_UP_MS`), puis le battement de cœur de 08:30 reprend la main.
- **`GET /api/sync/config`** (ADMIN) expose l'état RÉEL de l'auto-sync (`describeSchedule()` dans
  `sync/scheduler.ts` : `AUTO_SYNC` **et** présence des identifiants MPG, prochaine exécution, mode,
  fenêtre de journée ouverte ou non, derniers succès) — l'admin affichait « Active » en dur.
  ⚠️ La fonction est **async** (elle lit la base) : la route doit l'`await`.
- **Rôles** : `SUPERADMIN` vient de `SUPERADMIN_MPG_USER_IDS` (config, recalculé par requête) ;
  `ADMIN`/`TREASURER` sont stockés sur `Manager`. **ADMIN** gère ligues/tournois suivis + sync +
  cagnotte. **SUPERADMIN seul** : backfill de structure, attribution des rôles, fusion de managers,
  et la **suppression** d'une ligue/tournoi suivi.
- **Pages & navigation** : coquille `AppShell` (`src/components/layout/`) — sidebar fixe en desktop
  (`sticky top-0 h-screen`, ne s'étire plus avec le contenu), bottom nav en mobile (`< lg`).
  ⚠️ **Plus de barre en haut en desktop** (`Topbar` supprimée, ainsi que `pageTitle()`) : la sidebar
  porte la navigation ET, tout en bas, une section **compte** (avatar + nom + pseudo → `/profil`,
  puis la déconnexion). Corollaires à connaître : le **titre de page** de Palmarès et Cagnotte, que
  la topbar affichait, doit rester **visible en desktop** (pas de `lg:hidden` dessus) ; et le
  **bouton retour** des pages détail est rendu **par `AppShell` en tête du contenu** en desktop, par
  `MobileHeader` en mobile. Le `MobileHeader` et le bloc logo de la sidebar gardent leur **`h-[72px]`**.
  **Pages « détail »** (profil d'un autre = `/profil/:managerId`, `/parametres`
  et `/administration`) : `AppShell` calcule `isDetail` (via `useMatch`) → **pas de bottom-nav** +
  **bouton retour** (`navigate(-1)`). Navigation mobile animée
  (keyframe `lhmPageIn`, wrapper contenu `key={pathname}`, désactivée en `lg`). Routes : `/` =
  **Accueil** (dashboard branché sur `/api/dashboard`), `/palmares` = **Palmarès**, `/stats` =
  **Rétro** (libellé « Rétro », route inchangée), `/cagnotte`, `/profil`, `/parametres`,
  `/administration` (`/admin` y redirige).
  **Paramètres** (`/parametres`) = espace **personnel** uniquement (profil, paiement, déconnexion).
  Toute l'administration vit sur **`/administration`** : synchro, ligues et tournois suivis (ADMIN),
  attribution des rôles (SUPERADMIN). La route est gardée dans `App.tsx`
  (`isLeagueAdmin(me) ? <AdministrationPage/> : <Navigate to="/"/>`), l'entrée de menu est filtrée
  par le flag `adminOnly` de `SECONDARY_NAV` (`layout/nav.ts`) — sidebar en desktop, icône bouclier
  à gauche de l'engrenage en mobile. Le **profil public** d'un joueur est sur `/profil/:managerId`
  (`/profil` = soi), à onglets (Résumé / Salle des trophées / Stats / Confrontations), l'onglet actif
  étant porté par `?tab=`. Stats H2H + frise de carrière (graphique Recharts, données via
  `/api/palmares/timeline/:managerId`) vivent dans le profil, pas sur la page Stats.
  ⚠️ **Débordement mobile invisible** : `AppShell` a `overflow-x-clip`, donc un contenu trop large
  est **coupé** au lieu de créer un scroll — ça ne se voit pas à l'œil. Les colonnes de grille
  doivent porter `min-w-0` (sans ça, un texte long impose sa largeur au conteneur), et tout écran
  se teste à **375 px** (`resize_window` preset mobile), pas seulement en desktop.
- **Chargement, erreur, session expirée** : jamais de `return null` ni de `?? []` silencieux —
  `ui/Loader` pendant l'attente, `ui/ErrorState` (avec `onRetry`) en cas d'échec, sinon l'appli
  annonce « Pas encore de données » alors que l'API est tombée. ⚠️ Brancher l'état d'échec sur
  `isError` **ET `isPaused`** : réseau coupé, TanStack Query met la requête en pause et son statut
  reste `pending`. Le `QueryClient` est en `networkMode: "always"` et `retry: 0` (un réessai
  automatique reste suspendu tant que l'onglet n'est pas au premier plan — fréquent sur mobile —
  et rendait le bouton « Réessayer » inopérant). Un **401** vide la clé `["me"]` du cache
  (`QueryCache.onError` dans `main.tsx`) → retour automatique au login ; un crash de rendu est
  rattrapé par `ErrorBoundary`.
- **Cache TanStack Query** : `QueryClient` configuré dans `main.tsx` avec `staleTime` de 5 min et
  `refetchOnWindowFocus: false` — les données de la ligue ne bougent qu'au sync, et le profil
  (dont les onglets remontent le contenu) rejouait sinon `/h2h` et `/timeline` à chaque clic.
  **Corollaire indispensable** : un sync réussi périme TOUT (palmarès, stats, cagnotte, dashboard),
  donc `SyncSection` fait un `qc.invalidateQueries()` **global**, pas seulement sur `["sync-last"]`.
  Les mutations ciblées (cagnotte, rôles, ligues, tournois) invalident leurs propres clés.
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
  **Classement des coupes** (`/api/palmares/tournaments` → `ranking`) trié **hiérarchiquement**
  `LDC > UEFA > CONFERENCE` (puis nom) : une Conference ne passe jamais devant une UEFA.
- **Override manuel du type** : la détection par nom échoue si le type n'est identifiable qu'au logo
  (ex. coupe Conference nommée « Heureux Papa's League 🍐 » → classée UEFA par défaut). On peut forcer
  le type via `TrackedTournament.competitionOverride` (nullable ; `null` = détection auto). Le sync
  fait primer l'override (`tt.competitionOverride ?? competitionFromName(...)`). Le réglage se fait
  dans l'admin (select par tournoi) → `PUT /api/admin/tournaments/:id` `{ competitionOverride }`
  (rôle ADMIN) ; **la route met à jour immédiatement la ligne `Tournament` déjà synchronisée** (effet
  visible sans relancer un sync). L'override est **par environnement** (donnée DB) : à reposer dans
  l'admin prod après déploiement.
- **Année d'une saison de ligue EN COURS** : `/league/{id}/winners?season=N` renvoie **404** tant
  que la saison n'est pas finie, donc pas de `championshipSeason`. Repli obligatoire sur
  `/championships/active` → `championships[championshipId].season` (`activeChampionshipSeasons`
  dans `sync.ts`, appliqué à la seule saison courante). Sans ça on crée une `RealSeason` bâtarde
  (`"<ligue> — saison N"`, `year = N`) qu'un sync ultérieur **ne corrige jamais** (`name` est
  `@unique` et la bonne clé est différente) — il faut alors la supprimer à la main.
- **Année d'une coupe = `createdAt` MPG** (`/tournament/{id}`), pas le nom (l'année n'y est pas
  toujours) — `tournamentYear()` dans `sync.ts`, replis nom puis année courante. Convention
  inchangée : **coupe année N ↔ `RealSeason` N-1**. Pour corriger des données déjà en prod
  (reclasser/recalculer) : **relancer un sync** (upsert idempotent sur `mpgTournamentId`), pas de
  script dédié.
- **Trois états d'un match** (`Match.played` / `Match.live`) : MPG pose un score **dès le coup
  d'envoi**, mais `finalResult` n'apparaît qu'une fois la journée close et `status` vaut 1 ou 2 selon
  l'âge du match. D'où la règle du sync : `hasScore && !finalResult && gw >= currentGameWeek` = **en
  direct** (`live`), sinon score présent = **joué**, sinon **à venir**. Le repli sur `currentGameWeek`
  évite qu'une vieille journée reste éternellement « en cours ». Conséquences : les matchs à venir
  **sont en base** (scores `null`), donc **toute lecture de résultats doit filtrer `played: true`** —
  c'est le rôle de `playedMatchesOf()` (`modules/palmares/form.ts`, partagé par `/h2h` et le
  dashboard) ; un match `live` est **hors statistiques** (forme, séries, bilans) et n'est pas non plus
  le « prochain rendez-vous » (`nextMatchOf` filtre `live: false`), il est renvoyé à part par le
  dashboard et affiché avec un badge « en cours » + score provisoire.
- **Dater un match** : `/division/{id}/game-week/{n}/matches` ne porte **aucune date**. Le seul
  chemin est `/division/{id}/calendar` (`gameWeek` → `realGameWeek`) puis
  `/championship-calendar/{championshipId}` (dates des journées L1, mis en cache par championnat dans
  le run de sync). ⚠️ Cet endpoint ne renvoie **que la saison en cours** : on ne date donc que les
  saisons actives (`kickoffAt` reste `null` sur l'historique, et c'est très bien).
  **Granularité = la journée, jamais le match** : `gameWeeks[].startDate` est le coup d'envoi du
  **premier** match de la journée L1, et tous les matchs d'une journée partagent donc le même
  `kickoffAt`. Se caler sur chaque match L1 réel exigerait une API foot tierce — inutile de
  rechercher ça côté MPG. (Deux endpoints jamais sondés pourraient contenir plus fin :
  `/championship-calendar/{id}/next-game-weeks` et `/championship-calendars/nearest-game-weeks`.)
  ⚠️ **`kickoffAt` ne doit jamais régresser vers `null`** : l'upsert `Match` ne l'écrit en `update`
  que s'il est connu. Les appels calendrier sont sautés dès qu'une saison est finie, donc l'écrire
  tel quel effaçait toutes les dates au premier re-sync — et le planner du sync s'en sert d'ancre.
- **`GET /api/dashboard`** (`modules/dashboard/routes.ts`) = **le seul endroit de l'API qui parle de
  la saison EN COURS** : phase (`enCours|inter|estivale`), rang et variation, progression, zone,
  **les trois prochains rendez-vous datés** (`upcoming`, dont `next` est le premier — la carte de la
  dernière journée liste les suivants pour combler la hauteur imposée par la carte Palmarès à côté),
  dernier match, match en direct, forme, mercato, cagnotte, palmarès perso — en une requête plutôt
  que cinq.
- **Zone de classement (promotion / maintien / relégation / titre)** : ne pas la deviner, MPG la
  configure — `gameSettings.numberUpAndDownPreference` (2 chez nous) sur `/division/{id}`, persisté
  dans `Division.numberUpAndDown` (repli 2). Règle : D1 → rang 1 = titre, `u` derniers = relégation ;
  dernière division → `u` premiers = promotion, jamais de relégation ; entre les deux → les deux.
  Vérifié sur l'historique : 281/287 transitions (97,9 %), les écarts étant du turn-over d'effectif.
- **Périmètre « saison en cours »** — `Participation.finalRank` contient le rang **instantané** (écrit
  à chaque sync depuis les standings live), pas le rang final. Règle tranchée avec Coco :
  - **filtré** (`FINISHED_SEASON` dans `modules/palmares/routes.ts`) là où un **titre est célébré** :
    `/winners` (Palmarès + salle des trophées) et `/all-time` (tableau des médailles) ;
  - **non filtré** partout ailleurs : le **Hubert Book** (`/fun-stats` : podiums, Jean-Claude Duss,
    séries de titres, saisons D1) et les cumuls (buts, points, Rotaldo) racontent la ligue en direct ;
  - côté **profil**, `/timeline` expose `status` et le front s'en sert pour deux exceptions
    seulement : le compteur « Titres de saison » + la médaille 🥇 de la frise attendent la fin de
    saison, et meilleure/pire saison ne compare que des saisons closes (sinon celle qui démarre à
    0 point devient « la pire »). La card « Dernière saison » du profil montre la dernière saison
    **terminée** — la saison en cours, c'est le dashboard.
- **Classement all-time (`/api/palmares/all-time`)** : ordonné **façon JO** sur les titres de
  **division** d'abord (départage sur D1, puis D2…), **puis** par **nombre total de coupes** (les
  coupes départagent désormais *après* les championnats), enfin moins de saisons jouées puis le nom.
  L'ex æquo (`sameRank`) exige mêmes titres de division **ET** même nombre de coupes. `totalTitles`
  reste **divisions seules** ; le **total affiché = divisions + coupes** (côté front, helper
  `totalWithCups` dans `StatsPage`). La liste des **vainqueurs par saison** (`/winners`) est triée du
  plus récent au plus ancien : année desc, puis saison MPG desc, puis division asc.
- **Séries consécutives (`/fun-stats` : `d1Streak`, `titleStreak`)** : se calculent sur la
  carrière **triée chronologiquement (`year` → `index`), sans grouper par `mpgLeagueId`**. Piège :
  l'**ID de ligue MPG change dans le temps** (migrations *séquentielles*, pas des ligues parallèles) —
  grouper/reset par ligue casserait toute série traversant une migration. Même tri que le timeline
  du profil (`/timeline`). Une série n'est interrompue que par une saison hors-critère (rang ≠ 1
  pour les titres, division ≠ D1 pour `d1Streak`). La **saison en cours y compte** (cf. périmètre
  ci-dessus) : le Hubert Book est un livre de records vivant.
- **`/api/palmares/movements`** (montées / descentes / yo-yo) **n'est plus consommée par le front** :
  le bloc a été retiré de la Rétro (retrait temporaire assumé), la route est conservée pour pouvoir
  le rebrancher.
- **Formatage : Biome** (config racine `biome.json`, version épinglée). Lancer `npm run format`
  (écrit) ou `npm run format:check` (vérifie) **depuis la racine** — couvre front + back. Les deux
  scripts pointent sur **`biome check`** (pas `biome format`) : il formate **et** trie les imports.
  Style : 4 espaces, double quotes, point-virgules, largeur 120. **Tri des imports** = action
  d'« assist » `source.organizeImports` (PAS une règle de linter — l'IDE le signale même linter
  off ; appliqué par `biome check --write`). **Linter désactivé** pour l'instant. **Formateur CSS
  désactivé** (`styles.css` n'est jamais reformaté) ; le parseur CSS accepte la syntaxe Tailwind v4
  via `css.parser.tailwindDirectives` (sinon `@plugin`/`@import`/`@theme` font planter `biome check`).
  `docs/` et `**/dist/**` sont exclus du scan Biome (`files.includes`).

## Commandes

Racine du repo :
- `npm run format` — formate tout (front + back) avec Biome · `npm run format:check` — vérifie sans écrire

Backend (`cd backend`) :
- `npm run dev` — API en watch · `npm run build` — tsc · `npm start` — dist
- `npm run db:push` — applique le schéma · `npm run db:studio` — Prisma Studio
- `npm run clone:prod` — copie la prod (Postgres) → base SQLite locale (lit `PROD_DATABASE_URL`)
- `npm run sync` — sync CLI complet (utilise `.env`) · `-- --scope current` pour la seule saison
  en cours · `npm run connector:test` / `npm run discover` — outils de debug du connecteur MPG
- `npm run sync:plan` — diagnostic du planificateur : décision à l'instant présent + simulation des
  ticks à venir (`-- --at <ISO>` pour un instant précis, `-- --days N` pour l'horizon)

Frontend (`cd frontend`) :
- `npm run dev` · `npm run build` · `npm run preview`

## Git

- **Commits réguliers et petits**, ciblés sur un changement cohérent, pour la lisibilité dans le
  temps et faciliter les rollbacks.
- **Projet simple : travailler directement sur `main`.** Ne PAS créer de branche sauf demande
  explicite.
- **Committer proactivement** à chaque étape logique terminée (sans attendre qu'on le demande).
- **Pousser (`git push`) uniquement sur demande.**
