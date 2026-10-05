import { Pressable, StyleSheet, Text, View } from 'react-native';
import ReanimatedSwipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import Animated, { interpolate, useAnimatedStyle, type SharedValue } from 'react-native-reanimated';
import { Icon } from '../design/components';
import { alpha, priorityMeta, space, type } from '../design/theme';
import { dayDiff, relativeDay } from '../lib/dates';
import { useStore, useTheme, type Task } from '../store';

export function TaskRow({ task, onOpen, last }: { task: Task; onOpen: () => void; last: boolean }) {
  const { c } = useTheme();
  const { lists, toggleTask, deleteTask, haptic } = useStore();
  const list = lists.find((l) => l.id === task.listId) ?? lists[0];
  const prio = priorityMeta[task.priority];
  const overdue = !task.done && task.due !== null && dayDiff(task.due) < 0;
  const dueColor = overdue ? c.danger : dayDiff(task.due ?? 0) === 0 ? list.color : c.textSecondary;

  return (
    <ReanimatedSwipeable
      friction={1.6}
      rightThreshold={60}
      overshootRight={false}
      renderRightActions={(_p, drag) => (
        <DeleteAction
          drag={drag}
          color={c.danger}
          onPress={() => {
            haptic('warning');
            deleteTask(task.id);
          }}
        />
      )}
      onSwipeableWillOpen={() => haptic('light')}
    >
      <Pressable onPress={onOpen} style={({ pressed }) => [styles.row, { backgroundColor: pressed ? c.surfaceAlt : c.surface }]}>
        <View style={styles.checkCol}>
          <CheckboxFor task={task} color={prio.color ?? list.color} onToggle={() => {
            haptic(task.done ? 'light' : 'success');
            toggleTask(task.id);
          }} />
        </View>
        <View style={[styles.body, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderColor: c.separator }]}>
          <View style={styles.titleLine}>
            <Text
              numberOfLines={2}
              style={[
                type.body,
                { flex: 1, color: task.done ? c.textTertiary : c.text },
                task.done && { textDecorationLine: 'line-through' },
              ]}
            >
              {task.title}
            </Text>
            {prio.flags > 0 && !task.done && (
              <View style={[styles.flag, { backgroundColor: alpha(prio.color!, 0.14) }]}>
                <Icon name="flag.fill" size={10} color={prio.color!} />
                <Text style={[type.caption, { color: prio.color! }]}>{'!'.repeat(prio.flags)}</Text>
              </View>
            )}
          </View>
          {!!task.notes && !task.done && (
            <Text numberOfLines={1} style={[type.footnote, { color: c.textSecondary, marginTop: 2, fontWeight: '400' }]}>
              {task.notes}
            </Text>
          )}
          <View style={styles.meta}>
            <View style={[styles.dot, { backgroundColor: list.color }]} />
            <Text style={[type.footnote, { color: c.textSecondary }]}>{list.name}</Text>
            {task.due !== null && (
              <>
                <Text style={[type.footnote, { color: c.textTertiary }]}>·</Text>
                <Icon name={overdue ? 'exclamationmark.circle.fill' : 'calendar'} size={11} color={dueColor} />
                <Text style={[type.footnote, { color: dueColor }]}>{relativeDay(task.due)}</Text>
              </>
            )}
          </View>
        </View>
      </Pressable>
    </ReanimatedSwipeable>
  );
}

import { Checkbox } from '../design/components';
function CheckboxFor({ task, color, onToggle }: { task: Task; color: string; onToggle: () => void }) {
  return <Checkbox checked={task.done} color={color} onToggle={onToggle} />;
}

function DeleteAction({ drag, color, onPress }: { drag: SharedValue<number>; color: string; onPress: () => void }) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(drag.value, [-90, -30], [1, 0.6], 'clamp') }],
    opacity: interpolate(drag.value, [-80, -20], [1, 0], 'clamp'),
  }));
  return (
    <Pressable onPress={onPress} style={[styles.action, { backgroundColor: color }]}>
      <Animated.View style={[{ alignItems: 'center', gap: 2 }, style]}>
        <Icon name="trash.fill" size={18} color="#fff" />
        <Text style={[type.caption, { color: '#fff' }]}>Delete</Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row' },
  checkCol: { paddingLeft: space.lg, paddingRight: space.md, paddingTop: 14 },
  body: { flex: 1, paddingVertical: 12, paddingRight: space.lg },
  titleLine: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  flag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 2,
  },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  dot: { width: 7, height: 7, borderRadius: 4 },
  action: { width: 88, alignItems: 'center', justifyContent: 'center' },
});
