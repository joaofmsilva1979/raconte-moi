# Plan 04 — Home + Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le journal (bottom sheet qui monte depuis l'écran principal) avec timeline des entrées du jour groupées par créneaux repas et navigation entre les jours passés. L'utilisatrice glisse vers le haut depuis HomeScreen pour ouvrir le journal.

**Architecture:**
- `src/utils/dateUtils.ts` — helpers : `formatDate` (→ 'YYYY-MM-DD'), `formatDateLabel` (→ "Aujourd'hui" / "Hier" / "Sam 8 août"), `formatTime` (ISO → "HH:MM"), `addDays`
- `src/store/journalStore.ts` — Zustand : `viewedDate`, `entries`, `isLoading`, `isSheetOpen` + actions `openSheet` / `closeSheet` / `loadDay` / `goToPreviousDay` / `goToNextDay` / `refreshCurrentDay`
- `src/components/JournalTimeline.tsx` — timeline des créneaux repas : chaque slot → entrées ou "En attente…"
- `src/components/JournalSheet.tsx` — bottom sheet Animated.View + PanResponder drag-to-close + navigation date + JournalTimeline + bouton ajouter
- `app/index.tsx` mis à jour — intègre JournalSheet, bouton "↑ Journal" (testable), PanResponder swipe-up, refresh après sauvegarde

**Tech Stack:** expo-sqlite v2 (via entriesRepository), Zustand 5, expo-router 4, Animated (React Native), PanResponder, @testing-library/react-native v14, jest@29.

**Note sur le prénom :** Le HomeScreen affiche `{settings.first_name}` dynamiquement (par ex. "Eugénie"). Dans les tests, utiliser une valeur fixture (ex. 'Marie') mais l'implémentation est toujours dynamique.

---

## Structure de fichiers

```
src/utils/
└── dateUtils.ts                          # CRÉER — formatDate, formatDateLabel, formatTime, addDays

src/store/
└── journalStore.ts                       # CRÉER — Zustand: viewedDate, entries, isSheetOpen

src/components/
├── JournalTimeline.tsx                   # CRÉER — timeline créneaux repas
└── JournalSheet.tsx                      # CRÉER — bottom sheet animée

app/
└── index.tsx                             # MODIFIER — intégrer JournalSheet + journal opener

__tests__/
├── utils/
│   └── dateUtils.test.ts                 # CRÉER
├── store/
│   └── journalStore.test.ts              # CRÉER
└── components/
    ├── JournalTimeline.test.tsx           # CRÉER
    └── JournalSheet.test.tsx             # CRÉER
```

**Fichiers modifiés :**
- `app/index.tsx` — ajout JournalSheet, useJournalStore, PanResponder, bouton journal
- `__tests__/screens/index.test.tsx` — ajout tests journal integration

---

## Task 1 : dateUtils — Helpers de formatage de date

**Files:**
- Create: `src/utils/dateUtils.ts`
- Create: `__tests__/utils/dateUtils.test.ts`

- [ ] **Étape 1.1 — Écrire les tests (TDD)**

Créer `__tests__/utils/dateUtils.test.ts` :

```typescript
import {
  formatDate,
  formatDateLabel,
  formatTime,
  addDays,
} from '@/utils/dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
      expect(formatDate(new Date('2026-08-08T15:00:00'))).toBe('2026-08-08');
    });

    it('pads month and day with zeros', () => {
      expect(formatDate(new Date('2026-01-05T10:00:00'))).toBe('2026-01-05');
    });
  });

  describe('formatDateLabel', () => {
    const TODAY = new Date('2026-08-08T12:00:00');

    it('returns "Aujourd\'hui" for today', () => {
      expect(formatDateLabel('2026-08-08', TODAY)).toBe("Aujourd'hui");
    });

    it('returns "Hier" for yesterday', () => {
      expect(formatDateLabel('2026-08-07', TODAY)).toBe('Hier');
    });

    it('returns a French weekday + date label for older dates', () => {
      const label = formatDateLabel('2026-08-05', TODAY);
      expect(label).toMatch(/mer\. 5 août/);
    });
  });

  describe('formatTime', () => {
    it('extracts HH:MM from an ISO string', () => {
      expect(formatTime('2026-08-08T09:07:00.000Z')).toMatch(/^\d{2}:\d{2}$/);
    });

    it('pads hours and minutes with zeros', () => {
      const date = new Date('2026-08-08T09:07:00.000Z');
      const local = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', hour12: false }).format(date);
      expect(formatTime('2026-08-08T09:07:00.000Z')).toBe(local);
    });
  });

  describe('addDays', () => {
    it('adds positive days', () => {
      expect(addDays('2026-08-08', 1)).toBe('2026-08-09');
    });

    it('subtracts days with negative input', () => {
      expect(addDays('2026-08-08', -1)).toBe('2026-08-07');
    });

    it('crosses month boundaries correctly', () => {
      expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    });
  });
});
```

