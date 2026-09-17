import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.dormly.dormosaur',
  appName: 'Dormosaur',
  webDir: 'out',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F7F8F5',
      showSpinner: false,
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#F7F8F5',
    },
  },
}

export default config
