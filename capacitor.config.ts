import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.syacreates.pinlove',
  appName: 'PinLove',
  webDir: 'public',
  server: {
    url: 'https://pinlove-legal.vercel.app',
    androidScheme: 'https',
  },
};

export default config;
