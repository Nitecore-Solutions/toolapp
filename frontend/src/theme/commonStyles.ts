/**
 * Bharat Document Studio — Common Reusable Styles
 * ─────────────────────────────────────────────────
 * Import these pre-built StyleSheet objects in any screen to stay consistent.
 * Usage: import { CS } from '../../../theme/commonStyles';
 *
 *   <View style={CS.card}>
 *   <TouchableOpacity style={CS.primaryButton}>
 *   <Text style={CS.primaryButtonText}>
 */
import { StyleSheet } from 'react-native';
import { Colors, FontSize, FontFamily, Spacing, Radius, Shadows } from './index';

export const CS = StyleSheet.create({

  // ── Screen Containers ────────────────────────────────────────────────────
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: 150,
  },

  // ── Page Header ──────────────────────────────────────────────────────────
  pageTitle: {
    fontSize: FontSize['2xl'],
    fontFamily: FontFamily.bold,
    color: Colors.accent,          // orange title — all tool screens
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  pageSubtitle: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },

  // ── Spec / Info Badge ────────────────────────────────────────────────────
  specBadge: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    backgroundColor: Colors.accentLight,
    borderWidth: 1,
    borderColor: Colors.accentBorder,
    borderRadius: Radius.full,
    paddingVertical: 5,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  specBadgeText: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.medium,
    color: Colors.accentDark,
  },

  // ── Upload Box (empty state) ─────────────────────────────────────────────
  uploadCard: {
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    alignItems: 'center' as const,
  },
  dottedUploadBox: {
    width: '100%' as const,
    borderWidth: 2,
    borderColor: Colors.accentBorder,
    borderStyle: 'dashed' as const,
    borderRadius: Radius.lg,
    backgroundColor: Colors.accentLight,
    paddingVertical: 36,
    paddingHorizontal: Spacing.md,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  uploadTitle: {
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
    textAlign: 'center' as const,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: FontSize.sm,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center' as const,
  },

  // ── Config / Edit Card ───────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surface,
    padding: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.sm,
  },
  cardLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: Colors.accentDark,
    textAlign: 'center' as const,
    marginBottom: Spacing.md,
  },

  // ── Instruction Text (inside cards) ─────────────────────────────────────
  instructionText: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.textMuted,
    textAlign: 'center' as const,
    lineHeight: 20,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.sm,
  },

  // ── Buttons ──────────────────────────────────────────────────────────────

  /** Primary action — Orange (Generate, Convert, Compress, Process) */
  primaryButton: {
    backgroundColor: Colors.accent,
    padding: Spacing.md + 2,
    borderRadius: Radius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    marginTop: Spacing.sm,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
  },

  /** Success action — Green (Download, Save) */
  successButton: {
    backgroundColor: Colors.success,
    padding: Spacing.md + 2,
    borderRadius: Radius.sm,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    flexDirection: 'row' as const,
    marginTop: Spacing.md,
  },
  successButtonText: {
    color: '#FFFFFF',
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
  },

  /** Outline link — Start Over, Reset */
  textLinkBtn: {
    padding: Spacing.md,
    alignItems: 'center' as const,
    marginTop: Spacing.sm,
  },
  textLinkBtnText: {
    color: Colors.primary,
    fontSize: FontSize.md,
    fontFamily: FontFamily.bold,
    textDecorationLine: 'underline' as const,
  },

  // ── Image Preview ─────────────────────────────────────────────────────────
  previewContainer: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.background,
    marginBottom: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    height: 200,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  previewImage: {
    width: '100%' as const,
    height: '100%' as const,
  },

  // ── Success / Result State ────────────────────────────────────────────────
  successSizeText: {
    fontSize: FontSize.lg - 1,
    fontFamily: FontFamily.bold,
    color: Colors.success,
    textAlign: 'center' as const,
    marginBottom: Spacing.md,
  },

  // ── Text Input ───────────────────────────────────────────────────────────
  textInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: FontSize.base,
    fontFamily: FontFamily.regular,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
  },
  textInputLabel: {
    fontSize: FontSize.base,
    fontFamily: FontFamily.bold,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
});
