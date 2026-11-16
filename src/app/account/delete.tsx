import { router } from 'expo-router';
import { useState } from 'react';

import { deletionBlockers, deletionSteps, isOwnGroup } from '@/core/groups/rules';
import { Button, Card, Field, Notice, Screen, Txt } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';

export default function DeleteAccount() {
  const { backend, user, groups } = useSession();
  const { busy, error, run } = useAction();
  const [password, setPassword] = useState('');
  if (!user) return <Screen edges={['bottom']}>{null}</Screen>;

  const blockers = deletionBlockers(groups, user.id);
  const plan = deletionSteps(groups, user.id);
  const carriesOn = groups.filter((g) => isOwnGroup(g, user.id) && plan.leave.includes(g.id));

  return (
    <Screen edges={['bottom']}>
      <Card>
        <Txt>{t.account.deleteWhat}</Txt>
        {carriesOn.map((g) => (
          <Txt key={g.id} tone="muted">
            {t.account.deleteCarriesOn(g.name)}
          </Txt>
        ))}
      </Card>
      {blockers.length > 0 ? (
        blockers.map((g) => (
          <Card key={g.id} highlight>
            <Txt testID="delete-blocked">{t.account.deleteBlocked(g.name)}</Txt>
            <Button kind="plain" title={t.account.openGroup} onPress={() => router.push({ pathname: '/group/[id]', params: { id: g.id } })} />
          </Card>
        ))
      ) : (
        <Card>
          <Field testID="password" label={t.account.passwordAgain} value={password} onChangeText={setPassword} secureTextEntry textContentType="password" />
          <Notice text={error} />
          <Button
            testID="submit"
            kind="danger"
            title={t.account.deleteButton}
            busy={busy}
            disabled={!password}
            onPress={() => void run(() => backend.deleteAccount(password, plan)).then((ok) => ok && router.dismissTo('/profile'))}
          />
        </Card>
      )}
    </Screen>
  );
}
