# Les notes de patate — Documentation Technique Complète

> Dernière mise à jour : 2026-08-07  
> Stack : React Native + Expo (TypeScript) · iOS uniquement · Tout local

---

## 1. Stack technique

| Couche | Technologie | Rôle |
|--------|-------------|------|
| Framework mobile | React Native + Expo (TypeScript) | Base de l'app |
| Navigation | expo-router | Routing et navigation |
| Transcription vocale | `@react-native-voice/voice` | iOS Speech Recognition (on-device) |
| Reformulation IA | Foundation Models (Swift natif) | Apple Intelligence on-device |
| Stockage local | expo-sqlite | Base de données SQLite sur l'iPhone |
| Notifications | expo-notifications | Rappels repas |
| Backup iCloud | expo-file-system + iCloud Drive | Export SQLite vers iCloud |
| Build cloud | EAS (Expo Application Services) | Compilation iOS sans Mac obligatoire |
| Distribution | TestFlight (Apple) | Installation hors App Store |

---

## 2. Architecture de l'app

```
les-notes-de-patate/
├── app/                        # Écrans (expo-router)
│   ├── index.tsx               # Écran principal (micro + dernières entrées)
│   ├── onboarding/             # Flow onboarding (5 étapes)
│   │   ├── welcome.tsx
│   │   ├── goal.tsx
│   │   ├── meal-slots.tsx
│   │   ├── color.tsx
│   │   └── permissions.tsx
│   └── _layout.tsx
├── components/                 # Composants réutilisables
│   ├── MicButton.tsx           # Bouton micro avec halos
│   ├── MealBadge.tsx           # Badge repas détecté
│   ├── JournalSheet.tsx        # Sheet journal (swipe up)
│   ├── EntryCard.tsx           # Carte entrée dans la timeline
│   └── ColorPicker.tsx         # Sélecteur 10 couleurs + preview
├── modules/                    # Modules natifs custom
│   └── AppleIntelligence/      # Pont Swift → Foundation Models
│       ├── AppleIntelligenceModule.swift
│       └── index.ts
├── services/
│   ├── db.ts                   # Couche SQLite (CRUD)
│   ├── mealDetection.ts        # Détection repas selon l'heure
│   ├── transcription.ts        # Speech Recognition
│   ├── reformulation.ts        # Appel Apple Intelligence
│   └── icloudBackup.ts         # Export/import iCloud
├── store/                      # État global (Zustand ou Context)
│   ├── settings.ts
│   └── entries.ts
├── constants/
│   ├── colors.ts               # Les 10 palettes + dérivation des sous-tons
│   └── meals.ts                # Types repas, icônes, labels
└── docs/
    └── TECH.md                 # Ce fichier
```

---

## 3. Modèle de données (SQLite)

### Table `entries`

```sql
CREATE TABLE entries (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  recorded_at  DATETIME NOT NULL,        -- Horodatage exact (UTC)
  meal_type    TEXT     NOT NULL,        -- breakfast | lunch | snack | dinner | other
  transcript   TEXT     NOT NULL,        -- Texte final (reformulé ou corrigé)
  raw_text     TEXT,                     -- Transcript brut original (pour "voir original")
  edited_at    DATETIME,                 -- Si l'utilisatrice a modifié manuellement
  created_at   DATETIME DEFAULT (datetime('now'))
);
```

### Table `meal_slots`

```sql
CREATE TABLE meal_slots (
  meal_type    TEXT    PRIMARY KEY,      -- breakfast | lunch | snack | dinner
  label        TEXT    NOT NULL,         -- "Petit-déjeuner" etc.
  icon         TEXT    NOT NULL,         -- Emoji
  start_hour   INTEGER NOT NULL,         -- 6 pour 06:00
  end_hour     INTEGER NOT NULL          -- 10 pour 10:00
);

-- Valeurs par défaut
INSERT INTO meal_slots VALUES ('breakfast', 'Petit-déjeuner', '☀️', 6, 10);
INSERT INTO meal_slots VALUES ('lunch',     'Déjeuner',       '🌞', 11, 14);
INSERT INTO meal_slots VALUES ('snack',     'Collation',      '🌤', 14, 18);
INSERT INTO meal_slots VALUES ('dinner',    'Dîner',          '🌙', 18, 22);
```

### Table `settings`

```sql
CREATE TABLE settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Clés utilisées :
-- first_name      → "Léa"
-- primary_color   → "#E85520"
-- goal            → "watch" | "remember" | "other"
-- onboarding_done → "true"
-- icloud_backup   → "true" | "false"
-- backup_interval → "1" | "3" | "7" | "30"  (jours)
-- last_backup_at  → ISO datetime
```

---

## 4. Pipeline d'enregistrement

