import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.surfscore.app',
  appName: 'SurfScore',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    cleartext: true,
    url: 'http://192.168.1.57:3000'
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystorePassword: undefined,
      keystoreAlias: undefined,
      keystoreAliasPassword: undefined,
    }
  }
};

export default config;
