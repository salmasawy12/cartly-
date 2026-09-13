import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../components/Avatar';
import InlineError from '../components/InlineError';
import { useAuth } from '../context/AuthContext';
import { usePro } from '../context/ProContext';
import { colors, gradients, radius, shadow, spacing, typography } from '../theme';
import UpgradeModal from './UpgradeModal';

export default function AccountScreen() {
  const { user, logout, deleteAccount } = useAuth();
  const { isPro, restoring, iapError, restorePurchases, manageSubscription } = usePro();
  const [upgradeVisible, setUpgradeVisible] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  function confirmLogout() {
    Alert.alert('Log out?', 'You can log back in any time.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: logout },
    ]);
  }

  function confirmDeleteAccount() {
    Alert.alert(
      'Delete Account?',
      'This permanently deletes your account, any lists you own, and removes you from lists shared with you. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Account', style: 'destructive', onPress: handleDeleteAccount },
      ],
    );
  }

  async function handleDeleteAccount() {
    setDeleteError(null);
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (e: any) {
      setDeleting(false);
      setDeleteError(e.message ?? 'Could not delete your account. Please try again.');
    }
  }

  function togglePlan() {
    if (isPro) {
      manageSubscription();
    } else {
      setUpgradeVisible(true);
    }
  }

  async function handleRestore() {
    await restorePurchases();
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <LinearGradient colors={gradients.hero} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
        <Avatar name={user?.displayName ?? '?'} size={72} style={styles.avatar} />
        <Text style={styles.name}>{user?.displayName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </LinearGradient>

      <LinearGradient
        colors={isPro ? gradients.gold : [colors.surface, colors.surface]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.planCard, !isPro && styles.planCardFree]}
      >
        <View style={styles.planCardHeader}>
          <Ionicons name={isPro ? 'star' : 'star-outline'} size={20} color={isPro ? colors.white : colors.accent} />
          <Text style={[styles.planCardTitle, isPro && styles.onGradientText]}>
            {isPro ? 'Cartly Pro' : 'Free Plan'}
          </Text>
        </View>
        <Text style={[styles.planCardSubtitle, isPro && styles.onGradientTextMuted]}>
          {isPro
            ? 'Unlimited lists, sharing, and real-time sync are all unlocked.'
            : 'Limited to 1 list. Upgrade for unlimited lists and sharing.'}
        </Text>
        <TouchableOpacity onPress={togglePlan} style={[styles.planButton, isPro && styles.planButtonOnGradient]}>
          <Text style={[styles.planButtonText, isPro && styles.planButtonTextOnGradient]}>
            {isPro ? 'Manage Plan' : 'Upgrade to Pro'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {iapError ? (
        <View style={styles.iapErrorWrap}>
          <InlineError message={iapError} />
        </View>
      ) : null}

      {!isPro && (
        <TouchableOpacity onPress={handleRestore} style={styles.restoreRow} disabled={restoring}>
          {restoring ? (
            <ActivityIndicator color={colors.textMuted} size="small" />
          ) : (
            <Text style={styles.restoreText}>Restore Purchases</Text>
          )}
        </TouchableOpacity>
      )}

      <UpgradeModal
        visible={upgradeVisible}
        reason="Unlock unlimited lists and sharing."
        onClose={() => setUpgradeVisible(false)}
      />

      <Text style={styles.sectionLabel}>ACCOUNT</Text>
      <View style={styles.group}>
        <Row icon="mail-outline" label="Email" value={user?.email} />
        <Row icon="person-outline" label="Name" value={user?.displayName} last />
      </View>

      <Text style={styles.sectionLabel}>ABOUT</Text>
      <View style={styles.group}>
        <Row icon="information-circle-outline" label="Version" value="1.0.0" last />
      </View>

      <TouchableOpacity style={styles.logoutRow} onPress={confirmLogout} activeOpacity={0.7}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      {deleteError ? (
        <View style={styles.iapErrorWrap}>
          <InlineError message={deleteError} />
        </View>
      ) : null}

      <TouchableOpacity
        style={styles.logoutRow}
        onPress={confirmDeleteAccount}
        activeOpacity={0.7}
        disabled={deleting}
      >
        {deleting ? (
          <ActivityIndicator color={colors.danger} size="small" />
        ) : (
          <>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>Delete Account</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({
  icon,
  label,
  value,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  last?: boolean;
}) {
  return (
    <View style={[styles.row, !last && styles.rowDivider]}>
      <Ionicons name={icon} size={18} color={colors.textMuted} style={styles.rowIcon} />
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: spacing.xxl },
  hero: {
    alignItems: 'center',
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  avatar: { borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', marginBottom: spacing.md },
  name: { ...typography.heading, color: colors.white, marginBottom: 2 },
  email: { ...typography.caption, color: colors.onDarkMuted },
  planCard: {
    marginHorizontal: spacing.xl,
    marginTop: -spacing.xl,
    borderRadius: radius.lg,
    padding: spacing.lg,
    ...shadow.raised,
  },
  planCardFree: { borderWidth: 1, borderColor: colors.border },
  iapErrorWrap: { marginHorizontal: spacing.xl, marginTop: spacing.md },
  restoreRow: { alignItems: 'center', paddingVertical: spacing.sm },
  restoreText: { ...typography.caption, fontWeight: '600', textDecorationLine: 'underline' },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  planCardTitle: { ...typography.bodyStrong },
  planCardSubtitle: { ...typography.caption, marginBottom: spacing.md },
  onGradientText: { color: colors.white },
  onGradientTextMuted: { color: colors.onDarkMuted },
  planButton: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryLight,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  planButtonOnGradient: { backgroundColor: 'rgba(255,255,255,0.22)' },
  planButtonText: { ...typography.caption, fontWeight: '700', color: colors.primaryDark },
  planButtonTextOnGradient: { color: colors.white },
  sectionLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textFaint,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
    marginLeft: spacing.xl + spacing.xs,
  },
  group: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginHorizontal: spacing.xl,
    ...shadow.card,
  },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.background },
  rowIcon: { marginRight: spacing.md },
  rowLabel: { ...typography.body, flex: 1 },
  rowValue: { ...typography.caption, maxWidth: '50%' },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xl,
    paddingVertical: spacing.md,
  },
  logoutText: { ...typography.bodyStrong, color: colors.danger },
});
