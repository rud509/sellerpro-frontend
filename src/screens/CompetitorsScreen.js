// ==================== COMPETITORS SCREEN ====================
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { competitorsAPI, aiAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { showMessage } from 'react-native-flash-message';

export default function CompetitorsScreen({ language = 'fr', navigation }) {
  const [competitors, setCompetitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newAsin, setNewAsin] = useState('');
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);
  const [analyzing, setAnalyzing] = useState(null);

  const loadData = async () => {
    try {
      const res = await competitorsAPI.list();
      setCompetitors(res.data?.data || []);
    } catch(e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const addCompetitor = async () => {
    if (!newAsin.trim()) return;
    setAdding(true);
    try {
      await competitorsAPI.add({ asin: newAsin.trim().toUpperCase(), name: newName || newAsin });
      showMessage({ message: '✅ Concurrent ajouté !', type: 'success' });
      setShowModal(false); setNewAsin(''); setNewName('');
      loadData();
    } catch(e) {
      showMessage({ message: '❌ Erreur lors de l\'ajout', type: 'danger' });
    }
    finally { setAdding(false); }
  };

  const analyzeCompetitor = async (competitor) => {
    setAnalyzing(competitor.asin);
    try {
      const res = await aiAPI.analyzeCompetitor(competitor.asin, competitor.name);
      Alert.alert('🎯 Analyse IA', res.data?.data?.analysis?.slice(0, 500) + '...', [{ text: 'OK' }]);
    } catch(e) {
      showMessage({ message: '❌ Erreur analyse', type: 'danger' });
    }
    finally { setAnalyzing(null); }
  };

  if (loading) return <View style={comp.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <View style={comp.container}>
      <LinearGradient colors={GRADIENTS.primary} style={comp.header}>
        <View style={comp.headerRow}>
          <View>
            <TouchableOpacity onPress={() => navigation.goBack()} style={comp.backBtn}>
              <Ionicons name="arrow-back" size={20} color="#FFF" />
            </TouchableOpacity>
            <Text style={comp.headerTitle}>👁️ {language==='fr'?'Concurrents':'Competitors'}</Text>
            <Text style={comp.headerSub}>{competitors.length} {language==='fr'?'surveillés':'tracked'}</Text>
          </View>
          <TouchableOpacity style={comp.addBtn} onPress={() => setShowModal(true)}>
            <Ionicons name="add" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <FlatList
        data={competitors}
        keyExtractor={(_, i) => i.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.md }}
        renderItem={({ item }) => (
          <View style={comp.card}>
            <View style={comp.cardTop}>
              <View style={{ flex: 1 }}>
                <Text style={comp.compName}>{item.name}</Text>
                <Text style={comp.compAsin}>ASIN: {item.asin}</Text>
              </View>
              <View style={comp.priceContainer}>
                {item.buy_box_price && <Text style={comp.price}>${item.buy_box_price}</Text>}
                <Text style={comp.priceLabel}>Buy Box</Text>
              </View>
            </View>
            <View style={comp.cardActions}>
              <TouchableOpacity style={comp.actionBtn} onPress={() => analyzeCompetitor(item)} disabled={analyzing === item.asin}>
                {analyzing === item.asin
                  ? <ActivityIndicator size="small" color={COLORS.primary} />
                  : <Text style={comp.actionBtnText}>🤖 {language==='fr'?'Analyser':'Analyze'}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={comp.emptyContainer}>
            <Text style={comp.emptyIcon}>👁️</Text>
            <Text style={comp.emptyText}>{language==='fr'?'Aucun concurrent surveillé.\nAjoutez un ASIN pour commencer !':'No competitors tracked.\nAdd an ASIN to get started!'}</Text>
          </View>
        }
      />

      {/* Modal Ajout */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={comp.modalBg}>
          <View style={comp.modal}>
            <Text style={comp.modalTitle}>➕ {language==='fr'?'Ajouter un concurrent':'Add Competitor'}</Text>
            <TextInput style={comp.modalInput} value={newAsin} onChangeText={setNewAsin}
              placeholder="ASIN (ex: B08XYZ123)" placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters" />
            <TextInput style={comp.modalInput} value={newName} onChangeText={setNewName}
              placeholder={language==='fr'?'Nom (optionnel)':'Name (optional)'} placeholderTextColor={COLORS.textMuted} />
            <View style={comp.modalBtns}>
              <TouchableOpacity style={comp.cancelBtn} onPress={() => setShowModal(false)}>
                <Text style={comp.cancelText}>{language==='fr'?'Annuler':'Cancel'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={comp.confirmBtn} onPress={addCompetitor} disabled={adding}>
                {adding ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={comp.confirmText}>{language==='fr'?'Ajouter':'Add'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={{ height: 80 }} />
    </View>
  );
}

const comp = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  backBtn: { marginBottom: SPACING.sm },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, marginTop: 4 },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.2)', padding: SPACING.md, borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.md },
  compName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  compAsin: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 4 },
  priceContainer: { alignItems: 'flex-end' },
  price: { color: COLORS.success, fontSize: FONTS.sizes.xl, fontWeight: 'bold' },
  priceLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  cardActions: { flexDirection: 'row', gap: SPACING.sm },
  actionBtn: { flex: 1, backgroundColor: COLORS.primary + '20', padding: SPACING.sm, borderRadius: RADIUS.md, alignItems: 'center', borderWidth: 1, borderColor: COLORS.primary + '40' },
  actionBtnText: { color: COLORS.primary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  emptyContainer: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', fontSize: FONTS.sizes.md },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, gap: SPACING.md },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: 'bold' },
  modalInput: { backgroundColor: COLORS.background, borderRadius: RADIUS.md, padding: SPACING.md, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, borderWidth: 1, borderColor: COLORS.border },
  modalBtns: { flexDirection: 'row', gap: SPACING.md },
  cancelBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  confirmBtn: { flex: 1, padding: SPACING.md, borderRadius: RADIUS.md, alignItems: 'center', backgroundColor: COLORS.primary },
  confirmText: { color: '#FFF', fontSize: FONTS.sizes.md, fontWeight: 'bold' },
});
