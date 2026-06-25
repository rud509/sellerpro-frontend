import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, ActivityIndicator, Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { amazonAPI, aiAPI } from '../services/api';
import { COLORS, FONTS, SPACING, RADIUS, SHADOWS, GRADIENTS } from '../utils/theme';
import { translations } from '../i18n/translations';

const { width } = Dimensions.get('window');

export default function DashboardScreen({ navigation, language = 'fr' }) {
  const t = translations[language];
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [salesData, setSalesData] = useState(null);
  const [lowStock, setLowStock] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [error, setError] = useState(null);

  const loadData = async () => {
    try {
      setError(null);
      const [salesRes, stockRes, ordersRes] = await Promise.allSettled([
        amazonAPI.getFinances(30),
        amazonAPI.getLowStock(15),
        amazonAPI.getOrders(7),
      ]);

      if (salesRes.status === 'fulfilled') setSalesData(salesRes.value.data?.data);
      if (stockRes.status === 'fulfilled') setLowStock(stockRes.value.data?.data || []);
      if (ordersRes.status === 'fulfilled') {
        const orders = ordersRes.value.data?.data?.payload?.Orders || [];
        setRecentOrders(orders.slice(0, 5));
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadData(); }, []));

  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>{t.loading}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.welcomeText}>{t.welcome}</Text>
            <Text style={styles.appName}>SellerPro</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('Notifications')} style={styles.notifBtn}>
            <Ionicons name="notifications" size={24} color={COLORS.textPrimary} />
            {lowStock.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{lowStock.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Stats rapides */}
        <View style={styles.quickStats}>
          <QuickStat
            label={t.monthSales}
            value={`$${(salesData?.total_sales || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon="trending-up"
            color={COLORS.success}
          />
          <QuickStat
            label={t.netProfit}
            value={`$${(salesData?.net_revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            icon="cash"
            color={COLORS.accent}
          />
        </View>
      </LinearGradient>

      {/* Cartes KPIs */}
      <View style={styles.kpiGrid}>
        <KPICard
          title={t.activeOrders}
          value={recentOrders.length.toString()}
          icon="cart"
          color={COLORS.primary}
          onPress={() => navigation.navigate('Orders')}
        />
        <KPICard
          title={t.lowStock}
          value={lowStock.length.toString()}
          icon="warning"
          color={lowStock.length > 0 ? COLORS.danger : COLORS.success}
          onPress={() => navigation.navigate('Inventory')}
        />
        <KPICard
          title={t.totalFees}
          value={`$${(salesData?.total_fees || 0).toFixed(0)}`}
          icon="receipt"
          color={COLORS.warning}
          onPress={() => navigation.navigate('Analytics')}
        />
        <KPICard
          title={t.refunds}
          value={`$${(salesData?.total_refunds || 0).toFixed(0)}`}
          icon="return-down-back"
          color={COLORS.secondary}
          onPress={() => navigation.navigate('Orders')}
        />
      </View>

      {/* Alertes stock bas */}
      {lowStock.length > 0 && (
        <View style={styles.section}>
          <SectionHeader title={`⚠️ ${t.lowStock}`} onPress={() => navigation.navigate('Inventory')} t={t} />
          {lowStock.slice(0, 3).map((item, idx) => (
            <StockAlertCard key={idx} item={item} t={t} />
          ))}
        </View>
      )}

      {/* Commandes récentes */}
      <View style={styles.section}>
        <SectionHeader title={`🛒 ${t.orders}`} onPress={() => navigation.navigate('Orders')} t={t} />
        {recentOrders.length === 0 ? (
          <Text style={styles.noData}>{t.noData}</Text>
        ) : (
          recentOrders.map((order, idx) => (
            <OrderCard key={idx} order={order} t={t} />
          ))
        )}
      </View>

      {/* Raccourcis rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🚀 Actions Rapides</Text>
        <View style={styles.quickActions}>
          <QuickAction icon="chatbubble-ellipses" label="IA Chat" color={COLORS.primary}
            onPress={() => navigation.navigate('Chat')} />
          <QuickAction icon="analytics" label="Analytics" color={COLORS.success}
            onPress={() => navigation.navigate('Analytics')} />
          <QuickAction icon="eye" label={language === 'fr' ? 'Concurrents' : 'Competitors'}
            color={COLORS.warning} onPress={() => navigation.navigate('Competitors')} />
          <QuickAction icon="business" label="Alibaba" color={COLORS.secondary}
            onPress={() => navigation.navigate('Alibaba')} />
        </View>
      </View>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}

// ==================== COMPOSANTS ====================

function QuickStat({ label, value, icon, color }) {
  return (
    <View style={styles.quickStat}>
      <Ionicons name={icon} size={18} color={color} />
      <View style={styles.quickStatText}>
        <Text style={styles.quickStatValue}>{value}</Text>
        <Text style={styles.quickStatLabel}>{label}</Text>
      </View>
    </View>
  );
}

function KPICard({ title, value, icon, color, onPress }) {
  return (
    <TouchableOpacity style={styles.kpiCard} onPress={onPress}>
      <View style={[styles.kpiIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiTitle}>{title}</Text>
    </TouchableOpacity>
  );
}

function StockAlertCard({ item, t }) {
  const isCritical = item.alert_level === 'critical';
  return (
    <View style={[styles.alertCard, { borderLeftColor: isCritical ? COLORS.danger : COLORS.warning }]}>
      <View style={styles.alertContent}>
        <Text style={styles.alertName} numberOfLines={1}>{item.name || item.asin}</Text>
        <Text style={styles.alertSku}>ASIN: {item.asin}</Text>
      </View>
      <View style={[styles.alertBadge, { backgroundColor: isCritical ? COLORS.danger : COLORS.warning }]}>
        <Text style={styles.alertQty}>{item.quantity}</Text>
        <Text style={styles.alertUnit}>{t.units}</Text>
      </View>
    </View>
  );
}

function OrderCard({ order, t }) {
  const statusColors = {
    Unshipped: COLORS.warning,
    Shipped: COLORS.info,
    Delivered: COLORS.success,
    Cancelled: COLORS.danger,
  };
  const status = order.OrderStatus || 'Unknown';
  return (
    <View style={styles.orderCard}>
      <View>
        <Text style={styles.orderId}>{order.AmazonOrderId}</Text>
        <Text style={styles.orderDate}>
          {order.PurchaseDate ? new Date(order.PurchaseDate).toLocaleDateString() : ''}
        </Text>
      </View>
      <View style={styles.orderRight}>
        <Text style={styles.orderAmount}>
          ${parseFloat(order.OrderTotal?.Amount || 0).toFixed(2)}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: (statusColors[status] || COLORS.textMuted) + '30' }]}>
          <Text style={[styles.statusText, { color: statusColors[status] || COLORS.textMuted }]}>
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

function SectionHeader({ title, onPress, t }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.viewAll}>{t.viewAll} →</Text>
      </TouchableOpacity>
    </View>
  );
}

function QuickAction({ icon, label, color, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={[styles.quickActionIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  loadingText: { color: COLORS.textSecondary, marginTop: SPACING.md, fontSize: FONTS.sizes.md },

  header: { padding: SPACING.xl, paddingTop: 55, paddingBottom: SPACING.xl, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  welcomeText: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.md },
  appName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxxl, fontWeight: FONTS.weights.extrabold },
  notifBtn: { padding: SPACING.sm, position: 'relative' },
  badge: { position: 'absolute', top: 0, right: 0, backgroundColor: COLORS.danger, borderRadius: 10, width: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },

  quickStats: { flexDirection: 'row', gap: SPACING.xl },
  quickStat: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  quickStatText: {},
  quickStatValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  quickStatLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONTS.sizes.xs },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: SPACING.lg, gap: SPACING.md },
  kpiCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.lg, padding: SPACING.lg, width: (width - SPACING.lg * 2 - SPACING.md) / 2, alignItems: 'center', ...SHADOWS.sm },
  kpiIcon: { width: 44, height: 44, borderRadius: RADIUS.full, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.sm },
  kpiValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold },
  kpiTitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, marginTop: 2, textAlign: 'center' },

  section: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  viewAll: { color: COLORS.primary, fontSize: FONTS.sizes.sm },
  noData: { color: COLORS.textMuted, textAlign: 'center', padding: SPACING.lg },

  alertCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderLeftWidth: 3 },
  alertContent: { flex: 1, marginRight: SPACING.sm },
  alertName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },
  alertSku: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  alertBadge: { borderRadius: RADIUS.md, padding: SPACING.sm, alignItems: 'center', minWidth: 50 },
  alertQty: { color: '#FFF', fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold },
  alertUnit: { color: 'rgba(255,255,255,0.8)', fontSize: FONTS.sizes.xs },

  orderCard: { backgroundColor: COLORS.surface, borderRadius: RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  orderId: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  orderDate: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  orderRight: { alignItems: 'flex-end' },
  orderAmount: { color: COLORS.success, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  statusBadge: { borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2, marginTop: 4 },
  statusText: { fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.semibold },

  quickActions: { flexDirection: 'row', justifyContent: 'space-between' },
  quickAction: { alignItems: 'center', flex: 1 },
  quickActionIcon: { width: 52, height: 52, borderRadius: RADIUS.lg, justifyContent: 'center', alignItems: 'center', marginBottom: SPACING.xs },
  quickActionLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xs, textAlign: 'center' },
});
