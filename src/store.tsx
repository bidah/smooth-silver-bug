import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import { createMMKV } from 'react-native-mmkv';
import * as Haptics from 'expo-haptics';
import type { SFSymbol } from 'expo-symbols';
import { accents, palettes, type AccentKey, type Palette } from './design/theme';
import { addDays, startOfDay } from './lib/dates';

export type Priority = 0 | 1 | 2 | 3;

export type Task = {
  id: string;
  title: string;
  notes: string;
  listId: string;
  priority: Priority;
  due: number | null;
  done: boolean;
  createdAt: number;
  completedAt: number | null;
};

export type TaskList = { id: string; name: string; color: string; icon: SFSymbol };

export type Settings = {
  onboarded: boolean;
  name: string;
  accent: AccentKey;
  appearance: 'system' | 'light' | 'dark';
  haptics: boolean;
  showCompleted: boolean;
};

type State = { tasks: Task[]; lists: TaskList[]; settings: Settings };

const storage = createMMKV({ id: 'clarity' });
const KEY = 'state.v1';

const defaultLists: TaskList[] = [
  { id: 'personal', name: 'Personal', color: '#0A84FF', icon: 'person.fill' },
  { id: 'work', name: 'Work', color: '#FF9500', icon: 'briefcase.fill' },
  { id: 'shopping', name: 'Shopping', color: '#30B85C', icon: 'cart.fill' },
  { id: 'health', name: 'Health', color: '#FF2D78', icon: 'heart.fill' },
];

const defaultSettings: Settings = {
  onboarded: false,
  name: '',
  accent: 'indigo',
  appearance: 'system',
  haptics: true,
  showCompleted: true,
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

function sampleTasks(): Task[] {
  const today = startOfDay();
  const make = (title: string, listId: string, due: number | null, priority: Priority, notes = ''): Task => ({
    id: uid(),
    title,
    notes,
    listId,
    priority,
    due,
    done: false,
    createdAt: Date.now(),
    completedAt: null,
  });
  return [
    make('Tap the circle to complete a task', 'personal', today, 0, 'You will feel a satisfying little tap.'),
    make('Swipe left on a task to delete it', 'personal', today, 0),
    make('Prepare weekly team update', 'work', today, 3, 'Highlights, blockers, next steps.'),
    make('Buy oat milk & avocados', 'shopping', addDays(today, 1), 1),
    make('Evening run — 5 km', 'health', addDays(today, 2), 2),
    make('Plan the weekend trip', 'personal', null, 0),
  ];
}

function load(): State {
  try {
    const raw = storage.getString(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<State>;
      return {
        tasks: parsed.tasks ?? [],
        lists: parsed.lists?.length ? parsed.lists : defaultLists,
        settings: { ...defaultSettings, ...parsed.settings },
      };
    }
  } catch {}
  return { tasks: [], lists: defaultLists, settings: defaultSettings };
}

type TaskDraft = Omit<Task, 'id' | 'createdAt' | 'completedAt' | 'done'>;

type Store = State & {
  addTask: (t: TaskDraft) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  clearCompleted: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  completeOnboarding: (name: string, accent: AccentKey) => void;
  resetAll: () => void;
  haptic: (kind?: 'light' | 'medium' | 'success' | 'warning' | 'select') => void;
};

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(load);

  useEffect(() => {
    storage.set(KEY, JSON.stringify(state));
  }, [state]);

  const hapticsOn = state.settings.haptics;
  const haptic = useCallback<Store['haptic']>(
    (kind = 'light') => {
      if (!hapticsOn) return;
      if (kind === 'success') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      else if (kind === 'warning') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      else if (kind === 'select') Haptics.selectionAsync();
      else
        Haptics.impactAsync(
          kind === 'medium' ? Haptics.ImpactFeedbackStyle.Medium : Haptics.ImpactFeedbackStyle.Light,
        );
    },
    [hapticsOn],
  );

  const actions = useMemo(
    () => ({
      addTask: (t: TaskDraft) =>
        setState((s) => ({
          ...s,
          tasks: [{ ...t, id: uid(), done: false, createdAt: Date.now(), completedAt: null }, ...s.tasks],
        })),
      updateTask: (id: string, patch: Partial<Task>) =>
        setState((s) => ({ ...s, tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      toggleTask: (id: string) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) =>
            t.id === id ? { ...t, done: !t.done, completedAt: t.done ? null : Date.now() } : t,
          ),
        })),
      deleteTask: (id: string) => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      clearCompleted: () => setState((s) => ({ ...s, tasks: s.tasks.filter((t) => !t.done) })),
      updateSettings: (patch: Partial<Settings>) =>
        setState((s) => ({ ...s, settings: { ...s.settings, ...patch } })),
      completeOnboarding: (name: string, accent: AccentKey) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.length ? s.tasks : sampleTasks(),
          settings: { ...s.settings, name: name.trim(), accent, onboarded: true },
        })),
      resetAll: () => setState({ tasks: [], lists: defaultLists, settings: defaultSettings }),
    }),
    [],
  );

  const value = useMemo(() => ({ ...state, ...actions, haptic }), [state, actions, haptic]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const s = useContext(StoreContext);
  if (!s) throw new Error('useStore outside StoreProvider');
  return s;
}

export type Theme = { c: Palette; dark: boolean; accent: string; accentDeep: string };

export function useTheme(): Theme {
  const { settings } = useStore();
  const system = useColorScheme();
  const dark = settings.appearance === 'system' ? system === 'dark' : settings.appearance === 'dark';
  const a = accents[settings.accent] ?? accents.indigo;
  return { c: dark ? palettes.dark : palettes.light, dark, accent: a.base, accentDeep: a.deep };
}
