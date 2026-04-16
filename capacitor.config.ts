import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.muninn.app',
  appName: 'Muninn',
  webDir: 'dist',
  server: {
    // Enable this during development to use the Vite dev server:
    // url: 'http://YOUR_LOCAL_IP:5173',
    // cleartext: true
  },
  ios: {
    contentInset: 'automatic'
  }
}

export default config
