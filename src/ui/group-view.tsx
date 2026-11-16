/* One group: its name, the invite code, the people in it, and leaving. Shown on the Group tab
   (the group the app is showing) and on its own screen (any group, by id). */
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Clipboard from 'expo-clipboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Alert, Share, StyleSheet, View } from 'react-native';

import { formatCode } from '@/core/groups/invites';
import { canInvite, canLeave, canRemove, canSetRole, isAdmin, isOwnGroup, memberIds, validName, type Group } from '@/core/groups/rules';
import type { ActiveInvite, User } from '@/data/backend';

import { Avatar, Button, Card, Divider, Field, HeroCard, IconButton, Notice, SectionLabel, Title, Txt } from './components';
import { successFeel } from './motion';
import { useAction, useSession } from './session';
import { t } from './strings';
import { size, useTheme } from './theme';

const day = (ms: number) => new Date(ms).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

function Invites({ group, user }: { group: Group; user: User }) {
  const c = useTheme();
  const { backend } = useSession();
  const { busy, error, run } = useAction();
  const [invite, setInvite] = useState<ActiveInvite | null>(null);
  const allowed = canInvite(group, user.id, user.emailConfirmed);
  const alone = memberIds(group).length === 1;
  const [copied, setCopied] = useState(false);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (copiedTimer.current && clearTimeout(copiedTimer.current)), []);
  /** Says "Code copied" only when the phone really took it. */
  const copy = async (code: string) => {
    try {
      await Clipboard.setStringAsync(formatCode(code));
    } catch {
      return;
    }
    successFeel();
    AccessibilityInfo.announceForAccessibility(t.group.copied); // a screen reader hears it too
    setCopied(true);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  const load = useCallback(() => {
    if (!allowed.ok) return; // only someone who may invite asks for the code
    backend.activeInvite(group.id).then(setInvite, () => {});
  }, [backend, group.id, allowed.ok]);
  useEffect(load, [load]);

  if (!allowed.ok && allowed.why !== 'email-unconfirmed') return null; // members do not see invites
  if (!allowed.ok) {
    return (
      <Card>
        <View style={styles.line}>
          <Ionicons name="mail-unread-outline" size={22} color={c.accent} />
          <Txt testID="invite-needs-email" tone="muted" style={styles.fill}>
            {t.group.inviteNeedsEmail}
          </Txt>
        </View>
      </Card>
    );
  }
  return (
    <HeroCard>
      <Txt size={size.label} bold tone="gold" style={styles.caps}>
        {alone ? t.group.inviteAlone : t.group.invite}
      </Txt>
      {invite?.code ? (
        <View>
          <Txt testID="invite-code" size={size.title} tone="onHero" selectable style={styles.code}>
            {formatCode(invite.code)}
          </Txt>
          <Txt size={size.small} tone="onHeroMuted">
            {copied ? t.group.copied : t.group.expires(day(invite.expiresAt))}
          </Txt>
        </View>
      ) : invite ? (
        <Txt testID="code-elsewhere" tone="onHeroMuted">
          {t.group.codeElsewhere}
        </Txt>
      ) : null}
      {invite?.code ? (
        <View style={styles.pair}>
            <Button grow testID="copy-code" on="hero" icon="copy-outline" title={t.group.copy} onPress={() => void copy(invite.code ?? '')} />
            <Button grow testID="share-code" on="hero" kind="outline" icon="share-outline" title={t.group.share} onPress={() => void Share.share({ message: t.group.shareMessage(group.name, formatCode(invite.code ?? '')) }).catch(() => {})} />
        </View>
      ) : null}
      <Button
        testID="new-code"
        on="hero"
        kind={invite?.code ? 'outline' : 'primary'}
        title={invite ? t.group.newCode : t.group.makeCode}
        busy={busy}
        onPress={() => void run(async () => (setCopied(false), setInvite(await backend.createInvite(group, user.id))))}
      />
      {invite ? (
        <>
          <Txt size={size.small} tone="onHeroMuted">
            {t.group.newCodeNote}
          </Txt>
          <Button testID="cancel-code" on="hero" kind="plain" title={t.group.cancelCode} disabled={busy} onPress={() => void run(async () => (await backend.cancelInvite(group.id), setInvite(null)))} />
        </>
      ) : null}
      <Notice text={error} />
    </HeroCard>
  );
}

