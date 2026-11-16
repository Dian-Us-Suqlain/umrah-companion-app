import { router } from 'expo-router';
import { useState } from 'react';

import { validName } from '@/core/groups/rules';
import { Button, Card, Field, Notice, Screen } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';

export default function EditName() {
  const { backend, user, groups } = useSession();
  const { busy, error, setError, run } = useAction();
  const [name, setName] = useState(user?.name ?? '');

  const submit = () => {
    if (!validName(name)) return setError(t.account.nameNeeded);
    void run(() => backend.setName(name, groups.map((g) => g.id))).then((ok) => ok && router.back());
  };

  return (
    <Screen edges={['bottom']}>
      <Card>
        <Field testID="name" label={t.account.name} value={name} onChangeText={setName} autoCapitalize="words" />
        <Notice text={error} />
        <Button testID="submit" title={t.save} busy={busy} onPress={submit} />
      </Card>
    </Screen>
  );
}
