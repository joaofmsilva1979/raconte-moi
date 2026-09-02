import { StyleSheet } from 'react-native';

export const settingsStyles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 4,
    shadowColor: '#2D1A0E',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  rowSub: { fontSize: 12, color: '#C09070', marginBottom: 6 },
  actionBtn: {
    borderWidth: 1.5, borderRadius: 10, padding: 12,
    alignItems: 'center' as const, marginBottom: 8,
  },
  actionBtnText: { fontSize: 14, fontWeight: '600' as const },
  listRow: {
    flexDirection: 'row' as const, alignItems: 'center' as const,
    paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: '#F0D0B8',
  },
  listRowLabel: { fontSize: 14, fontWeight: '600' as const, color: '#2D1A0E' },
  listRowSub: { fontSize: 11, color: '#C09070', marginTop: 1 },
  deleteIcon: { fontSize: 14, color: '#FCA5A5', paddingHorizontal: 6 },
  addRow: { flexDirection: 'row' as const, gap: 8, marginTop: 12, alignItems: 'center' as const },
  addInput: {
    borderWidth: 1.5, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8,
    fontSize: 13, color: '#2D1A0E', backgroundColor: 'white',
  },
  addBtnSmall: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center' as const, justifyContent: 'center' as const,
  },
  addBtnSmallText: { fontSize: 20, color: 'white', lineHeight: 24 },
});
