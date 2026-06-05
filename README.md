# MPG Enhanced

Appli web pour résumer l'organisation d'une grande ligue Mon Petit Gazon entre amis
(6 divisions, 3 saisons jeu par saison réelle, coupe, cagnotte commune).

**Idée directrice** : l'appli possède sa propre base de données historique. MPG n'est
qu'une source qu'on synchronise ; la cagnotte est 100 % maison.

## Stack

- **backend/** — API Node + TypeScript (Express), Prisma, SQLite en local (portable Postgres).
- **frontend/** — React + Vite + TypeScript, TanStack Query, Tailwind v4.
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
- `npm run sync` — lance le sync admin (à compléter, voir `src/sync/sync.ts`).
- `npm run db:studio` — explorer la base avec Prisma Studio.
- `npx tsx src/db/seed.ts` — données de démonstration.
- `npx tsx src/db/verify.ts` — vérif end-to-end des endpoints (forge une session admin).

## État actuel (v1)

- ✅ Connecteur MPG (flow OAuth), auth applicative "Sign in with MPG", sessions JWT.
- ✅ Modèle de données complet (Manager / RealSeason / GameSeason / Division / Participation /
  Cup / PrizePool / Contribution / Payout).
- ✅ Cagnotte : API lecture + édition admin, page de consultation.
- ✅ Palmarès : vainqueurs par saison + classement all-time.
- ✅ Admin : déclenchement du sync.
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
  **QR SEPA** (EPC/GiroCode) affiché au banquier pour pré-remplir le virement. `ENCRYPTION_KEY` requis.
- ✅ **Ligues suivies** : on ne synchronise que les ligues sélectionnées (page Admin →
  « Ligues suivies »). Sync ponctuel d'une ligue par `POST /api/sync { leagueId }`.
- ✅ **Rôles** : SUPERADMIN / ADMIN / TREASURER / MEMBER, attribués depuis la page Admin.
- ✅ **Gains automatisés** : grille de **montants fixes** par division + coupe ; bouton
  « Générer les reversements » qui crée les gains des vainqueurs depuis les classements
  (idempotent, préserve le statut « versé »).
- ✅ **Dark mode** (toggle dans le header) + UI responsive mobile-first (DaisyUI, nav bas mobile,
  classements en cartes sur petit écran, classement all-time pondéré par division + montées/descentes).
- 🚧 Features v2/v3 : résultats par journée, badges, stats MVP (« Rotaldo d'Or ») — données
  déjà captées par le crawler (`npm run discover`).
