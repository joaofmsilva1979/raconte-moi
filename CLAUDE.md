@AGENTS.md

# Raconte-moi

App iOS de journal alimentaire vocal pour Eugénie (femme de Joao).
Stack : React Native 0.86.2 + Expo SDK 57 + TypeScript + SQLite local.

## Docs (GDrive, hub produit app + PWA) : lire `APP/STATUS.md` en début de session
Hub : `GDrive CLAUDE_AI/APP_LESNOTESDEPATATE/`
- `README.md` : carte du produit ; `APP/STATUS.md` : suivi iOS (**mettre à jour en fin de session**)
- `FONCTIONNALITES/` (1 md par fonctionnalité) · `CONTENUS/` (1 md par texte publié, à modifier avant le code)
- `ARCHITECTURE.md` · `DATABASE.md` · `APP_FLOW.md` · `TESTING.md` · `BRAND.md` : la version du hub fait foi (les copies locales ne sont pas commitées)
- `DECISIONS.md` · `SOLUTIONS.md` · `HISTORIQUE.md` · `REFLEXIONS.md` · `AUDIT_LEGAL.md`
La PWA (`~/projects/raconte-moi-pwa`) contient tout ce code + les adaptations web : c'est la base la plus à jour.

## Règles communes (détail : hub `README.md` § Règles et `DECISIONS.md`)
- Code en local + GitHub, jamais dans Drive ; âge minimum 15 ans ; nom App Store « Raconte-moi · Journal santé vocal »
- Avant `eas submit` : vérifier que la politique répond et est à jour (`https://joaofmsilva1979.github.io/raconte-moi/privacy-policy.html`). Elle se publie depuis le repo PWA : `bash ~/projects/raconte-moi-pwa/scripts/publish-privacy-ios.sh`
- Dates : `recorded_at` en UTC ; filtrer un jour local avec `dayRange()` / `localDay()` (`src/utils/dateUtils.ts` du code PWA), jamais `date(recorded_at)`
- Prochain build natif : partir du code PWA (corrections du 2026-11-25), pas de ce repo
- Backups : launchd `com.racontemoi.backup` (30 min) + hook Claude → hub `APP/backups/`

## Docs techniques
- Commandes dev : `GDrive CLAUDE_AI/APP_LESNOTESDEPATATE/DOCS/COMMANDES_DEV.md`
- Tech reference : `GDrive CLAUDE_AI/APP_LESNOTESDEPATATE/DOCS/TECH.md`
- Plans features : `GDrive CLAUDE_AI/APP_LESNOTESDEPATATE/PLANS/`

## Expo SDK 57 — pièges critiques
- `expo-av` n'existe plus → utiliser `expo-audio`
- `expo-file-system/legacy` pour `documentDirectory`
- `expo-notifications` : trigger DAILY n'a plus `repeats`
- `@testing-library/react-native` v14 : `render()` est async → `await render(...)`
- `expo-asset` doit être en dépendance EXPLICITE dans package.json
- Après chaque `expo prebuild --clean` : vider `aps-environment` du fichier `.entitlements`
- Nouveaux packages : `npm install --legacy-peer-deps`

## UX & UI
Invoquer dans cet ordre avant tout travail visuel :
1. `/design-research` — inspiration Godly + Design Spells + pattern Mobbin + Refero Styles si dispo
2. `/design-bear` — atmosphère principale (écriture, warm charcoal)
3. `/design-things3` — patterns iOS, sérénité
4. `/design-apple-wallet` — surfaces dark si besoin

## Nouvelle feature
Utiliser le workflow spec-kit : `/speckit-clarify` → `/speckit-specify` → `/speckit-plan` → `/speckit-tasks` → `/speckit-implement`
