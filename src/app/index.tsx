import { Redirect } from 'expo-router';

export default function Index() {
  // Normally, check AsyncStorage to see if user completed onboarding.
  // For now, always redirect to onboarding to demonstrate the flow.
  return <Redirect href="/onboarding" />;
}
