/* The first-run tutorial: three screens side by side. Swipe between them, or use the buttons:
   every swipe has a button that does the same thing. It opens by itself once (see the tabs layout)
   and again from Profile on request (`replay`). */
import Ionicons from '@expo/vector-icons/Ionicons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';

import { Avatar, Button, Card, Divider, Screen, Txt, type IconName } from '@/ui/components';
import { Appear, StepMark, useCalm } from '@/ui/motion';
import { useSession } from '@/ui/session';
import { t } from '@/ui/strings';
import { ARABIC_FONT, radius, size, useTheme } from '@/ui/theme';
import { markTutorialSeen } from '@/ui/tutorial';

const POINT_ICONS: IconName[] = ['cloud-offline-outline', 'lock-closed-outline', 'eye-outline'];
const LAST = 2;

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

function Words({ title, body, children }: { title: string; body: string; children?: ReactNode }) {
  return (
    <View style={styles.words}>
      {children}
      <Txt tone="onHero" size={size.title} accessibilityRole="header" style={styles.heading}>
        {title}
      </Txt>
      <Txt tone="onHeroMuted" size={size.body} style={styles.body}>
        {body}
      </Txt>
    </View>
  );
}

export default function Tutorial() {
  const c = useTheme();
  const calm = useCalm();
  const { width } = useWindowDimensions();
  // `step` lets a link open on a given screen (1 to 3); used for screenshots and by nothing in the app.
  const { replay, step: startAt } = useLocalSearchParams<{ replay?: string; step?: string }>();
  const { user } = useSession();
  const first = Math.min(LAST, Math.max(0, (Number(startAt) || 1) - 1));
  const [step, setStep] = useState(first);
  const pager = useRef<ScrollView>(null);
  const leaving = useRef(false);

  /** The buttons' way of moving: the same place a swipe would reach. */
  const go = (to: number) => {
    const next = Math.min(LAST, Math.max(0, to));
    setStep(next);
    pager.current?.scrollTo({ x: next * width, animated: !calm });
  };
  /** The swipe's way of moving: when the pages come to rest, the buttons and marks catch up. */
  const settled = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (width <= 0) return;
    const at = Math.min(LAST, Math.max(0, Math.round(e.nativeEvent.contentOffset.x / width)));
    setStep((was) => (was === at ? was : at));
  };
  // A link that opens on a later screen, or a phone turned on its side: put the pages where the step says.
  useEffect(() => {
    pager.current?.scrollTo({ x: step * width, animated: false });
    // only when the width changes; moving between steps is `go` and `settled`
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width]);

  const leave = async (to: 'look' | 'account') => {
    if (leaving.current) return; // one tap, one exit
    leaving.current = true;
    await markTutorialSeen();
    if (replay) {
      if (to === 'account') return router.replace('/account/sign-up');
      return router.canGoBack() ? router.back() : router.replace('/profile'); // opened by a link: there is nothing to go back to
    }
    if (to === 'look') return router.replace('/');
    router.replace('/profile');
    router.push('/account/sign-up');
  };

  const page = { width };
  return (
    <Screen edges={['top', 'bottom']} scroll={false} tone="hero">
      <View style={styles.fill} testID={`tutorial-${step + 1}`}>
        <View style={styles.top}>
          {step > 0 ? <Button testID="tutorial-back" kind="plain" on="hero" title={t.back} onPress={() => go(step - 1)} /> : <View />}
          {step < LAST ? <Button testID="tutorial-skip" kind="plain" on="hero" title={t.tutorial.skip} onPress={() => go(LAST)} /> : null}
        </View>

        <ScrollView ref={pager} testID="tutorial-pager" horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentOffset={{ x: first * width, y: 0 }} onScroll={settled} scrollEventThrottle={32} onMomentumScrollEnd={settled} style={styles.fill}>
          <ScrollView style={page} contentContainerStyle={styles.middle}>
            <Appear active={step === 0}>
              <Emblem />
            </Appear>
            <Words title={t.tutorial.welcomeTitle} body={t.tutorial.welcomeBody}>
              <Txt tone="gold" size={size.title} style={styles.arabic}>
                {t.tutorial.talbiyah}
              </Txt>
            </Words>
            <Txt tone="onHeroMuted" size={size.label} style={styles.centre}>
              {t.tutorial.talbiyahSource}
            </Txt>
          </ScrollView>

          <ScrollView style={page} contentContainerStyle={styles.middle}>
            <Appear active={step === 1}>
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
            </Appear>
            <Words title={t.tutorial.groupTitle} body={t.tutorial.groupBody} />
          </ScrollView>

          <ScrollView style={page} contentContainerStyle={styles.middle}>
            <Appear active={step === 2} style={styles.points}>
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
            </Appear>
            <Words title={t.tutorial.readyTitle} body={t.tutorial.readyBody} />
          </ScrollView>
        </ScrollView>

        {/* The buttons stay on screen however large the text is; the words above them scroll. */}
        <View style={styles.bottom}>
          <View style={styles.marks} accessible accessibilityRole="image" accessibilityLabel={t.tutorial.step(step + 1)}>
            {Array.from({ length: LAST + 1 }, (_, i) => i).map((i) => (
              <StepMark key={i} on={i === step} colour={c.gold} offColour={c.heroLine} />
            ))}
          </View>
          {step < LAST ? (
            <Button testID="tutorial-next" on="hero" title={t.tutorial.next} onPress={() => go(step + 1)} />
          ) : user ? (
            <Button testID="tutorial-done" on="hero" title={t.tutorial.done} onPress={() => void leave('look')} />
          ) : (
            <>
              <Button testID="tutorial-create" on="hero" title={t.account.create} onPress={() => void leave('account')} />
              <Button testID="tutorial-look" on="hero" kind="outline" title={t.tutorial.lookAround} onPress={() => void leave('look')} />
            </>
          )}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 48, paddingHorizontal: 16 },
  middle: { flexGrow: 1, justifyContent: 'center', gap: 24, paddingVertical: 16, paddingHorizontal: 28 },
  bottom: { gap: 12, paddingTop: 12, paddingHorizontal: 28, paddingBottom: 12 },
  words: { gap: 14 },
  heading: { fontWeight: '700', letterSpacing: -0.5, textAlign: 'center' },
  body: { lineHeight: 25, textAlign: 'center' },
  centre: { textAlign: 'center' },
  caps: { letterSpacing: 0.8, textTransform: 'uppercase' },
  arabic: { fontFamily: ARABIC_FONT, textAlign: 'center', writingDirection: 'rtl', lineHeight: 52 },
  emblem: { width: 132, height: 132, borderRadius: 40, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  cube: { width: 64, height: 62, borderWidth: 3, borderRadius: 5, alignItems: 'center', justifyContent: 'flex-end' },
  band: { position: 'absolute', top: 14, left: 0, right: 0, height: 3 },
  door: { width: 18, height: 24, borderWidth: 3, borderBottomWidth: 0, borderTopLeftRadius: 9, borderTopRightRadius: 9 },
  marks: { flexDirection: 'row', gap: 8, justifyContent: 'center', alignItems: 'center', paddingBottom: 8 },
  person: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  code: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: radius.field, paddingVertical: 14, paddingHorizontal: 16 },
  codeText: { fontWeight: '700', letterSpacing: 2 },
  points: { gap: 12 },
  pointIcon: { width: 44, height: 44, borderRadius: radius.icon, alignItems: 'center', justifyContent: 'center' },
});