- [ ] **Étape 1.2 — Vérifier que les tests échouent**

```bash
cd /Users/joao.silva/Projects/les-notes-de-patate && npx jest __tests__/utils/dateUtils.test.ts
```

Attendu : FAIL — `Cannot find module '@/utils/dateUtils'`.

- [ ] **Étape 1.3 — Implémenter dateUtils**

Créer `src/utils/dateUtils.ts` :

```typescript
const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(dateStr: string, today: Date = new Date()): string {
  const todayStr = formatDate(today);
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(today.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayDate);

  if (dateStr === todayStr) return "Aujourd'hui";
  if (dateStr === yesterdayStr) return 'Hier';

  const date = new Date(dateStr + 'T12:00:00');
  const dayName = DAYS_FR[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_FR[date.getMonth()];
  return `${dayName} ${day} ${month}`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return formatDate(date);
}
```

- [ ] **Étape 1.4 — Vérifier que les tests passent**

```bash
npx jest __tests__/utils/dateUtils.test.ts
```

Attendu : `7 passed`.

- [ ] **Étape 1.5 — Run all existing tests**

```bash
npx jest
```

Attendu : 89 + 7 = 96 tests passent.

- [ ] **Étape 1.6 — Commit**

```bash
git add src/utils/dateUtils.ts __tests__/utils/dateUtils.test.ts
git commit -m "feat: add dateUtils — formatDate, formatDateLabel, formatTime, addDays"
```

---

## Task 2 : journalStore — Zustand store

**Files:**
- Create: `src/store/journalStore.ts`
- Create: `__tests__/store/journalStore.test.ts`

Dépend de : `getEntriesForDay` (entriesRepository, déjà existant), `formatDate` et `addDays` (Task 1).

- [ ] **Étape 2.1 — Écrire les tests (TDD)**

Créer `__tests__/store/journalStore.test.ts` :

