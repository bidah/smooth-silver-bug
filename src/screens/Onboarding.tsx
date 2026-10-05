import { useRef, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore, useTheme } from '../store';
import { radius, space, type } from '../design/theme';
import { Card, Checkbox, GlassButton, Icon, PrimaryButton } from '../design/components';

const slides = [
  {
    kicker: 'Capture',
    title: 'Everything\nin one calm list.',
    body: 'Write it down the moment it comes to mind. Clarity keeps the rest out of the way.',
    Visual: MockList,
  },
  {
    kicker: 'Plan',
    title: 'Plan your day\nin two taps.',
    body: 'Set a due date, a priority and a list. Today shows only what needs you now.',
    Visual: MockPlan,
  },
  {
    kicker: 'Progress',
    title: 'See the day\ncome together.',
    body: 'Tap to complete, swipe to delete. Quiet haptics and a simple tally keep you moving.',
    Visual: MockProgress,
  },
];

export function Onboarding() {
  const { c } = useTheme();
  const { settings, completeOnboarding, haptic } = useStore();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const x = useSharedValue(0);
  const [page, setPage] = useState(0);
  const [name, setName] = useState(settings.name);
  const total = slides.length + 1;
  const last = page === total - 1;

  const onScroll = useAnimatedScrollHandler((e) => {
    x.value = e.contentOffset.x;
  });

  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * width, animated: true });
    setPage(i);
  };

  const next = () => {
    if (last) {
      haptic('success');
      completeOnboarding(name);
    } else {
      haptic('light');
      goTo(page + 1);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
          <Wordmark />
          <View style={styles.topRight}>
            <Text style={[type.label, { color: c.textSecondary }]}>
              {String(page + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
            </Text>
            {!last && <GlassButton label="Skip" onPress={() => goTo(total - 1)} />}
          </View>
        </View>

        <Animated.ScrollView
          ref={scrollRef as never}
          horizontal
          pagingEnabled
          bounces={false}
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        >
          {slides.map(({ kicker, title, body, Visual }, i) => (
            <View key={kicker} style={[styles.page, { width }]}>
              <Parallax index={i} x={x} width={width} distance={60} style={styles.visual}>
                <Visual />
              </Parallax>
              <Parallax index={i} x={x} width={width} distance={20} fade>
                <Text style={[type.labelCaps, { color: c.accent }]}>{kicker}</Text>
                <Text style={[type.display, { color: c.text, marginTop: space.sm }]}>{title}</Text>
                <Text style={[type.body, { color: c.textSecondary, marginTop: space.md, maxWidth: 340 }]}>{body}</Text>
              </Parallax>
            </View>
          ))}

          <View style={[styles.page, { width, justifyContent: 'center' }]}>
            <Parallax index={slides.length} x={x} width={width} distance={20} fade>
              <Text style={[type.labelCaps, { color: c.accent }]}>One last thing</Text>
              <Text style={[type.display, { color: c.text, marginTop: space.sm }]}>What should{'\n'}we call you?</Text>
              <Text style={[type.body, { color: c.textSecondary, marginTop: space.md }]}>
                Used for your daily greeting. Stays on this device.
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={c.textTertiary}
                returnKeyType="done"
                onSubmitEditing={next}
                autoCorrect={false}
                maxLength={24}
                selectionColor={c.accent}
                style={[styles.input, type.h2, { color: c.text, backgroundColor: c.surface, borderColor: c.border }]}
              />
            </Parallax>
          </View>
        </Animated.ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.progress}>
            {Array.from({ length: total }).map((_, i) => (
              <Segment key={i} index={i} x={x} width={width} />
            ))}
          </View>
          <PrimaryButton label={last ? 'Start using Clarity' : 'Continue'} onPress={next} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export function Wordmark() {
  const { c } = useTheme();
  return (
    <View style={styles.brand}>
      <View style={[styles.brandMark, { backgroundColor: c.ink }]}>
        <Icon name="checkmark" size={10} color={c.onInk} weight="bold" />
      </View>
      <Text style={[type.title, { color: c.text, fontFamily: 'Geist_600SemiBold' }]}>Clarity</Text>
    </View>
  );
}

function Parallax({
  index,
  x,
  width,
  distance,
  fade,
  style,
  children,
}: {
  index: number;
  x: SharedValue<number>;
  width: number;
  distance: number;
  fade?: boolean;
  style?: object;
  children: ReactNode;
}) {
  const anim = useAnimatedStyle(() => {
    const p = (x.value - index * width) / width;
    return {
      opacity: fade ? interpolate(p, [-0.7, 0, 0.7], [0, 1, 0], Extrapolation.CLAMP) : 1,
      transform: [{ translateX: interpolate(p, [-1, 0, 1], [-distance, 0, distance], Extrapolation.CLAMP) }],
    };
  });
  return <Animated.View style={[style, anim]}>{children}</Animated.View>;
}

function Segment({ index, x, width }: { index: number; x: SharedValue<number>; width: number }) {
  const { c } = useTheme();
  const fill = useAnimatedStyle(() => ({
    width: `${interpolate(x.value / width, [index - 1, index], [0, 100], Extrapolation.CLAMP)}%`,
  }));
  return (
    <View style={[styles.segment, { backgroundColor: c.border }]}>
      <Animated.View style={[styles.segmentFill, { backgroundColor: c.ink }, fill]} />
    </View>
  );
}

/* ───────────── Product vignettes ───────────── */

function MockRow({ title, meta, done, last }: { title: string; meta: string; done?: boolean; last?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.mockRow, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.border }]}>
      <Checkbox checked={!!done} onToggle={() => {}} />
      <View style={{ flex: 1 }}>
        <Text
          style={[type.body, { color: done ? c.textTertiary : c.text }, done && { textDecorationLine: 'line-through' }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text style={[type.label, { color: c.textTertiary }]}>{meta}</Text>
      </View>
    </View>
  );
}

function MockList() {
  return (
    <Card padded={false}>
      <MockRow title="Book dentist appointment" meta="PERSONAL · TODAY" done />
      <MockRow title="Draft Q4 roadmap" meta="WORK · TODAY · P1" />
      <MockRow title="Pick up groceries" meta="SHOPPING · TOMORROW" last />
    </Card>
  );
}

function MockPlan() {
  const { c } = useTheme();
  const pill = (label: string, on?: boolean) => (
    <View key={label} style={[styles.mockChip, { backgroundColor: on ? c.ink : c.surface, borderColor: on ? c.ink : c.border }]}>
      <Text style={[type.small, { color: on ? c.onInk : c.text, fontFamily: 'Geist_500Medium' }]}>{label}</Text>
    </View>
  );
  return (
    <Card>
      <Text style={[type.title, { color: c.text }]}>Draft Q4 roadmap</Text>
      <Text style={[type.labelCaps, { color: c.textSecondary, marginTop: space.md, marginBottom: space.sm }]}>Due</Text>
      <View style={styles.mockChips}>{['Today', 'Tomorrow', 'Next week'].map((l, i) => pill(l, i === 0))}</View>
      <Text style={[type.labelCaps, { color: c.textSecondary, marginTop: space.md, marginBottom: space.sm }]}>Priority</Text>
      <View style={[styles.mockSeg, { backgroundColor: c.surfaceAlt }]}>
        {['None', 'Low', 'Med', 'High'].map((l) => (
          <View key={l} style={[styles.mockSegItem, l === 'High' && { backgroundColor: c.surface }]}>
            <Text style={[type.small, { color: c.text, fontFamily: l === 'High' ? 'Geist_600SemiBold' : 'Geist_400Regular' }]}>{l}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

function MockProgress() {
  const { c } = useTheme();
  return (
    <Card>
      <Text style={[type.labelCaps, { color: c.textSecondary }]}>Today</Text>
      <View style={styles.mockTally}>
        <Text style={[type.display, { color: c.text, fontSize: 56, lineHeight: 60 }]}>4</Text>
        <Text style={[type.h2, { color: c.textTertiary, marginBottom: 8 }]}>/ 5 done</Text>
      </View>
      <View style={styles.mockBar}>
        {[1, 1, 1, 1, 0].map((on, i) => (
          <View key={i} style={[styles.mockBarSeg, { backgroundColor: on ? c.ink : c.border }]} />
        ))}
      </View>
      <Text style={[type.label, { color: c.textSecondary, marginTop: space.md }]}>1 LEFT · 2 UPCOMING</Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.lg,
    paddingBottom: space.sm,
    minHeight: 56,
  },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 20, height: 20, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1, paddingHorizontal: space.lg, justifyContent: 'flex-end', paddingBottom: space.lg },
  visual: { flex: 1, justifyContent: 'center' },
  input: {
    marginTop: space.lg,
    height: 60,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
  },
  footer: { paddingHorizontal: space.lg, gap: space.md },
  progress: { flexDirection: 'row', gap: 6 },
  segment: { flex: 1, height: 2, borderRadius: 1, overflow: 'hidden' },
  segmentFill: { height: 2 },
  mockRow: { flexDirection: 'row', alignItems: 'center', gap: space.md, paddingHorizontal: space.md, paddingVertical: 14 },
  mockChips: { flexDirection: 'row', gap: space.sm },
  mockChip: { paddingHorizontal: 12, height: 32, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center' },
  mockSeg: { flexDirection: 'row', borderRadius: radius.md, padding: 3 },
  mockSegItem: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8 },
  mockTally: { flexDirection: 'row', alignItems: 'flex-end', gap: space.sm, marginTop: space.sm },
  mockBar: { flexDirection: 'row', gap: 4, marginTop: space.md },
  mockBarSeg: { flex: 1, height: 6, borderRadius: 3 },
});
