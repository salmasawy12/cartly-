import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

type Props = {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
};

export default function InlineError({ message, actionLabel, onAction }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={18} color={colors.danger} style={styles.icon} />
      <View style={styles.textArea}>
        <Text style={styles.message}>{message}</Text>
        {actionLabel && onAction ? (
          <TouchableOpacity onPress={onAction} hitSlop={4}>
            <Text style={styles.action}>{actionLabel}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.dangerLight,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  icon: { marginRight: spacing.sm, marginTop: 1 },
  textArea: { flex: 1 },
  message: { ...typography.caption, color: colors.danger, fontWeight: '600' },
  action: { ...typography.caption, color: colors.danger, fontWeight: '700', textDecorationLine: 'underline', marginTop: 4 },
});
