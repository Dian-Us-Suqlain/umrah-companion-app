import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Divider, Notice, Row, Screen, Title, Txt } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';
import { size } from '@/ui/theme';

const variant = String(Constants.expoConfig?.extra?.variant ?? 'development');

/** The rows every profile ends with, guest or signed in. */
function Common() {
  return (
    <>
      <Row testID="show-tutorial" icon="help-circle-outline" label={t.tutorial.showAgain} onPress={() => router.push({ pathname: '/tutorial', params: { replay: '1' } })} />
      <Divider />
      <Row icon="shield-checkmark-outline" label={t.profile.privacy} value={t.profile.comingLater} />
      <Divider />
      <Row icon="book-outline" label={t.profile.sources} value={t.profile.comingLater} />
    </>
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
        <View style={styles.who}>
          <Avatar big />
          <View style={styles.fill}>
            <Txt bold size={size.large}>
              {t.account.guestTitle}
            </Txt>
            <Txt size={size.small} tone="muted">
              {t.account.guestNote}
            </Txt>
          </View>
        </View>
        <Txt tone="muted">{t.account.why}</Txt>
        <Button testID="guest-create" title={t.account.create} onPress={() => router.push('/account/sign-up')} />
        <Button testID="guest-sign-in" kind="outline" title={t.account.signIn} onPress={() => router.push('/account/sign-in')} />
      </Card>
      <Card tight>
        <Row testID="guest-join" icon="keypad-outline" label={t.account.joinWithCode} onPress={() => router.push('/account/needed')} />
        <Divider />
        <Common />
      </Card>
      <Button testID="erase-local" kind="danger" title={t.account.eraseLocal} busy={erase.busy} onPress={confirmErase} />
      <Notice text={erased ? t.account.erased : erase.error} tone={erased ? 'ok' : 'danger'} />
    </>
  );
}

function SignedIn() {
  const { user, backend } = useSession();
  const send = useAction();
  const check = useAction();
  const out = useAction();
  const [note, setNote] = useState<string | null>(null);
  if (!user) return null;
  return (
    <>
      <Card>
        <View style={styles.who}>
          <Avatar big name={user.name} tone="accent" />
          <View style={styles.fill}>
            <Txt bold size={size.large} testID="profile-name">
              {user.name}
            </Txt>
            <Txt size={size.small} tone="muted">
              {user.email}
            </Txt>
          </View>
        </View>
      </Card>
      {!user.emailConfirmed && (
        <Card highlight>
          <Txt bold>{t.account.confirmEmail}</Txt>
          <Txt size={size.small} tone="muted">
            {t.account.confirmWhy}
          </Txt>
          <Button
            testID="have-confirmed"
            kind="outline"
            title={t.account.haveConfirmed}
            busy={check.busy}
            onPress={() => void check.run(() => backend.refreshUser()).then((ok) => setNote(ok ? t.account.notYetConfirmed : null))}
          />
          <Button
            testID="send-again"
            kind="plain"
            title={t.account.sendAgain}
            busy={send.busy}
            onPress={() => void send.run(() => backend.sendConfirmation()).then((ok) => setNote(ok ? t.account.sentAgain : null))}
          />
          <Notice text={send.error ?? check.error} />
          <Notice text={note} tone="muted" />
        </Card>
      )}
      <Card tight>
        <Row testID="edit-name" icon="create-outline" label={t.account.editName} onPress={() => router.push('/account/name')} />
        <Divider />
        <Row testID="profile-join" icon="keypad-outline" label={t.account.joinWithCode} onPress={() => router.push('/group/join')} />
        <Divider />
        <Common />
      </Card>
      <Card tight>
        <Row testID="sign-out" icon="log-out-outline" label={t.account.signOut} onPress={() => void out.run(() => backend.signOut())} />
        <Divider />
        <Row testID="delete-account" danger icon="trash-outline" label={t.account.delete} onPress={() => router.push('/account/delete')} />
      </Card>
      <Notice text={out.error} />
    </>
  );
}

export default function ProfileScreen() {
  const { ready, user } = useSession();
  return (
    <Screen>
      <Title>{t.tabs.profile}</Title>
      {!ready ? null : user ? <SignedIn /> : <Guest />}
      {variant !== 'production' && (
        <Card tight>
          <Row testID="open-self-check" icon="construct-outline" label={t.profile.selfCheck} sub={t.profile.selfCheckHint} onPress={() => router.push('/self-check')} />
        </Card>
      )}
      <View style={styles.foot}>
        <Txt size={size.label} tone="muted">
          {t.profile.version} {Constants.expoConfig?.version ?? ''}
        </Txt>
        <View testID="variant" style={styles.footLine}>
          <Txt size={size.label} tone="muted">
            {t.profile.variant}:
          </Txt>
          <Txt size={size.label} tone="muted">
            {t.profile.variants[variant] ?? variant}
          </Txt>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  who: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  foot: { alignItems: 'center', gap: 2 },
  footLine: { flexDirection: 'row', gap: 4 },
});
