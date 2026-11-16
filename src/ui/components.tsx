/* The small set of parts every screen is built from. Rules they keep, so screens do not have to:
   nothing tappable is under 48 points tall, all text follows the phone's text-size setting,
   and every control has a label a screen reader can speak. */
import Ionicons from '@expo/vector-icons/Ionicons';
import { Children, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps, type TextProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { isNow, isPast, type Clock, type Gap, type Row as PlanItem } from '@/core/trip-plan';

import { initials } from './initials';
import { Rise, tapFeel } from './motion';
import { t } from './strings';
import { MAIN_BUTTON, MIN_TARGET, radius, size, useTheme, type Colour } from './theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export function Screen({ children, edges = ['top'], scroll = true, tone = 'background' }: { children: ReactNode; edges?: ('top' | 'bottom')[]; scroll?: boolean; tone?: 'background' | 'hero' }) {
  const c = useTheme();
  return (
    <SafeAreaView style={[styles.fill, { backgroundColor: c[tone] }]} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Each part of a screen eases up into place, one after the other. */}
          {Children.toArray(children).map((child, i) => (
            // A part made of several pieces keeps the same space between them as between parts.
            <Rise key={(child as { key?: string }).key ?? i} order={Math.min(i, 6)} style={styles.part}>
              {child}
            </Rise>
          ))}
        </ScrollView>
      ) : (
        children
      )}
    </SafeAreaView>
  );
}

type Tone = Extract<Colour, 'text' | 'muted' | 'accent' | 'onAccent' | 'danger' | 'ok' | 'onHero' | 'onHeroMuted' | 'gold' | 'goldText'>;
type TxtProps = TextProps & { tone?: Tone; size?: number; bold?: boolean };
/** All text in the app. It grows with the phone's text-size setting; do not switch that off. */
export function Txt({ tone = 'text', size: fontSize = size.text, bold, style, ...rest }: TxtProps) {
  const c = useTheme();
  return <Text {...rest} style={[{ color: c[tone], fontSize, fontWeight: bold ? '600' : '400' }, style]} />;
}

/** The name of a screen, with an optional line above it and something on the right (a badge, a button). */
export function Title({ children, above, right, testID }: { children: string; above?: string; right?: ReactNode; testID?: string }) {
  return (
    <View style={styles.titleRow}>
      <View style={styles.fill}>
        {above ? (
          <Txt size={size.small} tone="muted">
            {above}
          </Txt>
        ) : null}
        <Txt testID={testID} size={size.title} accessibilityRole="header" style={styles.title}>
          {children}
        </Txt>
      </View>
      {right}
    </View>
  );
}

export function Card({ children, highlight, tight }: { children: ReactNode; highlight?: boolean; tight?: boolean }) {
  const c = useTheme();
  return <View style={[styles.card, tight && styles.cardTight, { backgroundColor: c.card, borderColor: highlight ? c.accent : c.line, borderWidth: highlight ? 2 : 1 }]}>{children}</View>;
}

/** The green card at the top of a screen: the one thing to look at first. */
export function HeroCard({ children, testID }: { children: ReactNode; testID?: string }) {
  const c = useTheme();
  return (
    <View testID={testID} style={[styles.hero, { backgroundColor: c.hero }]}>
      {children}
    </View>
  );
}

/** A small heading in capitals above a card. */
export function SectionLabel({ children, tone = 'muted' }: { children: ReactNode; tone?: Tone }) {
  return (
    <Txt size={size.label} bold tone={tone} style={styles.sectionLabel}>
      {children}
    </Txt>
  );
}

export function Badge({ text, tone = 'gold' }: { text: string; tone?: 'gold' | 'accent' }) {
  const c = useTheme();
  const gold = tone === 'gold';
  return (
    <View style={[styles.badge, { backgroundColor: gold ? c.goldSoft : c.accent }]}>
      <Txt size={size.label} bold tone={gold ? 'goldText' : 'onAccent'}>
        {text}
      </Txt>
    </View>
  );
}

export function Divider() {
  const c = useTheme();
  return <View style={[styles.divider, { backgroundColor: c.line }]} />;
}

