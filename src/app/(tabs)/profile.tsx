import Constants from 'expo-constants';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { isAdmin, memberIds, type Group } from '@/core/groups/rules';
import { Button, Card, Notice, Screen, Txt } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';
import { useTheme } from '@/ui/theme';

const variant = String(Constants.expoConfig?.extra?.variant ?? 'development');

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Txt>{label}</Txt>
      <Txt tone="muted">{value}</Txt>
    </View>
  );
}

function Guest() {
  const { backend } = useSession();
  const erase = useAction();
  const [erased, setErased] = useState(false);
  const confirmErase = () =>
    Alert.alert(t.account.eraseLocal, t.account.eraseConfirm, [
      { text: t.cancel, style: 'cancel' },
      { text: t.account.eraseLocal, style: 'destructive', onPress: () => void erase.run(() => backend.eraseLocal()).then(setErased) },
    ]);
  return (
    <>
      <Card>
        <Txt bold>{t.account.guestTitle}</Txt>
        <Txt tone="muted">{t.account.guestNote}</Txt>
        <Button testID="guest-create" title={t.account.create} onPress={() => router.push('/account/sign-up')} />
        <Button testID="guest-sign-in" kind="plain" title={t.account.signIn} onPress={() => router.push('/account/sign-in')} />
        <Txt size={14} tone="muted">
          {t.account.why}
        </Txt>
      </Card>
      <Card>
        <Txt size={13} bold tone="muted">
          {t.account.travelAsGroup.toUpperCase()}
        </Txt>
        <Button testID="guest-join" kind="plain" title={t.account.joinWithCode} onPress={() => router.push('/account/needed')} />
      </Card>
      <Card>
        <Button testID="erase-local" kind="danger" title={t.account.eraseLocal} busy={erase.busy} onPress={confirmErase} />
        <Notice text={erased ? t.account.erased : erase.error} tone={erased ? 'ok' : 'danger'} />
      </Card>
    </>
  );
}

function GroupRow({ group, userId, showing, onSwitch }: { group: Group; userId: string; showing: boolean; onSwitch?: () => void }) {
  return (
    <View style={styles.groupRow}>
      <Pressable testID={`open-group-${group.id}`} accessibilityRole="button" onPress={() => router.push({ pathname: '/group/[id]', params: { id: group.id } })}>
        <Txt bold>
          {group.name} {'›'}
        </Txt>
        <Txt size={14} tone="muted">
          {t.group.summary(memberIds(group).length, isAdmin(group, userId))}
          {showing ? ` · ${t.account.showing}` : ''}
        </Txt>
      </Pressable>
      {!showing && onSwitch ? <Button kind="plain" title={t.account.switchTo} onPress={onSwitch} /> : null}
    </View>
  );
}

function SignedIn() {
  const { user, groups, own, current, choose, backend } = useSession();
  const send = useAction();
  const check = useAction();
  const out = useAction();
  const [note, setNote] = useState<string | null>(null);
  if (!user) return null;
  const others = groups.filter((g) => g.id !== own?.id);
  return (
    <>
      <Card>
        <View style={styles.line}>
          <Txt bold size={18} testID="profile-name">
            {user.name}
          </Txt>
          <Link href="/account/name" testID="edit-name">
            <Txt tone="accent">{t.account.editName}</Txt>
          </Link>
        </View>
        <Txt tone="muted">{user.email}</Txt>
      </Card>
      {!user.emailConfirmed && (
        <Card highlight>
          <Txt bold>{t.account.confirmEmail}</Txt>
          <Txt size={14} tone="muted">
            {t.account.confirmWhy}
          </Txt>
          <Button
            testID="send-again"
            kind="plain"
            title={t.account.sendAgain}
            busy={send.busy}
            onPress={() => void send.run(() => backend.sendConfirmation()).then((ok) => setNote(ok ? t.account.sentAgain : null))}
          />
          <Button
            testID="have-confirmed"
            kind="plain"
            title={t.account.haveConfirmed}
            busy={check.busy}
            onPress={() => void check.run(() => backend.refreshUser()).then((ok) => setNote(ok ? t.account.notYetConfirmed : null))}
          />
          <Notice text={send.error ?? check.error} />
          <Notice text={note} tone="muted" />
        </Card>
      )}
      <Card>
        <Txt size={13} bold tone="muted">
          {t.account.myGroup}
        </Txt>
        {own ? <GroupRow group={own} userId={user.id} showing={current?.id === own.id} onSwitch={() => choose(own.id)} /> : <Txt tone="muted">…</Txt>}
        {others.length > 0 && (
          <Txt size={13} bold tone="muted">
            {t.account.otherGroups}
          </Txt>
        )}
        {others.map((g) => (
          <GroupRow key={g.id} group={g} userId={user.id} showing={current?.id === g.id} onSwitch={() => choose(g.id)} />
        ))}
        <Button testID="join-another" kind="plain" title={t.account.joinWithCode} onPress={() => router.push('/group/join')} />
      </Card>
      <Card>
        <Button testID="sign-out" kind="plain" title={t.account.signOut} busy={out.busy} onPress={() => void out.run(() => backend.signOut())} />
        <Button testID="delete-account" kind="danger" title={t.account.delete} onPress={() => router.push('/account/delete')} />
        <Notice text={out.error} />
      </Card>
    </>
  );
}

export default function ProfileScreen() {
  const c = useTheme();
  const { ready, user } = useSession();
  return (
    <Screen>
      <Txt size={28} bold accessibilityRole="header">
        {t.tabs.profile}
      </Txt>
      {!ready ? null : user ? <SignedIn /> : <Guest />}
      <Card>
        <Line label={t.profile.version} value={Constants.expoConfig?.version ?? ''} />
        <View testID="variant">
          <Line label={t.profile.variant} value={t.profile.variants[variant] ?? variant} />
        </View>
        <Line label={t.profile.privacy} value={t.profile.comingLater} />
        <Line label={t.profile.sources} value={t.profile.comingLater} />
      </Card>
      {variant !== 'production' && (
        <Link href="/self-check" asChild>
          <Pressable testID="open-self-check" accessibilityRole="button" style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Card>
              <Txt bold tone="accent">
                {t.profile.selfCheck}
              </Txt>
              <Txt size={14} style={{ color: c.muted }}>
                {t.profile.selfCheckHint}
              </Txt>
            </Card>
          </Pressable>
        </Link>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' },
  groupRow: { gap: 8 },
});
