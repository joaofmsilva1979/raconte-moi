// Web stub — expo-print / expo-sharing / expo-file-system ne fonctionnent pas sur web
import { Alert } from 'react-native';
import type { Entry, Ressenti, Activity, SleepLog } from '@/types';

export function generateJournalHtml(): string { return ''; }

export async function exportJournalAsPdf(
  _entries: Entry[],
  _ressentis: Ressenti[],
  _activities: Activity[],
  _sleepLogs: SleepLog[],
  _from: string,
  _to: string,
): Promise<void> {
  Alert.alert('Non disponible', 'L\'export PDF nécessite l\'app iOS.');
}