```typescript
jest.mock('@/db/entriesRepository', () => ({
  getEntriesForDay: jest.fn(),
}));

jest.mock('@/utils/dateUtils', () => ({
  formatDate: jest.fn(),
  addDays: jest.fn(),
}));

import { act } from '@testing-library/react-native';
import { useJournalStore } from '@/store/journalStore';
import * as entriesRepository from '@/db/entriesRepository';
import * as dateUtils from '@/utils/dateUtils';

const mockGetEntries = entriesRepository.getEntriesForDay as jest.Mock;
const mockFormatDate = dateUtils.formatDate as jest.Mock;
const mockAddDays = dateUtils.addDays as jest.Mock;

const FAKE_TODAY = '2026-08-08';
const FAKE_YESTERDAY = '2026-08-07';
const FAKE_TOMORROW = '2026-08-09';

const SAMPLE_ENTRY = {
  id: 1,
  recorded_at: '2026-08-08T09:00:00.000Z',
  meal_type: 'breakfast' as const,
  transcript: 'Café au lait',
  raw_text: null,
  edited_at: null,
  created_at: '2026-08-08T09:00:00.000Z',
};

const INITIAL_STATE = {
  viewedDate: FAKE_TODAY,
  entries: [],
  isLoading: false,
  isSheetOpen: false,
};

describe('journalStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDate.mockReturnValue(FAKE_TODAY);
    mockGetEntries.mockResolvedValue([]);
    act(() => { useJournalStore.setState(INITIAL_STATE); });
  });

  describe('openSheet', () => {
    it('sets isSheetOpen to true and loads today', async () => {
      mockGetEntries.mockResolvedValue([SAMPLE_ENTRY]);

      await act(async () => {
        await useJournalStore.getState().openSheet();
      });

      expect(useJournalStore.getState().isSheetOpen).toBe(true);
      expect(useJournalStore.getState().viewedDate).toBe(FAKE_TODAY);
      expect(useJournalStore.getState().entries).toEqual([SAMPLE_ENTRY]);
      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_TODAY);
    });
  });

  describe('closeSheet', () => {
    it('sets isSheetOpen to false', () => {
      act(() => { useJournalStore.setState({ isSheetOpen: true }); });
      act(() => { useJournalStore.getState().closeSheet(); });
      expect(useJournalStore.getState().isSheetOpen).toBe(false);
    });
  });

  describe('loadDay', () => {
    it('loads entries for the given date and sets viewedDate', async () => {
      mockGetEntries.mockResolvedValue([SAMPLE_ENTRY]);

      await act(async () => {
        await useJournalStore.getState().loadDay(FAKE_YESTERDAY);
      });

      expect(useJournalStore.getState().viewedDate).toBe(FAKE_YESTERDAY);
      expect(useJournalStore.getState().entries).toEqual([SAMPLE_ENTRY]);
      expect(useJournalStore.getState().isLoading).toBe(false);
    });

    it('sets isLoading during fetch then clears it', async () => {
      let resolve: (v: any) => void;
      mockGetEntries.mockReturnValue(new Promise(r => { resolve = r; }));

      act(() => { useJournalStore.getState().loadDay(FAKE_TODAY); });
      expect(useJournalStore.getState().isLoading).toBe(true);

      await act(async () => { resolve!([]); await Promise.resolve(); });
      expect(useJournalStore.getState().isLoading).toBe(false);
    });
  });

  describe('goToPreviousDay', () => {
    it('loads the previous day', async () => {
      mockAddDays.mockReturnValue(FAKE_YESTERDAY);

      await act(async () => {
        await useJournalStore.getState().goToPreviousDay();
      });

      expect(mockAddDays).toHaveBeenCalledWith(FAKE_TODAY, -1);
      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_YESTERDAY);
    });
  });

  describe('goToNextDay', () => {
    it('loads the next day when it is before or equal to today', async () => {
      act(() => { useJournalStore.setState({ viewedDate: FAKE_YESTERDAY }); });
      mockAddDays.mockReturnValue(FAKE_TODAY);
      mockFormatDate.mockReturnValue(FAKE_TODAY);

      await act(async () => {
        await useJournalStore.getState().goToNextDay();
      });

      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_TODAY);
    });

    it('does not load when next day would be in the future', async () => {
      act(() => { useJournalStore.setState({ viewedDate: FAKE_TODAY }); });
      mockAddDays.mockReturnValue(FAKE_TOMORROW);
      mockFormatDate.mockReturnValue(FAKE_TODAY);

      await act(async () => {
        await useJournalStore.getState().goToNextDay();
      });

      expect(mockGetEntries).not.toHaveBeenCalled();
    });
  });

  describe('refreshCurrentDay', () => {
    it('reloads entries for the current viewedDate', async () => {
      mockGetEntries.mockResolvedValue([SAMPLE_ENTRY]);

      await act(async () => {
        await useJournalStore.getState().refreshCurrentDay();
      });

      expect(mockGetEntries).toHaveBeenCalledWith(FAKE_TODAY);
      expect(useJournalStore.getState().entries).toEqual([SAMPLE_ENTRY]);
    });
  });
});
```

- [ ] **Étape 2.2 — Vérifier que les tests échouent**

```bash
npx jest __tests__/store/journalStore.test.ts
```

Attendu : FAIL — `Cannot find module '@/store/journalStore'`.

- [ ] **Étape 2.3 — Implémenter journalStore**

Créer `src/store/journalStore.ts` :

```typescript
import { create } from 'zustand';
import { Entry } from '@/types';
import { getEntriesForDay } from '@/db/entriesRepository';
import { formatDate, addDays } from '@/utils/dateUtils';

interface JournalState {
  viewedDate: string;
  entries: Entry[];
  isLoading: boolean;
  isSheetOpen: boolean;
}

interface JournalActions {
  openSheet: () => Promise<void>;
  closeSheet: () => void;
  loadDay: (dateStr: string) => Promise<void>;
  goToPreviousDay: () => Promise<void>;
  goToNextDay: () => Promise<void>;
  refreshCurrentDay: () => Promise<void>;
}

export const useJournalStore = create<JournalState & JournalActions>((set, get) => ({
  viewedDate: formatDate(new Date()),
  entries: [],
  isLoading: false,
  isSheetOpen: false,

  openSheet: async () => {
    const today = formatDate(new Date());
    set({ isSheetOpen: true, viewedDate: today });
    await get().loadDay(today);
  },

  closeSheet: () => set({ isSheetOpen: false }),

  loadDay: async (dateStr: string) => {
    set({ isLoading: true, viewedDate: dateStr });
    try {
      const entries = await getEntriesForDay(dateStr);
      set({ entries, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  goToPreviousDay: async () => {
    const prev = addDays(get().viewedDate, -1);
    await get().loadDay(prev);
  },

  goToNextDay: async () => {
    const next = addDays(get().viewedDate, 1);
    const today = formatDate(new Date());
    if (next <= today) {
      await get().loadDay(next);
    }
  },

  refreshCurrentDay: async () => {
    await get().loadDay(get().viewedDate);
  },
}));
```

