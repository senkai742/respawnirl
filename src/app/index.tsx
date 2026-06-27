import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';

export default function Index() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(!!session);
      setSessionChecked(true);
    });
  }, []);

  if (!sessionChecked) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.dark.neonCyan} />
      </View>
    );
  }

  if (isLoggedIn) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return <Redirect href="/onboarding" />;
}
