import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Card, Chip, GlassIconButton, Icon, SectionLabel, Segmented } from '../design/components';
import { priorityLabels, radius, space, type } from '../design/theme';
import { addDays, relativeDay, shortDate, startOfDay } from '../lib/dates';
import { useStore, useTheme, type Priority, type Task } from '../store';

type DueKey = 'none' | 'today' | 'tomorrow' | 'week' | 'custom';

function dueKeyFor(due: number | null): DueKey {
  if (due === null) return 'none';
  const t = startOfDay();
  if (due === t) return 'today';
  if (due === addDays(t, 1)) return 'tomorrow';
  if (due === addDays(t, 7)) return 'week';
  return 'custom';
}

export function TaskSheet({
  visible,
  task,
  defaultListId,
  defaultDue,
  onClose,
}: {
  visible: boolean;
  task: Task | null;
  defaultListId: string | null;
  defaultDue: number | null;
  onClose: () => void;
}) {
  const { c, dark } = useTheme();
  const { lists, addTask, updateTask, deleteTask, toggleTask, haptic } = useStore();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [listId, setListId] = useState(lists[0].id);
  const [priority, setPriority] = useState<Priority>(0);
  const [due, setDue] = useState<number | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTitle(task?.title ?? '');
    setNotes(task?.notes ?? '');
    setListId(task?.listId ?? defaultListId ?? lists[0].id);
    setPriority(task?.priority ?? 0);
    setDue(task ? task.due : defaultDue);
    setShowCalendar(false);
  }, [visible, task, defaultListId, defaultDue, lists]);

  const canSave = title.trim().length > 0;
  const dueKey = dueKeyFor(due);

  const save = () => {
    if (!canSave) {
      haptic('warning');
      return;
    }
    const data = { title: title.trim(), notes: notes.trim(), listId, priority, due };
    if (task) updateTask(task.id, data);
    else addTask(data);
    haptic('success');
    onClose();
  };

  const pickDue = (k: DueKey) => {
    haptic('select');
    const t = startOfDay();
    if (k === 'custom') {
      setShowCalendar((s) => !s);
      if (due === null) setDue(addDays(t, 2));
      return;
    }
    setShowCalendar(false);
    setDue(k === 'none' ? null : k === 'today' ? t : k === 'tomorrow' ? addDays(t, 1) : addDays(t, 7));
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <View style={styles.nav}>
          <GlassIconButton icon="xmark" label="Cancel" size="regular" onPress={onClose} />
          <Text style={[type.title, { color: c.text }]}>{task ? 'Edit task' : 'New task'}</Text>
          <GlassIconButton icon="checkmark" label={task ? 'Save' : 'Add'} size="regular" prominent onPress={save} />
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          automaticallyAdjustKeyboardInsets
          contentContainerStyle={styles.content}
        >
          <Card padded={false}>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="What needs doing?"
              placeholderTextColor={c.textTertiary}
              autoFocus={!task}
              selectionColor={c.accent}
              returnKeyType="done"
              onSubmitEditing={save}
              style={[type.h2, styles.titleInput, { color: c.text }]}
            />
            <View style={[styles.divider, { backgroundColor: c.border }]} />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notes"
              placeholderTextColor={c.textTertiary}
              multiline
              selectionColor={c.accent}
              style={[type.body, styles.notesInput, { color: c.text }]}
            />
          </Card>

          <Field label="Due" value={due === null ? 'None' : relativeDay(due)}>
            <View style={styles.chipWrap}>
              <Chip label="None" selected={dueKey === 'none'} onPress={() => pickDue('none')} />
              <Chip label="Today" selected={dueKey === 'today'} onPress={() => pickDue('today')} />
              <Chip label="Tomorrow" selected={dueKey === 'tomorrow'} onPress={() => pickDue('tomorrow')} />
              <Chip label="Next week" selected={dueKey === 'week'} onPress={() => pickDue('week')} />
              <Chip
                label={dueKey === 'custom' && due !== null ? shortDate(due) : 'Date…'}
                icon="calendar"
                selected={dueKey === 'custom'}
                onPress={() => pickDue('custom')}
              />
            </View>
            {showCalendar && (
              <Animated.View entering={FadeIn} exiting={FadeOut} style={{ marginTop: space.sm }}>
                <Card padded={false} style={{ padding: space.sm }}>
                  <DateTimePicker
                    value={new Date(due ?? Date.now())}
                    mode="date"
                    display="inline"
                    minimumDate={new Date(startOfDay())}
                    accentColor={c.accent}
                    themeVariant={dark ? 'dark' : 'light'}
                    onChange={(_e, d) => d && setDue(startOfDay(d))}
                  />
                </Card>
              </Animated.View>
            )}
          </Field>

          <Field label="Priority" value={priority ? `P${4 - priority}` : '—'}>
            <Segmented<Priority>
              value={priority}
              onChange={setPriority}
              options={priorityLabels.map((label, i) => ({ value: i as Priority, label }))}
            />
          </Field>

          <Field label="List" value={lists.find((l) => l.id === listId)?.name ?? ''}>
            <View style={styles.chipWrap}>
              {lists.map((l) => (
                <Chip
                  key={l.id}
                  label={l.name}
                  icon={l.icon}
                  selected={listId === l.id}
                  onPress={() => {
                    haptic('select');
                    setListId(l.id);
                  }}
                />
              ))}
            </View>
          </Field>

          {task && (
            <Card padded={false} style={{ marginTop: space.lg }}>
              <ActionRow
                icon={task.done ? 'arrow.uturn.backward' : 'checkmark.circle'}
                label={task.done ? 'Mark as not done' : 'Mark as done'}
                color={c.text}
                onPress={() => {
                  haptic(task.done ? 'light' : 'success');
                  toggleTask(task.id);
                  onClose();
                }}
              />
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <ActionRow
                icon="trash"
                label="Delete task"
                color={c.danger}
                onPress={() =>
                  Alert.alert('Delete this task?', 'This can’t be undone.', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Delete',
                      style: 'destructive',
                      onPress: () => {
                        haptic('warning');
                        deleteTask(task.id);
                        onClose();
                      },
                    },
                  ])
                }
              />
            </Card>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function Field({ label, value, children }: { label: string; value: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: space.lg }}>
      <SectionLabel right={value}>{label}</SectionLabel>
      {children}
    </View>
  );
}

function ActionRow({
  icon,
  label,
  color,
  onPress,
}: {
  icon: 'arrow.uturn.backward' | 'checkmark.circle' | 'trash';
  label: string;
  color: string;
  onPress: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress}>
      {({ pressed }) => (
        <View style={[styles.action, pressed && { backgroundColor: c.surfaceAlt }]}>
          <Icon name={icon} size={16} color={color} />
          <Text style={[type.title, { color }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: space.md,
    paddingTop: space.md,
    paddingBottom: space.sm,
  },
  content: { padding: space.md, paddingBottom: 60 },
  titleInput: { paddingHorizontal: space.md, paddingTop: space.md, paddingBottom: 12 },
  divider: { height: StyleSheet.hairlineWidth, marginLeft: space.md },
  notesInput: { paddingHorizontal: space.md, paddingTop: 12, paddingBottom: space.md, minHeight: 84, textAlignVertical: 'top' },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  action: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.md, height: 52, borderRadius: radius.lg },
});
