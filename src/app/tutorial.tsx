/* The first-run tutorial: three screens, moved through with worded buttons, skippable.
   It opens by itself once (see the tabs layout) and again from Profile on request (`replay`). */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Avatar, Button, Card, Divider, Screen, Txt, type IconName } from '@/ui/components';
import { useSession } from '@/ui/session';
import { t } from '@/ui/strings';
import { ARABIC_FONT, radius, size, useTheme } from '@/ui/theme';
import { markTutorialSeen } from '@/ui/tutorial';

const POINT_ICONS: IconName[] = ['cloud-offline-outline', 'lock-closed-outline', 'eye-outline'];

/** A plain drawing of the Kaaba, made of boxes so it needs no picture file. */
function Emblem() {
  const c = useTheme();
  return (
    <View style={[styles.emblem, { backgroundColor: c.heroTrack }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.cube, { borderColor: c.gold }]}>
        <View style={[styles.band, { backgroundColor: c.gold }]} />
        <View style={[styles.door, { borderColor: c.gold }]} />
      </View>
    </View>
  );
}

function Dots({ step, onHero }: { step: number; onHero: boolean }) {
  const c = useTheme();
  return (
    <View style={styles.dots} accessible accessibilityRole="image" accessibilityLabel={t.tutorial.step(step + 1)}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.dot, i === step && styles.dotOn, { backgroundColor: i === step ? (onHero ? c.gold : c.accent) : onHero ? c.heroLine : c.line }]} />
      ))}
    </View>
  );
}

