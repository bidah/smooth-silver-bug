import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SFSymbol } from 'expo-symbols';
import { useStore, useTheme } from '../store';
import { accents, alpha, radius, space, type, type AccentKey } from '../design/theme';
import { AccentPicker, Icon, PrimaryButton } from '../design/components';

const slides: { icon: SFSymbol; title: string; body: string; badges: SFSymbol[] }[] = [
  {
    icon: 'checkmark.circle.fill',
    title: 'Welcome to\nClarity',
    body: 'A calm, focused place for everything you need to get done.',
    badges: ['sparkles', 'star.fill'],
  },
  {
    icon: 'calendar',
    title: 'Plan your day\nin seconds',
    body: 'Add due dates, priorities and lists with a couple of taps. Today shows only what matters now.',
    badges: ['flag.fill', 'clock.fill'],
  },
  {
    icon: 'hand.tap.fill',
    title: 'Made to feel\ngreat',
    body: 'Tap to complete, swipe to delete. Gentle haptics and progress tracking keep you in flow.',
    badges: ['bolt.fill', 'chart.pie.fill'],
  },
];

export function Onboarding() {
  const { c, accent, accentDeep } = useTheme();
  const { settings, updateSettings, completeOnboarding, haptic } = useStore();
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
    haptic('light');
    if (last) {
      haptic('success');
      completeOnboarding(name, settings.accent);
    } else goTo(page + 1);
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Soft accent glow behind everything */}
      <LinearGradient
        colors={[alpha(accent, 0.22), alpha(accent, 0)]}
        style={[StyleSheet.absoluteFill, { height: 520 }]}
      />
      <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
        <View style={[styles.topBar, { paddingTop: insets.top + space.sm }]}>
          <View style={styles.brand}>
            <View style={[styles.brandMark, { backgroundColor: accent }]}>
              <Icon name="checkmark" size={11} color="#fff" weight="black" />
            </View>
            <Text style={[type.headline, { color: c.text }]}>Clarity</Text>
          </View>
          {!last && (
            <Pressable hitSlop={12} onPress={() => goTo(total - 1)}>
              <Text style={[type.callout, { color: c.textSecondary }]}>Skip</Text>
            </Pressable>
          )}
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
          {slides.map((s, i) => (
            <View key={i} style={[styles.page, { width }]}>
              <Hero index={i} x={x} width={width} icon={s.icon} badges={s.badges} accent={accent} deep={accentDeep} />
              <SlideText index={i} x={x} width={width}>
                <Text style={[type.hero, styles.center, { color: c.text }]}>{s.title}</Text>
                <Text style={[type.body, styles.center, { color: c.textSecondary, marginTop: space.md, lineHeight: 24 }]}>
                  {s.body}
                </Text>
              </SlideText>
            </View>
          ))}

          {/* Personalize */}
          <View style={[styles.page, { width, justifyContent: 'center' }]}>
            <SlideText index={slides.length} x={x} width={width}>
              <LinearGradient colors={[accent, accentDeep]} style={styles.smallHero}>
                <Icon name="person.crop.circle.fill" size={40} color="#fff" />
              </LinearGradient>
              <Text style={[type.largeTitle, styles.center, { color: c.text, marginTop: space.xl }]}>
                Make it yours
              </Text>
              <Text style={[type.body, styles.center, { color: c.textSecondary, marginTop: space.sm }]}>
                What should we call you?
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={c.textTertiary}
                returnKeyType="done"
                autoCorrect={false}
                maxLength={24}
                selectionColor={accent}
                style={[styles.input, type.title, { color: c.text, backgroundColor: c.surface }]}
              />
              <Text style={[type.overline, styles.center, { color: c.textSecondary, marginTop: space.xxl, marginBottom: space.md }]}>
                Pick your color
              </Text>
              <AccentPicker value={settings.accent} onChange={(k: AccentKey) => updateSettings({ accent: k })} />
            </SlideText>
          </View>
        </Animated.ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + space.md }]}>
          <View style={styles.dots}>
            {Array.from({ length: total }).map((_, i) => (
              <Dot key={i} index={i} x={x} width={width} color={accent} track={c.textTertiary} />
            ))}
          </View>
          <PrimaryButton label={last ? (name.trim() ? `Let's go, ${name.trim()}` : 'Get Started') : 'Continue'} onPress={next} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Hero({
  index,
  x,
  width,
  icon,
  badges,
  accent,
  deep,
}: {
  index: number;
  x: SharedValue<number>;
  width: number;
  icon: SFSymbol;
  badges: SFSymbol[];
  accent: string;
  deep: string;
}) {
  const { c } = useTheme();
  const style = useAnimatedStyle(() => {
    const p = (x.value - index * width) / width;
    return {
      opacity: interpolate(p, [-1, 0, 1], [0, 1, 0], Extrapolation.CLAMP),
      transform: [
        { scale: interpolate(p, [-1, 0, 1], [0.6, 1, 0.6], Extrapolation.CLAMP) },
        { rotate: `${interpolate(p, [-1, 0, 1], [-18, 0, 18], Extrapolation.CLAMP)}deg` },
      ],
    };
  });
  const float = useAnimatedStyle(() => {
    const p = (x.value - index * width) / width;
    return { transform: [{ translateX: interpolate(p, [-1, 0, 1], [80, 0, -80], Extrapolation.CLAMP) }] };
  });
  return (
    <View style={styles.heroWrap}>
      <View style={[styles.ring, { width: 260, height: 260, borderColor: alpha(accent, 0.12) }]} />
      <View style={[styles.ring, { width: 200, height: 200, borderColor: alpha(accent, 0.2) }]} />
      <Animated.View style={style}>
        <LinearGradient colors={[accent, deep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { shadowColor: accent }]}>
          <Icon name={icon} size={64} color="#fff" />
        </LinearGradient>
      </Animated.View>
      <Animated.View style={[styles.badge, { top: 40, right: 60, backgroundColor: c.surface }, float]}>
        <Icon name={badges[0]} size={20} color={accent} />
      </Animated.View>
      <Animated.View style={[styles.badge, { bottom: 50, left: 56, backgroundColor: c.surface }, float]}>
        <Icon name={badges[1]} size={20} color={accents.orange.base} />
      </Animated.View>
    </View>
  );
}

