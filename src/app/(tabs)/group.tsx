import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { isAdmin, memberIds } from '@/core/groups/rules';
import { Button, Card, Divider, HeroCard, Row, Screen, SectionLabel, Title, Txt } from '@/ui/components';
import { GroupView } from '@/ui/group-view';
import { useSession } from '@/ui/session';
import { t } from '@/ui/strings';
import { size } from '@/ui/theme';

function Guest() {
  return (
    <>
      <Title>{t.tabs.group}</Title>
      <HeroCard>
        <Txt size={size.heading} tone="onHero" style={styles.heavy}>
          {t.group.guestTitle}
        </Txt>
        <Txt tone="onHeroMuted" style={styles.body}>
          {t.group.guestBody}
        </Txt>
        <Button testID="group-create" on="hero" title={t.account.create} onPress={() => router.push('/account/sign-up')} />
        <Button testID="group-sign-in" on="hero" kind="outline" title={t.account.signIn} onPress={() => router.push('/account/sign-in')} />
      </HeroCard>
      <Card tight>
        <Row testID="group-have-code" icon="keypad-outline" label={t.group.haveCode} onPress={() => router.push('/account/needed')} />
      </Card>
      <Txt testID="group-guest-note" size={size.small} tone="muted">
        {t.group.guestNote}
      </Txt>
    </>
  );
}

export default function GroupTab() {
  const { ready, user, current, groups, choose } = useSession();
  if (!ready) return <Screen>{null}</Screen>;
  if (!user) {
    return (
      <Screen>
        <Guest />
      </Screen>
    );
  }
  return (
    <Screen>
      {/* The key gives each group its own fresh view: a half-typed rename or an open code never carries over to another group. */}
      {current ? <GroupView key={current.id} group={current} user={user} /> : <Title>{t.tabs.group}</Title>}
      <View style={styles.section}>
        {/* Someone in more than one group changes which is showing here, from a list they can see. */}
        {groups.length > 1 ? <SectionLabel>{t.group.yourGroups}</SectionLabel> : null}
        <Card tight>
          {groups.length > 1
            ? groups.map((g) => {
                const showing = g.id === current?.id;
                return (
                  <View key={g.id}>
                    <Row
                      testID={`switch-${g.id}`}
                      icon={showing ? 'checkmark-circle-outline' : 'people-outline'}
                      label={g.name}
                      sub={t.group.summary(memberIds(g).length, isAdmin(g, user.id)) + (showing ? ` · ${t.account.showing}` : '')}
                      onPress={showing ? undefined : () => choose(g.id)}
                    />
                    <Divider />
                  </View>
                );
              })
            : null}
          <Row testID="join-another" icon="keypad-outline" label={t.account.joinWithCode} onPress={() => router.push('/group/join')} />
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  heavy: { fontWeight: '700' },
  body: { lineHeight: 23 },
  section: { gap: 10 },
});
