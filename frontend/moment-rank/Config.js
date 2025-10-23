import { Platform } from 'react-native';

// LAN IP
const IP = 'localhost';
const PORT = 5000;

const BASE_URL = (() => {
  if (Platform.OS === 'web') {
    return `http://localhost:${PORT}`;
  } else {
    // If testing on other device
    return `http://${IP}:${PORT}`;
  }
})();

export default BASE_URL;