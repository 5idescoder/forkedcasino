import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const categories = [
  {
    id: 'casino',
    name: 'Casino Games',
    icon: 'dice',
    description: 'Try your luck with our casino games'
  },
  {
    id: 'board',
    name: 'Board Games',
    icon: 'chess-board',
    description: 'Classic board games and strategy'
  }
];

const GamesScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleCategorySelect = (categoryId: string) => {
    if (categoryId === 'board') {
      navigation.navigate('Board Games');
    } else {
      // Handle casino games navigation
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.grid}>
        {categories.map(category => (
          <TouchableOpacity
            key={category.id}
            style={[styles.categoryCard, { backgroundColor: theme.card }]}
            onPress={() => handleCategorySelect(category.id)}
          >
            <Icon name={category.icon} size={40} color={theme.accent} />
            <Text style={[styles.categoryName, { color: theme.text }]}>
              {category.name}
            </Text>
            <Text style={[styles.categoryDescription, { color: theme.text + '99' }]}>
              {category.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  grid: {
    padding: 20,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    aspectRatio: 1,
    padding: 20,
    marginBottom: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 5,
  },
  categoryDescription: {
    fontSize: 14,
    textAlign: 'center',
  }
});

export default GamesScreen;