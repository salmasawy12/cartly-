import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { api } from '../api/client';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import InlineError from '../components/InlineError';
import TextField from '../components/TextField';
import { colors, radius, spacing, typography } from '../theme';
import { UserLookup } from '../types';

type Props = {
  visible: boolean;
  listId: number;
  onClose: () => void;
  onInvited: (user: UserLookup) => void;
};

type LookupState = 'idle' | 'loading' | 'found' | 'not-found';

// Only search once the email looks structurally complete (something@something.tld) -
// otherwise every partial address flashes a scary "not found" while still typing.
const LOOKS_LIKE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ShareListModal({ visible, listId, onClose, onInvited }: Props) {
  const [email, setEmail] = useState('');
  const [lookupState, setLookupState] = useState<LookupState>('idle');
  const [foundUser, setFoundUser] = useState<UserLookup | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!visible) {
      setEmail('');
      setLookupState('idle');
      setFoundUser(null);
      setInviteError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setInviteError(null);

    const trimmed = email.trim();
    if (!LOOKS_LIKE_EMAIL.test(trimmed)) {
      setLookupState('idle');
      setFoundUser(null);
      return;
    }

    setLookupState('loading');
    debounceRef.current = setTimeout(async () => {
      try {
        const user = await api.get<UserLookup>(`/api/users/lookup?email=${encodeURIComponent(trimmed)}`);
        setFoundUser(user);
        setLookupState('found');
      } catch {
        setFoundUser(null);
        setLookupState('not-found');
      }
    }, 600);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  async function handleInvite() {
    if (!foundUser) return;
    setInviting(true);
    setInviteError(null);
    try {
      await api.post(`/api/lists/${listId}/members`, { email: foundUser.email });
      onInvited(foundUser);
      onClose();
    } catch (e: any) {
      setInviteError(e.message ?? 'Could not send that invite.');
    } finally {
      setInviting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.box}>
          <Text style={styles.title}>Share this list</Text>
          <Text style={styles.subtitle}>Invite someone who already has a Cartly account.</Text>

          <TextField
            placeholder="Their email address"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            autoFocus
            style={styles.input}
          />

          <View style={styles.resultArea}>
            {lookupState === 'loading' && (
              <View style={styles.resultRow}>
                <ActivityIndicator size="small" color={colors.textFaint} />
                <Text style={styles.resultMuted}>Searching...</Text>
              </View>
            )}
            {lookupState === 'not-found' && (
              <View style={styles.resultRow}>
                <Ionicons name="alert-circle-outline" size={18} color={colors.danger} />
                <Text style={styles.resultError}>No Cartly account with that email.</Text>
              </View>
            )}
            {lookupState === 'found' && foundUser && (
              <View style={styles.foundCard}>
                <Avatar name={foundUser.displayName} size={36} />
                <View style={styles.foundText}>
                  <Text style={styles.foundName}>{foundUser.displayName}</Text>
                  <Text style={styles.foundEmail}>{foundUser.email}</Text>
                </View>
                <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
              </View>
            )}
          </View>

          {inviteError ? <InlineError message={inviteError} /> : null}

          <View style={styles.actions}>
            <Button title="Cancel" variant="ghost" fullWidth={false} onPress={onClose} style={styles.actionButton} />
            <Button
              title="Invite"
              fullWidth={false}
              loading={inviting}
              disabled={lookupState !== 'found'}
              onPress={handleInvite}
              style={styles.actionButton}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  box: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  title: { ...typography.heading, marginBottom: spacing.xs },
  subtitle: { ...typography.caption, marginBottom: spacing.lg },
  input: { marginBottom: spacing.sm },
  resultArea: { minHeight: 52, justifyContent: 'center', marginBottom: spacing.md },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.xs },
  resultMuted: { ...typography.caption },
  resultError: { ...typography.caption, color: colors.danger, flex: 1 },
  foundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  foundText: { flex: 1 },
  foundName: { ...typography.bodyStrong },
  foundEmail: { ...typography.caption },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  actionButton: { paddingHorizontal: spacing.lg },
});
