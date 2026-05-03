import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/store/AuthContext';

export default function AuthLayout() {
  const { isAuthenticated, hydrated } = useAuth();
  if (!hydrated) return null;
  if (isAuthenticated) return <Redirect href="/(tabs)" />;
  return <Stack screenOptions={{ headerShown: false, animation: 'fade' }} />;
}
