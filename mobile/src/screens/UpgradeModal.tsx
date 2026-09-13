import { Ionicons } from '@expo/vector-icons';
import React, { useEffect } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Button from '../components/Button';
import InlineError from '../components/InlineError';
import { usePro } from '../context/ProContext';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  visible: boolean;
  reason: string;
  onClose: () => void;
};

const FEATURES = [
  'Unlimited lists',
  'Share lists with family',
  'Real-time sync across every device',
];

export default function UpgradeModal({ visible, reason, onClose }: Props) {
  const { isPro, product, purchasing, iapError, clearIapError, purchasePro } = usePro();

  useEffect(() => {
    if (isPro) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  async function handleUpgrade() {
    await purchasePro();
  }

  const priceLabel = product ? `${product.displayPrice}/mo` : '$2.99/mo';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={() => {
        clearIapError();
        onClose();
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.box}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              clearIapError();
              onClose();
            }}
            hitSlop={8}
          >
            <Ionicons name="close" size={20} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={styles.iconCircle}>
            <Ionicons name="star" size={28} color={colors.white} />
          </View>

          <Text style={styles.title}>Upgrade to Pro</Text>
          <Text style={styles.reason}>{reason}</Text>

          <View style={styles.features}>
            {FEATURES.map(feature => (
              <View key={feature} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={18} color={colors.primary} />
                <Text style={styles.featureText}>{feature}</Text>
              </View>
            ))}
          </View>

          {iapError ? <InlineError message={iapError} /> : null}

          {purchasing ? (
            <ActivityIndicator color={colors.primary} style={styles.upgradeButton} />
          ) : (
            <Button title={`Upgrade — ${priceLabel}`} onPress={handleUpgrade} style={styles.upgradeButton} />
          )}
          <TouchableOpacity
            onPress={() => {
              clearIapError();
              onClose();
            }}
            style={styles.notNow}
          >
            <Text style={styles.notNowText}>Not now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl, alignItems: 'center' },
  closeButton: { position: 'absolute', top: spacing.md, right: spacing.md, padding: spacing.xs },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  title: { ...typography.heading, marginBottom: spacing.sm },
  reason: { ...typography.caption, textAlign: 'center', marginBottom: spacing.lg },
  features: { alignSelf: 'stretch', marginBottom: spacing.xl, gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { ...typography.body },
  upgradeButton: { marginBottom: spacing.sm },
  notNow: { paddingVertical: spacing.sm },
  notNowText: { ...typography.caption, fontWeight: '600' },
});
