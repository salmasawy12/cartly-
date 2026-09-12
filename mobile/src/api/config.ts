import Constants from 'expo-constants';
import { Platform } from 'react-native';

// The backend runs on port 8082 (see backend/src/main/resources/application.properties).
// A physical device (Expo Go) can't reach "localhost" - it needs the dev machine's LAN IP.
// Expo's dev server already knows that IP (it's how the phone reached the JS bundle at all),
// so we reuse it here instead of hardcoding an address that breaks when the network changes.
function resolveHost(): string {
  const hostUri = Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  const lanIp = hostUri?.split(':')[0];
  if (lanIp) return lanIp;

  // Fallback for simulators/emulators, which don't go through a LAN dev-server connection.
  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

const HOST = resolveHost();

export const API_BASE_URL = `http://${HOST}:8082`;
export const WS_URL = `ws://${HOST}:8082/ws/websocket`;
