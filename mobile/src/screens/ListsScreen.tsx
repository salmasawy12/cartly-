import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api/client';
import Avatar from '../components/Avatar';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import InlineError from '../components/InlineError';
import TextField from '../components/TextField';
import { useAuth } from '../context/AuthContext';
import { FREE_LIST_LIMIT, usePro } from '../context/ProContext';
import { colors, gradients, radius, shadow, spacing, typography } from '../theme';
import { GroceryList, Invite } from '../types';
import UpgradeModal from './UpgradeModal';

const CARD_ACCENTS = ['#1F9D55', '#2D7FF9', '#F5A524', '#E5484D', '#8B5CF6'];

function accentFor(id: number): string {
  return CARD_ACCENTS[id % CARD_ACCENTS.length];
}

function firstName(fullName?: string): string {
  return fullName?.split(' ')[0] ?? 'there';
}

export default function ListsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { isPro } = usePro();
  const insets = useSafeAreaInsets();
  const [lists, setLists] = useState<GroceryList[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [respondingTo, setRespondingTo] = useState<number | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  const loadLists = useCallback(async () => {
    try {
      const data = await api.get<GroceryList[]>('/api/lists');
      setLists(data);
    } catch (e: any) {
      setScreenError(e.message ?? 'Could not load your lists.');
    }
  }, []);

  const loadInvites = useCallback(async () => {
    try {
      const data = await api.get<Invite[]>('/api/invites');
      setInvites(data);
    } catch {
      // Non-critical - just skip showing invites this refresh rather than blocking the screen.
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadLists();
      loadInvites();
    }, [loadLists, loadInvites]),
  );

  async function respondToInvite(invite: Invite, accept: boolean) {
    setRespondingTo(invite.listId);
    setScreenError(null);
    try {
      await api.post(`/api/invites/${invite.listId}/${accept ? 'accept' : 'decline'}`);
      setInvites(prev => prev.filter(i => i.listId !== invite.listId));
      if (accept) loadLists();
    } catch (e: any) {
      setScreenError(e.message ?? 'Could not respond to that invite.');
    } finally {
      setRespondingTo(null);
    }
  }

  function handleNewListPress() {
    if (!isPro && lists.length >= FREE_LIST_LIMIT) {
      setUpgradeVisible(true);
      return;
    }
    setCreateError(null);
    setModalVisible(true);
  }

  async function createList() {
    if (!newListName.trim()) {
      setCreateError('Give your list a name first.');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await api.post<GroceryList>('/api/lists', { name: newListName.trim() });
      setNewListName('');
      setModalVisible(false);
      loadLists();
    } catch (e: any) {
      setCreateError(e.message ?? 'Could not create this list.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={gradients.hero}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.hero, { paddingTop: insets.top + spacing.lg }]}
      >
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.greeting}>Hi, {firstName(user?.displayName)} 👋</Text>
            <Text style={styles.heroSubtitle}>
              {lists.length === 0
                ? 'Ready to start shopping'
                : `${lists.length} list${lists.length === 1 ? '' : 's'}${isPro ? '' : ` · ${FREE_LIST_LIMIT} free`}`}
            </Text>
          </View>
          <Avatar name={user?.displayName ?? '?'} size={44} />
        </View>
      </LinearGradient>

      {screenError ? (
        <View style={styles.screenErrorWrap}>
          <InlineError message={screenError} />
        </View>
      ) : null}

      <FlatList
        data={lists}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={lists.length === 0 ? styles.emptyContainer : styles.listContent}
        ListHeaderComponent={
          invites.length > 0 ? (
            <View style={styles.invitesSection}>
              <Text style={styles.invitesLabel}>PENDING INVITES</Text>
              {invites.map(invite => (
                <View key={invite.listId} style={styles.inviteCard}>
                  <View style={styles.inviteIcon}>
                    <Ionicons name="mail-unread-outline" size={18} color={colors.accentDark} />
                  </View>
                  <View style={styles.inviteText}>
                    <Text style={styles.inviteTitle}>{invite.listName}</Text>
                    <Text style={styles.inviteSubtitle}>from {invite.ownerName}</Text>
                  </View>
                  {respondingTo === invite.listId ? (
                    <ActivityIndicator size="small" color={colors.textFaint} />
                  ) : (
                    <View style={styles.inviteActions}>
                      <TouchableOpacity
                        style={styles.inviteDecline}
                        onPress={() => respondToInvite(invite, false)}
                        hitSlop={6}
                      >
                        <Ionicons name="close" size={16} color={colors.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.inviteAccept}
                        onPress={() => respondToInvite(invite, true)}
                        hitSlop={6}
                      >
                        <Ionicons name="checkmark" size={16} color={colors.white} />
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.row}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ListDetail', { listId: item.id, listName: item.name })}
          >
            <View style={[styles.rowIcon, { backgroundColor: accentFor(item.id) + '1A' }]}>
              <Ionicons name="cart-outline" size={20} color={accentFor(item.id)} />
            </View>
            <Text style={styles.rowText}>{item.name}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="cart-outline"
            title="No lists yet"
            subtitle="Create your first list to start shopping together."
          />
        }
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.85} onPress={handleNewListPress}>
        <Ionicons name="add" size={28} color={colors.white} />
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>New List</Text>
            <TextField
              placeholder="e.g. Weekly Groceries"
              value={newListName}
              error={!!createError}
              onChangeText={text => {
                setNewListName(text);
                setCreateError(null);
              }}
              autoFocus
              style={styles.modalInput}
            />
            {createError ? <InlineError message={createError} /> : null}
            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                fullWidth={false}
                onPress={() => setModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Create"
                fullWidth={false}
                loading={creating}
                onPress={createList}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <UpgradeModal
        visible={upgradeVisible}
        reason={`Free accounts are limited to ${FREE_LIST_LIMIT} list. Upgrade to Pro for unlimited lists.`}
        onClose={() => setUpgradeVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  heroRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { ...typography.title, color: colors.white, fontSize: 24, marginBottom: 2 },
  heroSubtitle: { ...typography.caption, color: colors.onDarkMuted },
  listContent: { padding: spacing.xl },
  screenErrorWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.md },
  invitesSection: { marginBottom: spacing.lg },
  invitesLabel: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textFaint,
    marginBottom: spacing.sm,
  },
  inviteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent + '33',
    ...shadow.card,
  },
  inviteIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  inviteText: { flex: 1 },
  inviteTitle: { ...typography.bodyStrong },
  inviteSubtitle: { ...typography.caption },
  inviteActions: { flexDirection: 'row', gap: spacing.sm },
  inviteDecline: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviteAccept: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: { flexGrow: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  rowText: { ...typography.bodyStrong, flex: 1 },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.raised,
  },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  modalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.xl },
  modalTitle: { ...typography.heading, marginBottom: spacing.lg },
  modalInput: { marginBottom: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm },
  modalButton: { paddingHorizontal: spacing.lg },
});
