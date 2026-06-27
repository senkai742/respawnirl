import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Alert, ScrollView } from 'react-native';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { Colors } from '@/constants/theme';
import { NeonButton } from '@/components/NeonButton';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        // If they somehow got here without a session, boot them to auth
        router.replace('/auth');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        router.replace('/auth');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) Alert.alert('Error', error.message);
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>LOADING...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Safely extract metadata we passed during signup
  const meta = session.user.user_metadata || {};

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>USER PROFILE</Text>
        
        <View style={styles.profileContainer}>
          <View style={styles.infoCard}>
            <Text style={styles.label}>Identity:</Text>
            <Text style={styles.value}>{meta.full_name || session.user.email}</Text>
            
            <Text style={styles.label}>Codename (Username):</Text>
            <Text style={styles.value}>{meta.username || 'UNKNOWN'}</Text>

            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.label}>AGE</Text>
                <Text style={styles.value}>{meta.age || '?'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.label}>WEIGHT</Text>
                <Text style={styles.value}>{meta.weight ? `${meta.weight}` : '?'}</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.label}>HEIGHT</Text>
                <Text style={styles.value}>{meta.height ? `${meta.height}` : '?'}</Text>
              </View>
            </View>
            
            <Text style={styles.label}>Cloud Status:</Text>
            <Text style={[styles.value, { color: Colors.dark.neonGreen }]}>
              CONNECTED & SECURE
            </Text>
          </View>
          
          <View style={{ marginTop: 24 }}>
            <NeonButton
              title="DISCONNECT (LOGOUT)"
              onPress={signOut}
              color={Colors.dark.neonRed}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flexGrow: 1,
    padding: 16,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingBottom: 8,
  },
  profileContainer: {
    flex: 1,
  },
  infoCard: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  value: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.dark.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  statBox: {
    alignItems: 'center',
  }
});