- [ ] **Étape 2.4 — Vérifier que les tests passent**

```bash
npx jest __tests__/store/journalStore.test.ts
```

Attendu : `8 passed`.

- [ ] **Étape 2.5 — Run all tests**

```bash
npx jest
```

Attendu : 96 + 8 = 104 tests passent.

- [ ] **Étape 2.6 — Commit**

```bash
git add src/store/journalStore.ts __tests__/store/journalStore.test.ts
git commit -m "feat: add journalStore — Zustand: viewedDate, entries, isSheetOpen, day navigation"
```

---

## Task 3 : JournalTimeline — Composant timeline des créneaux

**Files:**
- Create: `src/components/JournalTimeline.tsx`
- Create: `__tests__/components/JournalTimeline.test.tsx`

Dépend de : `formatTime` (Task 1), types `Entry` et `MealSlot`.

- [ ] **Étape 3.1 — Écrire les tests (TDD)**

Créer `__tests__/components/JournalTimeline.test.tsx` :

```tsx
jest.mock('@/utils/dateUtils', () => ({
  formatTime: jest.fn((iso: string) => '09:00'),
}));

import React from 'react';
import { render } from '@testing-library/react-native';
import { JournalTimeline } from '@/components/JournalTimeline';
import { Entry, MealSlot } from '@/types';

const SLOTS: MealSlot[] = [
  { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6, end_hour: 10 },
  { meal_type: 'lunch', label: 'Déjeuner', icon: '🌞', start_hour: 11, end_hour: 14 },
  { meal_type: 'snack', label: 'Collation', icon: '🌤', start_hour: 14, end_hour: 18 },
  { meal_type: 'dinner', label: 'Dîner', icon: '🌙', start_hour: 18, end_hour: 22 },
];

const ENTRY: Entry = {
  id: 1,
  recorded_at: '2026-08-08T09:00:00.000Z',
  meal_type: 'breakfast',
  transcript: 'Café au lait, deux tartines.',
  raw_text: null,
  edited_at: null,
  created_at: '2026-08-08T09:00:00.000Z',
};

describe('JournalTimeline', () => {
  it('renders all meal slots', () => {
    const { getByTestId } = render(
      <JournalTimeline entries={[]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('timeline-slot-breakfast')).toBeTruthy();
    expect(getByTestId('timeline-slot-lunch')).toBeTruthy();
    expect(getByTestId('timeline-slot-snack')).toBeTruthy();
    expect(getByTestId('timeline-slot-dinner')).toBeTruthy();
  });

  it('shows "En attente…" for slots with no entry', () => {
    const { getByTestId } = render(
      <JournalTimeline entries={[]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('pending-breakfast')).toBeTruthy();
    expect(getByTestId('pending-lunch')).toBeTruthy();
  });

  it('shows entry text and time for slots with an entry', () => {
    const { getByText, getByTestId, queryByTestId } = render(
      <JournalTimeline entries={[ENTRY]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('entry-1')).toBeTruthy();
    expect(getByText('Café au lait, deux tartines.')).toBeTruthy();
    expect(queryByTestId('pending-breakfast')).toBeNull();
  });

  it('shows "En attente…" for slots without entries even when other slots have entries', () => {
    const { getByTestId } = render(
      <JournalTimeline entries={[ENTRY]} slots={SLOTS} primaryColor="#E85520" />
    );
    expect(getByTestId('pending-lunch')).toBeTruthy();
    expect(getByTestId('pending-snack')).toBeTruthy();
    expect(getByTestId('pending-dinner')).toBeTruthy();
  });
});
```

- [ ] **Étape 3.2 — Vérifier que les tests échouent**

```bash
npx jest __tests__/components/JournalTimeline.test.tsx
```

Attendu : FAIL — `Cannot find module '@/components/JournalTimeline'`.

- [ ] **Étape 3.3 — Implémenter JournalTimeline**

Créer `src/components/JournalTimeline.tsx` :

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Entry, MealSlot } from '@/types';
import { formatTime } from '@/utils/dateUtils';

interface JournalTimelineProps {
  entries: Entry[];
  slots: MealSlot[];
  primaryColor: string;
}

