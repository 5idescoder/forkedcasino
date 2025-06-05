import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import GlassButton from './GlassButton';
import { theme } from '../styles/theme';

interface BettingControlsProps {
  currentBet: number;
  minBet: number;
  maxBet: number;
  onBetChange: (bet: number) => void;
}

const BettingControls = ({ currentBet, minBet, maxBet, onBetChange }: BettingControlsProps) => {
  const updateBet = (value: number) => {
    onBetChange(Math.max(minBet, Math.min(maxBet, value)));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Bet Amount:</Text>
      <View style={styles.controls}>
        <GlassButton
          title="Min"
          onPress={() => updateBet(minBet)}
          style={styles.button}
        />
        <GlassButton
          title="1/2"
          onPress={() => updateBet(Math.floor(currentBet / 2))}
          style={styles.button}
        />
        <TextInput
          style={styles.input}
          value={currentBet.toString()}
          onChangeText={(text) => updateBet(parseInt(text) || minBet)}
          keyboardType="numeric"
        />
        <GlassButton
          title="x2"
          onPress={() => updateBet(currentBet * 2)}
          style={styles.button}
        />
        <GlassButton
          title="Max"
          onPress={() => updateBet(maxBet)}
          style={styles.button}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(74, 27, 109, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 20,
    marginVertical: 20,
  },
  label: {
    color: theme.colors.accentGold,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  button: {
    flex: 1,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    color: theme.colors.accentGold,
    padding: 10,
    width: 120,
    textAlign: 'center',
    fontSize: 16,
  },
});

export default BettingControls;