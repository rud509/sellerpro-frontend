// Thème SellerPro - Couleurs & Styles
export const COLORS = {
  // Primaires
  primary: '#6C63FF',       // Violet principal
  primaryDark: '#5A52D5',
  primaryLight: '#8B85FF',
  
  // Secondaires
  secondary: '#FF6584',     // Rose accent
  accent: '#43E97B',        // Vert succès
  
  // Fonds
  background: '#0F0F1A',    // Fond très sombre
  surface: '#1A1A2E',       // Cards
  surfaceLight: '#252540',  // Cards élevées
  
  // Textes
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#606080',
  
  // Status
  success: '#43E97B',
  warning: '#FFB347',
  danger: '#FF6B6B',
  info: '#4FC3F7',
  
  // Graphiques
  chart1: '#6C63FF',
  chart2: '#43E97B',
  chart3: '#FF6584',
  chart4: '#FFB347',
  chart5: '#4FC3F7',
  
  // Borders
  border: '#2A2A4A',
  divider: '#1E1E36',
};

export const GRADIENTS = {
  primary: ['#6C63FF', '#5A52D5'],
  success: ['#43E97B', '#38F9D7'],
  danger: ['#FF6B6B', '#FF8E53'],
  gold: ['#FFB347', '#FFCC02'],
  dark: ['#1A1A2E', '#0F0F1A'],
  card: ['#1E1E36', '#252545'],
};

export const FONTS = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 18,
    xxl: 22,
    xxxl: 28,
    huge: 36,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  }
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  md: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  lg: {
    shadowColor: '#6C63FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
};
