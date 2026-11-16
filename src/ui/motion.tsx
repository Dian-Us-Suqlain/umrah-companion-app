/* Movement and touch feedback. Every part here does nothing but sit in its final place when the phone's
   Reduce Motion setting is on, and nothing in the app depends on a movement having been seen. */
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated';

/** True when the phone's Reduce Motion setting is on. Timed animations already obey it by themselves;
    this is for the ones that repeat for ever, which are simply not started. */
export function useCalm(): boolean {
  const [calm, setCalm] = useState(false);
  useEffect(() => {
    let live = true;
    AccessibilityInfo.isReduceMotionEnabled().then((on) => live && setCalm(on), () => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setCalm);
    return () => {
      live = false;
      sub.remove();
    };
  }, []);
  return calm;
}

/** A light tap felt on the main button. Phones without haptics, or with them off, simply do nothing. */
export const tapFeel = () => {
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  } catch {}
};
/** The "it worked" tap: joining, copying a code. */
export const successFeel = () => {
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  } catch {}
};

const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);

/** A part of a screen that eases up into place. `order` staggers the parts so the eye is led down the screen. */
export function Rise({ children, order = 0, style }: { children: ReactNode; order?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.delay(order * 70).duration(450).easing(EASE)} style={style}>
      {children}
    </Animated.View>
  );
}

/** A dot with a ring that spreads and fades, for "this is happening now". Still, when motion is reduced. */
export function Pulse({ colour, size = 10 }: { colour: string; size?: number }) {
  const calm = useCalm();
  const beat = useSharedValue(0);
  useEffect(() => {
    beat.value = calm ? 0 : withRepeat(withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }), -1, false);
  }, [calm, beat]);
  const ring = useAnimatedStyle(() => ({ opacity: 0.55 * (1 - beat.value), transform: [{ scale: 1 + 1.8 * beat.value }] }));
  const dot = { width: size, height: size, borderRadius: size / 2, backgroundColor: colour };
  return (
    <View style={[styles.centre, { width: size, height: size }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {calm ? null : <Animated.View style={[StyleSheet.absoluteFill, dot, ring]} />}
      <View style={dot} />
    </View>
  );
}

/** A bar that fills to `fraction` (0 to 1) when it first shows, and follows later changes. */
export function Fill({ fraction, colour, track, label }: { fraction: number; colour: string; track: string; label: string }) {
  const target = Math.max(0, Math.min(1, fraction)) * 100;
  const width = useSharedValue(0);
  useEffect(() => {
    width.value = withDelay(250, withTiming(target, { duration: 1100, easing: EASE }));
  }, [target, width]);
  const bar = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  return (
    <View style={[styles.bar, { backgroundColor: track }]} accessible accessibilityRole="progressbar" accessibilityLabel={label}>
      <Animated.View style={[styles.bar, { backgroundColor: colour }, bar]} />
    </View>
  );
}

/** Something that grows in and settles when it becomes `active`, such as the picture on a tutorial page. */
export function Appear({ active, children, style }: { active: boolean; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const shown = useSharedValue(active ? 1 : 0);
  useEffect(() => {
    shown.value = withTiming(active ? 1 : 0, { duration: 550, easing: EASE });
  }, [active, shown]);
  const look = useAnimatedStyle(() => ({ opacity: 0.25 + 0.75 * shown.value, transform: [{ scale: 0.86 + 0.14 * shown.value }] }));
  return <Animated.View style={[style, look]}>{children}</Animated.View>;
}

/** One of the tutorial's step marks: short, and long when it is the current step. */
export function StepMark({ on, colour, offColour }: { on: boolean; colour: string; offColour: string }) {
  const w = useSharedValue(on ? 28 : 8);
  useEffect(() => {
    w.value = withTiming(on ? 28 : 8, { duration: 350, easing: EASE });
  }, [on, w]);
  const look = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View style={[styles.mark, { backgroundColor: on ? colour : offColour }, look]} />;
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  bar: { height: 6, borderRadius: 3 },
  mark: { height: 8, borderRadius: 4 },
});
