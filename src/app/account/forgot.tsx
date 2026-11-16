import { useState } from 'react';

import { validEmail } from '@/core/groups/rules';
import { Button, Card, Field, Notice, Screen, Txt } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';

export default function Forgot() {
  const { backend } = useSession();
  const { busy, error, setError, run } = useAction();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    setSent(false);
    if (!validEmail(email)) return setError(t.problems['invalid-email']);
    void run(() => backend.sendPasswordReset(email)).then(setSent);
  };

  return (
    <Screen edges={['bottom']}>
      <Card>
        <Txt tone="muted">{t.account.forgotNote}</Txt>
        <Field testID="email" label={t.account.email} value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" textContentType="emailAddress" />
        <Notice text={error} />
        {/* The same words whether or not the address has an account. */}
        <Notice text={sent ? t.account.resetSent : null} tone="ok" />
        <Button testID="submit" title={t.account.sendReset} busy={busy} onPress={submit} />
      </Card>
    </Screen>
  );
}
