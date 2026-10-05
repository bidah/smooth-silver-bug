import { Alert, Modal, StyleSheet, Text, View } from 'react-native';
import {
  Button,
  Form,
  Host,
  LabeledContent,
  Picker,
  Section,
  Text as SwiftText,
  TextField,
  Toggle,
  useNativeState,
} from '@expo/ui/swift-ui';
import { pickerStyle, tag, tint } from '@expo/ui/swift-ui/modifiers';
import { GlassIconButton } from '../design/components';
import { space, type } from '../design/theme';
import { useStore, useTheme, type Settings } from '../store';

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { c } = useTheme();
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: c.bg }]}>
        <View style={styles.nav}>
          <View>
            <Text style={[type.labelCaps, { color: c.textSecondary }]}>Clarity</Text>
            <Text style={[type.h1, { color: c.text, marginTop: 4 }]}>Settings</Text>
          </View>
          <GlassIconButton icon="xmark" label="Close" size="regular" onPress={onClose} />
        </View>
        {visible && <SettingsForm onClose={onClose} />}
      </View>
    </Modal>
  );
}

function SettingsForm({ onClose }: { onClose: () => void }) {
  const { c, dark } = useTheme();
  const { settings, tasks, updateSettings, clearCompleted, resetAll, haptic } = useStore();
  const name = useNativeState(settings.name);
  const doneCount = tasks.filter((t) => t.done).length;
  const openCount = tasks.length - doneCount;

  return (
    <Host style={{ flex: 1 }} colorScheme={dark ? 'dark' : 'light'}>
      <Form modifiers={[tint(c.accent)]}>
        <Section title="Profile">
          <TextField
            text={name}
            placeholder="Your name"
            maxLength={24}
            onTextChange={(v) => updateSettings({ name: v })}
          />
          <LabeledContent label="Tasks">
            <SwiftText>{`${openCount} open · ${doneCount} done`}</SwiftText>
          </LabeledContent>
        </Section>

        <Section title="Appearance">
          <Picker<Settings['appearance']>
            selection={settings.appearance}
            onSelectionChange={(appearance) => {
              haptic('select');
              updateSettings({ appearance });
            }}
            modifiers={[pickerStyle('segmented')]}
          >
            <SwiftText modifiers={[tag('system')]}>System</SwiftText>
            <SwiftText modifiers={[tag('light')]}>Light</SwiftText>
            <SwiftText modifiers={[tag('dark')]}>Dark</SwiftText>
          </Picker>
        </Section>

        <Section title="Preferences">
          <Toggle
            label="Haptic feedback"
            systemImage="iphone.radiowaves.left.and.right"
            isOn={settings.haptics}
            onIsOnChange={(haptics) => updateSettings({ haptics })}
          />
          <Toggle
            label="Show completed"
            systemImage="checkmark.circle"
            isOn={settings.showCompleted}
            onIsOnChange={(showCompleted) => updateSettings({ showCompleted })}
          />
        </Section>

        <Section title="Data" footer={<SwiftText>Your tasks are stored privately on this device.</SwiftText>}>
          <Button
            label="Replay onboarding"
            systemImage="sparkles"
            onPress={() => {
              onClose();
              updateSettings({ onboarded: false });
            }}
          />
          <Button
            label={`Clear completed (${doneCount})`}
            systemImage="checkmark.rectangle.stack"
            onPress={() => {
              if (!doneCount) return;
              Alert.alert('Clear completed tasks?', `${doneCount} task${doneCount === 1 ? '' : 's'} will be removed.`, [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear',
                  style: 'destructive',
                  onPress: () => {
                    haptic('warning');
                    clearCompleted();
                  },
                },
              ]);
            }}
          />
          <Button
            label="Erase all data"
            systemImage="trash"
            role="destructive"
            onPress={() =>
              Alert.alert('Erase everything?', 'All tasks and settings will be deleted.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Erase',
                  style: 'destructive',
                  onPress: () => {
                    haptic('warning');
                    onClose();
                    resetAll();
                  },
                },
              ])
            }
          />
        </Section>

        <Section title="About">
          <LabeledContent label="Version">
            <SwiftText>1.0</SwiftText>
          </LabeledContent>
        </Section>
      </Form>
    </Host>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: space.md + 4,
    paddingTop: space.lg,
    paddingBottom: space.sm,
  },
});
