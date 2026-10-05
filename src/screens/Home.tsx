import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  LinearTransition,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { SFSymbol } from 'expo-symbols';
import { Card, Chip, GlassButton, GlassIconButton, Icon, SectionLabel, Segmented } from '../design/components';
import { radius, space, type } from '../design/theme';
import { greeting, relativeDay, startOfDay, todayHeading } from '../lib/dates';
import { useStore, useTheme, type Task } from '../store';
import { TaskRow } from '../components/TaskRow';
import { TaskSheet } from './TaskSheet';
import { SettingsSheet } from './Settings';

type Filter = 'today' | 'upcoming' | 'all' | 'done';
type Group = { key: string; title: string; tasks: Task[] };

const hasGlass = isLiquidGlassAvailable();
const layout = LinearTransition.springify().damping(20);
const sortTasks = (a: Task, b: Task) =>
  b.priority - a.priority || (a.due ?? Infinity) - (b.due ?? Infinity) || b.createdAt - a.createdAt;

export function Home() {
  const { c, dark } = useTheme();
  const { tasks, lists, settings, haptic } = useStore();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<Filter>('today');
  const [listId, setListId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Task | 'new' | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((e) => {
    scrollY.value = e.contentOffset.y;
  });
  const compactHeader = useAnimatedStyle(() => ({ opacity: interpolate(scrollY.value, [50, 90], [0, 1], 'clamp') }));

  const today = startOfDay();

  const stats = useMemo(() => {
    const dueToday = tasks.filter((t) => t.due !== null && t.due <= today && (!t.done || (t.completedAt ?? 0) >= today));
    return {
      total: dueToday.length,
      done: dueToday.filter((t) => t.done).length,
      overdue: tasks.filter((t) => !t.done && t.due !== null && t.due < today).length,
      upcoming: tasks.filter((t) => !t.done && t.due !== null && t.due > today).length,
      completed: tasks.filter((t) => t.done).length,
    };
  }, [tasks, today]);

  const groups = useMemo<Group[]>(() => {
    const visible = tasks.filter((t) => !listId || t.listId === listId);
    const open = visible.filter((t) => !t.done).sort(sortTasks);
    const done = visible.filter((t) => t.done).sort((a, b) => (b.completedAt ?? 0) - (a.completedAt ?? 0));
    const overdue = open.filter((t) => t.due !== null && t.due < today);
    const dueToday = open.filter((t) => t.due === today);
    const later = open.filter((t) => t.due !== null && t.due > today);
    const someday = open.filter((t) => t.due === null);
    const out: Group[] = [];
    const push = (key: string, title: string, list: Task[]) => list.length && out.push({ key, title, tasks: list });

    if (filter === 'today') {
      push('overdue', 'Overdue', overdue);
      push('today', 'Today', dueToday);
      if (settings.showCompleted) push('done', 'Completed', done.filter((t) => (t.completedAt ?? 0) >= today));
    } else if (filter === 'upcoming') {
      const byDay = new Map<number, Task[]>();
      for (const t of [...later].sort((a, b) => a.due! - b.due!)) byDay.set(t.due!, [...(byDay.get(t.due!) ?? []), t]);
      byDay.forEach((list, day) => push(`d${day}`, relativeDay(day), list));
    } else if (filter === 'all') {
      push('overdue', 'Overdue', overdue);
      push('today', 'Today', dueToday);
      push('later', 'Upcoming', later);
      push('someday', 'Someday', someday);
      if (settings.showCompleted) push('done', 'Completed', done);
    } else {
      push('done', 'Completed', done);
    }
    return out;
  }, [tasks, listId, filter, today, settings.showCompleted]);

  const listCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const t of tasks) if (!t.done) m[t.listId] = (m[t.listId] ?? 0) + 1;
    return m;
  }, [tasks]);

  const left = stats.total - stats.done;
  const headline =
    stats.total === 0 ? 'A clear day.' : left === 0 ? 'All done for today.' : `${left} ${left === 1 ? 'task' : 'tasks'} left today.`;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <Animated.ScrollView
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[type.labelCaps, { color: c.textSecondary }]}>{todayHeading()}</Text>
            <Text style={[type.h1, { color: c.text, marginTop: space.sm }]}>
              {greeting()}
              {settings.name ? `,\n${settings.name}` : '.'}
            </Text>
          </View>
          <GlassIconButton
            icon="gearshape"
            label="Settings"
            onPress={() => {
              haptic('light');
              setSettingsOpen(true);
            }}
          />
        </View>

        {/* Today summary */}
        <View style={styles.px}>
          <Card>
            <View style={styles.summaryTop}>
              <Text style={[type.labelCaps, { color: c.textSecondary }]}>Today</Text>
              <Text style={[type.label, { color: c.textTertiary }]}>
                {stats.total ? Math.round((stats.done / stats.total) * 100) : 0}%
              </Text>
            </View>
            <View style={styles.tally}>
              <Text style={[type.display, { color: c.text, fontSize: 52, lineHeight: 56 }]}>{stats.done}</Text>
              <Text style={[type.h2, { color: c.textTertiary, marginBottom: 7 }]}>/ {stats.total}</Text>
            </View>
            <Text style={[type.body, { color: c.textSecondary }]}>{headline}</Text>
            <View style={styles.bar}>
              {stats.total === 0 ? (
                <View style={[styles.barSeg, { backgroundColor: c.border }]} />
              ) : (
                Array.from({ length: stats.total }).map((_, i) => (
                  <Animated.View
                    key={i}
                    layout={layout}
                    style={[styles.barSeg, { backgroundColor: i < stats.done ? c.ink : c.border }]}
                  />
                ))
              )}
            </View>
            <View style={[styles.stats, { borderColor: c.border }]}>
              <Stat label="Overdue" value={stats.overdue} alert={stats.overdue > 0} />
              <Stat label="Upcoming" value={stats.upcoming} />
              <Stat label="Completed" value={stats.completed} />
            </View>
          </Card>
        </View>

        {/* Filters */}
        <View style={[styles.px, { marginTop: space.lg }]}>
          <Segmented<Filter>
            value={filter}
            onChange={setFilter}
            options={[
              { value: 'today', label: 'Today' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'all', label: 'All' },
              { value: 'done', label: 'Done' },
            ]}
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Chip label="All lists" selected={listId === null} onPress={() => setListId(null)} />
          {lists.map((l) => (
            <Chip
              key={l.id}
              label={l.name}
              icon={l.icon}
              trailing={listCounts[l.id] ?? 0}
              selected={listId === l.id}
              onPress={() => {
                haptic('select');
                setListId(listId === l.id ? null : l.id);
              }}
            />
          ))}
        </ScrollView>

        {/* Groups */}
        <View style={styles.px}>
          {groups.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            groups.map((g) => (
              <Animated.View key={g.key} layout={layout} entering={FadeIn} exiting={FadeOut} style={{ marginBottom: space.lg }}>
                <SectionLabel right={g.tasks.length}>{g.title}</SectionLabel>
                <Card padded={false}>
                  {g.tasks.map((t, i) => (
                    <Animated.View key={t.id} layout={layout} entering={FadeIn.duration(220)} exiting={FadeOut.duration(140)}>
                      <TaskRow task={t} last={i === g.tasks.length - 1} onOpen={() => setEditing(t)} />
                    </Animated.View>
                  ))}
                </Card>
              </Animated.View>
            ))
          )}
        </View>
      </Animated.ScrollView>

      {/* Compact glass header that fades in on scroll */}
      <Animated.View pointerEvents="none" style={[styles.compact, { height: insets.top + 44 }, compactHeader]}>
        {hasGlass ? (
          <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} />
        ) : (
          <BlurView intensity={70} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        )}
        <Text style={[type.title, { color: c.text, marginTop: insets.top + 11 }]}>
          {{ today: 'Today', upcoming: 'Upcoming', all: 'All tasks', done: 'Completed' }[filter]}
        </Text>
      </Animated.View>

      {/* Floating glass action */}
      <View pointerEvents="box-none" style={[styles.dock, { bottom: insets.bottom + space.sm }]}>
        <GlassButton
          icon="plus"
          label="New task"
          prominent
          onPress={() => {
            haptic('medium');
            setEditing('new');
          }}
        />
      </View>

      <TaskSheet
        visible={editing !== null}
        task={editing === 'new' ? null : editing}
        defaultListId={listId}
        defaultDue={filter === 'today' ? today : null}
        onClose={() => setEditing(null)}
      />
      <SettingsSheet visible={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </View>
  );
}