/** A person's initials in a circle; a person icon when there is no name to take them from. */
export function Avatar({ name, tone = 'soft', big }: { name?: string; tone?: 'accent' | 'gold' | 'soft'; big?: boolean }) {
  const c = useTheme();
  const letters = initials(name ?? '');
  const [back, front]: [Colour, Tone] = tone === 'accent' ? ['accent', 'onAccent'] : tone === 'gold' ? ['goldSoft', 'goldText'] : ['accentSoft', 'accent'];
  const d = big ? 56 : 44;
  return (
    <View style={[styles.avatar, { width: d, height: d, borderRadius: d / 2, backgroundColor: c[back] }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {letters ? (
        <Txt bold tone={front} size={big ? size.large : size.text} maxFontSizeMultiplier={1.3}>
          {letters}
        </Txt>
      ) : (
        <Ionicons name="person-outline" size={big ? 26 : 22} color={c[front]} />
      )}
    </View>
  );
}

/** A line in a list: an icon in a soft square, words, and an arrow when it leads somewhere. */
export function Row({ icon, label, sub, value, onPress, testID, danger }: { icon?: IconName; label: string; sub?: string; value?: string; onPress?: () => void; testID?: string; danger?: boolean }) {
  const c = useTheme();
  const inside = (
    <>
      {icon ? (
        <View style={[styles.rowIcon, { backgroundColor: danger ? c.dangerSoft : c.accentSoft }]}>
          <Ionicons name={icon} size={20} color={danger ? c.danger : c.accent} />
        </View>
      ) : null}
      <View style={styles.fill}>
        <Txt tone={danger ? 'danger' : 'text'} style={styles.rowLabel}>
          {label}
        </Txt>
        {sub ? (
          <Txt size={size.small} tone="muted">
            {sub}
          </Txt>
        ) : null}
      </View>
      {value ? (
        <Txt size={size.small} tone="muted">
          {value}
        </Txt>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={c.muted} /> : null}
    </>
  );
  return onPress ? (
    <Pressable testID={testID} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }, pressed && styles.pressed]}>
      {inside}
    </Pressable>
  ) : (
    <View testID={testID} style={styles.row}>
      {inside}
    </View>
  );
}

/** A labelled text box. */
export function Field({ label, hint, ...rest }: TextInputProps & { label: string; hint?: string }) {
  const c = useTheme();
  return (
    <View style={styles.field}>
      <Txt size={size.small} bold>
        {label}
      </Txt>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={c.muted}
        autoCorrect={false}
        {...rest}
        style={[styles.input, { color: c.text, borderColor: c.line, backgroundColor: c.card }]}
      />
      {hint ? (
        <Txt size={size.small} tone="muted">
          {hint}
        </Txt>
      ) : null}
    </View>
  );
}

/** `primary` is the one filled button on a screen. `outline` is a second choice, `plain` a quiet one,
    `danger` anything that removes something. `on="hero"` is for buttons sitting on the green card. */
type ButtonKind = 'primary' | 'outline' | 'plain' | 'danger';
type ButtonProps = { title: string; onPress: () => void; kind?: ButtonKind; on?: 'page' | 'hero'; icon?: IconName; busy?: boolean; disabled?: boolean; testID?: string; grow?: boolean };
/** A button that cannot be pressed while it is busy or disabled, so one tap is one request. */
export function Button({ title, onPress, kind = 'primary', on = 'page', icon, busy, disabled, testID, grow }: ButtonProps) {
  const c = useTheme();
  const off = !!busy || !!disabled;
  const hero = on === 'hero';
  const filled = kind === 'primary';
  const back = filled ? (hero ? c.gold : c.accent) : 'transparent';
  const front = kind === 'danger' ? c.danger : filled ? (hero ? c.hero : c.onAccent) : hero ? c.onHero : c.accent;
  const border = kind === 'plain' ? 'transparent' : kind === 'danger' ? c.danger : filled ? back : hero ? c.heroLine : c.accent;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityState={{ disabled: off, busy: !!busy }}
      disabled={off}
      onPress={() => {
        if (filled) tapFeel(); // the main button answers with a light tap
        onPress();
      }}
      style={({ pressed }) => [styles.button, kind === 'plain' && styles.buttonPlain, grow && styles.fill, { backgroundColor: back, borderColor: border, opacity: off ? 0.45 : pressed ? 0.85 : 1 }, pressed && styles.pressed]}>
      {busy ? <ActivityIndicator color={front} /> : icon ? <Ionicons name={icon} size={20} color={front} /> : null}
      <Txt bold size={size.body} style={[styles.buttonText, { color: front }]}>
        {title}
      </Txt>
    </Pressable>
  );
}

/** A button that is only an icon. `label` is what a screen reader says; use it only where the icon
    opens choices written in words, or sits beside the words it acts on. */
export function IconButton({ icon, label, onPress, testID, open }: { icon: IconName; label: string; onPress: () => void; testID?: string; open?: boolean }) {
  const c = useTheme();
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={open === undefined ? undefined : { expanded: open }}
      onPress={onPress}
      style={({ pressed }) => [styles.iconButton, { backgroundColor: open ? c.accentSoft : 'transparent', opacity: pressed ? 0.6 : 1 }]}>
      <Ionicons name={icon} size={22} color={c.muted} />
    </Pressable>
  );
}

