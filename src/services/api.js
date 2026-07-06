// Configuration de l'API Backend
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 🔧 CHANGE CETTE URL APRÈS DÉPLOIEMENT SUR RENDER
const BASE_URL = 'https://sellerpro-backend.onrender.com';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

// ==================== AMAZON ====================
export const amazonAPI = {
  getOrders: (days = 7) => api.get(`/api/amazon/orders?days=${days}`),
  getOrder: (id) => api.get(`/api/amazon/orders/${id}`),
  getInventory: () => api.get('/api/amazon/inventory'),
  getLowStock: (threshold = 15) => api.get(`/api/amazon/inventory/low-stock?threshold=${threshold}`),
  getProduct: (asin) => api.get(`/api/amazon/products/${asin}`),
  getBuyBox: (asin) => api.get(`/api/amazon/pricing/${asin}/buybox`),
  getFinances: (days = 30) => api.get(`/api/amazon/finances/summary?days=${days}`),
  getFinancialEvents: (days = 30) => api.get(`/api/amazon/finances/events?days=${days}`),
};

// ==================== IA CLAUDE ====================
export const aiAPI = {
  chat: (messages, sessionId, includeAmazon = false) => api.post('/api/ai/chat', {
    messages, session_id: sessionId, include_amazon_data: includeAmazon
  }),
  getChatHistory: () => api.get('/api/ai/history'),
  analyzeAccount: (days = 30) => api.get(`/api/ai/analyze/account?days=${days}`),
  analyzeProduct: (asin) => api.get(`/api/ai/analyze/product/${asin}`),
  researchProduct: (keyword, category) => api.post('/api/ai/research/product', { keyword, category }),
  negotiate: (data) => api.post('/api/ai/negotiate/alibaba', data),
  analyzeCompetitor: (asin, name) => api.post('/api/ai/analyze/competitor', { asin, competitor_name: name }),
  predictStock: () => api.get('/api/ai/predict/stock'),
  weeklyReport: () => api.get('/api/ai/report/weekly'),
};

// ==================== PRODUITS ====================
export const productsAPI = {
  list: () => api.get('/api/products/'),
  create: (data) => api.post('/api/products/', data),
  get: (asin) => api.get(`/api/products/${asin}`),
  getPriceHistory: (asin, days = 90) => api.get(`/api/products/${asin}/price-history?days=${days}`),
  addPriceHistory: (asin, data) => api.post(`/api/products/${asin}/price-history`, data),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  list: (unreadOnly = false) => api.get(`/api/notifications/?unread_only=${unreadOnly}`),
  markRead: (id) => api.put(`/api/notifications/${id}/read`),
};

// ==================== ALIBABA ====================
export const alibabaAPI = {
  getNegotiations: (status) => api.get(`/api/alibaba/negotiations${status ? `?status=${status}` : ''}`),
  createNegotiation: (data) => api.post('/api/alibaba/negotiations', data),
  updateNegotiation: (id, data) => api.put(`/api/alibaba/negotiations/${id}`, data),
};

// ==================== ANALYTICS ====================
export const analyticsAPI = {
  history: (days = 30) => api.get(`/api/analytics/history?days=${days}`),
  pnl: (days = 30) => api.get(`/api/analytics/pnl?days=${days}`),
  fbaCalculator: (sellingPrice, costPrice, weightLbs = 1, category = 'standard') =>
    api.get(`/api/analytics/fba-calculator?selling_price=${sellingPrice}&cost_price=${costPrice}&weight_lbs=${weightLbs}&category=${category}`),
};

// ==================== CONCURRENTS ====================
export const competitorsAPI = {
  list: (myAsin) => api.get(`/api/competitors/${myAsin ? `?my_asin=${myAsin}` : ''}`),
  add: (data) => api.post('/api/competitors/', data),
  getLive: (asin) => api.get(`/api/competitors/${asin}/live`),
};

export default api;
