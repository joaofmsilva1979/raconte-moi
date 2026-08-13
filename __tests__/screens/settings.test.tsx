jest.mock('@/store/settingsStore', () => ({ useSettingsStore: jest.fn() }));
jest.mock('@/hooks/useColorTheme', () => ({ useColorTheme: jest.fn() }));
jest.mock('@/constants/colors', () => ({
  COLOR_PALETTES: [
    { name: 'Corail', primary: '#E85520', accent: '#F5855A', background: '#FDEEE8' },
    { name: 'Miel',   primary: '#C8943A', accent: '#DEB96A', background: '#FDF5E0' },
  ],
}));
jest.mock('@/services/notificationService', () => ({
  scheduleReminders: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/services/icloudService', () => ({
  backupToIcloud: jest.fn().mockResolvedValue('2026-08-08T00:00:00.000Z'),
  restoreFromIcloud: jest.fn().mockResolvedValue(undefined),
  isBackupDue: jest.fn().mockReturnValue(false),
}));
jest.mock('@/services/pdfService', () => ({
  exportJournalAsPdf: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/db/entriesRepository', () => ({
  getEntriesForDay: jest.fn().mockResolvedValue([]),
}));
jest.mock('expo-router', () => ({
  Stack: { Screen: () => null },
  useRouter: () => ({ back: jest.fn() }),
}));

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import SettingsScreen from '@/app/settings';

const mockUseSettingsStore = useSettingsStore as jest.MockedFunction<typeof useSettingsStore>;
const mockUseColorTheme = useColorTheme as jest.MockedFunction<typeof useColorTheme>;

const baseSettings = {
  first_name: 'Eugénie',
  primary_color: '#E85520',
  notifications_enabled: true,
  notifications_breakfast: true,
  notifications_lunch: true,
  notifications_snack: true,
  notifications_dinner: true,
  icloud_backup: false,
  backup_interval: 7,
  last_backup_at: null,
};

const baseMealSlots = [
  { meal_type: 'breakfast', label: 'Petit-déjeuner', icon: '☀️', start_hour: 6, end_hour: 10 },
  { meal_type: 'lunch',     label: 'Déjeuner',       icon: '🌞', start_hour: 11, end_hour: 14 },
];

const baseStoreMock = {
  settings: baseSettings,
  mealSlots: baseMealSlots,
  saveFirstName: jest.fn().mockResolvedValue(undefined),
  savePrimaryColor: jest.fn().mockResolvedValue(undefined),
  saveMealSlot: jest.fn().mockResolvedValue(undefined),
  saveNotificationSetting: jest.fn().mockResolvedValue(undefined),
  saveIcloudBackup: jest.fn().mockResolvedValue(undefined),
  saveBackupInterval: jest.fn().mockResolvedValue(undefined),
  saveLastBackupAt: jest.fn().mockResolvedValue(undefined),
};

describe('SettingsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettingsStore.mockReturnValue(baseStoreMock as any);
    mockUseColorTheme.mockReturnValue({ primary: '#E85520', accent: '#F5855A', background: '#FDEEE8', name: 'Corail' } as any);
  });

  it('1. rend le ScrollView settings-scroll', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('settings-scroll')).toBeTruthy();
  });

  it('2. firstname-input a la valeur Eugénie', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('firstname-input').props.value).toBe('Eugénie');
  });

  it('3. color-swatch-#E85520 et color-swatch-#C8943A sont présents', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('color-swatch-#E85520')).toBeTruthy();
    expect(getByTestId('color-swatch-#C8943A')).toBeTruthy();
  });

  it('4. press swatch #C8943A → savePrimaryColor appelé', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    await act(async () => {
      fireEvent.press(getByTestId('color-swatch-#C8943A'));
    });
    expect(baseStoreMock.savePrimaryColor).toHaveBeenCalledWith('#C8943A');
  });

  it('5. slot-start-breakfast présent avec valeur 6', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    const input = getByTestId('slot-start-breakfast');
    expect(input).toBeTruthy();
    expect(input.props.value).toBe('6');
  });

  it('6. toggle-notifications-enabled présent', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('toggle-notifications-enabled')).toBeTruthy();
  });

  it('7. press toggle-notifications-enabled avec false → saveNotificationSetting appelé', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    await act(async () => {
      fireEvent(getByTestId('toggle-notifications-enabled'), 'valueChange', false);
    });
    expect(baseStoreMock.saveNotificationSetting).toHaveBeenCalledWith('notifications_enabled', false);
  });

  it('8. quand notifications_enabled false, toggle-notifications-breakfast absent', async () => {
    mockUseSettingsStore.mockReturnValue({
      ...baseStoreMock,
      settings: { ...baseSettings, notifications_enabled: false },
    } as any);
    const { queryByTestId } = await render(<SettingsScreen />);
    expect(queryByTestId('toggle-notifications-breakfast')).toBeNull();
  });

  it('9. quand notifications_enabled true, toggle-notifications-breakfast présent', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('toggle-notifications-breakfast')).toBeTruthy();
  });

  it('10. privacy-badge présent', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('privacy-badge')).toBeTruthy();
  });

  it('11. toggle-icloud-backup est présent', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('toggle-icloud-backup')).toBeTruthy();
  });

  it('12. quand icloud_backup false, backup-now-btn est absent', async () => {
    const { queryByTestId } = await render(<SettingsScreen />);
    expect(queryByTestId('backup-now-btn')).toBeNull();
  });

  it('13. quand icloud_backup true, backup-now-btn est présent', async () => {
    mockUseSettingsStore.mockReturnValue({
      ...baseStoreMock,
      settings: { ...baseSettings, icloud_backup: true },
    } as any);
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('backup-now-btn')).toBeTruthy();
  });

  it('14. export-range-btn est présent', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('export-range-btn')).toBeTruthy();
  });

  it('15. export-from-input est présent', async () => {
    const { getByTestId } = await render(<SettingsScreen />);
    expect(getByTestId('export-from-input')).toBeTruthy();
  });
});