export function JournalTimeline({ entries, slots, primaryColor }: JournalTimelineProps) {
  return (
    <View style={styles.container} testID="journal-timeline">
      {slots.map((slot, idx) => {
        const slotEntries = entries.filter((e) => e.meal_type === slot.meal_type);
        const isLast = idx === slots.length - 1;
        return (
          <View key={slot.meal_type} style={styles.row} testID={`timeline-slot-${slot.meal_type}`}>
            <View style={styles.dotCol}>
              <View style={[styles.dot, { backgroundColor: primaryColor }]} />
              {!isLast && <View style={[styles.line, { backgroundColor: primaryColor + '40' }]} />}
            </View>
            <View style={styles.content}>
              <Text style={styles.slotLabel}>
                {slot.icon} {slot.label}
              </Text>
              {slotEntries.length > 0 ? (
                slotEntries.map((entry) => (
                  <View key={entry.id} style={styles.entryCard} testID={`entry-${entry.id}`}>
                    <Text style={styles.entryTime}>{formatTime(entry.recorded_at)}</Text>
                    <Text style={styles.entryText}>{entry.transcript}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.pendingCard} testID={`pending-${slot.meal_type}`}>
                  <Text style={styles.pendingText}>En attente…</Text>
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingVertical: 8 },
  row: { flexDirection: 'row', marginBottom: 16 },
  dotCol: { width: 20, alignItems: 'center' },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 4 },
  line: { flex: 1, width: 2, marginTop: 4 },
  content: { flex: 1, paddingLeft: 8 },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#5C3020',
    marginBottom: 4,
  },
  entryCard: {
    backgroundColor: '#FDEEE8',
    borderRadius: 8,
    padding: 8,
    marginBottom: 4,
  },
  entryTime: { fontSize: 10, fontWeight: '700', color: '#5C3020', marginBottom: 2 },
  entryText: { fontSize: 12, color: '#4A2F20', lineHeight: 16 },
  pendingCard: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#F0C0A0',
    borderRadius: 8,
    padding: 8,
  },
  pendingText: { fontSize: 11, color: '#C09070', fontStyle: 'italic' },
});
```

- [ ] **Étape 3.4 — Vérifier que les tests passent**

```bash
npx jest __tests__/components/JournalTimeline.test.tsx
```

Attendu : `4 passed`.

- [ ] **Étape 3.5 — Run all tests**

```bash
npx jest
```

Attendu : 104 + 4 = 108 tests passent.

- [ ] **Étape 3.6 — Commit**

```bash
git add src/components/JournalTimeline.tsx __tests__/components/JournalTimeline.test.tsx
git commit -m "feat: add JournalTimeline — timeline des créneaux repas avec entrées ou En attente"
```

---

## Task 4 : JournalSheet — Bottom sheet animée

**Files:**
- Create: `src/components/JournalSheet.tsx`
- Create: `__tests__/components/JournalSheet.test.tsx`

Dépend de : journalStore (Task 2), JournalTimeline (Task 3), formatDateLabel (Task 1), DEFAULT_MEAL_SLOTS (existant).

**Note sur les tests :** `Animated` et `PanResponder` de React Native sont mockés par `jest-expo`. Les tests vérifient le rendu conditionnel et les interactions, pas les animations.

- [ ] **Étape 4.1 — Écrire les tests (TDD)**

Créer `__tests__/components/JournalSheet.test.tsx` :

```tsx
jest.mock('@/store/journalStore', () => ({
  useJournalStore: jest.fn(),
}));

jest.mock('@/components/JournalTimeline', () => ({
  JournalTimeline: () => null,
}));

jest.mock('@/utils/dateUtils', () => ({
  formatDateLabel: jest.fn((dateStr: string) => dateStr === '2026-08-08' ? "Aujourd'hui" : dateStr),
}));

jest.mock('@/constants/meals', () => ({
  DEFAULT_MEAL_SLOTS: [
    { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6, end_hour: 10 },
  ],
}));

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useJournalStore } from '@/store/journalStore';
import { JournalSheet } from '@/components/JournalSheet';

const mockUseJournalStore = useJournalStore as jest.MockedFunction<typeof useJournalStore>;

const baseState = {
  isSheetOpen: true,
  entries: [],
  viewedDate: '2026-08-08',
  closeSheet: jest.fn(),
  goToPreviousDay: jest.fn().mockResolvedValue(undefined),
  goToNextDay: jest.fn().mockResolvedValue(undefined),
};

describe('JournalSheet', () => {
  const onAddEntry = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseJournalStore.mockReturnValue(baseState as any);
  });

  it('renders nothing when isSheetOpen is false', () => {
    mockUseJournalStore.mockReturnValue({ ...baseState, isSheetOpen: false } as any);
    const { queryByTestId } = render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(queryByTestId('journal-sheet')).toBeNull();
  });

  it('renders the sheet when isSheetOpen is true', () => {
    const { getByTestId } = render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(getByTestId('journal-sheet')).toBeTruthy();
  });

  it("shows the date label (Aujourd'hui)", () => {
    const { getByText } = render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    expect(getByText("Aujourd'hui")).toBeTruthy();
  });

  it('calls goToPreviousDay when ‹ is pressed', () => {
    const { getByTestId } = render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    fireEvent.press(getByTestId('prev-day-btn'));
    expect(baseState.goToPreviousDay).toHaveBeenCalled();
  });

  it('calls goToNextDay when › is pressed and not on today', () => {
    mockUseJournalStore.mockReturnValue({
      ...baseState,
      viewedDate: '2026-08-07',
    } as any);
    const { getByTestId } = render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    fireEvent.press(getByTestId('next-day-btn'));
    expect(baseState.goToNextDay).toHaveBeenCalled();
  });

  it('calls onAddEntry when the add button is pressed', () => {
    const { getByTestId } = render(
      <JournalSheet primaryColor="#E85520" onAddEntry={onAddEntry} />
    );
    fireEvent.press(getByTestId('add-entry-btn'));
    expect(onAddEntry).toHaveBeenCalled();
  });
});
```

- [ ] **Étape 4.2 — Vérifier que les tests échouent**

```bash
npx jest __tests__/components/JournalSheet.test.tsx
```

Attendu : FAIL — `Cannot find module '@/components/JournalSheet'`.

- [ ] **Étape 4.3 — Implémenter JournalSheet**

Créer `src/components/JournalSheet.tsx` :

```tsx
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useJournalStore } from '@/store/journalStore';
import { JournalTimeline } from '@/components/JournalTimeline';
import { formatDateLabel } from '@/utils/dateUtils';
import { DEFAULT_MEAL_SLOTS } from '@/constants/meals';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.75;
const CLOSE_THRESHOLD = 80;

