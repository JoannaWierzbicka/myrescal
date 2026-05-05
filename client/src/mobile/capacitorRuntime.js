import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

const runNativeSetup = async (setup) => {
  try {
    await setup();
  } catch (error) {
    console.warn('Native mobile setup failed', error);
  }
};

export function configureCapacitorRuntime() {
  if (!Capacitor.isNativePlatform()) return;

  runNativeSetup(() => StatusBar.setStyle({ style: Style.Dark }));
  runNativeSetup(() => StatusBar.setBackgroundColor({ color: '#1F3C4A' }));
  runNativeSetup(() => Keyboard.setResizeMode({ mode: KeyboardResize.Body }));
  runNativeSetup(() => SplashScreen.hide());
}
