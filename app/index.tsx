import { Redirect } from 'expo-router';
import { useAuth } from '@/store/AuthContext';

export default function IndexRoute() {
  const { hydrated, isAuthenticated } = useAuth();
  if (!hydrated) return null;
  return <Redirect href={isAuthenticated ? '/(tabs)' : '/(auth)/login'} />;
}
