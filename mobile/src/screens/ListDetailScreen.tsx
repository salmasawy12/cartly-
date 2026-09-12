import { Ionicons } from '@expo/vector-icons';
import { Client } from '@stomp/stompjs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { api, getToken } from '../api/client';
import { WS_URL } from '../api/config';
import AvatarStack from '../components/AvatarStack';
import EmptyState from '../components/EmptyState';
import InlineError from '../components/InlineError';
import TextField from '../components/TextField';
import { usePro } from '../context/ProContext';
import { colors, radius, shadow, spacing, typography } from '../theme';
import { ListItem, Member, UserLookup } from '../types';
import ShareListModal from './ShareListModal';
import UpgradeModal from './UpgradeModal';

export default function ListDetailScreen({ route, navigation }: any) {
  const { listId } = route.params as { listId: number; listName: string };
  const { isPro } = usePro();
  const [items, setItems] = useState<ListItem[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [upgradeVisible, setUpgradeVisible] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);
  const clientRef = useRef<Client | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  // The deleter's own WebSocket subscription also receives the ListDeletedEvent it
  // caused, so the direct delete handler and the WS listener would otherwise both
  // try to navigate back - the second call finds nothing left to go back to.
  const deletingListRef = useRef(false);

  const checkedCount = useMemo(() => items.filter(i => i.checked).length, [items]);
  const progress = items.length === 0 ? 0 : checkedCount / items.length;

  const sections = useMemo(() => {
    const toBuy = items.filter(i => !i.checked);
    const completed = items.filter(i => i.checked);
    const result: { title: string; data: ListItem[] }[] = [];
    if (toBuy.length > 0) result.push({ title: 'To Buy', data: toBuy });
    if (completed.length > 0) result.push({ title: 'Completed', data: completed });
    return result;
  }, [items]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress, progressAnim]);

  useEffect(() => {
    navigation.setOptions({
      // eslint-disable-next-line react/no-unstable-nested-components -- standard React Navigation headerRight pattern
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleSharePress} hitSlop={8}>
            <Ionicons name="person-add-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteListPress} hitSlop={8}>
            <Ionicons name="trash-outline" size={22} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPro]);

  useEffect(() => {
    api
      .get<ListItem[]>(`/api/lists/${listId}/items`)
      .then(setItems)
      .catch(e => setScreenError(e.message ?? 'Could not load items.'));
  }, [listId]);

  function loadMembers() {
    api
      .get<Member[]>(`/api/lists/${listId}/members`)
      .then(setMembers)
      .catch(() => {
        // Non-critical - the avatar stack just won't show if this fails.
      });
  }

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listId]);

  function upsertItem(updated: ListItem) {
    setItems(prev => {
      const exists = prev.some(i => i.id === updated.id);
      return exists ? prev.map(i => (i.id === updated.id ? updated : i)) : [...prev, updated];
    });
  }

  useEffect(() => {
    let cancelled = false;

    async function connect() {
      const token = await getToken();
      if (cancelled) return;

      const client = new Client({
        brokerURL: WS_URL,
        connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
        reconnectDelay: 3000,
        // React Native's WebSocket mishandles the NUL byte that terminates STOMP text
        // frames, so the server never sees a complete CONNECT frame and the handshake
        // hangs forever. Forcing binary frames avoids that string-encoding path entirely.
        // https://github.com/stomp-js/stompjs/issues/55
        forceBinaryWSFrames: true,
        appendMissingNULLonIncoming: true,
        onConnect: () => {
          client.subscribe(`/topic/lists/${listId}`, message => {
            const payload = JSON.parse(message.body);

            if (payload.itemId !== undefined && payload.id === undefined) {
              // ItemDeletedEvent
              setItems(prev => prev.filter(i => i.id !== payload.itemId));
              return;
            }

            if (payload.userId !== undefined && payload.listId !== undefined && payload.id === undefined) {
              // MemberJoinedEvent - someone accepted an invite. Must be checked before
              // ListDeletedEvent below, since both lack `id`/`name` and only differ by userId.
              loadMembers();
              return;
            }

            if (payload.listId !== undefined && payload.id === undefined && payload.name === undefined) {
              // ListDeletedEvent. If we're the one who triggered this delete, the direct
              // handler below already navigated back - don't do it again or alert ourselves.
              if (deletingListRef.current) return;
              Alert.alert('List deleted', 'The owner deleted this list.');
              if (navigation.canGoBack()) navigation.goBack();
              return;
            }

            upsertItem(payload as ListItem);
          });
        },
      });

      client.activate();
      clientRef.current = client;
    }

    connect();

    return () => {
      cancelled = true;
      clientRef.current?.deactivate();
    };
  }, [listId]);

  function handleSharePress() {
    if (!isPro) {
      setUpgradeVisible(true);
      return;
    }
    setShareModalVisible(true);
  }

  function handleDeleteListPress() {
    Alert.alert('Delete this list?', 'This removes it - and everything on it - for everyone. This can\'t be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete List',
        style: 'destructive',
        onPress: async () => {
          try {
            deletingListRef.current = true;
            await api.delete(`/api/lists/${listId}`);
            if (navigation.canGoBack()) navigation.goBack();
          } catch (e: any) {
            deletingListRef.current = false;
            setScreenError(e.message ?? 'Only the list owner can delete it.');
          }
        },
      },
    ]);
  }

  async function addItem() {
    if (!newItemName.trim()) return;
    setScreenError(null);
    try {
      const created = await api.post<ListItem>(`/api/lists/${listId}/items`, { name: newItemName.trim() });
      setNewItemName('');
      // Apply immediately - don't wait on the WebSocket echo, which may lag or drop.
      // The WS handler's upsert is idempotent, so no risk of a duplicate when it does arrive.
      upsertItem(created);
    } catch (e: any) {
      setScreenError(e.message ?? 'Could not add that item.');
    }
  }

  async function toggleChecked(item: ListItem) {
    setScreenError(null);
    try {
      const updated = await api.patch<ListItem>(`/api/lists/${listId}/items/${item.id}`, { checked: !item.checked });
      upsertItem(updated);
    } catch (e: any) {
      setScreenError(e.message ?? 'Could not update that item.');
    }
  }

  function confirmDeleteItem(item: ListItem) {
    Alert.alert('Remove item?', `Remove "${item.name}" from this list.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/api/lists/${listId}/items/${item.id}`);
            setItems(prev => prev.filter(i => i.id !== item.id));
          } catch (e: any) {
            setScreenError(e.message ?? 'Could not remove that item.');
          }
        },
      },
    ]);
  }

  function handleInvited(user: UserLookup) {
    Alert.alert('Invite sent', `${user.displayName} will see this list once they accept.`);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.container}>
        {screenError ? (
          <View style={styles.screenErrorWrap}>
            <InlineError message={screenError} />
          </View>
        ) : null}

        {members.length > 1 && (
          <View style={styles.membersRow}>
            <AvatarStack members={members} />
            <Text style={styles.membersLabel}>
              Shared with {members.length - 1} {members.length - 1 === 1 ? 'person' : 'people'}
            </Text>
          </View>
        )}

        {items.length > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressTextRow}>
              <Text style={styles.progressTitle}>
                {checkedCount === items.length ? 'All done! 🎉' : `${items.length - checkedCount} left to grab`}
              </Text>
              <Text style={styles.progressCount}>
                {checkedCount}/{items.length}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    width: progressAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0%', '100%'],
                    }),
                  },
                ]}
              />
            </View>
          </View>
        )}

        <SectionList
          sections={sections}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={items.length === 0 ? styles.emptyContainer : styles.listContent}
          stickySectionHeadersEnabled={false}
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title.toUpperCase()}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => toggleChecked(item)}>
              <Ionicons
                name={item.checked ? 'checkmark-circle' : 'ellipse-outline'}
                size={26}
                color={item.checked ? colors.primary : colors.textFaint}
              />
              <Text style={[styles.rowText, item.checked && styles.checkedText]}>{item.name}</Text>
              <TouchableOpacity hitSlop={10} onPress={() => confirmDeleteItem(item)}>
                <Ionicons name="trash-outline" size={18} color={colors.textFaint} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <EmptyState icon="basket-outline" title="No items yet" subtitle="Add your first item below." />
          }
        />

        <View style={styles.addRow}>
          <TextField
            placeholder="Add an item"
            value={newItemName}
            onChangeText={setNewItemName}
            onSubmitEditing={addItem}
            returnKeyType="done"
            style={styles.addInput}
            containerStyle={styles.addInputContainer}
          />
          <TouchableOpacity style={styles.addButton} activeOpacity={0.85} onPress={addItem}>
            <Ionicons name="add" size={26} color={colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ShareListModal
        visible={shareModalVisible}
        listId={listId}
        onClose={() => setShareModalVisible(false)}
        onInvited={handleInvited}
      />

      <UpgradeModal
        visible={upgradeVisible}
        reason="Sharing a list with family is a Pro feature."
        onClose={() => setUpgradeVisible(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  container: { flex: 1 },
  screenErrorWrap: { paddingHorizontal: spacing.xl, paddingTop: spacing.lg },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  membersLabel: { ...typography.caption },
  progressCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginHorizontal: spacing.xl,
    marginTop: spacing.lg,
    ...shadow.card,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressTitle: { ...typography.bodyStrong },
  progressCount: { ...typography.caption, fontWeight: '700', color: colors.primary },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  listContent: { padding: spacing.xl },
  emptyContainer: { flexGrow: 1 },
  sectionHeader: {
    ...typography.caption,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: colors.textFaint,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.card,
  },
  rowText: { ...typography.body, flex: 1 },
  checkedText: { textDecorationLine: 'line-through', color: colors.textFaint },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  addInputContainer: { flex: 1, marginBottom: 0 },
  addInput: { marginBottom: 0 },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
