import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="setpassword" />
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="forgetpassword" />
      <Stack.Screen name="manageprofile" />
      <Stack.Screen name="stock" />
      <Stack.Screen name="invoice" />
      
    </Stack>
  );
}
