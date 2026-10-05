import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, {
  interpolate,
  useAnimatedStyle,
  type SharedValue,
} from "react-native-reanimated";
import { Checkbox, Icon } from "../design/components";
import { space, type } from "../design/theme";
import { dayDiff, relativeDay } from "../lib/dates";
import { useStore, useTheme, type Task } from "../store";

export function TaskRow({
  task,
  onOpen,
  last,
}: {
  task: Task;
  onOpen: () => void;
  last: boolean;
}) {
  const { c } = useTheme();
  const { lists, toggleTask, deleteTask, haptic } = useStore();
  const list = lists.find((l) => l.id === task.listId) ?? lists[0];
  const overdue = !task.done && task.due !== null && dayDiff(task.due) < 0;

  const meta = [list.name, task.due !== null ? relativeDay(task.due) : null]
    .filter(Boolean)
    .join(" · ")
    .toUpperCase();

  return (
    <ReanimatedSwipeable
      friction={1.6}
      rightThreshold={60}
      overshootRight={false}
      onSwipeableWillOpen={() => haptic("light")}
      renderRightActions={(_p, drag) => (
        <DeleteAction
          drag={drag}
          color={c.danger}
          onPress={() => {
            haptic("warning");
            deleteTask(task.id);
          }}
        />
      )}
    >
      <Pressable onPress={onOpen}>
        {({ pressed }) => (
          <View
            style={[
              styles.row,
              { backgroundColor: pressed ? c.surfaceAlt : c.surface },
            ]}
          >
            <View style={styles.checkCol}>
              <Checkbox
                checked={task.done}
                onToggle={() => {
                  haptic(task.done ? "light" : "success");
                  toggleTask(task.id);
                }}
              />
            </View>
            <View
              style={[
                styles.body,
                !last && {
                  borderBottomWidth: StyleSheet.hairlineWidth,
                  borderColor: c.border,
                },
              ]}
            >
              <View style={styles.titleLine}>
                <Text
                  numberOfLines={2}
                  style={[
                    type.body,
                    { flex: 1, color: task.done ? c.textTertiary : c.text },
                    task.done && { textDecorationLine: "line-through" },
                  ]}
                >
                  {task.title}
                </Text>
                {task.priority > 0 && !task.done && (
                  <View
                    style={[
                      styles.prio,
                      { borderColor: task.priority === 3 ? c.ink : c.border },
                    ]}
                  >
                    <Text
                      style={[
                        type.label,
                        {
                          color: task.priority === 3 ? c.text : c.textSecondary,
                          fontSize: 11,
                        },
                      ]}
                    >
                      P{4 - task.priority}
                    </Text>
                  </View>
                )}
              </View>
              {!!task.notes && !task.done && (
                <Text
                  numberOfLines={1}
                  style={[type.small, { color: c.textSecondary }]}
                >
                  {task.notes}
                </Text>
              )}
              <View style={styles.meta}>
                {overdue && (
                  <Icon
                    name="exclamationmark.circle"
                    size={11}
                    color={c.danger}
                  />
                )}
                <Text
                  style={[
                    type.label,
                    {
                      color: overdue ? c.danger : c.textTertiary,
                      fontSize: 11,
                    },
                  ]}
                >
                  {meta}
                </Text>
              </View>
            </View>
          </View>
        )}
      </Pressable>
    </ReanimatedSwipeable>
  );
}

function DeleteAction({
  drag,
  color,
  onPress,
}: {
  drag: SharedValue<number>;
  color: string;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(drag.value, [-80, -20], [1, 0], "clamp"),
    transform: [
      { translateX: interpolate(drag.value, [-88, 0], [0, 24], "clamp") },
    ],
  }));
  return (
    <Pressable
      onPress={onPress}
      style={[styles.action, { backgroundColor: color }]}
      accessibilityLabel="Delete task"
    >
      <Animated.View style={[{ alignItems: "center", gap: 4 }, style]}>
        <Icon name="trash" size={17} color="#fff" />
        <Text style={[type.label, { color: "#fff", fontSize: 11 }]}>
          DELETE
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  checkCol: { paddingLeft: space.md, paddingRight: 14, paddingTop: 16 },
  body: { flex: 1, paddingVertical: 13, paddingRight: space.md, gap: 3 },
  titleLine: { flexDirection: "row", alignItems: "flex-start", gap: space.sm },
  prio: {
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginTop: 3,
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  action: { width: 88, alignItems: "center", justifyContent: "center" },
});