function SlideText({
  index,
  x,
  width,
  children,
}: {
  index: number;
  x: SharedValue<number>;
  width: number;
  children: React.ReactNode;
}) {
  const style = useAnimatedStyle(() => {
    const p = (x.value - index * width) / width;
    return {
      opacity: interpolate(p, [-0.6, 0, 0.6], [0, 1, 0], Extrapolation.CLAMP),
      transform: [{ translateY: interpolate(p, [-1, 0, 1], [30, 0, 30], Extrapolation.CLAMP) }],
    };
  });
  return <Animated.View style={[{ paddingHorizontal: space.xxl, alignItems: 'stretch' }, style]}>{children}</Animated.View>;
}

function Dot({
  index,
  x,
  width,
  color,
  track,
}: {
  index: number;
  x: SharedValue<number>;
  width: number;
  color: string;
  track: string;
}) {
  const style = useAnimatedStyle(() => {
    const p = Math.abs(x.value / width - index);
    const t = Math.max(0, 1 - p);
    return { width: 8 + 18 * t, opacity: 0.35 + 0.65 * t, backgroundColor: t > 0.5 ? color : track };
  });
  return <Animated.View style={[styles.dot, style]} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.xl,
    paddingBottom: space.sm,
  },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  brandMark: { width: 22, height: 22, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  page: { flex: 1 },
  heroWrap: { height: 340, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1.5 },
  hero: {
    width: 136,
    height: 136,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  badge: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  smallHero: {
    width: 84,
    height: 84,
    borderRadius: 26,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: { textAlign: 'center' },
  input: {
    marginTop: space.xl,
    height: 60,
    borderRadius: radius.lg,
    paddingHorizontal: space.xl,
    textAlign: 'center',
  },
  footer: { paddingHorizontal: space.xl, gap: space.xl },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
});
