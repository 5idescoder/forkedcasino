import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { theme } from '../styles/theme';

interface GlassButtonProps {
  onPress: () => void;
  title: string;
  style?: any;
  textStyle?: any;
}

const GlassButton = ({ onPress, title, style, textStyle }: GlassButtonProps) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  text: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default GlassButton;