# Les notes de patate — Vue d'ensemble des plans

> Chaque plan est indépendant et produit du code testable avant de passer au suivant.
> Ordre recommandé : 1 → 2 → 3 → 4 → 5 → 6 → 7

| Plan | Nom | Contenu | Dépend de |
|------|-----|---------|-----------|
| **01** | Foundation | Expo setup, SQLite, services de base, couleurs | — |
| **02** | Onboarding | 5 écrans d'onboarding, color picker, meal slots | 01 |
| **03** | Core Recording | Micro, Speech Recognition, module Apple Intelligence Swift | 01 |
| **04** | Home + Journal | Écran principal, sheet journal, timeline, navigation | 01, 02, 03 |
| **05** | Ressentis | Bouton 💜, sélecteur, affichage dans journal | 04 |
| **06** | Notifications | Scheduling intelligent, réglages par repas | 01, 02 |
| **07** | iCloud + Export PDF | Backup SQLite, génération PDF A4, share sheet | 01, 04, 05 |