interface JournalSheetProps {
  primaryColor: string;
  onAddEntry: () => void;
}

export function JournalSheet({ primaryColor, onAddEntry }: JournalSheetProps) {
  const {
    isSheetOpen,
    entries,
    viewedDate,
    closeSheet,
    goToPreviousDay,
    goToNextDay,
  } = useJournalStore();

  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;
  const today = new Date().toISOString().slice(0, 10);
  const canGoNext = viewedDate < today;

  useEffect(() => {
    if (isSheetOpen) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: SHEET_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [isSheetOpen]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => dy > 10,
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy }) => {
        if (dy > CLOSE_THRESHOLD) {
          closeSheet();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    })
  ).current;

  if (!isSheetOpen) return null;

  const dateLabel = formatDateLabel(viewedDate);

  return (
    <Animated.View
      testID="journal-sheet"
      style={[styles.sheet, { height: SHEET_HEIGHT, transform: [{ translateY }] }]}
    >
      <View {...panResponder.panHandlers} testID="sheet-handle-area">
        <View style={styles.handle} testID="sheet-handle" />
      </View>

      <View style={styles.dateNav}>
        <TouchableOpacity
          onPress={goToPreviousDay}
          testID="prev-day-btn"
          style={styles.navBtn}
        >
          <Text style={[styles.navArrow, { color: primaryColor }]}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.dateLabel}>{dateLabel}</Text>

        <TouchableOpacity
          onPress={goToNextDay}
          testID="next-day-btn"
          disabled={!canGoNext}
          style={styles.navBtn}
        >
          <Text style={[styles.navArrow, { color: canGoNext ? primaryColor : '#D0C0B0' }]}>›</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <JournalTimeline
          entries={entries}
          slots={DEFAULT_MEAL_SLOTS}
          primaryColor={primaryColor}
        />
      </ScrollView>

      <TouchableOpacity
        testID="add-entry-btn"
        onPress={onAddEntry}
        style={[styles.addBtn, { backgroundColor: primaryColor }]}
      >
        <Text style={styles.addBtnText}>🎙 Ajouter</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFF8F5',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#D0B8A8',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  dateNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E0D0',
  },
  navBtn: { padding: 8 },
  navArrow: { fontSize: 24, fontWeight: '600' },
  dateLabel: { fontSize: 14, fontWeight: '700', color: '#2D1A0E' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingVertical: 12 },
  addBtn: {
    margin: 16,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  addBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
});
```

- [ ] **Étape 4.4 — Vérifier que les tests passent**

```bash
npx jest __tests__/components/JournalSheet.test.tsx
```

Attendu : `6 passed`.

- [ ] **Étape 4.5 — Run all tests**

```bash
npx jest
```

Attendu : 108 + 6 = 114 tests passent.

- [ ] **Étape 4.6 — Commit**

```bash
git add src/components/JournalSheet.tsx __tests__/components/JournalSheet.test.tsx
git commit -m "feat: add JournalSheet — bottom sheet animée avec navigation par jour"
```

---

## Task 5 : HomeScreen mis à jour — intégration journal

**Files:**
- Modify: `app/index.tsx`
- Modify: `__tests__/screens/index.test.tsx`

Dépend de : JournalSheet (Task 4), journalStore (Task 2).

**Ce qui change dans HomeScreen :**
1. Import `useJournalStore` et `JournalSheet`
2. `useEffect` : quand `phase` passe de non-idle à 'idle' → `refreshCurrentDay()`
3. Bouton `testID="open-journal-btn"` pour ouvrir le journal (pressable + testable)
4. PanResponder sur le container pour détecter swipe ↑ (UX réelle)
5. `JournalSheet` rendu dans la SafeAreaView (se superpose)
6. `onAddEntry` prop de JournalSheet = `closeSheet` (ferme le journal, utilisatrice enregistre)

**Note :** La salutation utilise `settings.first_name` dynamiquement — ne jamais hardcoder "Eugénie".

- [ ] **Étape 5.1 — Ajouter les nouveaux tests à index.test.tsx**

Ouvrir `__tests__/screens/index.test.tsx` et ajouter les mocks et tests suivants SANS SUPPRIMER les tests existants.

Ajouter ce mock en haut (avec les autres mocks) :

```tsx
jest.mock('@/store/journalStore', () => ({
  useJournalStore: jest.fn(),
}));

