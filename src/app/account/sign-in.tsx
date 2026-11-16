import { router } from 'expo-router';
import { useState } from 'react';

import { validEmail } from '@/core/groups/rules';
import { Button, Field, Notice, Screen } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';

export default function SignIn() {
  const { backend } = useSession();
  const { busy, error, setError, run } = useAction();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = () => {
    if (!validEmail(email) || !password) return setError(t.problems['wrong-credentials']);
    void run(() => backend.signIn(email, password)).then((ok) => ok && router.dismissTo('/profile'));
  };

  return (
    <Screen edges={['bottom']}>
      <Field testID="email" label={t.account.email} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
      <Field testID="password" label={t.account.password} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
      <Notice text={error} />
      <Button testID="submit" title={t.account.signInButton} busy={busy} onPress={submit} />
      <Button testID="forgot" kind="plain" title={t.account.forgot} onPress={() => router.push('/account/forgot')} />
    </Screen>
  );
}
