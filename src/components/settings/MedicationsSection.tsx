import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useMedicationStore } from '@/store/medicationStore';
import { settingsStyles } from './settingsStyles';

export function MedicationsSection() {
  const { primary } = useColorTheme();
  const { medications, loadMedications, addNewMedication, removeMedication } = useMedicationStore();
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');

  useEffect(() => { loadMedications(); }, []);

  return (
    <View style={settingsStyles.card}>
      <Text style={settingsStyles.rowSub}>Gérer la liste · les dosages sont optionnels</Text>
      {medications.map(med => (
        <View key={med.id} style={settingsStyles.listRow}>
          <View style={{ flex: 1 }}>
            <Text style={settingsStyles.listRowLabel}>{med.name}</Text>
            {med.dosage ? <Text style={settingsStyles.listRowSub}>{med.dosage}</Text> : null}
          </View>
          <TouchableOpacity
            onPress={() => Alert.alert('Supprimer ?', `Supprimer ${med.name} ?`, [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => removeMedication(med.id) },
            ])}
          >
            <Text style={settingsStyles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={settingsStyles.addRow}>
        <TextInput
          style={[settingsStyles.addInput, { flex: 2, borderColor: primary }]}
          placeholder="Nom du médicament"
          placeholderTextColor="#C09070"
          value={newMedName}
          onChangeText={setNewMedName}
        />
        <TextInput
          style={[settingsStyles.addInput, { flex: 1, borderColor: primary }]}
          placeholder="Dosage"
          placeholderTextColor="#C09070"
          value={newMedDosage}
          onChangeText={setNewMedDosage}
        />
        <TouchableOpacity
          style={[settingsStyles.addBtnSmall, { backgroundColor: primary }]}
          onPress={async () => {
            const name = newMedName.trim();
            if (!name) return;
            await addNewMedication(name, newMedDosage.trim() || undefined);
            setNewMedName(''); setNewMedDosage('');
          }}
        >
          <Text style={settingsStyles.addBtnSmallText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
