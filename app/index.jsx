import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to splash screen immediately
  return <Redirect href="/splash" />;
}