```
1. Appui long sur le micro
      ↓
2. iOS Speech Recognition (on-device, @react-native-voice)
   → Transcription en temps réel affichée à l'écran
      ↓
3. Relâche → transcript brut capturé
      ↓
4. Apple Intelligence Foundation Models (on-device, module Swift)
   Prompt : "Reformule ce que j'ai mangé en une phrase claire et naturelle
             en français. Ne rajoute rien, ne retire rien. Texte : [raw]"
      ↓
5. Écran de confirmation :
   - Texte reformulé affiché (modifiable)
   - Repas détecté selon l'heure (modifiable)
   - Boutons : Sauvegarder | Réenregistrer | Voir original
      ↓
6. Sauvegarde SQLite locale
   - transcript = texte final
   - raw_text   = transcript brut (conservation pour transparence)
   - recorded_at = heure exacte de l'enregistrement
   - meal_type  = détecté ou choisi manuellement
```

**Note :** L'audio n'est jamais persisté sur disque. Il sert uniquement à produire le transcript, puis est libéré de la mémoire.

---

## 5. Détection automatique du repas

```typescript
// services/mealDetection.ts
function detectMealType(date: Date, slots: MealSlot[]): MealType {
  const hour = date.getHours();
  const match = slots.find(s => hour >= s.start_hour && hour < s.end_hour);
  return match?.meal_type ?? 'other';
}
```

Résultat toujours **suggéré**, jamais imposé. L'utilisatrice peut changer en 1 tap.

---

## 6. Module natif Swift — Apple Intelligence

Nécessite un **Expo Config Plugin** et un module natif Swift.

```swift
// AppleIntelligenceModule.swift
import Foundation
import FoundationModels  // iOS 18.1+ / Apple Intelligence

@objc(AppleIntelligenceModule)
class AppleIntelligenceModule: NSObject {

  @objc func reformulate(
    _ rawText: String,
    resolve: @escaping RCTPromiseResolveBlock,
    reject: @escaping RCTPromiseRejectBlock
  ) {
    Task {
      let session = LanguageModelSession()
      let prompt = """
        Reformule ce que j'ai mangé en une phrase claire et naturelle en français.
        Ne rajoute rien, ne retire rien. Texte : \(rawText)
        """
      do {
        let response = try await session.respond(to: prompt)
        resolve(response.content)
      } catch {
        reject("REFORMULATION_ERROR", error.localizedDescription, error)
      }
    }
  }
}
```

**Compatibilité :** iPhone 15 Pro / 15 Pro Max, iPhone 16+, iOS 18.1+.  
Affiché discrètement dans l'app : *"Reformulation via Apple Intelligence (on-device)"*

**Fallback :** Si le device ne supporte pas Apple Intelligence → affichage du transcript brut directement, l'utilisatrice peut corriger manuellement.

---

## 7. iCloud Backup

Le backup consiste à **copier le fichier SQLite** vers iCloud Drive.

```typescript
// services/icloudBackup.ts
import * as FileSystem from 'expo-file-system';

const DB_PATH = FileSystem.documentDirectory + 'notesdepatate.db';
const ICLOUD_PATH = 'iCloud/LesNotesDePatate/backup.db';

async function backupToICloud(): Promise<void> {
  await FileSystem.copyAsync({ from: DB_PATH, to: ICLOUD_PATH });
  await saveSetting('last_backup_at', new Date().toISOString());
}

async function restoreFromICloud(): Promise<void> {
  await FileSystem.copyAsync({ from: ICLOUD_PATH, to: DB_PATH });
}
```

**Fréquences configurables :** 1 jour / 3 jours / 7 jours (défaut) / 30 jours  
**Déclenchement :** automatique au lancement de l'app si le délai est écoulé + bouton manuel "Backup maintenant"

---

## 8. Notifications (rappels repas)

```typescript
// Logique de rappel
// Au lancement de l'app ou à intervalles réguliers :
// → Vérifier si un repas attendu n'a pas encore été noté
// → Si oui et que l'heure dépasse le milieu de la plage → notification

// Exemple : plage déjeuner = 11h-14h
// Si 13h00 et aucune entrée "lunch" aujourd'hui → notification
```

**Contenu des notifications :**
- *"Il est 13h et tu n'as pas encore noté ton déjeuner 🥗"*
- *"Tu n'as pas encore noté ta collation 🌤"*

**Règles :**
- Une seule notification par repas par jour maximum
- Silence total entre 22h et 7h (ne pas déranger la nuit)
- Désactivable par repas dans les Réglages

---

## 9. Distribution & Tests

### Environnements de test

| Environnement | Usage | Prérequis |
|--------------|-------|-----------|
| Simulateur iOS (Mac) | UI, navigation, journal | Xcode installé (gratuit) |
| Expo Go (iPhone) | UI sur vrai appareil | App Expo Go gratuite |
| Dev Build (iPhone) | Micro, Speech Recognition, Apple Intelligence | `eas build --profile development` |
| TestFlight | Distribution finale | Compte Apple Developer (99$/an) |

### Workflow de développement