jest.mock('@/components/JournalSheet', () => ({
  JournalSheet: () => null,
}));
```

Ajouter dans les `beforeEach` :

```tsx
const mockJournal = useJournalStore as jest.MockedFunction<typeof useJournalStore>;
// dans beforeEach:
mockJournal.mockReturnValue({
  isSheetOpen: false,
  openSheet: jest.fn().mockResolvedValue(undefined),
  closeSheet: jest.fn(),
  refreshCurrentDay: jest.fn().mockResolvedValue(undefined),
} as any);
```

Ajouter les nouveaux tests dans le bloc `describe('HomeScreen')` :

```tsx
it('renders the journal opener button', () => {
  const { getByTestId } = render(<HomeScreen />);
  expect(getByTestId('open-journal-btn')).toBeTruthy();
});

it('calls openSheet when journal opener is pressed', () => {
  const openSheet = jest.fn().mockResolvedValue(undefined);
  mockJournal.mockReturnValue({
    isSheetOpen: false,
    openSheet,
    closeSheet: jest.fn(),
    refreshCurrentDay: jest.fn().mockResolvedValue(undefined),
  } as any);

  const { getByTestId } = render(<HomeScreen />);
  fireEvent.press(getByTestId('open-journal-btn'));
  expect(openSheet).toHaveBeenCalled();
});

it('calls refreshCurrentDay when phase returns to idle', async () => {
  const refreshCurrentDay = jest.fn().mockResolvedValue(undefined);
  mockJournal.mockReturnValue({
    isSheetOpen: false,
    openSheet: jest.fn(),
    closeSheet: jest.fn(),
    refreshCurrentDay,
  } as any);

  mockRecording.mockReturnValue({
    ...baseRecordingState,
    phase: 'saving' as const,
  } as any);

  const { rerender } = render(<HomeScreen />);

  mockRecording.mockReturnValue({
    ...baseRecordingState,
    phase: 'idle' as const,
  } as any);

  await act(async () => {
    rerender(<HomeScreen />);
  });

  expect(refreshCurrentDay).toHaveBeenCalled();
});
```

- [ ] **Étape 5.2 — Vérifier que les nouveaux tests échouent**

```bash
npx jest __tests__/screens/index.test.tsx
```

Attendu : certains FAIL (les nouveaux tests pour le journal).

- [ ] **Étape 5.3 — Mettre à jour app/index.tsx**

Remplacer le contenu de `app/index.tsx` par :

```tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, PanResponder } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useRecordingStore } from '@/store/recordingStore';
import { useJournalStore } from '@/store/journalStore';
import { MicButton } from '@/components/MicButton';
import { WaveformView } from '@/components/WaveformView';
import { MealBadge } from '@/components/MealBadge';
import { JournalSheet } from '@/components/JournalSheet';

