import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syacreates.pinlove',
  appName: 'PinLove',
  webDir: 'public',
  server: {
    url: 'https://pinlove-legal.vercel.app',
    androidScheme: 'https',
  },
  plugins: {
    // Mode Rencontres : rappels (veille, H-2…) affichés même app ouverte.
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
