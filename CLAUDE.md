@AGENTS.md

# Raconte-moi

App iOS de journal alimentaire vocal pour Eugénie (femme de Joao).
Stack : React Native 0.86.2 + Expo SDK 57 + TypeScript + SQLite local.

## Docs techniques
- Commandes dev : `~/Library/CloudStorage/GoogleDrive-davisthe8th@gmail.com/My Drive/CLAUDE_AI/APP_LESNOTESDEPATATE/DOCS/COMMANDES_DEV.md`
- Tech reference : `~/Library/CloudStorage/GoogleDrive-davisthe8th@gmail.com/My Drive/CLAUDE_AI/APP_LESNOTESDEPATATE/DOCS/TECH.md`
- Plans features : `~/Library/CloudStorage/GoogleDrive-davisthe8th@gmail.com/My Drive/CLAUDE_AI/APP_LESNOTESDEPATATE/PLANS/`

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