export default function HomeScreen() {
  const router = useRouter();
  const { settings, loadSettings } = useSettingsStore();
  const { primary, background } = useColorTheme();
  const {
    phase,
    partialTranscript,
    mealType,
    recordedAt,
    startRecording,
    stopRecording,
  } = useRecordingStore();
  const { openSheet, closeSheet, refreshCurrentDay } = useJournalStore();

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (phase === 'confirming') {
      router.push('/confirm');
    }
  }, [phase]);

  const prevPhaseRef = useRef(phase);
  useEffect(() => {
    if (prevPhaseRef.current !== 'idle' && phase === 'idle') {
      refreshCurrentDay();
    }
    prevPhaseRef.current = phase;
  }, [phase]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy }) => dy < -40,
      onPanResponderRelease: (_, { dy }) => {
        if (dy < -40) openSheet();
      },
    })
  ).current;

  if (!settings?.onboarding_done) {
    return <Redirect href="/onboarding" />;
  }

  const isRecording = phase === 'recording';
  const isProcessing = phase === 'processing';
  const hour = new Date().getHours();
  const greeting = hour < 18 ? 'Bonjour' : 'Bonsoir';

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: background }]}
      {...panResponder.panHandlers}
    >
      <Text style={styles.greeting}>
        {greeting} {settings.first_name} ☀️
      </Text>

      <MealBadge
        mealType={mealType}
        time={recordedAt ?? new Date()}
        onPress={() => router.push('/meal-picker')}
        primaryColor={primary}
      />

      {isRecording && (
        <View style={styles.liveArea}>
          <WaveformView isActive={isRecording} primaryColor={primary} />
          {partialTranscript ? (
            <Text style={styles.partialTranscript}>{partialTranscript}</Text>
          ) : null}
        </View>
      )}

      {isProcessing && (
        <Text style={styles.processingText}>Reformulation…</Text>
      )}

      <MicButton
        primaryColor={primary}
        isRecording={isRecording}
        onPressIn={startRecording}
        onPressOut={() => stopRecording(partialTranscript)}
      />

      <Text style={styles.hint}>
        {isRecording ? 'Relâche pour terminer' : 'Appuie et parle'}
      </Text>

      <TouchableOpacity
        testID="open-journal-btn"
        onPress={openSheet}
        style={styles.journalOpener}
      >
        <Text style={[styles.journalOpenerText, { color: primary }]}>↑ Journal</Text>
      </TouchableOpacity>

      <JournalSheet primaryColor={primary} onAddEntry={closeSheet} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D1A0E',
    alignSelf: 'flex-start',
  },
  liveArea: {
    alignItems: 'center',
    gap: 8,
    width: '100%',
  },
  partialTranscript: {
    fontSize: 14,
    color: '#2D1A0E',
    textAlign: 'center',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1.5,
    borderColor: '#F0D0B8',
    width: '100%',
  },
  processingText: {
    fontSize: 13,
    color: '#9070C0',
    fontStyle: 'italic',
  },
  hint: {
    fontSize: 12,
    color: '#C09070',
    fontStyle: 'italic',
  },
  journalOpener: {
    position: 'absolute',
    bottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  journalOpenerText: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.7,
  },
});
```

- [ ] **Étape 5.4 — Run tous les tests**

```bash
npx jest
```

Attendu : **tous passent** (~89 + 7 + 8 + 4 + 6 + 3 = ~117 tests).

Si des tests échouent, corriger les imports ou mocks avant de continuer.

- [ ] **Étape 5.5 — Commit final Plan 04**

```bash
git add app/index.tsx __tests__/screens/index.test.tsx
git commit -m "feat: integrate JournalSheet into HomeScreen — Plan 04 Home+Journal complet"
```

---

## Vérification finale

```bash
npx jest
```

Le journal est en place :

1. **HomeScreen** : bouton "↑ Journal" + swipe ↑ → ouvre JournalSheet
2. **JournalSheet** : bottom sheet animée, handle drag-to-close
3. **Navigation jours** : ‹ → jour précédent, › → jour suivant (bloqué sur aujourd'hui)
4. **JournalTimeline** : timeline des 4 créneaux repas avec entrées ou "En attente…"
5. **Refresh auto** : quand l'utilisatrice sauvegarde une entrée et revient à HomeScreen, le journal se rafraîchit
6. **"🎙 Ajouter"** : ferme le journal, l'utilisatrice peut enregistrer une nouvelle entrée

**Fallback garanti :** Si SQLite retourne une erreur, `isLoading` revient à `false` et `entries` reste vide — la timeline affiche "En attente…" pour tous les créneaux.
