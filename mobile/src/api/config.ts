import Constants from 'expo-constants';
import { Platform } from 'react-native';

// The real, deployed backend (Railway). Used for all release/production builds -
// there's no "dev machine" to discover once the app is out of your hands.
const PRODUCTION_HOST = 'cartly-production-5be2.up.railway.app';

// The backend runs on port 8082 locally (see backend/src/main/resources/application.properties).
// A physical device (Expo Go) can't reach "localhost" - it needs the dev machine's LAN IP.
// Expo's dev server already knows that IP (it's how the phone reached the JS bundle at all),
// so we reuse it here instead of hardcoding an address that breaks when the network changes.
function resolveDevHost(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const lanIp = hostUri?.split(':')[0];
  if (lanIp) return lanIp;

  // Fallback for simulators/emulators, which don't go through a LAN dev-server connection.
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

// __DEV__ is true in Expo Go / dev builds, false in anything built for release
// (TestFlight, App Store, Play Store) - there's no Metro/dev-server to discover then.
export const API_BASE_URL = __DEV__ ? `http://${resolveDevHost()}:8082` : `https://${PRODUCTION_HOST}`;
export const WS_URL = __DEV__
  ? `ws://${resolveDevHost()}:8082/ws/websocket`
  : `wss://${PRODUCTION_HOST}/ws/websocket`;
