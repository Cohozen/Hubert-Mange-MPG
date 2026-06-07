# Déploiement

Architecture : **Vercel** (front statique) → rewrites `/api` & `/auth` → **Railway** (backend Node persistant) → **Supabase** (Postgres).
Les rewrites Vercel rendent le tout *same-origin* → le cookie de session fonctionne sans CORS.

Repo unique (monorepo) : Vercel pointe sur `frontend/`, Railway sur `backend/`.

---

## 1. Supabase (Postgres)

1. Crée un projet Supabase.
2. Settings → Database → **Connection string** → prends celle du **Session pooler** (IPv4, port 5432) :
   `postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres`
   (le Session pooler supporte le `prisma db push` et fonctionne depuis Railway en IPv4.)

## 2. Railway (backend)

1. New Project → Deploy from GitHub repo → `Hubert-Mange-MPG`.
2. Settings du service → **Root Directory = `backend`**.
   (Le `backend/railway.json` fournit déjà build `npm run build:prod` + start `npm run start:prod`.)
3. **Variables** :
   - `DATABASE_URL` = connection string Supabase (étape 1)
   - `SESSION_SECRET` = chaîne aléatoire longue (`openssl rand -base64 48`)
   - `ENCRYPTION_KEY` = `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
   - `MPG_ADMIN_EMAIL`, `MPG_ADMIN_PASSWORD` = tes identifiants MPG
   - `SUPERADMIN_MPG_USER_IDS` = `user_3482203`
   - `COOKIE_SECURE` = `true`
   - `AUTO_SYNC` = `false` (à passer `true` quand la saison reprend), `SYNC_CRON`, `SYNC_TZ` optionnels
   - `FRONTEND_ORIGIN` = (l'URL Vercel, une fois connue)
   - ⚠️ **ne PAS** mettre `NODE_ENV=production` (sinon les devDeps — prisma/tsc — ne s'installent pas au build).
4. Déploie. Récupère l'**URL publique** du service (Settings → Networking → Generate Domain) : `https://xxxx.up.railway.app`.

## 3. Vercel (frontend)

1. Add New Project → importe le repo.
2. **Root Directory = `frontend`** (preset Vite détecté : build `npm run build`, output `dist`).
3. Édite `frontend/vercel.json` : remplace `REMPLACER-PAR-URL-RAILWAY.up.railway.app` par ton domaine Railway (étape 2.4), commit + push.
4. Déploie. Récupère l'URL Vercel et reporte-la dans `FRONTEND_ORIGIN` côté Railway.

## 4. Mise en route

1. Ouvre l'URL Vercel → connecte-toi avec ton compte MPG (tu seras **superadmin** via `SUPERADMIN_MPG_USER_IDS`).
2. Page **Admin** → « Ligues suivies » et « Tournois suivis » → sélectionne les bons.
3. **Lance le sync** (bouton). La base Supabase se remplit.
4. Attribue les rôles (banquier, etc.).

## Notes
- Le schéma Prisma reste en `sqlite` dans le repo (dev local) ; le build Railway le bascule en `postgresql` (`scripts/use-postgres.mjs`) puis `prisma db push` crée les tables.
- Branche de prod : `main`.
