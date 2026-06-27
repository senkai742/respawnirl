import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Modal,
  TextInput,
  FlatList,
  Pressable,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { Colors } from '@/constants/theme';
import { useFuel } from '@/context/FuelContext';
import { NeonButton } from '@/components/NeonButton';
import { StatBar } from '@/components/StatBar';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function FuelCore() {
  const { items, targets, totals, isOverloaded, addConsumable, removeConsumable } = useFuel();
  const [modalVisible, setModalVisible] = useState(false);
  const [itemName, setItemName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');

  // SVG Ring values
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  // Animations
  const animatedStroke = useSharedValue(circumference);
  const pulseOpacity = useSharedValue(1);

  const remainingCals = Math.max(0, targets.calories - totals.calories);
  const ringColor = isOverloaded ? Colors.dark.neonRed : Colors.dark.neonCyan;

  useEffect(() => {
    // Fill ratio: If overloaded, ring is full (strokeDashoffset = 0)
    const ratio = isOverloaded ? 1 : totals.calories / targets.calories;
    animatedStroke.value = withTiming(circumference * (1 - ratio), { duration: 1000 });

    if (isOverloaded) {
      pulseOpacity.value = withRepeat(
        withSequence(withTiming(0.4, { duration: 500 }), withTiming(1, { duration: 500 })),
        -1, // infinite repeat
        true
      );
    } else {
      pulseOpacity.value = 1;
    }
  }, [totals.calories, isOverloaded, circumference]);

  const animatedCircleProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedStroke.value,
    opacity: pulseOpacity.value,
  }));

  const handleManifest = () => {
    if (!itemName || !calories || !protein || !carbs || !fat) return;

    addConsumable({
      name: itemName,
      calories: parseInt(calories, 10),
      protein: parseInt(protein, 10),
      carbs: parseInt(carbs, 10),
      fat: parseInt(fat, 10),
    });

    // Reset and close
    setItemName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
    setModalVisible(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>ENERGY MATRIX // FUEL MANAGEMENT</Text>

        {isOverloaded && (
          <View style={styles.overloadBanner}>
            <Text style={styles.overloadText}>
              ⚠️ ENERGY CORE OVERLOADED. TUTORIAL NPC DETECTED.
            </Text>
          </View>
        )}

        <View style={styles.hudContainer}>
          {/* Energy Core Ring */}
          <View style={styles.ringContainer}>
            <Svg height="200" width="200" viewBox="0 0 200 200">
              <Circle
                cx="100"
                cy="100"
                r={radius}
                stroke={Colors.dark.border}
                strokeWidth={strokeWidth}
                fill="none"
              />
              <AnimatedCircle
                cx="100"
                cy="100"
                r={radius}
                stroke={ringColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                animatedProps={animatedCircleProps}
                strokeLinecap="round"
                rotation="-90"
                origin="100, 100"
              />
            </Svg>
            <View style={styles.ringLabelContainer}>
              <Text style={[styles.ringNumber, { color: ringColor }]}>
                {remainingCals}
              </Text>
              <Text style={styles.ringSubtext}>KCAL REMAINING</Text>
            </View>
          </View>

          {/* Character Status Bars */}
          <View style={styles.statusBarsContainer}>
            <StatBar
              label="STR Status (Protein)"
              current={totals.protein}
              max={targets.protein}
              color={Colors.dark.neonCyan}
            />
            <StatBar
              label="VIT Status (Carbs)"
              current={totals.carbs}
              max={targets.carbs}
              color={Colors.dark.neonPurple}
            />
            <StatBar
              label="AGI Status (Fat)"
              current={totals.fat}
              max={targets.fat}
              color={Colors.dark.neonOrange}
            />
          </View>
        </View>

        {/* Consumed List */}
        <Text style={styles.listHeader}>Today's Manifest Log</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.itemCard}>
              <View style={styles.itemDetails}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemStats}>
                  {item.calories} kcal | {item.protein}g P | {item.carbs}g C | {item.fat}g F
                </Text>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => removeConsumable(item.id)}
              >
                <Text style={styles.deleteText}>Purge</Text>
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No fuel consumed yet.</Text>
          }
          contentContainerStyle={styles.listContent}
        />

        {/* Manifest FAB */}
        <View style={styles.fabContainer}>
          <NeonButton
            title="+ MANIFEST CONSUMABLE"
            onPress={() => setModalVisible(true)}
            color={Colors.dark.neonGreen}
          />
        </View>

        {/* Manifest Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <Text style={styles.modalHeader}>MANIFEST NEW FUEL</Text>
              <TextInput
                style={styles.input}
                placeholder="Item Designation (e.g. Chicken & Rice)"
                placeholderTextColor={Colors.dark.textSecondary}
                value={itemName}
                onChangeText={setItemName}
              />
              <TextInput
                style={styles.input}
                placeholder="Fuel Mass (kcal)"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={calories}
                onChangeText={setCalories}
              />
              <TextInput
                style={styles.input}
                placeholder="STR Catalyst (Protein g)"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={protein}
                onChangeText={setProtein}
              />
              <TextInput
                style={styles.input}
                placeholder="VIT Catalyst (Carbs g)"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={carbs}
                onChangeText={setCarbs}
              />
              <TextInput
                style={styles.input}
                placeholder="AGI Catalyst (Fat g)"
                placeholderTextColor={Colors.dark.textSecondary}
                keyboardType="numeric"
                value={fat}
                onChangeText={setFat}
              />
              
              <View style={styles.modalActions}>
                <NeonButton
                  title="CANCEL"
                  onPress={() => setModalVisible(false)}
                  color={Colors.dark.textSecondary}
                  style={styles.modalButton}
                />
                <NeonButton
                  title="LOG ITEM"
                  onPress={handleManifest}
                  color={Colors.dark.neonGreen}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  container: {
    flex: 1,
    padding: 16,
  },
  headerTitle: {
    color: Colors.dark.text,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingBottom: 8,
  },
  overloadBanner: {
    backgroundColor: Colors.dark.neonRed + '20', // Transparent red
    borderColor: Colors.dark.neonRed,
    borderWidth: 1,
    padding: 12,
    borderRadius: 4,
    marginBottom: 16,
  },
  overloadText: {
    color: Colors.dark.neonRed,
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: Colors.dark.neonRed,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  hudContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 24,
  },
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  ringLabelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  ringSubtext: {
    color: Colors.dark.textSecondary,
    fontSize: 10,
    letterSpacing: 1,
  },
  statusBarsContainer: {
    gap: 8,
  },
  listHeader: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  emptyText: {
    color: Colors.dark.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  listContent: {
    paddingBottom: 80, // Space for FAB
  },
  itemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.dark.backgroundElement,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    marginBottom: 8,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: Colors.dark.text,
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  itemStats: {
    color: Colors.dark.textSecondary,
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
    borderWidth: 1,
    borderColor: Colors.dark.neonRed,
    borderRadius: 4,
  },
  deleteText: {
    color: Colors.dark.neonRed,
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    left: 16, // Stretches across the bottom
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.dark.backgroundElement,
    borderTopWidth: 2,
    borderColor: Colors.dark.border,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 24,
  },
  modalHeader: {
    color: Colors.dark.neonGreen,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: Colors.dark.background,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    color: Colors.dark.text,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
    marginTop: 8,
    marginBottom: 20,
  },
  modalButton: {
    flex: 1,
  },
});
