# Déploiement

Architecture : **Vercel** (front statique, `www.ligue-hubert-mange.fr`) → appelle **directement**
**Railway** (backend Node persistant, `api.ligue-hubert-mange.fr`) → **Supabase** (Postgres).

Front et API sont deux sous-domaines du **même domaine** (*same-site*) : le cookie de session
`SameSite=Lax` passe tel quel, et le CORS est piloté côté backend par `FRONTEND_ORIGIN`.
⚠️ Il n'y a **plus de rewrite `/api` dans `vercel.json`** (il ne garde que le fallback SPA) :
c'est `VITE_API_BASE_URL` qui porte l'URL de l'API, **injectée au build**.

Repo unique (monorepo) : Vercel pointe sur `frontend/`, Railway sur `backend/`.
Branche de prod : `main`.

---

## 1. Supabase (Postgres)

1. Crée un projet Supabase.
2. Settings → Database → **Connection string** → celle du **Session pooler** (IPv4, port 5432) :
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
   (le Session pooler supporte `prisma db push` et fonctionne depuis Railway en IPv4).

## 2. Railway (backend)

1. New Project → Deploy from GitHub repo.
2. Settings du service → **Root Directory = `backend`**.
   (`backend/railway.json` fournit build `npm run build:prod` + start `npm run start:prod`.)
3. **Variables** :

   | Variable | Valeur | Obligatoire |
   |---|---|---|
   | `DATABASE_URL` | connection string Supabase (étape 1) | oui |
   | `SESSION_SECRET` | `openssl rand -base64 48` | **oui — l'API refuse de démarrer sans** |
   | `ENCRYPTION_KEY` | `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` | **oui — idem** |
   | `FRONTEND_ORIGIN` | `https://www.ligue-hubert-mange.fr` | oui (CORS) |
   | `COOKIE_SECURE` | `true` | oui (HTTPS) |
   | `SUPERADMIN_MPG_USER_IDS` | `user_3482203` | oui |
   | `MPG_ADMIN_EMAIL` / `MPG_ADMIN_PASSWORD` | identifiants MPG | pour l'auto-sync |
   | `AUTO_SYNC` | `true` — **peut rester posé toute l'année** (voir Notes) | non (défaut `true`) |
   | `SYNC_TZ` | défaut : `Europe/Paris` | non |
   | `SYNC_MODE` | `matchday` (défaut, piloté par le calendrier) ou `cron` (repli) | non |
   | `SYNC_SLOTS` | surcharge des créneaux, ex. `"fri 22:45, sat 19:15"` | non |
   | `SYNC_CRON` | **ignoré en mode `matchday`** — à retirer de Railway | non |

   Dès que `DATABASE_URL` pointe sur Postgres, l'appli se considère en prod : **sans
   `SESSION_SECRET` ni `ENCRYPTION_KEY`, elle s'arrête au démarrage avec un message explicite**
   (un secret par défaut rendrait les cookies de session forgeables).

   ⚠️ **Ne PAS poser `NODE_ENV=production`** : les devDeps (prisma, tsc) ne s'installeraient pas
   au build. C'est aussi pourquoi le code ne s'appuie jamais dessus pour détecter la prod.
4. Déploie, puis Settings → Networking → **Custom domain** `api.ligue-hubert-mange.fr`
   (CNAME chez le registrar vers le domaine Railway).
5. Vérifie le démarrage : `https://api.ligue-hubert-mange.fr/api/health` → `{"ok":true}`.
   Les logs doivent montrer le `prisma db push` (schéma synchronisé) et l'état de l'auto-sync.

## 3. Vercel (frontend)

1. Add New Project → importe le repo.
2. **Root Directory = `frontend`** (preset Vite : build `npm run build`, output `dist`).
3. **Environment Variables**, scope **Production** :
   `VITE_API_BASE_URL = https://api.ligue-hubert-mange.fr`
   ⚠️ Les variables `VITE_*` sont lues **au build** : après tout changement, **redéployer**.
