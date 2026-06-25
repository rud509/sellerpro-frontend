// ==================== ORDERS SCREEN ====================
import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { amazonAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { translations } from '../i18n/translations';

export default function OrdersScreen({ language = 'fr' }) {
  const t = translations[language];
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all');

  const loadOrders = async () => {
    try {
      const res = await amazonAPI.getOrders(30);
      setOrders(res.data?.data?.payload?.Orders || []);
    } catch (e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadOrders(); }, []));

  const statusColors = { Unshipped: COLORS.warning, Shipped: COLORS.info, Delivered: COLORS.success, Cancelled: COLORS.danger, Pending: COLORS.textMuted };

  const filtered = filter === 'all' ? orders : orders.filter(o => o.OrderStatus === filter);

  if (loading) return <View style={s.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <View style={s.container}>
      <LinearGradient colors={GRADIENTS.primary} style={s.header}>
        <Text style={s.headerTitle}>🛒 {t.orders}</Text>
        <Text style={s.headerSub}>{orders.length} {language === 'fr' ? 'commandes (30 jours)' : 'orders (30 days)'}</Text>
      </LinearGradient>

      <View style={s.filters}>
        {['all','Unshipped','Shipped','Cancelled'].map(f => (
          <TouchableOpacity key={f} style={[s.filterBtn, filter===f && s.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[s.filterText, filter===f && s.filterTextActive]}>{f === 'all' ? (language==='fr'?'Tous':'All') : f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(_, i) => i.toString()}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} tintColor={COLORS.primary} />}
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm }}
        renderItem={({ item }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={s.orderId}>{item.AmazonOrderId}</Text>
              <View style={[s.badge, { backgroundColor: (statusColors[item.OrderStatus]||COLORS.textMuted)+'25' }]}>
                <Text style={[s.badgeText, { color: statusColors[item.OrderStatus]||COLORS.textMuted }]}>{item.OrderStatus}</Text>
              </View>
            </View>
            <View style={s.cardFooter}>
              <Text style={s.date}>{item.PurchaseDate ? new Date(item.PurchaseDate).toLocaleDateString() : ''}</Text>
              <Text style={s.amount}>${parseFloat(item.OrderTotal?.Amount||0).toFixed(2)}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>{t.noData}</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, marginTop: 4 },
  filters: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  filterTextActive: { color: '#FFF', fontWeight: 'bold' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  orderId: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  badge: { paddingHorizontal: SPACING.sm, paddingVertical: 2, borderRadius: RADIUS.full },
  badgeText: { fontSize: FONTS.sizes.xs, fontWeight: '600' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  date: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  amount: { color: COLORS.success, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  empty: { color: COLORS.textMuted, textAlign: 'center', padding: 40 },
});