export default function Tutorial() {
  const c = useTheme();
  // `step` lets a link open on a given screen (1 to 3); used for screenshots and by nothing in the app.
  const { replay, step: startAt } = useLocalSearchParams<{ replay?: string; step?: string }>();
  const { user } = useSession();
  const [step, setStep] = useState(() => Math.min(2, Math.max(0, (Number(startAt) || 1) - 1)));
  const onHero = step === 0;
  const body = onHero ? 'onHeroMuted' : 'muted';

  const leave = async (to: 'look' | 'account') => {
    await markTutorialSeen();
    if (replay) {
      if (to === 'account') return router.replace('/account/sign-up');
      return router.canGoBack() ? router.back() : router.replace('/profile'); // opened by a link: there is nothing to go back to
    }
    if (to === 'look') return router.replace('/');
    router.replace('/profile');
    router.push('/account/sign-up');
  };

  return (
    <Screen edges={['top', 'bottom']} scroll={false} tone={onHero ? 'hero' : 'background'}>
      <View style={styles.page} testID={`tutorial-${step + 1}`}>
        <View style={styles.top}>
          {step > 0 ? <Button testID="tutorial-back" kind="plain" title={t.back} onPress={() => setStep(step - 1)} /> : <View />}
          {step < 2 ? <Button testID="tutorial-skip" kind="plain" on={onHero ? 'hero' : 'page'} title={t.tutorial.skip} onPress={() => setStep(2)} /> : null}
        </View>

        <ScrollView contentContainerStyle={styles.middle}>
          {step === 0 ? (
            <>
              <Emblem />
              <View style={styles.words}>
                <Txt tone="gold" size={size.title} style={styles.arabic}>
                  {t.tutorial.talbiyah}
                </Txt>
                <Txt tone="onHero" size={size.title} accessibilityRole="header" style={[styles.heading, styles.centre]}>
                  {t.tutorial.welcomeTitle}
                </Txt>
                <Txt tone="onHeroMuted" size={size.body} style={[styles.body, styles.centre]}>
                  {t.tutorial.welcomeBody}
                </Txt>
                <Txt tone="onHeroMuted" size={size.label} style={styles.centre}>
                  {t.tutorial.talbiyahSource}
                </Txt>
              </View>
            </>
          ) : step === 1 ? (
            <>
              <Card>
                <Txt size={size.label} bold tone="muted" style={styles.caps}>
                  {t.tutorial.sampleGroup}
                </Txt>
                <View style={styles.person}>
                  <Avatar name={t.tutorial.samplePeople[0]} tone="accent" />
                  <View>
                    <Txt bold>{t.tutorial.samplePeople[0]}</Txt>
                    <Txt size={size.small} tone="muted">
                      {t.group.admin}
                    </Txt>
                  </View>
                </View>
                <Divider />
                <View style={styles.person}>
                  <Avatar name={t.tutorial.samplePeople[1]} tone="gold" />
                  <Txt bold>{t.tutorial.samplePeople[1]}</Txt>
                </View>
                <View style={[styles.code, { backgroundColor: c.accentSoft }]}>
                  <View>
                    <Txt size={size.label} tone="muted">
                      {t.group.code}
                    </Txt>
                    <Txt size={size.heading} style={styles.codeText}>
                      {t.tutorial.sampleCode}
                    </Txt>
                  </View>
                  <Ionicons name="share-outline" size={24} color={c.accent} />
                </View>
              </Card>
              <View style={styles.words}>
                <Txt size={size.title} accessibilityRole="header" style={styles.heading}>
                  {t.tutorial.groupTitle}
                </Txt>
                <Txt tone={body} size={size.body} style={styles.body}>
                  {t.tutorial.groupBody}
                </Txt>
              </View>
            </>
          ) : (
            <>
              <View style={styles.points}>
                {t.tutorial.points.map((p, i) => (
                  <Card key={p.title}>
                    <View style={styles.person}>
                      <View style={[styles.pointIcon, { backgroundColor: c.accentSoft }]}>
                        <Ionicons name={POINT_ICONS[i]} size={22} color={c.accent} />
                      </View>
                      <View style={styles.fill}>
                        <Txt bold>{p.title}</Txt>
                        <Txt size={size.small} tone="muted">
                          {p.body}
                        </Txt>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
              <View style={styles.words}>
                <Txt size={size.title} accessibilityRole="header" style={styles.heading}>
                  {t.tutorial.readyTitle}
                </Txt>
                <Txt tone={body} size={size.body} style={styles.body}>
                  {t.tutorial.readyBody}
                </Txt>
              </View>
            </>
          )}
        </ScrollView>

        {/* The buttons stay on screen however large the text is; the words above them scroll. */}
        <View style={styles.bottom}>
          <Dots step={step} onHero={onHero} />
          {step < 2 ? (
            <Button testID="tutorial-next" on={onHero ? 'hero' : 'page'} title={t.tutorial.next} onPress={() => setStep(step + 1)} />
          ) : user ? (
            <Button testID="tutorial-done" title={t.tutorial.done} onPress={() => void leave('look')} />
          ) : (
            <>
              <Button testID="tutorial-create" title={t.account.create} onPress={() => void leave('account')} />
              <Button testID="tutorial-look" kind="outline" title={t.tutorial.lookAround} onPress={() => void leave('look')} />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  page: { flex: 1, paddingHorizontal: 28, paddingBottom: 12 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48 },
  middle: { flexGrow: 1, justifyContent: 'center', gap: 28, paddingVertical: 16 },
  bottom: { gap: 12, paddingTop: 12 },
  words: { gap: 14 },
  heading: { fontWeight: '700', letterSpacing: -0.5 },
  body: { lineHeight: 25 },
  centre: { textAlign: 'center' },
  caps: { letterSpacing: 0.8, textTransform: 'uppercase' },
  arabic: { fontFamily: ARABIC_FONT, textAlign: 'center', writingDirection: 'rtl', lineHeight: 52 },
  emblem: { width: 132, height: 132, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  cube: { width: 64, height: 62, borderWidth: 3, borderRadius: 5, alignItems: 'center', justifyContent: 'flex-end' },
  band: { position: 'absolute', top: 14, left: 0, right: 0, height: 3 },
  door: { width: 18, height: 24, borderWidth: 3, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  dots: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', paddingBottom: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  dotOn: { width: 28 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  code: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.field, paddingVertical: 14, paddingHorizontal: 16 },
  codeText: { fontWeight: '700', letterSpacing: 2 },
  points: { gap: 12 },
  pointIcon: { width: 44, height: 44, borderRadius: radius.icon, alignItems: 'center', justifyContent: 'center' },
});
