import { Platform } from 'react-native';

export const theme = {
  colors: {
    primary: '#FF6B00',          // Oranye Cerah
    secondary: '#00E5FF',        // Neon Cyan/Mint
    background: '#0B101D',       // Midnight Deep Slate
    surface: 'rgba(255, 255, 255, 0.06)', // Ultra-translucent light glass overlay
    cardBg: 'rgba(22, 28, 45, 0.65)',    // Translucent dark glass backdrop
    textPrimary: '#FFFFFF',      // White for dark mode contrast
    textSecondary: '#94A3B8',    // Slate Gray for secondary text
    danger: '#FF4D4D',           // Bright Neon Red
    border: 'rgba(255, 255, 255, 0.12)',  // Soft translucent glass border
    inputBg: 'rgba(255, 255, 255, 0.04)', // Translucent input background
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
    default: 16, // Smoother round corners for Liquid Glass cards
    cta: 24,     // Capsule button styling
  },
  animations: {
    duration: 300,
    easing: 'cubic-bezier(0.215, 0.610, 0.355, 1)' as const,
  },
  glassShadow: Platform.OS === 'web'
    ? 'box-shadow: 0px 10px 20px rgba(0, 0, 0, 0.25);'
    : `
      shadow-color: #000000;
      shadow-offset: 0px 10px;
      shadow-opacity: 0.25;
      shadow-radius: 20px;
      elevation: 8;
    `
};

export type ThemeType = typeof theme;
