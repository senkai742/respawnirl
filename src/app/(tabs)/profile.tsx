import { NeonButton } from '@/components/NeonButton';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

export default function ProfileScreen() {
  const [session, setSession] = useState<Session | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  // Unit display toggles
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');

  // Editable fields
  const [editFullName, setEditFullName] = useState('');
  const [editWeight, setEditWeight] = useState('');
  const [editHeightCm, setEditHeightCm] = useState('');
  const [editHeightFt, setEditHeightFt] = useState('');
  const [editHeightIn, setEditHeightIn] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (!session) {
        router.replace('/auth');
      } else {
        initFromMeta(session.user.user_metadata || {});
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) router.replace('/auth');
    });

    return () => subscription.unsubscribe();
  }, []);

  function initFromMeta(meta: any) {
    const wu = meta.weight_unit || 'kg';
    const hu = meta.height_unit || 'cm';
    setWeightUnit(wu);
    setHeightUnit(hu);
    setEditFullName(meta.full_name || '');

    // Pre-fill weight in the user's preferred unit
    if (meta.weight) {
      const storedKg = parseFloat(meta.weight);
      if (wu === 'lbs') {
        setEditWeight(parseFloat((storedKg / 0.453592).toFixed(1)).toString());
      } else {
        setEditWeight(storedKg.toString());
      }
    }

    // Pre-fill height in the user's preferred unit
    if (meta.height) {
      const storedCm = parseFloat(meta.height);
      if (hu === 'ft') {
        const totalInches = storedCm / 2.54;
        setEditHeightFt(Math.floor(totalInches / 12).toString());
        setEditHeightIn(Math.round(totalInches % 12).toString());
      } else {
        setEditHeightCm(storedCm.toString());
      }
    }
  }

  async function handleSave() {
    setSaving(true);

    // Convert to standardized kg/cm for storage
    const rawWeight = parseFloat(editWeight) || 0;
    const finalWeight = weightUnit === 'lbs'
      ? parseFloat((rawWeight * 0.453592).toFixed(1))
      : rawWeight;

    let finalHeight = 0;
    if (heightUnit === 'cm') {
      finalHeight = parseFloat(editHeightCm) || 0;
    } else {
      const ft = parseInt(editHeightFt, 10) || 0;
      const inch = parseInt(editHeightIn, 10) || 0;
      finalHeight = Math.round((ft * 12 + inch) * 2.54);
    }

    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: editFullName,
        weight: finalWeight,
        weight_unit: weightUnit,
        height: finalHeight,
        height_unit: heightUnit,
      },
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      // Refresh session to get updated metadata
      const { data: { session: refreshed } } = await supabase.auth.getSession();
      setSession(refreshed);
      setIsEditing(false);
      Alert.alert('Saved', 'Profile updated successfully.');
    }
    setSaving(false);
  }

  function handleCancelEdit() {
    // Reset edits to current saved values
    if (session) initFromMeta(session.user.user_metadata || {});
    setIsEditing(false);
  }

  async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/auth');
    }
  }

  const UnitToggle = ({
    options,
    selected,
    onSelect,
  }: {
    options: string[];
    selected: string;
    onSelect: (v: any) => void;
  }) => (
    <View style={styles.unitSelector}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          style={[styles.unitOption, selected === opt && styles.unitOptionSelected]}
          onPress={() => onSelect(opt)}
        >
          <Text style={[styles.unitText, selected === opt && styles.unitTextSelected]}>
            {opt.toUpperCase()}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  if (!session) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.headerTitle}>LOADING...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const meta = session.user.user_metadata || {};

  const formatWeight = () => {
    if (!meta.weight) return '?';
    const kg = parseFloat(meta.weight);
    if (weightUnit === 'lbs') return `${parseFloat((kg / 0.453592).toFixed(1))} lbs`;
    return `${kg} kg`;
  };

  const formatHeight = () => {
    if (!meta.height) return '?';
    const cm = parseFloat(meta.height);
    if (heightUnit === 'ft') {
      const totalInches = cm / 2.54;
      const feet = Math.floor(totalInches / 12);
      const inches = Math.round(totalInches % 12);
      return `${feet}' ${inches}"`;
    }
    return `${cm} cm`;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>USER PROFILE</Text>

        <View style={styles.profileContainer}>
          {/* Identity Card */}
          <View style={styles.infoCard}>
            {isEditing ? (
              <>
                <Text style={styles.label}>Identity</Text>
                <TextInput
                  style={styles.input}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.dark.textSecondary}
                />
              </>
            ) : (
              <>
                <Text style={styles.label}>Identity</Text>
                <Text style={styles.value}>{meta.full_name || session.user.email}</Text>
              </>
            )}

            <Text style={styles.label}>Codename</Text>
            <Text style={styles.value}>{meta.username || 'UNKNOWN'}</Text>

            <Text style={styles.label}>Age</Text>
            <Text style={styles.value}>{meta.age ? `${meta.age} yrs` : '?'}</Text>

            <Text style={styles.label}>Cloud Status</Text>
            <Text style={[styles.value, { color: Colors.dark.neonGreen, marginBottom: 0 }]}>
              CONNECTED & SECURE
            </Text>
          </View>

          {/* Physical Stats Card */}
          <View style={[styles.infoCard, { marginTop: 12 }]}>
            <Text style={styles.sectionTitle}>PHYSICAL STATS</Text>

            {/* Weight Row */}
            <View style={styles.statRow}>
              <View style={styles.statLabelCol}>
                <Text style={styles.label}>Weight</Text>
                {isEditing ? (
                  <TextInput
                    style={styles.statInput}
                    value={editWeight}
                    onChangeText={setEditWeight}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                  />
                ) : (
                  <Text style={styles.statValue}>{formatWeight()}</Text>
                )}
              </View>
              <UnitToggle
                options={['kg', 'lbs']}
                selected={weightUnit}
                onSelect={(u: 'kg' | 'lbs') => {
                  // Convert the edit field value when switching units
                  if (isEditing) {
                    const v = parseFloat(editWeight) || 0;
                    if (u === 'lbs' && weightUnit === 'kg') {
                      setEditWeight(parseFloat((v / 0.453592).toFixed(1)).toString());
                    } else if (u === 'kg' && weightUnit === 'lbs') {
                      setEditWeight(parseFloat((v * 0.453592).toFixed(1)).toString());
                    }
                  }
                  setWeightUnit(u);
                }}
              />
            </View>

            {/* Height Row */}
            <View style={[styles.statRow, { marginTop: 12, borderTopWidth: 1, borderTopColor: Colors.dark.border, paddingTop: 12 }]}>
              <View style={styles.statLabelCol}>
                <Text style={styles.label}>Height</Text>
                {isEditing ? (
                  heightUnit === 'cm' ? (
                    <TextInput
                      style={styles.statInput}
                      value={editHeightCm}
                      onChangeText={setEditHeightCm}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={Colors.dark.textSecondary}
                    />
                  ) : (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TextInput
                        style={[styles.statInput, { width: 50 }]}
                        value={editHeightFt}
                        onChangeText={setEditHeightFt}
                        keyboardType="numeric"
                        placeholder="Ft"
                        placeholderTextColor={Colors.dark.textSecondary}
                        maxLength={1}
                      />
                      <TextInput
                        style={[styles.statInput, { width: 50 }]}
                        value={editHeightIn}
                        onChangeText={setEditHeightIn}
                        keyboardType="numeric"
                        placeholder="In"
                        placeholderTextColor={Colors.dark.textSecondary}
                        maxLength={2}
                      />
                    </View>
                  )
                ) : (
                  <Text style={styles.statValue}>{formatHeight()}</Text>
                )}
              </View>
              <UnitToggle
                options={['cm', 'ft']}
                selected={heightUnit}
                onSelect={(u: 'cm' | 'ft') => {
                  // Convert the edit field value when switching units
                  if (isEditing) {
                    if (u === 'ft' && heightUnit === 'cm') {
                      const cm = parseFloat(editHeightCm) || 0;
                      const totalInches = cm / 2.54;
                      setEditHeightFt(Math.floor(totalInches / 12).toString());
                      setEditHeightIn(Math.round(totalInches % 12).toString());
                    } else if (u === 'cm' && heightUnit === 'ft') {
                      const ft = parseInt(editHeightFt, 10) || 0;
                      const inch = parseInt(editHeightIn, 10) || 0;
                      setEditHeightCm(Math.round((ft * 12 + inch) * 2.54).toString());
                    }
                  }
                  setHeightUnit(u);
                }}
              />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            {isEditing ? (
              <>
                <View style={styles.actionBtn}>
                  <NeonButton
                    title="CANCEL"
                    onPress={handleCancelEdit}
                    color={Colors.dark.textSecondary}
                    disabled={saving}
                  />
                </View>
                <View style={styles.actionBtn}>
                  <NeonButton
                    title={saving ? 'SAVING...' : 'SAVE CHANGES'}
                    onPress={handleSave}
                    color={Colors.dark.neonGreen}
                    disabled={saving}
                  />
                </View>
              </>
            ) : (
              <>
                <View style={styles.actionBtn}>
                  <NeonButton
                    title="EDIT PROFILE"
                    onPress={() => setIsEditing(true)}
                    color={Colors.dark.neonCyan}
                  />
                </View>
                <View style={styles.actionBtn}>
                  <NeonButton
                    title="DISCONNECT (LOGOUT)"
                    onPress={signOut}
                    color={Colors.dark.neonRed}
                  />
                </View>
              </>
            )}
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
  sectionTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 16,
  },
  label: {
    color: Colors.dark.textSecondary,
    fontSize: 11,
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
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    padding: 10,
    borderRadius: 6,
    fontSize: 16,
    marginBottom: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabelCol: {
    flex: 1,
  },
  statValue: {
    color: Colors.dark.neonCyan,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statInput: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.neonCyan,
    color: Colors.dark.neonCyan,
    padding: 8,
    borderRadius: 6,
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 80,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flex: 1,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  unitOptionSelected: {
    backgroundColor: Colors.dark.neonCyan + '30',
  },
  unitText: {
    fontSize: 12,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
  },
  unitTextSelected: {
    color: Colors.dark.neonCyan,
  },
});