```bash
# Démarrer le serveur de dev
npx expo start

# Ouvrir dans le simulateur iOS
# → Appuyer sur 'i' dans le terminal

# Build de développement (pour features natives)
eas build --platform ios --profile development

# Build TestFlight
eas build --platform ios --profile preview
eas submit --platform ios
```

### Distribuer via TestFlight

1. Créer un compte Apple Developer (developer.apple.com) — 99$/an
2. `eas build --platform ios` → build cloud (pas besoin de Mac)
3. `eas submit --platform ios` → envoi automatique sur TestFlight
4. Partager le lien d'invitation TestFlight
5. L'utilisatrice installe l'app TestFlight (gratuit), puis l'app

**Capacité :** jusqu'à 10 000 testeurs avec le même lien.

---

## 10. Sécurité & Vie privée

### Principes fondamentaux

| Principe | Implémentation |
|----------|---------------|
| **Privacy by design** | Aucune donnée ne quitte l'iPhone par défaut |
| **Minimal data** | On ne collecte que ce qui est nécessaire (transcript + heure) |
| **No server** | Pas de backend, pas d'API, pas de compte utilisateur |
| **Transparent** | L'utilisatrice voit toujours où vont ses données |

### Données et leur localisation

| Donnée | Localisation | Chiffrement | Quitte l'iPhone ? |
|--------|-------------|-------------|-------------------|
| Transcriptions | SQLite local | iOS chiffrement at-rest | Non (sauf backup iCloud choisi) |
| Audio | Jamais persisté | — | Jamais |
| Prénom / préférences | SQLite local | iOS chiffrement at-rest | Non |
| Backup SQLite | iCloud Drive (si activé) | Chiffrement Apple end-to-end | Uniquement si activé par l'utilisatrice |

### Permissions demandées

| Permission | Pourquoi | Moment |
|------------|----------|--------|
| Microphone | Enregistrement vocal | Onboarding étape 5 |
| Reconnaissance vocale | Transcription iOS | Onboarding étape 5 |
| Notifications | Rappels repas (optionnel) | Onboarding étape 5 |
| iCloud | Backup (optionnel) | À l'activation du backup |

**Aucune autre permission n'est demandée.** Pas de caméra, pas de localisation, pas de contacts, pas de réseau (hors backup iCloud).

### Vecteurs d'attaque et mitigations

| Risque | Mitigation |
|--------|-----------|
| Accès physique à l'iPhone | Données chiffrées par iOS (Secure Enclave) — inaccessibles sans déverrouillage |
| Interception réseau | Aucun trafic réseau hors backup iCloud (chiffré TLS + E2E Apple) |
| Fuite via Apple Intelligence | Foundation Models tourne entièrement on-device — aucune donnée envoyée à Apple |
| Accès au backup iCloud | Protégé par le compte Apple ID de l'utilisatrice + chiffrement E2E |
| Injection de données | Pas d'input externe — seule source = voix de l'utilisatrice |
| Crash / corruption DB | expo-sqlite gère les transactions, le fichier SQLite peut être restauré depuis iCloud |

### Conformité RGPD (Luxembourg / UE)

L'app est **RGPD-conforme par conception** :

- ✅ **Pas de traitement de données personnelles hors de l'appareil** — aucun serveur, aucune base de données externe
- ✅ **Consentement explicite** pour chaque permission (microphone, notifications, iCloud)
- ✅ **Droit à l'effacement** — supprimer l'app supprime toutes les données (+ le backup iCloud si désactivé)
- ✅ **Transparence** — l'utilisatrice voit à tout moment où sont ses données (badge privacité dans le journal)
- ✅ **Minimisation** — on ne collecte que le strict nécessaire (pas d'analytics, pas de tracking)
- ✅ **Pas de tiers** — aucun SDK analytics, pub ou tracking intégré

---

## 11. Dépendances principales

```json
{
  "expo": "~52.x",
  "expo-router": "~4.x",
  "expo-sqlite": "~14.x",
  "expo-notifications": "~0.28.x",
  "expo-file-system": "~17.x",
  "@react-native-voice/voice": "~3.x",
  "zustand": "~5.x"
}
```

**Aucune dépendance réseau** (pas d'axios, fetch, etc. — hors iCloud natif).

---

## 12. Roadmap technique

### v1.0 — MVP
- [x] Onboarding 5 étapes
- [x] Enregistrement vocal + transcription
- [x] Reformulation Apple Intelligence
- [x] Détection automatique repas
- [x] Journal timeline
- [x] Backup iCloud
- [x] Notifications rappels
- [x] Thème couleur personnalisé

### v1.x — Améliorations futures (hors scope v1)
- [ ] Exportation du journal en PDF
- [ ] Résumé hebdomadaire / mensuel
- [ ] Widget iOS (dernier repas noté)
- [ ] Partage sécurisé avec un médecin/nutritionniste
- [ ] Support iPad
