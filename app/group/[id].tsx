import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';

import { Screen } from '@/components/Screen';
import { useColorScheme } from '@/components/useColorScheme';
import { addGroupMember, getFriends, getGroup, removeGroupMember, type Friend, type Group } from '@/core/api/social-api';
import { useAuth } from '@/core/auth/auth-context';
import { palette, radius } from '@/constants/Colors';

export default function GroupDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = palette[useColorScheme() ?? 'light'];
  const { accessToken, isRestoring, user, authorizedRequest } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    try {
      const [nextGroup, nextFriends] = await Promise.all([
        authorizedRequest(token => getGroup(token, id)),
        authorizedRequest(getFriends),
      ]);
      setGroup(nextGroup);
      setFriends(nextFriends);
    } catch {
      Alert.alert('Não foi possível abrir o grupo', 'Tente novamente.');
    } finally {
      setLoading(false);
    }
  }, [authorizedRequest, id]);
  useEffect(() => { void load(); }, [load]);

  // The debt service only accepts member changes from the group owner.
  const isOwner = Boolean(group && user && group.createdByUserId === user.id);
  const memberIds = new Set(group?.members.map(member => member.userId) ?? []);
  const addableFriends = friends.filter(friend => !memberIds.has(friend.userId));

  async function run(action: () => Promise<unknown>) {
    setWorking(true);
    try {
      await action();
      await load();
    } catch {
      Alert.alert('Não foi possível concluir', 'Tente novamente.');
    } finally {
      setWorking(false);
    }
  }

  if (isRestoring) return null;
  if (!accessToken) return <Redirect href="/login" />;

  return (
    <Screen>
      <Pressable onPress={() => router.back()}>
        <Text style={[s.back, { color: colors.primary }]}>‹ Voltar</Text>
      </Pressable>

      {loading ? <ActivityIndicator color={colors.primary} /> : group ? (
        <>
          <View>
            <Text style={[s.title, { color: colors.text }]}>{group.name}</Text>
            {group.description ? (
              <Text style={[s.muted, { color: colors.textMuted }]}>{group.description}</Text>
            ) : null}
          </View>

          <Text style={[s.section, { color: colors.text }]}>Membros ({group.members.length})</Text>
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {group.members.map(member => (
              <View key={member.userId} style={s.row}>
                <View style={{ flex: 1 }}>
                  <Text style={[s.name, { color: colors.text }]}>
                    {member.displayName}
                    {member.userId === group.createdByUserId ? ' · dono' : ''}
                  </Text>
                  <Text style={[s.muted, { color: colors.textMuted }]}>{member.email}</Text>
                </View>
                {isOwner && member.userId !== group.createdByUserId ? (
                  <Pressable
                    disabled={working}
                    onPress={() => void run(() => authorizedRequest(token => removeGroupMember(token, group.id, member.userId)))}
                  >
                    <Text style={[s.action, { color: colors.danger }]}>Remover</Text>
                  </Pressable>
                ) : null}
              </View>
            ))}
          </View>

          {isOwner ? (
            <>
              <Text style={[s.section, { color: colors.text }]}>Adicionar amigo</Text>
              <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                {addableFriends.length ? addableFriends.map(friend => (
                  <View key={friend.userId} style={s.row}>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.name, { color: colors.text }]}>{friend.displayName}</Text>
                      <Text style={[s.muted, { color: colors.textMuted }]}>{friend.email}</Text>
                    </View>
                    <Pressable
                      disabled={working}
                      onPress={() => void run(() => authorizedRequest(token => addGroupMember(token, group.id, friend.userId)))}
                    >
                      <Text style={[s.action, { color: colors.primary }]}>Adicionar</Text>
                    </Pressable>
                  </View>
                )) : (
                  <Text style={[s.muted, { color: colors.textMuted }]}>
                    Todos os seus amigos já estão neste grupo.
                  </Text>
                )}
              </View>
            </>
          ) : (
            <Text style={[s.hint, { color: colors.textMuted }]}>
              Apenas {group.members.find(member => member.userId === group.createdByUserId)?.displayName ?? 'o dono'} pode alterar os membros deste grupo.
            </Text>
          )}
        </>
      ) : (
        <Text style={[s.muted, { color: colors.textMuted }]}>Grupo indisponível.</Text>
      )}
    </Screen>
  );
}

const s = StyleSheet.create({
  back: { fontFamily: 'Inter_700Bold' },
  title: { fontFamily: 'Inter_800ExtraBold', fontSize: 28, letterSpacing: -.8 },
  muted: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
  section: { fontFamily: 'Inter_700Bold', fontSize: 18, marginTop: 4 },
  card: { borderWidth: 1, borderRadius: radius.component, padding: 15, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  name: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  action: { fontFamily: 'Inter_700Bold', fontSize: 13 },
  hint: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19 },
});
