// InventoryScreen
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { amazonAPI, aiAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { translations } from '../i18n/translations';
import { showMessage } from 'react-native-flash-message';

export default function InventoryScreen({ language = 'fr' }) {
  const t = translations[language];
  const [inventory, setInventory] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [predicting, setPredicting] = useState(false);
  const [tab, setTab] = useState('all');

  const loadData = async () => {
    try {
      const [invRes, lowRes] = await Promise.allSettled([
        amazonAPI.getInventory(),
        amazonAPI.getLowStock(20),
      ]);
      if (invRes.status === 'fulfilled') {
        setInventory(invRes.value.data?.data?.payload?.inventorySummaries || []);
      }
      if (lowRes.status === 'fulfilled') {
        setLowStock(lowRes.value.data?.data || []);
      }
    } catch(e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const predictStock = async () => {
    setPredicting(true);
    try {
      const res = await aiAPI.predictStock();
      showMessage({ message: '✅ Prévisions générées !', description: language === 'fr' ? 'Consultez le chat IA pour les détails.' : 'Check AI chat for details.', type: 'success', duration: 3000 });
    } catch(e) {
      showMessage({ message: '❌ Erreur', type: 'danger' });
    }
    finally { setPredicting(false); }
  };

  const displayData = tab === 'low' ? lowStock : inventory;

  if (loading) return <View style={inv.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <View style={inv.container}>
      <LinearGradient colors={GRADIENTS.primary} style={inv.header}>
        <View style={inv.headerRow}>
          <View>
            <Text style={inv.headerTitle}>📦 {t.inventory}</Text>
            <Text style={inv.headerSub}>{inventory.length} SKUs · {lowStock.length} {language==='fr'?'en alerte':'alerts'}</Text>
          </View>
          <TouchableOpacity style={inv.predictBtn} onPress={predictStock} disabled={predicting}>
            {predicting ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={inv.predictBtnText}>🤖 {language==='fr'?'Prévoir':'Predict'}</Text>}
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <View style={inv.tabs}>
        <TouchableOpacity style={[inv.tab, tab==='all'&&inv.tabActive]} onPress={() => setTab('all')}>
          <Text style={[inv.tabText, tab==='all'&&inv.tabTextActive]}>{language==='fr'?'Tout':'All'} ({inventory.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[inv.tab, tab==='low'&&inv.tabActive]} onPress={() => setTab('low')}>
          <Text style={[inv.tabText, tab==='low'&&inv.tabTextActive]}>⚠️ {language==='fr'?'Stock Bas':'Low Stock'} ({lowStock.length})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={displayData}
        keyExtractor={(_, i) => i.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm }}
        renderItem={({ item }) => {
          const qty = item.inventoryDetails?.fulfillableQuantity ?? item.quantity ?? 0;
          const isCritical = item.alert_level === 'critical' || qty <= 5;
          const isWarning = qty <= 15 && !isCritical;
          const borderColor = isCritical ? COLORS.danger : isWarning ? COLORS.warning : COLORS.border;
          return (
            <View style={[inv.card, { borderLeftColor: borderColor, borderLeftWidth: 3 }]}>
              <View style={inv.cardTop}>
                <Text style={inv.productName} numberOfLines={2}>{item.productName || item.name || item.asin || 'Produit'}</Text>
                <View style={[inv.qtyBadge, { backgroundColor: borderColor + '25' }]}>
                  <Text style={[inv.qtyText, { color: borderColor }]}>{qty}</Text>
                  <Text style={inv.qtyUnit}>{t.units}</Text>
                </View>
              </View>
              <View style={inv.cardBottom}>
                <Text style={inv.asin}>ASIN: {item.asin || '-'}</Text>
                <Text style={inv.sku}>SKU: {item.sellerSku || item.sku || '-'}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={<Text style={inv.empty}>{t.noData}</Text>}
      />
    </View>
  );
}

const inv = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, marginTop: 4 },
  predictBtn: { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: RADIUS.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
  predictBtnText: { color: '#FFF', fontSize: FONTS.sizes.sm, fontWeight: '600' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  tabTextActive: { color: COLORS.primary, fontWeight: 'bold' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SPACING.sm },
  productName: { flex: 1, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600', marginRight: SPACING.md },
  qtyBadge: { borderRadius: RADIUS.sm, padding: SPACING.sm, alignItems: 'center', minWidth: 48 },
  qtyText: { fontSize: FONTS.sizes.xl, fontWeight: 'bold' },
  qtyUnit: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  cardBottom: { flexDirection: 'row', gap: SPACING.lg },
  asin: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  sku: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  empty: { color: COLORS.textMuted, textAlign: 'center', padding: 40 },
});
