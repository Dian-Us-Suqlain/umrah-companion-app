import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Share, StyleSheet, View } from 'react-native';

import { formatCode } from '@/core/groups/invites';
import { canInvite, canLeave, canRemove, canSetRole, isAdmin, isOwnGroup, memberIds, validName, type Group } from '@/core/groups/rules';
import type { ActiveInvite, User } from '@/data/backend';
import { Button, Card, Field, Notice, Screen, Txt } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';

const day = (ms: number) => new Date(ms).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function Invites({ group, user }: { group: Group; user: User }) {
  const { backend } = useSession();
  const { busy, error, run } = useAction();
  const [invite, setInvite] = useState<ActiveInvite | null>(null);
  const allowed = canInvite(group, user.id, user.emailConfirmed);
  const alone = memberIds(group).length === 1;

  const load = useCallback(() => {
    backend.activeInvite(group.id).then(setInvite, () => {});
  }, [backend, group.id]);
  useEffect(load, [load]);

  if (!allowed.ok && allowed.why !== 'email-unconfirmed') return null; // members do not see invites
  return (
    <Card>
      <Txt bold>{alone ? t.group.inviteAlone : t.group.invite}</Txt>
      {!allowed.ok ? (
        <Txt testID="invite-needs-email" tone="muted">
          {t.group.inviteNeedsEmail}
        </Txt>
      ) : (
        <>
          {invite?.code ? (
            <>
              <Txt testID="invite-code" size={28} bold selectable style={styles.code}>
                {formatCode(invite.code)}
              </Txt>
              <Txt size={14} tone="muted">
                {t.group.expires(day(invite.expiresAt))}
              </Txt>
              <Button testID="share-code" title={t.group.share} onPress={() => void Share.share({ message: t.group.shareMessage(group.name, formatCode(invite.code ?? '')) })} />
            </>
          ) : invite ? (
            <Txt testID="code-elsewhere" tone="muted">
              {t.group.codeElsewhere}
            </Txt>
          ) : null}
          <Button
            testID="new-code"
            kind={invite?.code ? 'plain' : 'primary'}
            title={invite ? t.group.newCode : t.group.makeCode}
            busy={busy}
            onPress={() => void run(async () => setInvite(await backend.createInvite(group, user.id)))}
          />
          {invite ? (
            <>
              <Txt size={13} tone="muted">
                {t.group.newCodeNote}
              </Txt>
              <Button testID="cancel-code" kind="danger" title={t.group.cancelCode} disabled={busy} onPress={() => void run(async () => (await backend.cancelInvite(group.id), setInvite(null)))} />
            </>
          ) : null}
          <Notice text={error} />
        </>
      )}
    </Card>
  );
}

export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { backend, user, groups } = useSession();
  const { busy, error, run } = useAction();
  const group = groups.find((g) => g.id === id);
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');

  if (!user || !group) {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Txt testID="group-gone" tone="muted">
            {t.group.gone}
          </Txt>
        </Card>
      </Screen>
    );
  }

  const admin = isAdmin(group, user.id);
  const leave = canLeave(group, user.id);
  const ask = (question: string, action: string, fn: () => Promise<void>, after?: () => void) =>
    Alert.alert(question, undefined, [
      { text: t.cancel, style: 'cancel' },
      { text: action, style: 'destructive', onPress: () => void run(fn).then((ok) => ok && after?.()) },
    ]);
  const ids = memberIds(group).sort((a, b) => group.members[a].name.localeCompare(group.members[b].name));

  return (
    <Screen edges={['bottom']}>
      <Card>
        {renaming ? (
          <>
            <Field testID="group-name" label={t.group.groupName} value={name} onChangeText={setName} autoCapitalize="words" />
            <Button testID="save-name" title={t.save} busy={busy} disabled={!validName(name)} onPress={() => void run(() => backend.renameGroup(group.id, name)).then((ok) => ok && setRenaming(false))} />
            <Button kind="plain" title={t.cancel} onPress={() => setRenaming(false)} />
          </>
        ) : (
          <>
            <Txt testID="group-title" size={22} bold>
              {group.name}
            </Txt>
            <Txt tone="muted">{t.group.summary(ids.length, admin)}</Txt>
            {admin ? <Button testID="rename" kind="plain" title={t.group.rename} onPress={() => (setName(group.name), setRenaming(true))} /> : null}
          </>
        )}
      </Card>

      <Card>
        <Txt size={13} bold tone="muted">
          {t.group.members}
        </Txt>
        {ids.map((uid) => {
          const m = group.members[uid];
          const me = uid === user.id;
          const promote = canSetRole(group, user.id, uid, 'admin');
          const demote = canSetRole(group, user.id, uid, 'member');
          const remove = canRemove(group, user.id, uid);
          return (
            <View key={uid} testID={`member-${uid}`} style={styles.member}>
              <Txt bold>
                {m.name}
                {me ? ` (${t.group.you})` : ''}
              </Txt>
              {m.role === 'admin' ? (
                <Txt size={14} tone="accent">
                  {t.group.admin}
                </Txt>
              ) : null}
              {admin && !me ? (
                <View style={styles.actions}>
                  {m.role === 'member' ? (
                    <Button testID={`promote-${uid}`} kind="plain" title={t.group.makeAdmin} disabled={busy || !promote.ok} onPress={() => void run(() => backend.setRole(group.id, uid, 'admin'))} />
                  ) : (
                    <Button testID={`demote-${uid}`} kind="plain" title={t.group.removeAdminRole} disabled={busy || !demote.ok} onPress={() => void run(() => backend.setRole(group.id, uid, 'member'))} />
                  )}
                  <Button
                    testID={`remove-${uid}`}
                    kind="danger"
                    title={t.group.remove}
                    disabled={busy || !remove.ok}
                    onPress={() => ask(t.group.removeConfirm(m.name), t.group.remove, () => backend.removeMember(group.id, uid))}
                  />
                </View>
              ) : null}
            </View>
          );
        })}
        <Notice text={error} />
      </Card>

      <Invites group={group} user={user} />

      <Card>
        {isOwnGroup(group, user.id) ? (
          <Txt testID="own-group-note" size={14} tone="muted">
            {t.group.ownGroup}
          </Txt>
        ) : (
          <>
            <Button
              testID="leave"
              kind="danger"
              title={t.group.leave}
              disabled={busy || !leave.ok}
              onPress={() => ask(t.group.leaveConfirm(group.name), t.group.leave, () => backend.removeMember(group.id, user.id), () => router.dismissTo('/profile'))}
            />
            {!leave.ok && leave.why === 'last-admin' ? (
              <Txt testID="last-admin-note" size={14} tone="muted">
                {t.group.lastAdmin}
              </Txt>
            ) : null}
          </>
        )}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  member: { gap: 4, paddingVertical: 6 },
  actions: { gap: 8, marginTop: 4 },
  code: { letterSpacing: 2 },
});
