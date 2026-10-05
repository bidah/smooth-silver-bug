import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import { accents, alpha, radius, space, type, type AccentKey } from './theme';
import { useStore, useTheme } from '../store';

export function Icon({
  name,
  size = 20,
  color,
  weight = 'semibold',
}: {
  name: SFSymbol;
  size?: number;
  color: string;
  weight?: SymbolWeight;
}) {
  return <SymbolView name={name} size={size} tintColor={color} weight={weight} style={{ width: size, height: size }} />;
}

/** Pressable with a springy scale-down, the core touch feedback across the app. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.96,
  ...rest
}: PressableProps & { style?: StyleProp<ViewStyle>; scaleTo?: number; children: ReactNode }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      {...rest}
      onPressIn={(e) => {
        s.value = withSpring(scaleTo, { damping: 20, stiffness: 400 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        s.value = withSpring(1, { damping: 14, stiffness: 300 });
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, anim, rest.disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Checkbox({ checked, color, onToggle }: { checked: boolean; color: string; onToggle: () => void }) {
  const { c } = useTheme();
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      hitSlop={12}
      onPress={() => {
        s.value = withSequence(withTiming(0.75, { duration: 90 }), withSpring(1, { damping: 8, stiffness: 260 }));
        onToggle();
      }}
    >
      <Animated.View
        style={[
          styles.check,
          { borderColor: checked ? color : c.textTertiary, backgroundColor: checked ? color : 'transparent' },
          anim,
        ]}
      >
        {checked && <Icon name="checkmark" size={13} color="#fff" weight="heavy" />}
      </Animated.View>
    </Pressable>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export function ProgressRing({
  progress,
  size = 64,
  stroke = 7,
  color = '#fff',
  track = 'rgba(255,255,255,0.25)',
  children,
}: {
  progress: number;
  size?: number;
  stroke?: number;
  color?: string;
  track?: string;
  children?: ReactNode;
}) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withTiming(Math.max(0, Math.min(1, progress)), { duration: 700 });
  }, [progress, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${circ} ${circ}`}
          animatedProps={props}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      {children}
    </View>
  );
}

export function Chip({
  label,
  icon,
  color,
  selected,
  onPress,
  trailing,
}: {
  label: string;
  icon?: SFSymbol;
  color?: string;
  selected?: boolean;
  onPress: () => void;
  trailing?: string | number;
}) {
  const { c, accent } = useTheme();
  const tint = color ?? accent;
  return (
    <PressableScale
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? tint : c.surface,
          borderColor: selected ? tint : c.separator,
        },
      ]}
    >
      {icon && <Icon name={icon} size={13} color={selected ? '#fff' : tint} />}
      <Text style={[type.subhead, { color: selected ? '#fff' : c.text }]}>{label}</Text>
      {trailing !== undefined && (
        <Text style={[type.footnote, { color: selected ? 'rgba(255,255,255,0.8)' : c.textSecondary }]}>
          {trailing}
        </Text>
      )}
    </PressableScale>
  );
}

/** iOS-style segmented control with a sliding thumb. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { c, dark } = useTheme();
  const { haptic } = useStore();
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const width = useSharedValue(0);
  const x = useSharedValue(index);
  useEffect(() => {
    x.value = withSpring(index, { damping: 22, stiffness: 260 });
  }, [index, x]);
  const thumb = useAnimatedStyle(() => ({
    width: width.value / options.length - 4,
    transform: [{ translateX: (x.value * width.value) / options.length }],
  }));
  return (
    <View
      style={[styles.segTrack, { backgroundColor: c.surfaceAlt }]}
      onLayout={(e) => (width.value = e.nativeEvent.layout.width - 4)}
    >
      <Animated.View
        style={[
          styles.segThumb,
          { backgroundColor: dark ? '#636366' : '#fff' },
          thumb,
        ]}
      />
      {options.map((o) => (
        <Pressable
          key={String(o.value)}
          style={styles.segItem}
          onPress={() => {
            if (o.value !== value) haptic('select');
            onChange(o.value);
          }}
        >
          <Text
            style={[type.footnote, { color: c.text, fontWeight: o.value === value ? '700' : '500' }]}
            numberOfLines={1}
          >
            {o.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Grouped "inset" card section like iOS Settings. */
export function Section({ title, children, footer }: { title?: string; children: ReactNode; footer?: string }) {
  const { c } = useTheme();
  return (
    <View style={{ marginBottom: space.xxl }}>
      {title && <Text style={[type.overline, { color: c.textSecondary, marginBottom: space.sm, marginLeft: space.lg }]}>{title}</Text>}
      <View style={[styles.section, { backgroundColor: c.surface }]}>{children}</View>
      {footer && (
        <Text style={[type.footnote, { color: c.textSecondary, marginTop: space.sm, marginHorizontal: space.lg }]}>
          {footer}
        </Text>
      )}
    </View>
  );
}

export function Row({
  icon,
  iconBg,
  label,
  right,
  onPress,
  destructive,
  last,
}: {
  icon: SFSymbol;
  iconBg: string;
  label: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [styles.row, pressed && { backgroundColor: c.surfaceAlt }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={15} color="#fff" />
      </View>
      <View style={[styles.rowBody, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.separator }]}>
        <Text style={[type.body, { color: destructive ? c.danger : c.text, flex: 1 }]}>{label}</Text>
        {right}
        {onPress && !right && <Icon name="chevron.right" size={13} color={c.textTertiary} />}
      </View>
    </Pressable>
  );
}

export function AccentPicker({ value, onChange }: { value: AccentKey; onChange: (k: AccentKey) => void }) {
  const { haptic } = useStore();
  return (
    <View style={styles.accentRow}>
      {(Object.keys(accents) as AccentKey[]).map((k) => {
        const selected = k === value;
        return (
          <PressableScale
            key={k}
            scaleTo={0.85}
            onPress={() => {
              haptic('select');
              onChange(k);
            }}
            style={[styles.accentOuter, { borderColor: selected ? accents[k].base : 'transparent' }]}
          >
            <View style={[styles.accentDot, { backgroundColor: accents[k].base }]}>
              {selected && <Icon name="checkmark" size={14} color="#fff" weight="bold" />}
            </View>
          </PressableScale>
        );
      })}
    </View>
  );
}

export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { accent } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      style={[styles.primary, { backgroundColor: accent, shadowColor: accent }]}
    >
      <Text style={[type.headline, { color: '#fff' }]}>{label}</Text>
    </PressableScale>
  );
}

export function IconBadge({ icon, color, size = 30 }: { icon: SFSymbol; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: alpha(color, 0.15),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={size * 0.5} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  check: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segTrack: { flexDirection: 'row', height: 36, borderRadius: 10, padding: 2 },
  segThumb: {
    position: 'absolute',
    top: 2,
    left: 4,
    bottom: 2,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  segItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingLeft: space.lg, minHeight: 50 },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: space.md,
    paddingRight: space.lg,
    minHeight: 50,
    gap: space.sm,
  },
  accentRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  accentOuter: { padding: 3, borderRadius: 24, borderWidth: 2.5 },
  accentDot: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  primary: {
    height: 56,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
});
