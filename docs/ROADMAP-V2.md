# Roadmap V2

Ce qui vient **après** la première mise en ligne de la refonte Broadcast. Le `README` décrit ce qui
existe ; ce fichier ne garde que ce qui demande de la conception. Chaque piste note ce sur quoi elle
s'appuie déjà, pour éviter de redécouvrir à chaque fois ce que la base contient.

Ordre indicatif : les trois premières apportent le plus, et se tiennent (les notifications
transportent les résumés et les badges).

---

## 🤖 Résumé de journée par un agent

Un compte-rendu rédigé chaque lundi à partir des matchs synchronisés : résultats marquants,
mouvements au classement, exploits et flops, chambrage.

- **Déjà là** : les matchs sont en base avec leur score et leur date (`Match`, `kickoffAt`), les
  classements instantanés (`Participation.finalRank`, `rankVariation`), les trois états d'un match
  (à venir / en direct / joué) et le sync hebdomadaire qui déclenche tout.
- **À concevoir** : un modèle `Recap` (saison jeu + journée + texte + date) pour garder l'historique
  et ne pas régénérer à chaque affichage ; l'appel au modèle à la fin du sync ; le prompt (ton du
  groupe, noms des managers, pas d'invention de chiffres) ; l'affichage sur l'Accueil et une page
  d'archives.
- **Pièges** : ne jamais laisser l'agent inventer un résultat — lui donner les données déjà agrégées
  plutôt que la base brute ; prévoir le cas « journée non close » (matchs en direct) ; coût par
  journée à surveiller.

## 🔔 Notifications du lundi

« Les résultats sont tombés », « tu as gagné la cagnotte », « ton record est battu ».

- **Déjà là** : le manifest PWA et les icônes (v1), donc l'appli est installable — prérequis du Web
  Push sur iOS, qui n'autorise les notifications **que** depuis une appli ajoutée à l'écran
  d'accueil.
- **À concevoir** : abonnement push par manager (clé VAPID, `PushSubscription` en base), envoi
  déclenché en fin de sync, préférences par type de notification (la card « Préférences » avait été
  retirée des Paramètres faute de backend — c'est ici qu'elle revient).

## 🏅 Badges et hauts faits

Série de titres, yo-yo, invincibilité, comeback, saison parfaite…

- **Déjà là** : le Hubert Book calcule déjà des séries (`d1Streak`, `titleStreak`) et une dizaine de
  classements ; `/api/palmares/movements` (montées/descentes/yo-yo) existe mais **n'est plus
  affichée** depuis la Rétro — à rebrancher ici.
- **À concevoir** : un moteur de règles rejoué après chaque sync, un modèle `Achievement`
  (manager + type + date d'obtention) pour dater les débloquages, et une vitrine sur le profil.
- **Piège** : les règles doivent se calculer sur la carrière triée chronologiquement **sans grouper
  par ligue MPG** (l'id de ligue change à chaque nouvelle formule, cf. `CLAUDE.md`).

---

## Ensuite

- **🔥 Rivalités** — page de confrontation entre deux joueurs au choix. Tout est déjà servi par
  `/api/palmares/h2h/:managerId` (l'onglet Confrontations liste déjà tous les adversaires) : il
  manque surtout un sélecteur et une mise en scène.
- **📈 Résultats par journée** — les matchs sont en base et datés, et ne sont exposés nulle part :
  une page « journée » avec les scores et le classement avant/après.
- **🥇 Ballon d'Or annuel** — un classement de fin de saison combinant titres, coupes et Rotaldo.
  `/api/palmares/rotaldo` existe et n'est pas consommée.
- **📣 Récap partageable** — image ou story de fin de saison pour le groupe. La carte Open Graph de
  la v1 montre la recette : composer en HTML aux couleurs de marque et rasteriser.
- **📺 Mode remise des prix** — plein écran, pour la soirée de fin de saison.

## Chantiers techniques

- **Thème clair** — les surfaces `light-*` sont déjà réservées dans `styles.css` ; l'appli est
  `dark`-only par une classe forcée dans `App.tsx`.
- **Tests** — il n'y en a aucun. `backend/src/db/verify.ts` fait office de contrôle d'endpoints ;
  la prochaine étape est de tester les règles métier délicates (zones de promotion/relégation,
  classement all-time façon JO, détection des trois états d'un match).
- **Suivi des erreurs en prod** — aujourd'hui une erreur serveur ne laisse qu'une ligne de log
  Railway, et une erreur de rendu n'est visible que dans la console du navigateur.
- **Historique des syncs** — `/api/sync/history` (20 dernières exécutions) existe sans écran.
