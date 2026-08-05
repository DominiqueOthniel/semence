# Semence

Application de gestion financière personnelle pour le Cameroun.
Quatre enveloppes prélevées d’abord, FCFA sans décimales, hors ligne.

## Lancer en local

```bash
npm install
npm run web
```

Ou `npx expo start` puis `w` pour le web.

## Build web

```bash
npm run build:web
```

Sortie dans `dist/`.

## Déploiement

- GitHub : dépôt source
- Netlify : build `npx expo export --platform web`, publish `dist`

## Ce qui est dans la V1 (cette base)

**Socle**
- Comptes multiples (espèces, MTN MoMo, Orange Money, banque, tontine)
- Transferts entre comptes
- Choix du premier jour du mois
- Sauvegarde JSON partageable
- Code PIN à l’ouverture
- Saisie rapide avec montants favoris
- Fonctionnement hors ligne (SQLite)

**Différenciant**
- Quatre enveloppes dans un ordre fixe
- Profils : chrétien, musulman, solidarité, aucun
- Rendez-vous du soir
- Reste à vivre par jour
- Position réelle (avoirs moins dettes)
- Coût réel des emprunts mobiles

**Parité**
- Dettes et créances
- Crédits (reçu / total / reste / surcoût)
- Objectifs d’épargne

## Structure

```
app/           écrans (expo-router)
src/db/        SQLite et requêtes
src/lib/       calculs FCFA et enveloppes
src/store/     état global
src/theme/     couleurs Semence
src/ui/        composants
docs/          présentation produit
```

## Suite prévue

- Notifications locales du soir
- Widget de saisie Android
- Export PDF / Excel
- Restauration depuis fichier
- Tontine (V1.1)
- Lecture SMS MoMo (V2)