/** A line that explains a problem, or confirms something was done. Problems sit in a tinted panel with an icon,
    so colour is not the only sign. */
export function Notice({ text, tone = 'danger' }: { text?: string | null; tone?: 'danger' | 'ok' | 'muted' }) {
  const c = useTheme();
  if (!text) return null;
  if (tone !== 'danger') {
    return (
      <Txt size={size.small} tone={tone} accessibilityLiveRegion="polite">
        {text}
      </Txt>
    );
  }
  return (
    <View style={[styles.notice, { backgroundColor: c.dangerSoft }]}>
      <Ionicons name="alert-circle-outline" size={20} color={c.danger} />
      <Txt size={size.small} tone="danger" accessibilityLiveRegion="polite" style={styles.fill}>
        {text}
      </Txt>
    </View>
  );
}

const when = (r: PlanItem): string =>
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
export const planRowWhen = when;

/** One line of the plan. A cancelled row is red, says so, and is struck through; a past row is dimmed. */
export function PlanRow({ row, now }: { row: PlanItem; now: Clock }) {
  const cancelled = row.status === 'cancelled';
  const past = !cancelled && isPast(row, now);
  return (
    <View style={[styles.planRow, { opacity: past ? 0.55 : 1 }]}>
      <Txt size={size.small} tone={cancelled ? 'danger' : 'accent'} bold style={styles.when}>
        {cancelled ? t.cancelled : when(row)}
      </Txt>
      <View style={styles.fill}>
        <Txt bold tone={cancelled ? 'muted' : 'text'} style={cancelled ? styles.struck : undefined}>
          {row.title}
        </Txt>
        {cancelled && row.time ? (
          <Txt size={size.small} tone="muted" style={styles.struck}>
            {row.time}
          </Txt>
        ) : null}
        {row.note ? (
          <Txt size={size.small} tone="muted">
            {row.note}
          </Txt>
        ) : null}
        <Txt size={size.small} tone="muted">
          {row.who.join(', ')}
          {row.done ? ` · ${t.done}` : ''}
          {isNow(row, now) ? ` · ${t.today.happeningNow}` : ''}
        </Txt>
      </View>
    </View>
  );
}

/** Something the plan is missing, such as a night with no hotel. */
export function GapLine({ gap }: { gap: Gap }) {
  const c = useTheme();
  return (
    <View style={[styles.gap, { backgroundColor: c.goldSoft }]}>
      <Ionicons name="help-circle-outline" size={18} color={c.goldText} />
      <Txt size={size.small} tone="goldText" style={styles.fill}>
        {gap.text}
      </Txt>
    </View>
  );
}

export function NowLine() {
  const c = useTheme();
  return (
    <View style={styles.nowLine}>
      <Txt size={size.label} bold tone="accent">
        {t.now.toUpperCase()}
      </Txt>
      <View style={[styles.nowRule, { backgroundColor: c.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pressed: { transform: [{ scale: 0.97 }] }, // buttons and rows press in under the finger
  content: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 32, gap: 16 },
  part: { gap: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontWeight: '700', letterSpacing: -0.5 },
  card: { borderRadius: radius.card, padding: 16, gap: 12 },
  cardTight: { paddingVertical: 4, gap: 0 },
  hero: { borderRadius: radius.hero, padding: 20, gap: 14, overflow: 'hidden' },
  sectionLabel: { letterSpacing: 0.8, textTransform: 'uppercase' },
  badge: { borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  divider: { height: 1 },
  avatar: { alignItems: 'center', justifyContent: 'center' },
  row: { minHeight: MIN_TARGET + 20, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10 },
  rowIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontWeight: '500' },
  field: { gap: 6 },
  input: { minHeight: 52, borderWidth: 1, borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 12, fontSize: size.body },
  button: { minHeight: MAIN_BUTTON, borderRadius: radius.button, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 8, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  buttonPlain: { minHeight: MIN_TARGET },
  buttonText: { textAlign: 'center', flexShrink: 1 },
  iconButton: { width: MIN_TARGET, height: MIN_TARGET, borderRadius: radius.icon, alignItems: 'center', justifyContent: 'center' },
  notice: { flexDirection: 'row', gap: 10, alignItems: 'center', borderRadius: radius.field, paddingHorizontal: 14, paddingVertical: 12 },
  planRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start', paddingVertical: 12 },
  when: { width: 92 },
  struck: { textDecorationLine: 'line-through' },
  gap: { flexDirection: 'row', gap: 8, alignItems: 'center', borderRadius: radius.icon, paddingVertical: 10, paddingHorizontal: 12 },
  nowLine: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nowRule: { flex: 1, height: 2, borderRadius: 1 },
});
