/**
 * Bharat Document Studio — Unified Design System
 * ─────────────────────────────────────────────────
 * Import from this file instead of hardcoding colors/values in each screen.
 * Usage: import { Colors, Typography, Spacing, Radius, Shadows } from '../../../theme';
 */

// ── Brand Colors ────────────────────────────────────────────────────────────
export const Colors = {
  // Primary — Indigo (main CTA, nav, active states)
  primary:        '#4F46E5',
  primaryLight:   '#EEF2FF',
  primaryBorder:  '#C7D2FE',

  // Accent — Orange (government tool highlights, badges)
  accent:         '#F97316',
  accentDark:     '#C2410C',
  accentLight:    '#FFF7ED',
  accentBorder:   '#FED7AA',

  // Success — Green (download, success, result)
  success:        '#10B981',
  successLight:   '#ECFDF5',
  successBorder:  '#6EE7B7',

  // Danger / Warning
  danger:         '#EF4444',
  warning:        '#F59E0B',
  warningLight:   '#FFFBEB',

  // Neutral — Text
  textPrimary:    '#0F172A',
  textSecondary:  '#334155',
  textMuted:      '#64748B',
  textPlaceholder:'#94A3B8',

  // Neutral — Surface
  background:     '#F8FAFC',
  surface:        '#FFFFFF',
  surfaceAlt:     '#F1F5F9',

  // Neutral — Border
  border:         '#E2E8F0',
  borderLight:    '#F1F5F9',

  // Overlay
  overlayBlue:    'rgba(59, 130, 246, 0.05)',
} as const;

// ── Typography Sizes ──────────────────────────────────────────────────────────
export const FontSize = {
  xs:   10,
  sm:   11,
  base: 13,
  md:   14,
  lg:   16,
  xl:   18,
  '2xl':20,
  '3xl':24,
} as const;

// ── Font Families (Outfit loaded globally via useFonts) ──────────────────────
export const FontFamily = {
  regular:   'Outfit-Regular',
  medium:    'Outfit-Medium',
  semiBold:  'Outfit-SemiBold',
  bold:      'Outfit-Bold',
} as const;

// ── Spacing ───────────────────────────────────────────────────────────────────
export const Spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  '2xl':24,
  '3xl':32,
} as const;

// ── Border Radius ─────────────────────────────────────────────────────────────
export const Radius = {
  sm:   6,
  md:   8,
  lg:   12,
  xl:   16,
  full: 9999,
} as const;

// ── Shadows ───────────────────────────────────────────────────────────────────
export const Shadows = {
  sm: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
} as const;
