jest.mock('expo-sqlite', () => ({
  openDatabaseAsync: jest.fn(() => Promise.resolve({
    execAsync: jest.fn(),
    runAsync: jest.fn(() => Promise.resolve({ lastInsertRowId: 1, changes: 1 })),
    getAllAsync: jest.fn(() => Promise.resolve([])),
    getFirstAsync: jest.fn(() => Promise.resolve(null)),
  })),
}));

jest.mock('expo-notifications', () => ({
  requestPermissionsAsync: jest.fn(),
  scheduleNotificationAsync: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(),
  addNotificationReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getExpoPushTokenAsync: jest.fn(),
  setNotificationHandler: jest.fn(),
}));

jest.mock('expo-audio', () => ({
  requestRecordingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: 'granted' })
  ),
  getRecordingPermissionsAsync: jest.fn(() =>
    Promise.resolve({ granted: true, status: 'granted' })
  ),
  setAudioModeAsync: jest.fn(() => Promise.resolve()),
  useAudioRecorder: jest.fn(() => ({
    prepareToRecordAsync: jest.fn(() => Promise.resolve()),
    record: jest.fn(),
    stop: jest.fn(() => Promise.resolve()),
    uri: null,
    id: 0,
  })),
  useAudioRecorderState: jest.fn(() => ({
    isRecording: false,
    currentTime: 0,
  })),
  RecordingPresets: {
    HIGH_QUALITY: {},
  },
}));

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    push: jest.fn(),
  },
}));
