import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme';
import { Member } from '../types';
import Avatar from './Avatar';

type Props = {
  members: Member[];
  max?: number;
  size?: number;
};

export default function AvatarStack({ members, max = 4, size = 28 }: Props) {
  if (members.length === 0) return null;

  const visible = members.slice(0, max);
  const overflow = members.length - visible.length;

  return (
    <View style={styles.row}>
      {visible.map((member, i) => (
        <Avatar
          key={member.userId}
          name={member.displayName}
          size={size}
          style={[styles.avatar, i > 0 && { marginLeft: -size * 0.3 }]}
        />
      ))}
      {overflow > 0 && (
        <View style={[styles.overflow, { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.3 }]}>
          <Text style={[styles.overflowText, { fontSize: size * 0.38 }]}>+{overflow}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { borderWidth: 2, borderColor: colors.surface },
  overflow: {
    backgroundColor: colors.border,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overflowText: { color: colors.textMuted, fontWeight: '700' },
});
