import { router } from 'expo-router';

import { Button, Card, Screen, Txt } from '@/ui/components';
import { t } from '@/ui/strings';

/** Shown when a guest taps something that needs an account. "Not now" returns them where they were. */
export default function AccountNeeded() {
  return (
    <Screen edges={['bottom']}>
      <Card>
        <Txt>{t.account.neededWhy}</Txt>
        <Button testID="needed-create" title={t.account.create} onPress={() => router.replace('/account/sign-up')} />
        <Button testID="needed-sign-in" kind="plain" title={t.account.signIn} onPress={() => router.replace('/account/sign-in')} />
        <Button testID="not-now" kind="plain" title={t.notNow} onPress={() => router.back()} />
      </Card>
    </Screen>
  );
}
