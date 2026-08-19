# Graph Report - les-notes-de-patate  (2026-08-19)

## Corpus Check
- 171 files · ~256,568 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 762 nodes · 1529 edges · 56 communities (42 shown, 14 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 38 edges (avg confidence: 0.84)
- Token cost: 19,012 input · 4,410 output

## Community Hubs (Navigation)
- Comfort & Aid UI
- App Shell & Settings
- Expo Dependencies
- Ressentis UI
- Project Vision & Docs
- Dev Scripts & Tooling
- Data Layer & Services
- Config & Test Setup
- Onboarding & Welcome
- Confirm & Photo Screen
- Swift / Apple Intelligence
- Trends & Statistics
- Meal Picker Screen
- Expo Config
- Meal Badges & Slots
- Pro Notes Detail
- SpecKit Workflow
- Settings Repository
- Home Screen & Waveform
- Activity Sheet
- TypeScript Config
- Journal Timeline
- Journal Sheet Edit
- Entries CRUD
- Implementation Plans
- Date Utilities
- Journal Sheet Props
- Design Brainstorm
- Goal Screen
- Privacy & Local Storage
- Journal Store Tests
- Mic Button
- Meal Detection Logic
- SpecKit Checklist
- Android Adaptive Icons
- Brand Mascot & Splash
- AI Recording Pipeline
- PDF Export
- Android Icon Layers
- Favicon
- App Icon
- App Logo
- Logo Backup
- Docs Redirect
- Navigation Setup
- Design Direction Final
- V1 Scope Boundaries
- TestFlight Distribution
- Permissions Screen
- Placeholder Content
- In-Progress Spec

## God Nodes (most connected - your core abstractions)
1. `getDatabase()` - 66 edges
2. `MealType` - 31 edges
3. `useColorTheme()` - 29 edges
4. `useSettingsStore` - 26 edges
5. `expo-router` - 22 edges
6. `useJournalStore` - 21 edges
7. `useRecordingStore` - 20 edges
8. `SettingsScreen()` - 16 edges
9. `useRessentisStore` - 16 edges
10. `JournalSheet()` - 15 edges

## Surprising Connections (you probably didn't know these)
- `Journal Timeline UI — Glissement ↑ depuis l'écran principal` --semantically_similar_to--> `Journal & Stockage — Design validé + modèle de données SQLite`  [INFERRED] [semantically similar]
  .superpowers/brainstorm/2261-1786085987/content/journal-stockage.html → docs/ecrans/06-journal-stockage.html
- `Pipeline IA — Capture → Transcription → Reformulation → Révision → Sauvegarde` --semantically_similar_to--> `Pipeline reformulation — Design validé + options Apple Intelligence`  [INFERRED] [semantically similar]
  .superpowers/brainstorm/2261-1786085987/content/pipeline-reformulation.html → docs/ecrans/07-pipeline-reformulation.html
- `Consentement RGPD — Badge et mention explicite avant export` --semantically_similar_to--> `Privacy by design — Aucune donnée quitte l'iPhone par défaut, RGPD-conforme`  [INFERRED] [semantically similar]
  .superpowers/brainstorm/2261-1786085987/content/export.html → docs/TECH.md
- `Onboarding — 5 écrans (bienvenue, objectif, plages, couleur, permissions)` --semantically_similar_to--> `Onboarding flow — 5 écrans validés (bienvenue, objectif, plages, couleur, permissions)`  [INFERRED] [semantically similar]
  .superpowers/brainstorm/2261-1786085987/content/onboarding-flow.html → docs/ecrans/04-onboarding-flow.html
- `Constitution Authority — Non-negotiable Governance in Spec-Kit` --rationale_for--> `Project Constitution (Unfilled Template)`  [INFERRED]
  .claude/skills/speckit-analyze/SKILL.md → .specify/memory/constitution.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Spec-Kit Core SDD Skills (specify→clarify→plan→tasks→implement)** — _claude_skills_speckit_specify_skill_md_speckit_specify, _claude_skills_speckit_clarify_skill_md_speckit_clarify, _claude_skills_speckit_plan_skill_md_speckit_plan, _claude_skills_speckit_tasks_skill_md_speckit_tasks, _claude_skills_speckit_implement_skill_md_speckit_implement [EXTRACTED 1.00]
- **Raconte-moi Brainstorm UI Session (design options + colors + final direction + recording flow + export)** — _superpowers_brainstorm_2261_1786085987_content_approches_design_html_design_options, _superpowers_brainstorm_2261_1786085987_content_couleurs_onboarding_html_color_picker, _superpowers_brainstorm_2261_1786085987_content_direction_finale_html_final_design_direction, _superpowers_brainstorm_2261_1786085987_content_enregistrement_flow_html_recording_flow, _superpowers_brainstorm_2261_1786085987_content_export_pagination_html_pdf_export_pagination [INFERRED 0.95]
- **Spec-Kit Post-Implement Quality Skills (analyze, converge, taskstoissues)** — _claude_skills_speckit_analyze_skill_md_speckit_analyze, _claude_skills_speckit_converge_skill_md_speckit_converge, _claude_skills_speckit_taskstoissues_skill_md_speckit_taskstoissues [INFERRED 0.85]
- **Modèle de données SQLite — entries + ressentis + meal_slots + settings** — superpowers_brainstorm_2261_1786085987_content_journal_stockage_table_entries, superpowers_brainstorm_2261_1786085987_content_ressentis_table_ressentis, superpowers_brainstorm_2261_1786085987_content_journal_stockage_table_meal_slots, superpowers_brainstorm_2261_1786085987_content_journal_stockage_table_settings [EXTRACTED 0.95]
- **Pipeline enregistrement vocal — Capture → Transcription → Reformulation → Sauvegarde SQLite** — superpowers_brainstorm_2261_1786085987_content_pipeline_reformulation_pipeline_ia, superpowers_brainstorm_2261_1786085987_content_pipeline_reformulation_apple_intelligence_option, docs_tech_md_apple_intelligence_module, superpowers_brainstorm_2261_1786085987_content_journal_stockage_table_entries, docs_tech_md_audio_not_persisted [INFERRED 0.95]
- **Onboarding flow — 5 étapes de configuration initiale** — superpowers_brainstorm_2261_1786085987_content_onboarding_flow_onboarding_5steps, superpowers_brainstorm_2261_1786085987_content_onboarding_flow_permissions_screen, docs_ecrans_04_onboarding_flow_5screens, docs_ecrans_03_couleurs_onboarding_10_colors [INFERRED 0.85]
- **Zustand Store Pattern — settingsStore, journalStore, ressentisStore** — docs_superpowers_plans_2026_08_07_02_onboarding_settings_store, docs_superpowers_plans_2026_08_08_04_home_journal_journal_store, docs_superpowers_plans_2026_08_08_05_ressentis_ressentis_store [INFERRED 0.95]
- **5-Screen Onboarding Flow** — docs_superpowers_plans_2026_08_07_02_onboarding_welcome_screen, docs_superpowers_plans_2026_08_07_02_onboarding_goal_screen, docs_superpowers_plans_2026_08_07_02_onboarding_slots_screen, docs_superpowers_plans_2026_08_07_02_onboarding_color_screen, docs_superpowers_plans_2026_08_07_02_onboarding_permissions_screen [EXTRACTED 1.00]
- **Privacy-First Local Data Principles** — docs_privacy_policy_local_sqlite_storage, docs_privacy_policy_no_server_principle, docs_superpowers_specs_2026_08_07_les_notes_de_patate_design_privacy_by_design, docs_privacy_policy_rgpd_compliance [INFERRED 0.95]

## Communities (56 total, 14 thin omitted)

### Community 0 - "Comfort & Aid UI"
Cohesion: 0.06
Nodes (66): AidSlot, ComfortAidSheet(), Props, SLOT_OPTS, styles, JournalTimelineProps, EFFICACY_OPTS, MEAL_OPTS (+58 more)

### Community 1 - "App Shell & Settings"
Cohesion: 0.07
Nodes (47): RootLayout(), SettingsScreen(), applyPreset(), daysAgoStr(), exportRange(), parseFrDate(), todayStr(), styles (+39 more)

### Community 2 - "Expo Dependencies"
Cohesion: 0.04
Nodes (47): expo, expo-asset, expo-audio, expo-auth-session, expo-crypto, expo-document-picker, expo-file-system, expo-image-manipulator (+39 more)

### Community 3 - "Ressentis UI"
Cohesion: 0.08
Nodes (37): AnySlot, currentSlot(), RessentisSheet(), RessentisSheetProps, SLEEP_OPTIONS, SLOT_OPTS, styles, RESSENTI_CATEGORIES (+29 more)

### Community 4 - "Project Vision & Docs"
Cohesion: 0.05
Nodes (43): Expo SDK 57 — Lire les docs versionnées avant tout code, Expo SDK 57 — Pièges critiques (expo-av → expo-audio, etc.), Raconte-moi — App iOS journal alimentaire vocal pour Eugénie, Spec-kit workflow — clarify → specify → plan → tasks → implement, 3 Directions design — A (enregistrement d'abord), B (journal d'abord), C (ultra-minimal), Direction retenue — C ultra-minimal + palette corail/abricot de A, 10 couleurs disponibles — Corail (défaut), Terracotta, Miel, Vert, Teal, Bleu, Violet, Rose, Bordeaux, Brun, Onboarding flow — 5 écrans validés (bienvenue, objectif, plages, couleur, permissions) (+35 more)

### Community 5 - "Dev Scripts & Tooling"
Cohesion: 0.08
Nodes (17): check-prerequisites.sh script, check_dir(), check_file(), get_feature_paths(), get_repo_root(), has_jq(), _persist_feature_json(), resolve_specify_init_dir() (+9 more)

### Community 6 - "Data Layer & Services"
Cohesion: 0.08
Nodes (33): 10 Color Palettes (Corail default), colorSystem Service — Color Palette Derivation, entriesRepository — CRUD entries, mealDetection Service — Detect Meal by Hour, ressentisRepository — CRUD ressentis, settingsRepository — CRUD settings + meal_slots, SQLite Layer — 3 Tables (entries, ressentis, settings/meal_slots), TDD Approach — Tests First, Implementation Second (+25 more)

### Community 7 - "Config & Test Setup"
Cohesion: 0.07
Nodes (27): jest, jest-expo, devDependencies, jest, jest-expo, @react-native/jest-preset, test-renderer, @testing-library/react-native (+19 more)

### Community 8 - "Onboarding & Welcome"
Cohesion: 0.12
Nodes (16): plugins, styles, WelcomeScreen(), PermissionsScreen(), styles, SlotsScreen(), styles, expo-router (+8 more)

### Community 9 - "Confirm & Photo Screen"
Cohesion: 0.15
Nodes (13): ConfirmScreen(), styles, @react-native-voice/voice, MealBadge(), destroyListener(), startListening(), stopListening(), initialState (+5 more)

### Community 10 - "Swift / Apple Intelligence"
Cohesion: 0.11
Nodes (17): Bool, Foundation, AppleIntelligenceModule, NSObject, RCTPromiseRejectBlock, RCTPromiseResolveBlock, isAvailable(), reformulate() (+9 more)

### Community 11 - "Trends & Statistics"
Cohesion: 0.16
Nodes (20): DAY_LABELS, DayBar(), formatDate(), getDayLabel(), getMonthLabel(), MODE_OPTS, MONTH_NAMES, scoreBg() (+12 more)

### Community 12 - "Meal Picker Screen"
Cohesion: 0.17
Nodes (12): MealPickerScreen(), styles, ColorScreen(), styles, COLOR_PALETTES, DEFAULT_COLOR, useColorTheme(), getDefaultPalette() (+4 more)

### Community 13 - "Expo Config"
Cohesion: 0.10
Nodes (20): typedRoutes, expo, experiments, extra, icon, ios, name, orientation (+12 more)

### Community 14 - "Meal Badges & Slots"
Cohesion: 0.16
Nodes (17): MealBadgeProps, styles, DEFAULT_MEAL_SLOTS, MEAL_ICONS, MEAL_LABELS, buildPhotoMap(), entryHtml(), exportJournalAsPdf() (+9 more)

### Community 15 - "Pro Notes Detail"
Cohesion: 0.18
Nodes (15): ProNoteDetailScreen(), handleSave(), styles, ProNotesScreen(), handleAddText(), handleDelete(), handleImportFile(), load() (+7 more)

### Community 16 - "SpecKit Workflow"
Cohesion: 0.19
Nodes (17): speckit-analyze Skill, speckit-clarify Skill, speckit-constitution Skill, speckit-converge Skill, speckit-implement Skill, speckit-plan Skill, speckit-specify Skill, speckit-tasks Skill (+9 more)

### Community 17 - "Settings Repository"
Cohesion: 0.26
Nodes (13): getAppSettings(), getMealSlots(), getSetting(), setSetting(), updateMealSlot(), DEFAULT_SETTINGS, SettingsState, useSettingsStore (+5 more)

### Community 18 - "Home Screen & Waveform"
Cohesion: 0.14
Nodes (13): HomeScreen(), styles, HEIGHTS, styles, WaveformView(), WaveformViewProps, baseDoneSettings, baseJournalState (+5 more)

### Community 19 - "Activity Sheet"
Cohesion: 0.18
Nodes (11): ActivitySheet(), handleTimeChange(), ActivitySheetProps, hhmmToISO(), isoToHHMM(), styles, ACTIVITY_ICONS, ACTIVITY_LABELS (+3 more)

### Community 20 - "TypeScript Config"
Cohesion: 0.14
Nodes (13): expo-env.d.ts, expo/tsconfig.base, .expo/types/**/*.ts, plugins, __tests__, **/*.ts, **/*.tsx, compilerOptions (+5 more)

### Community 21 - "Journal Timeline"
Cohesion: 0.16
Nodes (13): buildTimeline(), EFFICACY_ICON, JournalTimeline(), RessentisCard(), SLEEP_BORDER, SLEEP_COLOR, SLEEP_LABEL, SLEEP_TEXT (+5 more)

### Community 22 - "Journal Sheet Edit"
Cohesion: 0.17
Nodes (9): JournalSheet(), handlePickPhoto(), handleSaveRessentiEdit(), handleTakePhoto(), savePhotoToPermanentStorage(), getActiveDates(), updateRessenti(), baseState (+1 more)

### Community 23 - "Entries CRUD"
Cohesion: 0.23
Nodes (10): handleDeleteEntry(), handleSaveEdit(), createEntry(), CreateEntryParams, deleteEntry(), getLastEntry(), updateEntryPhoto(), updateEntryTranscript() (+2 more)

### Community 24 - "Implementation Plans"
Cohesion: 0.42
Nodes (10): Plan 01 — Foundation, Plan 02 — Onboarding, Plan 03 — Core Recording, Plan 04 — Home + Journal, Plan 05 — Ressentis, Plan 06 — Notifications, Plan 07 — iCloud + Export PDF, 7-Plan Implementation Sequence (+2 more)

### Community 25 - "Date Utilities"
Cohesion: 0.46
Nodes (6): addDays(), DAYS_FR, formatDate(), formatDateLabel(), formatTime(), MONTHS_FR

### Community 26 - "Journal Sheet Props"
Cohesion: 0.43
Nodes (5): JournalSheetProps, styles, RESSENTI_ICONS, RESSENTI_LABELS, RESSENTI_SUB_CATEGORIES

### Community 27 - "Design Brainstorm"
Cohesion: 0.33
Nodes (6): Raconte-moi — 3 Design Direction Options (A/B/C), Raconte-moi — Onboarding Color Picker (10 palettes), Raconte-moi — Final Design Direction (C + warmth of A), Raconte-moi — Recording Flow UX (5 states), Raconte-moi Design System — Coral/Apricot Warm Palette + Ultra-minimal Layout, Raconte-moi Recording UX — Hybrid Flux A (direct speak) and Flux B (badge-first)

### Community 28 - "Goal Screen"
Cohesion: 0.40
Nodes (4): GOALS, GoalScreen(), styles, mockPush

### Community 29 - "Privacy & Local Storage"
Cohesion: 0.33
Nodes (6): Local SQLite Storage — Privacy Principle, No Server / No Network Data Transmission, Raconte-moi Privacy Policy, RGPD Compliance — Right to Erasure, Privacy by Design — No Server, No Network, Local SQLite Only, App Vision — Vocal Food Journal, Local-Only, No Account

### Community 30 - "Journal Store Tests"
Cohesion: 0.33
Nodes (5): INITIAL_STATE, mockAddDays, mockFormatDate, mockGetEntries, SAMPLE_ENTRY

### Community 31 - "Mic Button"
Cohesion: 0.50
Nodes (4): hexToRgb(), MicButton(), MicButtonProps, styles

### Community 32 - "Meal Detection Logic"
Cohesion: 0.70
Nodes (3): detectMealType(), getMealReminderHour(), MealSlot

### Community 33 - "SpecKit Checklist"
Cohesion: 0.67
Nodes (3): speckit-checklist Skill, Checklist Template, Checklists as Unit Tests for Requirements Quality

### Community 34 - "Android Adaptive Icons"
Cohesion: 1.00
Nodes (3): Android Icon Monochrome — Raconte-moi app icon (chevron/caret symbol, grey on white, monochrome adaptive icon), Android adaptive icon — monochrome layer for themed icons (Android 13+), Raconte-moi brand identity — chevron/caret mark, monochrome palette

### Community 35 - "Brand Mascot & Splash"
Cohesion: 1.00
Nodes (3): Splash Icon — Patate mascot (cartoon potato holding notebook and pencil), App identity: food journal / note-taking, warm orange palette, playful tone, Brand mascot: friendly cartoon potato character

### Community 36 - "AI Recording Pipeline"
Cohesion: 0.67
Nodes (3): Apple Intelligence Foundation Models — On-Device Reformulation, Confirmation Screen — Editable Reformulated Transcript, Recording Pipeline — Speech Recognition → Apple Intelligence → SQLite

## Knowledge Gaps
- **239 isolated node(s):** `common.sh script`, `mockUseJournalStore`, `baseState`, `SLOTS`, `ENTRY` (+234 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **14 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `expo-router` connect `Onboarding & Welcome` to `App Shell & Settings`, `Confirm & Photo Screen`, `Trends & Statistics`, `Meal Picker Screen`, `Pro Notes Detail`, `Home Screen & Waveform`, `Journal Sheet Edit`, `Journal Sheet Props`, `Goal Screen`?**
  _High betweenness centrality (0.064) - this node is a cross-community bridge._
- **Why does `getDatabase()` connect `Comfort & Aid UI` to `App Shell & Settings`, `Ressentis UI`, `Trends & Statistics`, `Pro Notes Detail`, `Settings Repository`, `Journal Sheet Edit`, `Entries CRUD`?**
  _High betweenness centrality (0.036) - this node is a cross-community bridge._
- **Why does `plugins` connect `Onboarding & Welcome` to `App Shell & Settings`, `Expo Config`, `Confirm & Photo Screen`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `common.sh script`, `mockUseJournalStore`, `baseState` to the rest of the system?**
  _239 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Comfort & Aid UI` be split into smaller, more focused modules?**
  _Cohesion score 0.0608250526949714 - nodes in this community are weakly interconnected._
- **Should `App Shell & Settings` be split into smaller, more focused modules?**
  _Cohesion score 0.06936026936026936 - nodes in this community are weakly interconnected._
- **Should `Expo Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._