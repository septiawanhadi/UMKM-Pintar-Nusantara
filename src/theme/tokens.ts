export const theme = {
  colors: {
    primary: '#FF6B00',        // Oranye Cerah
    secondary: '#4ECDC4',      // Teal/Mint
    background: '#F7F9FC',     // Off-White
    surface: '#FFFFFF',        // Surface Card/Modal
    textPrimary: '#1A202C',    // Dark Charcoal
    textSecondary: '#6B7280',  // Medium Gray
    danger: '#E53E3E',         // Red
    border: '#E2E8F0',         // Soft gray border
  },
  typography: {
    fontFamily: 'Inter',
    h1: {
      fontSize: 28,
      fontWeight: '700' as const,
    },
    bodyLarge: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    bodySmall: {
      fontSize: 14,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: '500' as const,
    },
  },
  spacing: (multiplier: number) => multiplier * 8,
  borderRadius: {
    default: 10,
    cta: 12,
  },
  animations: {
    duration: 300,
    easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)' as const, // easeOutCubic approximation
  }
};

export type ThemeType = typeof theme;
