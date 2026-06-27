import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TextInput, Alert, ScrollView, Pressable, Modal, FlatList } from 'react-native';

const MONTHS = [
  { label: 'January', value: '01' },
  { label: 'February', value: '02' },
  { label: 'March', value: '03' },
  { label: 'April', value: '04' },
  { label: 'May', value: '05' },
  { label: 'June', value: '06' },
  { label: 'July', value: '07' },
  { label: 'August', value: '08' },
  { label: 'September', value: '09' },
  { label: 'October', value: '10' },
  { label: 'November', value: '11' },
  { label: 'December', value: '12' },
];
import { supabase } from '@/lib/supabase';
import { Colors } from '@/constants/theme';
import { NeonButton } from '@/components/NeonButton';
import { useRouter } from 'expo-router';

export default function AuthScreen() {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Basic Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Profile State
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Birthdate
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);
  
  // Weight & Height
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [heightCm, setHeightCm] = useState('');
  const [heightFt, setHeightFt] = useState('');
  const [heightIn, setHeightIn] = useState('');

  // Calculate age from MM / YYYY
  const calculateAge = () => {
    if (!birthMonth || !birthYear) return 0;
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const m = parseInt(birthMonth, 10);
    const y = parseInt(birthYear, 10);
    
    if (isNaN(m) || isNaN(y)) return 0;
    
    let age = currentYear - y;
    if (currentMonth < m) {
      age--; // Hasn't had birthday this year yet
    }
    return age;
  };

  // Convert height to cm for standard storage
  const getStandardizedHeight = () => {
    if (heightUnit === 'cm') {
      return parseInt(heightCm, 10) || 0;
    } else {
      const ft = parseInt(heightFt, 10) || 0;
      const inch = parseInt(heightIn, 10) || 0;
      // 1 ft = 30.48 cm, 1 in = 2.54 cm
      return Math.round((ft * 12 + inch) * 2.54);
    }
  };

  // Convert weight to kg for standard storage
  const getStandardizedWeight = () => {
    const w = parseFloat(weight) || 0;
    if (weightUnit === 'kg') {
      return w;
    } else {
      // lbs to kg
      return parseFloat((w * 0.453592).toFixed(1));
    }
  };

  async function checkUsernameUnique(uname: string) {
    if (!uname) return false;
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', uname)
      .maybeSingle(); // maybeSingle returns null if no rows, instead of an error

    if (error && error.code !== 'PGRST116') {
       console.error("Username check error", error);
       return false; // If there's a DB error, we might just let it fail at trigger or ignore.
    }
    return !!data; // True if it exists (not unique)
  }

  async function handleLogin() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }

  async function handleSignup() {
    setUsernameError('');
    if (!email || !password || !fullName || !username || !birthMonth || !birthYear) {
      Alert.alert('Missing Fields', 'Please fill in all core fields to register.');
      return;
    }

    setLoading(true);

    // 1. Check Username Uniqueness
    const isTaken = await checkUsernameUnique(username);
    if (isTaken) {
      setUsernameError('Username already taken.');
      setLoading(false);
      return;
    }

    const age = calculateAge();
    const finalWeight = getStandardizedWeight();
    const finalHeight = getStandardizedHeight();

    // 2. Sign up
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username,
          age,
          weight: finalWeight,
          weight_unit: weightUnit,
          height: finalHeight,
          height_unit: heightUnit,
        }
      }
    });

    if (error) {
      Alert.alert('Error', error.message);
      setLoading(false);
    } else if (!session) {
      Alert.alert('Success', 'Check your email for the login link!');
      setLoading(false);
    } else {
      router.replace('/(tabs)/dashboard');
    }
  }

  const UnitSelector = ({ options, selected, onSelect }: any) => (
    <View style={styles.unitSelector}>
      {options.map((opt: string) => (
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.headerTitle}>{isLoginMode ? 'ACCESS CLOUD DATA' : 'CREATE PROFILE'}</Text>
        
        <View style={styles.authContainer}>
          {!isLoginMode && (
            <>
              {/* Full Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Identity</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>

              {/* Username */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Codename</Text>
                <TextInput
                  style={[styles.input, usernameError ? styles.inputError : null]}
                  placeholder="Username"
                  placeholderTextColor={Colors.dark.textSecondary}
                  value={username}
                  onChangeText={(val) => {
                    setUsername(val);
                    setUsernameError(''); // Clear error on type
                  }}
                  autoCapitalize="none"
                />
                {!!usernameError && <Text style={styles.errorText}>{usernameError}</Text>}
              </View>

              {/* Birthdate */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Date of Birth</Text>
                <View style={styles.row}>
                  {/* Month Selector */}
                  <Pressable
                    style={[styles.input, styles.flexInput, styles.pickerButton]}
                    onPress={() => setMonthPickerVisible(true)}
                  >
                    <Text style={birthMonth ? styles.pickerText : styles.pickerPlaceholder}>
                      {birthMonth ? MONTHS.find(m => m.value === birthMonth)?.label : 'Month'}
                    </Text>
                    <Text style={styles.pickerChevron}>▾</Text>
                  </Pressable>

                  <TextInput
                    style={[styles.input, styles.flexInput]}
                    placeholder="YYYY"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={birthYear}
                    onChangeText={setBirthYear}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>
              </View>

              {/* Month Picker Modal */}
              <Modal
                visible={monthPickerVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setMonthPickerVisible(false)}
              >
                <Pressable style={styles.modalOverlay} onPress={() => setMonthPickerVisible(false)}>
                  <View style={styles.monthPickerContainer}>
                    <Text style={styles.monthPickerTitle}>SELECT MONTH</Text>
                    <FlatList
                      data={MONTHS}
                      keyExtractor={(item) => item.value}
                      renderItem={({ item }) => (
                        <Pressable
                          style={[styles.monthOption, birthMonth === item.value && styles.monthOptionSelected]}
                          onPress={() => {
                            setBirthMonth(item.value);
                            setMonthPickerVisible(false);
                          }}
                        >
                          <Text style={[styles.monthOptionText, birthMonth === item.value && styles.monthOptionTextSelected]}>
                            {item.label}
                          </Text>
                        </Pressable>
                      )}
                    />
                  </View>
                </Pressable>
              </Modal>

              {/* Physical Stats Row */}
              <View style={styles.row}>
                {/* Weight */}
                <View style={[styles.fieldGroup, styles.flexInput]}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Weight</Text>
                    <UnitSelector 
                      options={['kg', 'lbs']} 
                      selected={weightUnit} 
                      onSelect={setWeightUnit} 
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={Colors.dark.textSecondary}
                    value={weight}
                    onChangeText={setWeight}
                    keyboardType="numeric"
                  />
                </View>

                {/* Height */}
                <View style={[styles.fieldGroup, styles.flexInput]}>
                  <View style={styles.labelRow}>
                    <Text style={styles.fieldLabel}>Height</Text>
                    <UnitSelector 
                      options={['cm', 'ft']} 
                      selected={heightUnit} 
                      onSelect={setHeightUnit} 
                    />
                  </View>
                  
                  {heightUnit === 'cm' ? (
                    <TextInput
                      style={styles.input}
                      placeholder="0"
                      placeholderTextColor={Colors.dark.textSecondary}
                      value={heightCm}
                      onChangeText={setHeightCm}
                      keyboardType="numeric"
                    />
                  ) : (
                    <View style={styles.row}>
                      <TextInput
                        style={[styles.input, styles.flexInput]}
                        placeholder="Ft"
                        placeholderTextColor={Colors.dark.textSecondary}
                        value={heightFt}
                        onChangeText={setHeightFt}
                        keyboardType="numeric"
                        maxLength={1}
                      />
                      <TextInput
                        style={[styles.input, styles.flexInput]}
                        placeholder="In"
                        placeholderTextColor={Colors.dark.textSecondary}
                        value={heightIn}
                        onChangeText={setHeightIn}
                        keyboardType="numeric"
                        maxLength={2}
                      />
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Credentials */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Credentials</Text>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Colors.dark.textSecondary}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={Colors.dark.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>
          
          <View style={{ marginTop: 24 }}>
            {isLoginMode ? (
              <NeonButton
                title="INITIATE LOGIN"
                onPress={handleLogin}
                color={Colors.dark.neonCyan}
                disabled={loading}
              />
            ) : (
              <NeonButton
                title="ESTABLISH LINK"
                onPress={handleSignup}
                color={Colors.dark.neonGreen}
                disabled={loading}
              />
            )}
          </View>
          
          <Text 
            style={styles.toggleText} 
            onPress={() => {
              setIsLoginMode(!isLoginMode);
              setUsernameError('');
            }}
          >
            {isLoginMode 
              ? "New Operative? Establish Link" 
              : "Returning Operative? Initiate Login"}
          </Text>
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
    padding: 20,
    justifyContent: 'center',
  },
  headerTitle: {
    color: Colors.dark.neonCyan,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 2,
    textShadowColor: Colors.dark.neonCyan,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  authContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    padding: 12,
    borderRadius: 6,
    fontSize: 16,
  },
  inputError: {
    borderColor: Colors.dark.neonRed,
  },
  errorText: {
    color: Colors.dark.neonRed,
    fontSize: 12,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginVertical: 12,
  },
  toggleText: {
    color: Colors.dark.textSecondary,
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.background,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    overflow: 'hidden',
  },
  unitOption: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  unitOptionSelected: {
    backgroundColor: Colors.dark.border,
  },
  unitText: {
    fontSize: 10,
    color: Colors.dark.textSecondary,
    fontWeight: 'bold',
  },
  unitTextSelected: {
    color: Colors.dark.text,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  pickerPlaceholder: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  pickerChevron: {
    color: Colors.dark.textSecondary,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPickerContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    width: '80%',
    maxHeight: 400,
    overflow: 'hidden',
  },
  monthPickerTitle: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    textAlign: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  monthOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  monthOptionSelected: {
    backgroundColor: Colors.dark.neonCyan + '20',
  },
  monthOptionText: {
    color: Colors.dark.text,
    fontSize: 16,
  },
  monthOptionTextSelected: {
    color: Colors.dark.neonCyan,
    fontWeight: 'bold',
  },
});
