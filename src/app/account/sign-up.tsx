import { router } from 'expo-router';
import { useState } from 'react';

import { validEmail, validName, validPassword } from '@/core/groups/rules';
import { Button, Card, Field, Notice, Screen, Txt } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';

export default function SignUp() {
  const { backend } = useSession();
  const { busy, error, setError, run } = useAction();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!validName(name)) return setError(t.account.nameNeeded);
    if (!validEmail(email)) return setError(t.problems['invalid-email']);
    if (!validPassword(password)) return setError(t.problems['weak-password']);
    void run(() => backend.signUp(name, email, password)).then((ok) => ok && router.dismissTo('/profile'));
  };

  return (
    <Screen edges={['bottom']}>
      <Card>
        <Field testID="name" label={t.account.name} value={name} onChangeText={setName} autoCapitalize="words" textContentType="name" />
        <Field testID="email" label={t.account.email} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
        <Field testID="password" label={t.account.password} hint={t.account.passwordHint} value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" />
        <Notice text={error} />
        <Button testID="submit" title={t.account.createButton} busy={busy} onPress={submit} />
        {error === t.problems['email-in-use'] ? <Button testID="to-sign-in" kind="plain" title={t.account.signIn} onPress={() => router.replace('/account/sign-in')} /> : null}
        <Txt size={13} tone="muted">
          {t.account.privacyNote}
        </Txt>
      </Card>
    </Screen>
  );
}