function Stat({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, gap: 2 }}>
      <Text style={[type.h2, { color: alert ? c.danger : c.text }]}>{value}</Text>
      <Text style={[type.labelCaps, { color: c.textTertiary }]}>{label}</Text>
    </View>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const { c } = useTheme();
  const copy: Record<Filter, { icon: SFSymbol; title: string; body: string }> = {
    today: { icon: 'sun.max', title: 'Nothing due today', body: 'Enjoy the quiet, or add something with New task.' },
    upcoming: { icon: 'calendar', title: 'Nothing upcoming', body: 'Tasks with a future due date appear here.' },
    all: { icon: 'tray', title: 'No tasks yet', body: 'Add your first task to get started.' },
    done: { icon: 'checkmark.circle', title: 'Nothing completed', body: 'Finished tasks collect here.' },
  };
  const e = copy[filter];
  return (
    <Animated.View entering={FadeIn}>
      <Card style={styles.empty}>
        <View style={[styles.emptyIcon, { borderColor: c.border }]}>
          <Icon name={e.icon} size={22} color={c.textSecondary} />
        </View>
        <Text style={[type.title, { color: c.text, marginTop: space.md }]}>{e.title}</Text>
        <Text style={[type.small, { color: c.textSecondary, marginTop: 4, textAlign: 'center' }]}>{e.body}</Text>
      </Card>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  px: { paddingHorizontal: space.md },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: space.md + 4,
    paddingTop: space.sm,
    marginBottom: space.lg,
    gap: space.md,
  },
  summaryTop: { flexDirection: 'row', justifyContent: 'space-between' },
  tally: { flexDirection: 'row', alignItems: 'flex-end', gap: 6, marginTop: space.sm },
  bar: { flexDirection: 'row', gap: 4, marginTop: space.md },
  barSeg: { flex: 1, height: 6, borderRadius: 3 },
  stats: {
    flexDirection: 'row',
    marginTop: space.lg,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  chips: { paddingHorizontal: space.md, paddingVertical: space.md, gap: space.sm },
  compact: { position: 'absolute', top: 0, left: 0, right: 0, alignItems: 'center', overflow: 'hidden' },
  dock: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: space.xl },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
