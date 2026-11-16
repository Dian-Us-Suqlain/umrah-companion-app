import { router, useLocalSearchParams } from 'expo-router';

import { Card, Screen, Txt } from '@/ui/components';
import { GroupView } from '@/ui/group-view';
import { useSession } from '@/ui/session';
import { t } from '@/ui/strings';

/** Any one of the person's groups, opened by its id. The Group tab shows the same view for the current group. */
export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, groups } = useSession();
  const group = groups.find((g) => g.id === id);

  if (!user || !group) {
    return (
      <Screen edges={['bottom']}>
        <Card>
          <Txt testID="group-gone" tone="muted">
            {t.group.gone}
          </Txt>
        </Card>
      </Screen>
    );
  }
  return (
    <Screen edges={['bottom']}>
      <GroupView key={group.id} group={group} user={user} onLeft={() => router.dismissTo('/group')} />
    </Screen>
  );
}
