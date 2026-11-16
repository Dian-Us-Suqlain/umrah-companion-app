import { router } from 'expo-router';
import { useState } from 'react';

import { canJoin, type Invite } from '@/core/groups/invites';
import { AppError } from '@/data/backend';
import { Button, Card, Field, Notice, Screen, Txt } from '@/ui/components';
import { useAction, useSession } from '@/ui/session';
import { t } from '@/ui/strings';

export default function JoinGroup() {
  const { backend, user, groups, choose } = useSession();
  const { busy, error, setError, run } = useAction();
  const [code, setCode] = useState('');
  const [found, setFound] = useState<Invite | null>(null);
  const [already, setAlready] = useState<string | null>(null);
  if (!user) return <Screen edges={['bottom']}>{null}</Screen>;

  if (!user.emailConfirmed) {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Txt testID="join-needs-email">{t.group.joinNeedsEmail}</Txt>
          <Button kind="plain" title={t.account.sendAgain} busy={busy} onPress={() => void run(() => backend.sendConfirmation())} />
          <Notice text={error} />
        </Card>
      </Screen>
    );
  }

  const find = () => {
    setFound(null);
    setAlready(null);
    void run(async () => {
      const invite = await backend.lookupInvite(code);
      const verdict = canJoin(invite, groups.find((g) => g.id === invite?.groupId) ?? null, user.id, user.emailConfirmed, Date.now());
      if (!verdict.ok && verdict.why === 'already-member') return setAlready(invite?.groupName ?? '');
      if (!verdict.ok || !invite) throw new AppError('invalid-code');
      setFound(invite);
    });
  };
  const join = () => {
    if (!found) return;
    void run(() => backend.join(code, found, user)).then((ok) => {
      if (!ok) return setFound(null);
      choose(found.groupId);
      router.dismissTo('/profile');
    });
  };

  return (
    <Screen edges={['bottom']}>
      <Card>
        <Field
          testID="code"
          label={t.group.enterCode}
          placeholder={t.group.codePlaceholder}
          value={code}
          onChangeText={(v) => (setCode(v), setFound(null), setAlready(null), setError(null))}
          autoCapitalize="characters"
          editable={!busy}
        />
        <Notice text={error} />
        <Notice text={already !== null ? t.group.already(already) : null} tone="muted" />
        {!found ? <Button testID="find" title={t.group.find} busy={busy} disabled={!code.trim()} onPress={find} /> : null}
      </Card>
      {found ? (
        <Card highlight>
          <Txt testID="join-ask" bold size={18}>
            {t.group.joinAsk(found.groupName)}
          </Txt>
          <Txt tone="muted">{t.group.joinAdmin(found.adminName)}</Txt>
          <Button testID="join" title={t.group.join} busy={busy} onPress={join} />
          <Button kind="plain" title={t.cancel} disabled={busy} onPress={() => setFound(null)} />
        </Card>
      ) : null}
    </Screen>
  );
}