export function GroupView({ group, user, onLeft }: { group: Group; user: User; onLeft?: () => void }) {
  const { backend } = useSession();
  const { busy, error, run } = useAction();
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState('');
  const [openFor, setOpenFor] = useState<string | null>(null);

  const admin = isAdmin(group, user.id);
  const leave = canLeave(group, user.id);
  const ask = (question: string, action: string, fn: () => Promise<void>, after?: () => void) =>
    Alert.alert(question, undefined, [
      { text: t.cancel, style: 'cancel' },
      { text: action, style: 'destructive', onPress: () => void run(fn).then((ok) => ok && after?.()) },
    ]);
  const ids = memberIds(group).sort((a, b) => group.members[a].name.localeCompare(group.members[b].name));

  return (
    <>
      {renaming ? (
        <Card>
          <Field testID="group-name" label={t.group.groupName} value={name} onChangeText={setName} autoCapitalize="words" />
          <Button testID="save-name" title={t.save} busy={busy} disabled={!validName(name)} onPress={() => void run(() => backend.renameGroup(group.id, name)).then((ok) => ok && setRenaming(false))} />
          <Button kind="plain" title={t.cancel} onPress={() => setRenaming(false)} />
        </Card>
      ) : (
        <Title
          testID="group-title"
          above={t.group.summary(ids.length, admin)}
          right={admin ? <Button testID="rename" kind="plain" icon="create-outline" title={t.group.rename} onPress={() => (setName(group.name), setRenaming(true))} /> : undefined}>
          {group.name}
        </Title>
      )}

      <Invites group={group} user={user} />

      <View style={styles.section}>
        <SectionLabel>{t.group.members}</SectionLabel>
        <Card tight>
          {ids.map((uid, i) => {
            const m = group.members[uid];
            const me = uid === user.id;
            const open = openFor === uid;
            const promote = canSetRole(group, user.id, uid, 'admin');
            const demote = canSetRole(group, user.id, uid, 'member');
            const remove = canRemove(group, user.id, uid);
            return (
              <View key={uid} testID={`member-${uid}`}>
                {i > 0 && <Divider />}
                <View style={styles.member}>
                  <Avatar name={m.name} tone={me ? 'accent' : m.role === 'admin' ? 'gold' : 'soft'} />
                  <View style={styles.fill}>
                    <Txt bold>
                      {m.name}
                      {me ? ` (${t.group.you})` : ''}
                    </Txt>
                    {m.role === 'admin' ? (
                      <Txt size={size.small} tone="muted">
                        {t.group.admin}
                      </Txt>
                    ) : null}
                  </View>
                  {/* The dots open choices written in words, right under the person. */}
                  {admin && !me ? <IconButton testID={`options-${uid}`} icon="ellipsis-horizontal" label={t.group.optionsFor(m.name)} open={open} onPress={() => setOpenFor(open ? null : uid)} /> : null}
                </View>
                {admin && !me && open ? (
                  <View style={styles.actions}>
                    {m.role === 'member' ? (
                      <Button testID={`promote-${uid}`} kind="outline" title={t.group.makeAdmin} disabled={busy || !promote.ok} onPress={() => void run(() => backend.setRole(group.id, uid, 'admin'))} />
                    ) : (
                      <Button testID={`demote-${uid}`} kind="outline" title={t.group.removeAdminRole} disabled={busy || !demote.ok} onPress={() => void run(() => backend.setRole(group.id, uid, 'member'))} />
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
        </Card>
        <Notice text={error} />
      </View>

      {isOwnGroup(group, user.id) ? (
        <Txt testID="own-group-note" size={size.small} tone="muted">
          {t.group.ownGroup}
        </Txt>
      ) : (
        <>
          <Button
            testID="leave"
            kind="danger"
            title={t.group.leave}
            disabled={busy || !leave.ok}
            onPress={() => ask(t.group.leaveConfirm(group.name), t.group.leave, () => backend.removeMember(group.id, user.id), onLeft)}
          />
          {!leave.ok && leave.why === 'last-admin' ? (
            <Txt testID="last-admin-note" size={size.small} tone="muted">
              {t.group.lastAdmin}
            </Txt>
          ) : null}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  section: { gap: 10 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  caps: { letterSpacing: 0.8, textTransform: 'uppercase' },
  code: { fontWeight: '700', letterSpacing: 3 },
  pair: { flexDirection: 'row', gap: 10 },
  member: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, minHeight: 68 },
  actions: { gap: 10, paddingBottom: 14 },
});
