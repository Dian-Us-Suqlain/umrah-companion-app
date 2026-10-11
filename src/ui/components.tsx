import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View, type TextProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isNow, isPast, type Clock, type Gap, type Row } from '@/core/trip-plan';

import { t } from './strings';
import { useTheme } from './theme';

export function Screen({ children, edges = ['top'] }: { children: ReactNode; edges?: ('top' | 'bottom')[] }) {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c.background }]} edges={edges}>
      <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
    </SafeAreaView>
  );
}

type Tone = 'text' | 'muted' | 'accent' | 'warn' | 'danger' | 'ok';
export function Txt({ tone = 'text', size = 16, bold, style, ...rest }: TextProps & { tone?: Tone; size?: number; bold?: boolean }) {
  const c = useTheme();
  return <Text {...rest} style={[{ color: c[tone], fontSize: size, fontWeight: bold ? '600' : '400' }, style]} />;
}

export function Card({ children, highlight }: { children: ReactNode; highlight?: boolean }) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: highlight ? c.accent : c.line, borderWidth: highlight ? 2 : StyleSheet.hairlineWidth }]}>
      {children}
    </View>
  );
}

export function SampleBanner() {
  const c = useTheme();
  return (
    <View style={[styles.banner, { backgroundColor: c.accentSoft }]}>
      <Txt bold tone="accent" size={14}>
        {t.sampleTrip}
      </Txt>
      <Txt tone="muted" size={14}>
        {t.sampleNote}
      </Txt>
    </View>
  );
}

const when = (r: Row): string =>
  r.time
    ? r.endTime
      ? `${r.time} – ${r.endTime}`
      : r.time
    : r.type === 'checkin'
      ? t.checkinDay
      : r.type === 'checkout'
        ? t.checkoutDay
        : r.type === 'due'
          ? t.actionNeeded
          : '';

/** One line of the plan. A cancelled row is struck through and labelled; a past row is dimmed. */
export function PlanRow({ row, now }: { row: Row; now: Clock }) {
  const c = useTheme();
  const cancelled = row.status === 'cancelled';
  const past = !cancelled && isPast(row, now);
  const current = isNow(row, now);
  return (
    <View style={[styles.row, { opacity: past ? 0.5 : 1 }]}>
      <Txt size={14} tone={cancelled ? 'danger' : current ? 'accent' : 'muted'} bold={current} style={styles.when}>
        {cancelled ? t.cancelled : when(row)}
      </Txt>
      <View style={styles.fill}>
        <Txt bold style={cancelled ? styles.struck : undefined}>
          {row.title}
        </Txt>
        {cancelled && row.time ? (
          <Txt size={14} tone="muted" style={styles.struck}>
            {row.time}
          </Txt>
        ) : null}
        {row.note ? (
          <Txt size={14} tone="muted">
            {row.note}
          </Txt>
        ) : null}
        <Txt size={14} tone="muted">
          {row.who.join(', ')}
          {row.done ? ` · ${t.done}` : ''}
        </Txt>
      </View>
      <View style={[styles.dot, { backgroundColor: current ? c.accent : 'transparent' }]} />
    </View>
  );
}

export function GapLine({ gap }: { gap: Gap }) {
  const c = useTheme();
  return (
    <View style={[styles.gap, { backgroundColor: c.warnSoft }]}>
      <Txt size={14} tone="warn">
        {gap.text}
      </Txt>
    </View>
  );
}

export function NowLine() {
  const c = useTheme();
  return (
    <View style={styles.nowLine}>
      <Txt size={12} bold tone="accent">
        {t.now.toUpperCase()}
      </Txt>
      <View style={[styles.nowRule, { backgroundColor: c.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: 16, gap: 12, paddingBottom: 32 },
  card: { borderRadius: 14, padding: 14, gap: 10 },
  banner: { borderRadius: 12, padding: 12, gap: 2 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  when: { width: 96 },
  struck: { textDecorationLine: 'line-through' },
  dot: { width: 8, height: 8, borderRadius: 4, marginTop: 7 },
  gap: { borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  nowLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nowRule: { flex: 1, height: 2, borderRadius: 1 },
});
