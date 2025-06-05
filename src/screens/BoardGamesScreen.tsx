import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useTheme } from '../contexts/ThemeContext';
import { useNavigation } from '@react-navigation/native';

const games = [
  {
    id: 'mancala',
    name: 'Mancala',
    icon: 'circle',
    description: 'Ancient board game of strategy and counting'
  },
  {
    id: 'chess',
    name: 'Chess',
    icon: 'chess-king',
    description: 'Classic game of strategy and tactics'
  },
  {
    id: 'checkers',
    name: 'Checkers',
    icon: 'circle',
    description: 'Traditional diagonal jumping game'
  },
  {
    id: 'connect4',
    name: 'Connect 4',
    icon: 'circle',
    description: 'Get four in a row to win'
  },
  {
    id: 'tictactoe',
    name: 'Tic Tac Toe',
    icon: 'times',
    description: 'Classic X\'s and O\'s game'
  },
  {
    id: 'battleship',
    name: 'Battleship',
    icon: 'ship',
    description: 'Naval combat strategy game'
  }
];

const BoardGamesScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();

  const handleGameSelect = (gameId: string) => {
    navigation.navigate('BoardGame', { gameId });
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.grid}>
        {games.map(game => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameCard, { backgroundColor: theme.card }]}
            onPress={() => handleGameSelect(game.id)}
          >
            <Icon name={game.icon} size={40} color={theme.accent} />
            <Text style={[styles.gameName, { color: theme.text }]}>{game.name}</Text>
            <Text style={[styles.gameDescription, { color: theme.text + '99' }]}>
              {game.description}
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
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gameCard: {
    width: '48%',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  gameDescription: {
    fontSize: 12,
    textAlign: 'center',
  }
});

export default BoardGamesScreen;