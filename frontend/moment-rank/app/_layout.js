import { Stack } from 'expo-router';
import { useFonts, JacquesFrancoisShadow_400Regular } from "@expo-google-fonts/jacques-francois-shadow";
import { Roboto_400Regular, Roboto_700Bold } from "@expo-google-fonts/roboto";

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    JacquesFrancoisShadow_400Regular,
    Roboto_400Regular,
    Roboto_700Bold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#ffffff' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="register" />
      <Stack.Screen name="first-time-login" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