4. Domaine `www.ligue-hubert-mange.fr` (et redirection du domaine nu).
5. Déploie, puis reporte l'URL exacte dans `FRONTEND_ORIGIN` côté Railway si elle a changé.

---

## 4. Checklist avant de pousser

À dérouler dans cet ordre — le point 5 est celui qui se paie cash.

1. **Vérifs locales**, tout doit être vert :
   ```bash
   npm run format:check && (cd frontend && npx tsc -b && npm run build) && (cd backend && npx tsc --noEmit)
   ```
   puis, backend démarré : `cd backend && npx tsx src/db/verify.ts` (16 endpoints, sortie en échec
   si l'un tombe).
2. `git push` → Railway et Vercel se déploient.
3. **Railway** : `SESSION_SECRET` et `ENCRYPTION_KEY` présents, `FRONTEND_ORIGIN`,
   `COOKIE_SECURE=true`, `AUTO_SYNC=true`. Vérifier les logs de démarrage : schéma poussé, puis
   `Auto-sync planifié en mode matchday` suivi de la grille de créneaux et du prochain. Un
   avertissement `SYNC_CRON est défini mais ignoré` signale une variable à retirer.
4. **Vercel** : `VITE_API_BASE_URL` en scope Production **et redéploiement** après tout changement.
5. ⚠️ **Administration prod AVANT d'envoyer le lien** : ajouter la ligue de la saison en cours dans
   « Ligues suivies », les tournois, reposer les `competitionOverride` (donnée en base, donc **par
   environnement**), puis **lancer le sync**.
   Le login **refuse tout compte qui n'appartient pas à une ligue suivie active** : lien envoyé
   avant le sync = 403 sec pour tout le monde au premier essai.
6. Contrôles finaux : `/api/health`, connexion avec ton compte, Accueil / Palmarès / Cagnotte,
   la pastille Auto-sync dans Administration (et son « Prochaine synchro », qui doit tomber sur un
   créneau de la grille), et l'aperçu du lien collé dans une conversation.
7. Envoyer le lien au groupe.

---

## Notes

- Le schéma Prisma reste en `sqlite` dans le repo (dev local) ; le build Railway le bascule en
  `postgresql` (`scripts/use-postgres.mjs`) puis `prisma db push` crée/ajuste les tables **à chaque
  démarrage** (`start:prod`, avec `--accept-data-loss` : une colonne retirée du schéma est
  supprimée en prod au déploiement suivant).
- **Travailler en local sur les vraies données** : `cd backend && npm run clone:prod` copie la prod
  Supabase → SQLite local. Renseigner `PROD_DATABASE_URL` dans `backend/.env` (même connection
  string qu'à l'étape 1). ⚠️ Les champs chiffrés (IBAN, tokens MPG) ne se déchiffrent que si la
  `ENCRYPTION_KEY` locale est identique à celle de prod.
- Le cron d'auto-sync exige un **process Node persistant** (Railway), pas du serverless.
- En mode `matchday` (défaut), l'auto-sync ne suit plus une expression cron unique : un tick
  toutes les 15 min interroge le planner, qui ne déclenche que sur un créneau Ligue 1 franchi
  **et** une journée effectivement en cours. Les logs `[auto-sync]` disent le créneau et le
  périmètre (`full` le lundi matin, `current` le reste du temps) ; un run échoué est retenté au
  tick suivant pendant 2 h. `GET /api/sync/config` expose l'état réel.
- **`AUTO_SYNC` n'a plus à être basculé au fil de la saison.** Hors journée — trêve, intersaison —
  la garde du planner ferme les créneaux du soir d'elle-même ; il ne reste que le run léger de
  08:30, qui redémarre tout seul quand la nouvelle saison apparaît chez MPG. Le laisser sur `true`
  évite d'oublier de le rallumer en août.
- Le déploiement de cette évolution **n'exige aucune action manuelle en base** : `start:prod`
  lance `prisma db push`, qui ajoute la colonne `SyncRun.scope` (nullable — les runs existants
  restent lisibles et sont traités comme complets).
