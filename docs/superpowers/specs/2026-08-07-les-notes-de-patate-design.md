# Les notes de patate — Spec design

**Date :** 2026-08-07  
**Statut :** validé  
**Plateforme :** iOS uniquement (React Native + Expo, TypeScript)  
**Cible matérielle :** iPhone 15 Pro et supérieur (requis pour Apple Intelligence)  
**Distribution :** TestFlight (jusqu'à 10 000 utilisateurs, lien unique)

---

## 1. Vision

Une app iOS de journal alimentaire vocal, **entièrement locale**, sans compte, sans serveur, sans friction. L'utilisatrice parle — l'app note. Tout reste sur son iPhone.

**L'action centrale :** appuyer sur un bouton, parler, relâcher. C'est tout.

---

## 2. Design

### 2.1 Direction visuelle

**Ultra-minimal (direction C) + palette corail/abricot chaleureuse (direction A).**

- Un seul écran principal — zéro onglets, zéro menu
- Gros bouton micro central avec halos lumineux
- Journal accessible par glissement ↑ uniquement
- Palette : couleur principale choisie par l'utilisatrice → 2 sous-tons dérivés automatiquement (fond pastel + accent intermédiaire)

### 2.2 Système de couleurs

Au premier lancement, l'utilisatrice choisit parmi **10 couleurs** :

| Couleur | Principal | Accent | Fond |
|---------|-----------|--------|------|
| Corail (défaut) | `#E85520` | `#F5855A` | `#FDEEE8` |
| Terracotta | `#C4623A` | `#D9845C` | `#FAEAE0` |
| Miel | `#C8943A` | `#DEB96A` | `#FDF5E0` |
| Sauge | `#5C7A4E` | `#82A870` | `#EEF5EC` |
| Teal | `#3A8A8A` | `#60AAAA` | `#E8F5F5` |
| Lavande | `#4F7FFF` | `#7FA0FF` | `#EEF2FF` |
| Prune | `#7B5EA7` | `#A080CC` | `#F3EEFF` |
| Rose | `#C96B8A` | `#DF90AA` | `#FEEEF4` |
| Bordeaux | `#A03050` | `#C05878` | `#FAEAEE` |
| Cacao | `#5C4A35` | `#8A6E52` | `#F5EEE6` |

La dérivation est automatique : on ne stocke que la couleur principale, les deux sous-tons sont calculés à la volée.

---

## 3. Onboarding

**5 écrans, une seule fois au premier lancement. Durée estimée : moins de 90 secondes.**  
Tout est modifiable après coup dans les Réglages.

### Étape 1 — Bienvenue + prénom
- Logo 🥔 + nom de l'app
- Champ texte : "Comment tu t'appelles ?"
- Utilisé partout : "Bonjour Eugénie ☀️"

### Étape 2 — Objectif
Trois choix (cosmétique, aucun impact sur les données) :
- 👀 Surveiller ce que je mange
- 🧠 Me souvenir de ce que j'ai mangé
- ✏️ Autre chose

### Étape 3 — Plages horaires
Quatre repas avec sliders pour ajuster les bornes :

| Repas | Défaut | Icône |
|-------|--------|-------|
| Petit-déjeuner | 06h – 10h | ☀️ |
| Déjeuner | 11h – 14h | 🌞 |
| Collation | 14h – 18h | 🌤 |
| Dîner | 18h – 22h | 🌙 |

### Étape 4 — Couleur principale
10 swatches cliquables avec preview live de l'écran principal (fond, halos, badges mis à jour en temps réel).

### Étape 5 — Permissions
Deux permissions demandées séparément et clairement expliquées :
- 🎙 Microphone — obligatoire, pour enregistrer la voix
- 🔔 Notifications — optionnel, pour les rappels repas

Badge permanent affiché : *"Aucune donnée ne quitte cet iPhone"*

---

## 4. Écran principal

L'intégralité de l'app au quotidien tient sur un seul écran.

```
┌─────────────────────────┐
│ Bonjour Eugénie ☀️      │
│ [badge repas actuel] ✎  │  ← tap = changer de repas
│                         │
│      ◉ ◉               │  ← halos
│    ◉  🎙  ◉            │  ← bouton micro (appui long)
│      ◉ ◉               │
│   Appuie et parle       │
│                         │
│ [entrée 1 récente]      │
│ [entrée 2 récente]      │
│                         │
│ ↑ Glisse pour le journal│
└─────────────────────────┘
```

**Le badge repas** affiche le repas détecté selon l'heure courante. Le ✎ indique qu'il est modifiable d'un tap.

---

## 5. Flux d'enregistrement

### Flux A — Parle d'abord (défaut)
1. Appui long sur le micro → enregistrement démarre
2. Transcription iOS Speech Recognition apparaît en direct
3. Relâche → transcript brut capturé
4. Apple Intelligence reformule en une phrase claire
5. Écran de confirmation : texte modifiable + repas détecté
6. Tap "Sauvegarder" → entrée créée dans SQLite

### Flux B — Annonce d'abord (via badge)
1. Tap sur le badge repas → sélecteur (4 options + "Autre")
2. Repas choisi → retour à l'écran principal
3. Appui long micro → enregistrement
4. Transcription → reformulation Apple Intelligence
5. Confirmation sans étape de validation du repas (déjà choisi)
6. Tap "Sauvegarder"

**Les deux flux coexistent sur le même écran.** Le badge avec ✎ est la porte d'entrée vers le Flux B.

### Écran de confirmation (commun aux deux flux)
- Transcript brut visible en grisé (référence)
- Texte reformulé en clair, **éditable à la main**
- Repas détecté / choisi (modifiable)
- Boutons : **Sauvegarder** · Réenregistrer · Voir original
- Mention discrète : *"✨ via Apple Intelligence (on-device)"*

---

## 6. Pipeline technique d'enregistrement

```
🎙  Appui long micro
      ↓
👂  iOS Speech Recognition  [on-device, @react-native-voice]
    → Transcription en temps réel affichée
      ↓
✨  Apple Intelligence Foundation Models  [on-device, Swift natif]
    Prompt : "Reformule ce que j'ai mangé en une phrase claire
              et naturelle en français. Ne rajoute rien,
              ne retire rien. Texte : [raw]"
      ↓
✏️  Écran de confirmation  [modifiable]
      ↓
💾  SQLite local  [jamais envoyé ailleurs]
```

**L'audio n'est jamais persisté.** Seul le texte est sauvegardé.  
**Fallback :** si Apple Intelligence indisponible → transcript brut affiché directement.

### Détection automatique du repas

```typescript
function detectMealType(date: Date, slots: MealSlot[]): MealType {
  const hour = date.getHours();
  const match = slots.find(s => hour >= s.start_hour && hour < s.end_hour);
  return match?.meal_type ?? 'other';
}
```

Résultat toujours suggéré, jamais imposé.

---

## 7. Journal

Accessible par **glissement ↑** depuis l'écran principal. Se ferme par glissement ↓.

### Vue du jour
- Timeline verticale avec un point par repas
- Repas notés : fond coloré, texte plein
- Repas non encore notés : pointillés, texte atténué *"En attente…"*
- Navigation ← → entre les jours (ou glissement horizontal)
- Tons atténués pour les jours passés

### Mini-calendrier hebdomadaire
Affiche les 7 jours de la semaine en cours avec un indicateur par jour (noté / partiel / vide).

### Bouton micro flottant
Visible en bas du journal — tap → ouvre le micro avec le bon repas pré-sélectionné selon l'heure.

---

## 8. Stockage local

**Aucun serveur. Aucun réseau. SQLite sur l'iPhone.**

### Table `entries`
```sql
id           INTEGER PRIMARY KEY AUTOINCREMENT
recorded_at  DATETIME NOT NULL       -- heure exacte de l'enregistrement
meal_type    TEXT NOT NULL           -- breakfast|lunch|snack|dinner|other
transcript   TEXT NOT NULL           -- texte final (reformulé ou corrigé)
raw_text     TEXT                    -- transcript brut (pour "voir original")
edited_at    DATETIME                -- si modifié manuellement après coup
created_at   DATETIME DEFAULT now()
```

### Table `meal_slots`
```sql
meal_type    TEXT PRIMARY KEY
label        TEXT NOT NULL           -- "Petit-déjeuner"
icon         TEXT NOT NULL           -- "☀️"
start_hour   INTEGER NOT NULL        -- 6
end_hour     INTEGER NOT NULL        -- 10
```

### Table `settings`
```sql
key    TEXT PRIMARY KEY
value  TEXT NOT NULL
-- Clés : first_name, primary_color, goal,
--        onboarding_done, icloud_backup,
--        backup_interval, last_backup_at
```

---

## 9. Backup iCloud

**Optionnel, activé par l'utilisatrice, configurable.**

- Mécanisme : copie du fichier SQLite vers iCloud Drive (`Les notes de patate/backup.db`)
- Fréquences : 1 jour / 3 jours / **7 jours (défaut)** / 30 jours
- Déclenchement : automatique au lancement si le délai est écoulé
- Bouton manuel : "Backup maintenant" dans le journal (section privacité)
- Restauration possible depuis les Réglages

---

## 10. Notifications

**Rappels intelligents — une seule notification par repas par jour maximum.**

### Logique de déclenchement
Au milieu de chaque plage horaire configurée, l'app vérifie si une entrée existe pour ce repas aujourd'hui. Si non → notification envoyée.

Avec les plages par défaut :
- ☀️ Petit-déjeuner → rappel à **08:00**
- 🌞 Déjeuner → rappel à **12:30**
- 🌤 Collation → rappel à **16:00**
- 🌙 Dîner → rappel à **20:00**

### Règles strictes
- Maximum 1 notification par repas par jour
- Silence total entre **22h00 et 07h00**
- Si l'utilisatrice note après la notification → pas de 2ème rappel

### Contenu des notifications
| Repas | Titre | Corps |
|-------|-------|-------|
| Petit-déjeuner | Tu as bien déjeuné ce matin ? 🌅 | Il est 8h — note ton petit-déjeuner avant de commencer ta journée. |
| Déjeuner | Ton déjeuner ? 🌞 | Il est 12h30 et tu n'as pas encore noté ton déjeuner. |
| Collation | Une petite collation aujourd'hui ? 🌤 | N'oublie pas de noter si tu as grignoté quelque chose. |
| Dîner | Et pour le dîner ? 🌙 | Il est 20h — raconte-moi ce que tu as mangé ce soir. |

### Comportement au tap
Tap sur la notification → app s'ouvre avec **le bon repas pré-sélectionné**. L'utilisatrice appuie directement sur le micro. Zéro navigation supplémentaire.

### Réglages notifications
- Toggle global activé/désactivé
- Toggle individuel par repas
- Silence nocturne toujours actif (non désactivable)

### Implémentation
`expo-notifications` avec notifications locales planifiées dynamiquement chaque jour. Aucun serveur nécessaire.

---

## 11. Réglages (accessible depuis le journal)

| Réglage | Type |
|---------|------|
| Prénom | Champ texte |
| Couleur principale | 10 swatches |
| Objectif | 3 options |
| Plages horaires | Sliders |
| Rappels (global) | Toggle |
| Rappels par repas | 4 toggles |
| Backup iCloud | Toggle + fréquence |
| Backup maintenant | Bouton |
| Restaurer depuis iCloud | Bouton |

---

## 12. Sécurité & vie privée

### Principes
- **Privacy by design** — aucune donnée ne quitte l'iPhone par défaut
- **Aucun serveur, aucun compte, aucun réseau**
- **Consentement explicite** pour chaque permission
- **Transparent** — badge privacité permanent dans le journal

### Localisation des données

| Donnée | Où | Chiffrement | Quitte l'iPhone ? |
|--------|-----|-------------|-------------------|
| Transcriptions | SQLite local | iOS (Secure Enclave) | Non |
| Audio | Jamais persisté | — | Jamais |
| Préférences | SQLite local | iOS | Non |
| Backup | iCloud Drive (si activé) | Apple E2E | Seulement si activé |

### Permissions demandées
- 🎙 Microphone — enregistrement vocal (obligatoire)
- 🎤 Reconnaissance vocale — transcription (obligatoire, liée au micro)
- 🔔 Notifications — rappels repas (optionnel)
- ☁️ iCloud — backup (optionnel, demandé à l'activation)

Aucune autre permission. Pas de localisation, pas de caméra, pas de contacts.

### Apple Intelligence
Le module Foundation Models tourne **entièrement on-device**. Le texte transcrit ne quitte jamais l'iPhone pour la reformulation. Affiché discrètement dans l'app : *"✨ Apple Intelligence (on-device)"*

### Conformité RGPD (Luxembourg / UE)
Conforme par conception :
- Pas de traitement hors appareil sans consentement explicite
- Droit à l'effacement : désinstaller l'app supprime toutes les données
- Minimisation : seul le transcript final est conservé (pas l'audio)
- Pas de tiers, pas d'analytics, pas de tracking

---

## 13. Distribution & tests

### Environnements de test
| Niveau | Usage | Prérequis |
|--------|-------|-----------|
| Simulateur iOS | UI, navigation, journal | Xcode (gratuit, Mac) |
| Expo Go (iPhone) | UI sur vrai appareil | App Expo Go gratuite |
| Dev Build (iPhone) | Micro, Speech Recognition, Apple Intelligence | `eas build --profile development` |
| TestFlight | Distribution finale | Compte Apple Developer (99$/an) |

### Distribution TestFlight
1. `eas build --platform ios` → build cloud (pas besoin de Mac)
2. `eas submit --platform ios` → envoi automatique TestFlight
3. Partage du lien d'invitation
4. L'utilisatrice installe l'app **TestFlight** (gratuite, officielle Apple) → puis l'app
5. Capacité : jusqu'à **10 000 utilisateurs** avec le même lien

---

## 14. Écrans archivés

Tous les écrans validés sont dans `docs/ecrans/` (et dans Google Drive `APP_LESNOTESDEPATATE/ECRANS/`) :

| Fichier | Contenu |
|---------|---------|
| `01-approches-design.html` | 3 directions design (A, B, C) |
| `02-direction-finale.html` | Direction retenue : C + corail |
| `03-couleurs-onboarding.html` | 10 couleurs avec preview live |
| `04-onboarding-flow.html` | 5 écrans d'onboarding |
| `05-enregistrement-flow.html` | Flux hybride (5 états) |
| `06-journal-stockage.html` | Journal + modèle de données |
| `07-pipeline-reformulation.html` | Pipeline Apple Intelligence |
| `08-notifications.html` | Notifications intelligentes |

---

## 15. Ressentis

L'utilisatrice peut noter un ressenti physique **à n'importe quel moment**, indépendamment d'un repas.

### Déclenchement
Bouton dédié **💜 "Ajouter un ressenti"** — petit, sous le bouton micro sur l'écran principal. Toujours visible, jamais confondu avec l'enregistrement repas.

### Catégories (6)
| Emoji | Label | Sous-catégorie |
|-------|-------|----------------|
| 😮‍💨 | Ballonnement | — |
| 🤢 | Nausée | — |
| 😣 | Douleur | Ventre / Tête / Autre |
| 😴 | Fatigue | — |
| 😊 | Je me sens bien | — |
| ✏️ | Autre | Note vocale libre |

### Flux
1. Tap "💜 Ajouter un ressenti" → sheet rapide
2. Sélection catégorie (+ sous-catégorie si douleur)
3. Note vocale optionnelle (même pipeline Apple Intelligence)
4. Tap "Noter ce ressenti" → sauvegardé

### Affichage dans le journal
- Couleur **violet/prune** — visuellement distinct du corail des repas
- Intégré chronologiquement dans la timeline
- Lien automatique avec le repas précédent + délai calculé ("~45min après le déjeuner")

### Table `ressentis` (SQLite)
```sql
id             INTEGER PRIMARY KEY AUTOINCREMENT
recorded_at    DATETIME NOT NULL
category       TEXT NOT NULL        -- bloating|nausea|pain|fatigue|good|other
sub_category   TEXT                 -- belly|head|other (si pain)
note           TEXT                 -- note vocale transcrite (optionnel)
entry_id       INTEGER              -- FK → entries.id (repas précédent, auto-lié)
delay_minutes  INTEGER              -- calculé auto
```

---

## 16. Export du journal

L'utilisatrice peut exporter son journal sur une période choisie, au format PDF, via le share sheet iOS natif.

### Flux (4 étapes)
1. **Déclenchement** — bouton "📤 Exporter le journal…" en bas du journal
2. **Paramètres** — période (cette semaine / ce mois / 30 jours / dates libres) + options (inclure repas ✓, inclure ressentis ✓) + badge consentement RGPD explicite
3. **Aperçu** — rendu du PDF avant envoi, avec bouton "← Modifier"
4. **Partage** — share sheet iOS natif : Mail, WhatsApp, AirDrop, Fichiers…

### Format du document exporté
- En-tête : "🥔 Journal d'Eugénie — Du [date] au [date]"
- Entrées groupées par jour, triées par heure
- Repas : heure · icône repas · texte transcrit
- Ressentis : heure · 💜 · catégorie · délai depuis repas précédent
- Footer horodaté : *"Partagé volontairement par Eugénie le [date]. Données locales, aucun serveur tiers."*

### Technique
- Génération PDF : `react-native-html-to-pdf` (on-device, aucun service tiers)
- Partage : `expo-sharing` → share sheet iOS natif
- Aucune donnée envoyée à un serveur

### RGPD
- Consentement explicite affiché avant l'export
- Footer horodaté avec mention "partagé volontairement"
- L'utilisatrice choisit le destinataire via son propre Mail
- Aucun intermédiaire

---

## 17. Hors scope v1

Fonctionnalités explicitement exclues du MVP :

- Résumé hebdomadaire / mensuel automatique
- Widget iOS
- Support iPad
- Version Android
- Reconnaissance d'aliments par photo
- Calcul de calories / macros
