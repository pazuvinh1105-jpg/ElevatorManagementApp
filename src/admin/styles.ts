import {StyleSheet} from 'react-native';

export default StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#F3F7FC'},
  content: {padding: 20, paddingBottom: 36},
  title: {fontSize: 28, fontWeight: '700', color: '#123B78', marginBottom: 5},
  subtitle: {fontSize: 15, color: '#607A9B', marginBottom: 22},
  section: {fontSize: 18, fontWeight: '700', color: '#123B78', marginBottom: 10, marginTop: 10},
  card: {backgroundColor: '#FFFFFF', borderRadius: 16, padding: 17, marginBottom: 11, borderWidth: 1, borderColor: '#DBE6F3'},
  cardTitle: {fontSize: 17, fontWeight: '600', color: '#123B78'},
  cardDetail: {fontSize: 14, color: '#607A9B', marginTop: 5},
  label: {fontSize: 14, fontWeight: '600', color: '#123B78', marginBottom: 6},
  input: {backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#B9CBE1', borderRadius: 10, paddingHorizontal: 12, minHeight: 46, color: '#162D4B', marginBottom: 16},
  button: {backgroundColor: '#135FC4', padding: 15, borderRadius: 12, alignItems: 'center', marginBottom: 12},
  buttonText: {fontSize: 16, fontWeight: '700', color: '#FFFFFF'},
  secondaryButton: {backgroundColor: '#E5F2FF', padding: 12, borderRadius: 10, alignItems: 'center', marginTop: 8},
  secondaryText: {color: '#135FC4', fontSize: 15, fontWeight: '600'},
  error: {color: '#B42318', marginBottom: 12},
});
