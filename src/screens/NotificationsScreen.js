import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { notificationsAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, GRADIENTS } from '../utils/theme';
import { showMessage } from 'react-native-flash-message';

const NOTIF_ICONS = {
  sale: { icon: 'cart', color: COLORS.success },
  low_stock: { icon: 'warning', color: COLORS.warning },
  competitor_oos: { icon: 'trophy', color: COLORS.primary },
  price_change: { icon: 'trending-up', color: COLORS.info },
  return: { icon: 'return-down-back', color: COLORS.secondary },
  reorder: { icon: 'cube', color: COLORS.warning },
  buy_box_lost: { icon: 'ribbon', color: COLORS.danger },
  review: { icon: 'star', color: COLORS.accent },
  weekly_report: { icon: 'bar-chart', color: COLORS.primary },
};

export default function NotificationsScreen({ language = 'fr', navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const loadData = async () => {
    try {
      const res = await notificationsAPI.list(unreadOnly);
      setNotifications(res.data?.data || []);
    } catch(e) { console.log(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useFocusEffect(useCallback(() => { loadData(); }, [unreadOnly]));

  const markRead = async (id) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch(e) {}
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <View style={ns.center}><ActivityIndicator color={COLORS.primary} size="large" /></View>;

  return (
    <View style={ns.container}>
      <LinearGradient colors={GRADIENTS.primary} style={ns.header}>
        <View style={ns.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={20} color="#FFF" />
          </TouchableOpacity>
          <View style={{ flex: 1, marginLeft: SPACING.md }}>
            <Text style={ns.headerTitle}>🔔 {language === 'fr' ? 'Notifications' : 'Notifications'}</Text>
            {unreadCount > 0 && (
              <Text style={ns.headerSub}>{unreadCount} {language === 'fr' ? 'non lues' : 'unread'}</Text>
            )}
          </View>
        </View>
      </LinearGradient>

      {/* Filtre */}
      <View style={ns.filterRow}>
        <TouchableOpacity
          style={[ns.filterBtn, !unreadOnly && ns.filterActive]}
          onPress={() => setUnreadOnly(false)}
        >
          <Text style={[ns.filterText, !unreadOnly && ns.filterTextActive]}>
            {language === 'fr' ? 'Toutes' : 'All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[ns.filterBtn, unreadOnly && ns.filterActive]}
          onPress={() => setUnreadOnly(true)}
        >
          <Text style={[ns.filterText, unreadOnly && ns.filterTextActive]}>
            {language === 'fr' ? 'Non lues' : 'Unread'}
            {unreadCount > 0 && ` (${unreadCount})`}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(_, i) => i.toString()}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); loadData(); }}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={{ padding: SPACING.lg, gap: SPACING.sm }}
        renderItem={({ item }) => {
          const config = NOTIF_ICONS[item.type] || { icon: 'notifications', color: COLORS.primary };
          return (
            <TouchableOpacity
              style={[ns.card, !item.read && ns.cardUnread]}
              onPress={() => markRead(item.id)}
            >
              <View style={[ns.iconContainer, { backgroundColor: config.color + '20' }]}>
                <Ionicons name={config.icon} size={22} color={config.color} />
              </View>
              <View style={ns.cardContent}>
                <Text style={ns.notifTitle}>{item.title}</Text>
                <Text style={ns.notifMessage} numberOfLines={2}>{item.message}</Text>
                <Text style={ns.notifTime}>
                  {item.created_at ? new Date(item.created_at).toLocaleString() : ''}
                </Text>
              </View>
              {!item.read && <View style={ns.unreadDot} />}
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={ns.empty}>
            <Text style={ns.emptyIcon}>🔔</Text>
            <Text style={ns.emptyText}>
              {language === 'fr' ? 'Aucune notification' : 'No notifications'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const ns = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  header: { paddingTop: 55, paddingBottom: SPACING.lg, paddingHorizontal: SPACING.xl },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: { color: '#FFF', fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.sm, marginTop: 2 },
  filterRow: { flexDirection: 'row', padding: SPACING.md, gap: SPACING.sm, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  filterBtn: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
  filterActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  filterTextActive: { color: '#FFF' },
  card: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.md, flexDirection: 'row', alignItems: 'center', gap: SPACING.md },
  cardUnread: { borderWidth: 1, borderColor: COLORS.primary + '40', backgroundColor: COLORS.primary + '08' },
  iconContainer: { width: 44, height: 44, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center' },
  cardContent: { flex: 1 },
  notifTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600', marginBottom: 2 },
  notifMessage: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, lineHeight: 18 },
  notifTime: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 4 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },
  empty: { alignItems: 'center', padding: 60 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.lg },
});
