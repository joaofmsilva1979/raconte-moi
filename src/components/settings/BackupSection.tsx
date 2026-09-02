import { View, Text, Switch, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useSettingsStore } from '@/store/settingsStore';
import { useColorTheme } from '@/hooks/useColorTheme';
import { backupToIcloud, exportBackup, restoreFromIcloud } from '@/services/icloudService';
import { settingsStyles } from './settingsStyles';

export function BackupSection() {
  const { settings, saveIcloudBackup, saveBackupInterval, saveLastBackupAt } = useSettingsStore();
  const { primary } = useColorTheme();

  return (
    <View style={settingsStyles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.rowLabel}>Backup automatique</Text>
          <Text style={settingsStyles.rowSub}>
            Sauvegarde locale, incluse dans la sauvegarde iCloud de l'iPhone
          </Text>
        </View>
        <Switch
          testID="toggle-icloud-backup"
          value={settings?.icloud_backup ?? false}
          onValueChange={saveIcloudBackup}
          trackColor={{ true: primary }}
        />
      </View>

      {settings?.icloud_backup && (
        <>
          <Text style={[settingsStyles.rowSub, { marginTop: 8 }]}>Fréquence automatique</Text>
          <View style={styles.intervalRow}>
            {[1, 3, 7, 30].map(d => (
              <TouchableOpacity
                key={d}
                testID={`interval-${d}`}
                style={[
                  styles.intervalBtn,
                  settings.backup_interval === d && { backgroundColor: primary, borderColor: primary },
                ]}
                onPress={() => saveBackupInterval(d)}
              >
                <Text style={[
                  styles.intervalText,
                  settings.backup_interval === d && { color: 'white' },
                ]}>
                  {d === 30 ? '1 mois' : `${d}j`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={settingsStyles.rowSub}>
            Dernier backup : {settings.last_backup_at
              ? new Date(settings.last_backup_at).toLocaleString('fr-FR')
              : 'Jamais'}
          </Text>

          <TouchableOpacity
            testID="backup-now-btn"
            style={[settingsStyles.actionBtn, { borderColor: primary }]}
            onPress={async () => {
              try {
                const date = await backupToIcloud();
                await saveLastBackupAt(date);
                Alert.alert('Backup effectué ✓', 'Sauvegarde créée sur cet iPhone.');
              } catch {
                Alert.alert('Erreur', 'Sauvegarde échouée. Réessaie plus tard.');
              }
            }}
          >
            <Text style={[settingsStyles.actionBtnText, { color: primary }]}>Sauvegarder maintenant</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity
        testID="export-backup-btn"
        style={[settingsStyles.actionBtn, { borderColor: '#0EA5E9', marginTop: settings?.icloud_backup ? 0 : 8 }]}
        onPress={async () => {
          try {
            await exportBackup();
          } catch {
            Alert.alert('Erreur', 'Export impossible. Réessaie plus tard.');
          }
        }}
      >
        <Text style={[settingsStyles.actionBtnText, { color: '#0EA5E9' }]}>Exporter la sauvegarde…</Text>
      </TouchableOpacity>

      <TouchableOpacity
        testID="restore-btn"
        style={[settingsStyles.actionBtn, { borderColor: '#C09070' }]}
        onPress={() => {
          Alert.alert(
            'Restaurer depuis un fichier',
            "Toutes les données actuelles seront remplacées. Tu devras redémarrer l'app ensuite.",
            [
              { text: 'Annuler', style: 'cancel' },
              {
                text: 'Choisir un fichier',
                onPress: async () => {
                  try {
                    await restoreFromIcloud();
                    Alert.alert('Restauré ✓', "Ferme et rouvre l'app pour voir tes données.");
                  } catch {
                    Alert.alert('Erreur', 'Restauration impossible. Réessaie plus tard.');
                  }
                },
              },
            ]
          );
        }}
      >
        <Text style={[settingsStyles.actionBtnText, { color: '#C09070' }]}>Restaurer depuis un fichier…</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  rowLabel: { fontSize: 15, color: '#2D1A0E', fontWeight: '500' },
  intervalRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  intervalBtn: {
    borderWidth: 1.5, borderColor: '#F0D0B8', borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  intervalText: { fontSize: 13, fontWeight: '600', color: '#5C3020' },
});
