import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts, Geist_400Regular, Geist_500Medium, Geist_600SemiBold } from '@expo-google-fonts/geist';
import { GeistMono_400Regular, GeistMono_500Medium } from '@expo-google-fonts/geist-mono';
import { StoreProvider, useStore, useTheme } from './store';
import { Onboarding } from './screens/Onboarding';
import { Home } from './screens/Home';

function Root() {
  const { settings } = useStore();
  const { c, dark } = useTheme();
  // Render immediately; Geist swaps in once loaded (never block mount on fonts).
  useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    GeistMono_400Regular,
    GeistMono_500Medium,
  });
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Animated.View key={settings.onboarded ? 'home' : 'onboarding'} entering={FadeIn.duration(350)} style={{ flex: 1 }}>
        {settings.onboarded ? <Home /> : <Onboarding />}
      </Animated.View>
      <StatusBar style={dark ? 'light' : 'dark'} />
    </View>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StoreProvider>
          <Root />
        </StoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
