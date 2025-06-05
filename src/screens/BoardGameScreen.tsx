import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
import { useTheme } from '../contexts/ThemeContext';
import MancalaGame from '../games/board/MancalaGame';
import ChessGame from '../games/board/ChessGame';
import CheckersGame from '../games/board/CheckersGame';
import Connect4Game from '../games/board/Connect4Game';
import TicTacToeGame from '../games/board/TicTacToeGame';
import BattleshipGame from '../games/board/BattleshipGame';

const BoardGameScreen = () => {
  const route = useRoute();
  const { theme } = useTheme();
  const { gameId } = route.params as { gameId: string };

  const renderGame = () => {
    switch (gameId) {
      case 'mancala':
        return <MancalaGame />;
      case 'chess':
        return <ChessGame />;
      case 'checkers':
        return <CheckersGame />;
      case 'connect4':
        return <Connect4Game />;
      case 'tictactoe':
        return <TicTacToeGame />;
      case 'battleship':
        return <BattleshipGame />;
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {renderGame()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default BoardGameScreen;