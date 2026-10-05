import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import { SymbolView, type SFSymbol, type SymbolWeight } from 'expo-symbols';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Button, Host, Picker, Text as SwiftText } from '@expo/ui/swift-ui';
import {
  buttonBorderShape,
  buttonStyle,
  controlSize,
  labelStyle,
  pickerStyle,
  tag,
  tint,
} from '@expo/ui/swift-ui/modifiers';
import { radius, space, type } from './theme';
import { useStore, useTheme } from '../store';

const hasGlass = isLiquidGlassAvailable();

export function Icon({
  name,
  size = 18,
  color,
  weight = 'medium',
}: {
  name: SFSymbol;
  size?: number;
  color: string;
  weight?: SymbolWeight;
}) {
  return <SymbolView name={name} size={size} tintColor={color} weight={weight} style={{ width: size, height: size }} />;
}

/** Subtle press-scale used for custom RN controls. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
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
        s.value = withSpring(1, { damping: 16, stiffness: 300 });
        rest.onPressOut?.(e);
      }}
    >
      <Animated.View style={[style, anim, rest.disabled && { opacity: 0.4 }]}>{children}</Animated.View>
    </Pressable>
  );
}

/* ───────────── Native Liquid Glass controls (Expo UI / SwiftUI) ───────────── */

/** Circular Liquid Glass icon button. `prominent` tints it cobalt — use once per screen. */
export function GlassIconButton({
  icon,
  label,
  onPress,
  prominent,
  size = 'large',
}: {
  icon: SFSymbol;
  label: string;
  onPress: () => void;
  prominent?: boolean;
  size?: 'regular' | 'large';
}) {
  const { c, dark } = useTheme();
  return (
    <Host matchContents colorScheme={dark ? 'dark' : 'light'}>
      <Button
        systemImage={icon}
        label={label}
        onPress={onPress}
        modifiers={[
          labelStyle('iconOnly'),
          buttonStyle(prominent ? (hasGlass ? 'glassProminent' : 'borderedProminent') : hasGlass ? 'glass' : 'bordered'),
          buttonBorderShape('circle'),
          controlSize(size),
          tint(prominent ? c.accent : c.text),
        ]}
      />
    </Host>
  );
}

/** Capsule Liquid Glass button with a label. */
export function GlassButton({
  icon,
  label,
  onPress,
  prominent,
}: {
  icon?: SFSymbol;
  label: string;
  onPress: () => void;
  prominent?: boolean;
}) {
  const { c, dark } = useTheme();
  return (
    <Host matchContents colorScheme={dark ? 'dark' : 'light'}>
      <Button
        systemImage={icon}
        label={label}
        onPress={onPress}
        modifiers={[
          buttonStyle(prominent ? (hasGlass ? 'glassProminent' : 'borderedProminent') : hasGlass ? 'glass' : 'bordered'),
          buttonBorderShape('capsule'),
          controlSize('large'),
          tint(prominent ? c.accent : c.text),
        ]}
      />
    </Host>
  );
}

/** Native SwiftUI segmented control. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const { dark } = useTheme();
  const { haptic } = useStore();
  return (
    <Host matchContents={{ vertical: true }} colorScheme={dark ? 'dark' : 'light'} style={{ alignSelf: 'stretch' }}>
      <Picker<T>
        selection={value}
        onSelectionChange={(v) => {
          haptic('select');
          onChange(v);
        }}
        modifiers={[pickerStyle('segmented')]}
      >
        {options.map((o) => (
          <SwiftText key={String(o.value)} modifiers={[tag(o.value)]}>
            {o.label}
          </SwiftText>
        ))}
      </Picker>
    </Host>
  );
}

/* ───────────── Flat Glassline primitives ───────────── */

export function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  const { c } = useTheme();
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      hitSlop={14}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      onPress={() => {
        s.value = withSequence(withTiming(0.8, { duration: 80 }), withSpring(1, { damping: 10, stiffness: 300 }));
        onToggle();
      }}
    >
      <Animated.View
        style={[
          styles.check,
          { borderColor: checked ? c.ink : c.textTertiary, backgroundColor: checked ? c.ink : 'transparent' },
          anim,
        ]}
      >
        {checked && <Icon name="checkmark" size={11} color={c.onInk} weight="bold" />}
      </Animated.View>
    </Pressable>
  );
}

export function Chip({
  label,
  icon,
  selected,
  onPress,
  trailing,
}: {
  label: string;
  icon?: SFSymbol;
  selected?: boolean;
  onPress: () => void;
  trailing?: string | number;
}) {
  const { c } = useTheme();
  const fg = selected ? c.onInk : c.text;
  return (
    <PressableScale
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? c.ink : c.surface, borderColor: selected ? c.ink : c.border }]}
    >
      {icon && <Icon name={icon} size={13} color={selected ? c.onInk : c.textSecondary} />}
      <Text style={[type.small, { color: fg, fontFamily: 'Geist_500Medium' }]}>{label}</Text>
      {trailing !== undefined && (
        <Text style={[type.label, { color: selected ? c.onInk : c.textTertiary, opacity: selected ? 0.7 : 1 }]}>{trailing}</Text>
      )}
    </PressableScale>
  );
}

export function Card({ children, style, padded = true }: { children: ReactNode; style?: StyleProp<ViewStyle>; padded?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }, padded && { padding: space.lg }, style]}>
      {children}
    </View>
  );
}

export function SectionLabel({ children, right }: { children: string; right?: string | number }) {
  const { c } = useTheme();
  return (
    <View style={styles.sectionLabel}>
      <Text style={[type.labelCaps, { color: c.textSecondary }]}>{children}</Text>
      {right !== undefined && <Text style={[type.label, { color: c.textTertiary }]}>{String(right).padStart(2, '0')}</Text>}
    </View>
  );
}

/** Cobalt primary button — the single tertiary action on a screen. */
export function PrimaryButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  const { c } = useTheme();
  return (
    <PressableScale onPress={onPress} disabled={disabled} style={[styles.primary, { backgroundColor: c.accent }]}>
      <Text style={[type.title, { color: c.onAccent }]}>{label}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  check: {
    width: 20,
    height: 20,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 34,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  card: { borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  sectionLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: space.sm,
    paddingHorizontal: 2,
  },
  primary: {
    height: 52,
    paddingHorizontal: 20,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
