import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useColorTheme } from '@/hooks/useColorTheme';
import { useComfortAidStore } from '@/store/comfortAidStore';
import { settingsStyles } from './settingsStyles';

export function ComfortAidsSection() {
  const { primary } = useColorTheme();
  const { aids, loadAids, addNewAid, removeAid } = useComfortAidStore();
  const [newAidName, setNewAidName] = useState('');

  useEffect(() => { loadAids(); }, []);

  return (
    <View style={settingsStyles.card}>
      <Text style={settingsStyles.rowSub}>Bouillotte, position antalgique, massage…</Text>
      {aids.map(aid => (
        <View key={aid.id} style={settingsStyles.listRow}>
          <Text style={[settingsStyles.listRowLabel, { flex: 1 }]}>{aid.name}</Text>
          <TouchableOpacity
            onPress={() => Alert.alert('Supprimer ?', `Supprimer ${aid.name} ?`, [
              { text: 'Annuler', style: 'cancel' },
              { text: 'Supprimer', style: 'destructive', onPress: () => removeAid(aid.id) },
            ])}
          >
            <Text style={settingsStyles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
      <View style={settingsStyles.addRow}>
        <TextInput
          style={[settingsStyles.addInput, { flex: 1, borderColor: primary }]}
          placeholder="Nom de l'accessoire"
          placeholderTextColor="#C09070"
          value={newAidName}
          onChangeText={setNewAidName}
        />
        <TouchableOpacity
          style={[settingsStyles.addBtnSmall, { backgroundColor: '#0EA5E9' }]}
          onPress={async () => {
            const name = newAidName.trim();
            if (!name) return;
            await addNewAid(name);
            setNewAidName('');
          }}
        >
          <Text style={settingsStyles.addBtnSmallText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
