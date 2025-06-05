import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Dimensions,
  Animated
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PIT_SIZE = SCREEN_WIDTH / 8;
const STONE_SIZE = PIT_SIZE / 4;

const MancalaGame = () => {
  const { theme } = useTheme();
  const { saveScore, getHighScore } = useAuth();
  const [pits, setPits] = useState(Array(14).fill(4));
  const [currentPlayer, setCurrentPlayer] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [animations] = useState(() => Array(14).fill(0).map(() => new Animated.Value(1)));
  const [stoneAnimations, setStoneAnimations] = useState([]);

  useEffect(() => {
    initializeGame();
  }, []);

  const initializeGame = () => {
    const newPits = Array(14).fill(4);
    newPits[6] = 0; // Player's store
    newPits[13] = 0; // AI's store
    setPits(newPits);
    setCurrentPlayer(0);
    setGameOver(false);
    setStoneAnimations([]);
  };

  const animatePit = (index) => {
    Animated.sequence([
      Animated.timing(animations[index], {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true
      }),
      Animated.timing(animations[index], {
        toValue: 1,
        duration: 150,
        useNativeDriver: true
      })
    ]).start();
  };

  const createStoneAnimation = (fromPit, toPit) => {
    const fromPos = getPitPosition(fromPit);
    const toPos = getPitPosition(toPit);
    
    return {
      stone: new Animated.ValueXY({ x: fromPos.x, y: fromPos.y }),
      toPos,
      opacity: new Animated.Value(1)
    };
  };

  const getPitPosition = (index) => {
    const row = index < 6 ? 1 : 0;
    const col = index < 6 ? index : 12 - index;
    return {
      x: (col + 1) * PIT_SIZE,
      y: row * PIT_SIZE * 2
    };
  };

  const makeMove = async (pitIndex) => {
    if (gameOver || currentPlayer !== 0 || pits[pitIndex] === 0) return;

    let newPits = [...pits];
    let stones = newPits[pitIndex];
    newPits[pitIndex] = 0;
    let currentPit = pitIndex;
    
    // Create stone animations
    const newAnimations = [];
    let delay = 0;

    while (stones > 0) {
      currentPit = (currentPit + 1) % 14;
      if ((currentPlayer === 0 && currentPit === 13) || 
          (currentPlayer === 1 && currentPit === 6)) {
        continue;
      }

      newPits[currentPit]++;
      stones--;

      // Add stone animation
      newAnimations.push({
        ...createStoneAnimation(pitIndex, currentPit),
        delay: delay
      });
      delay += 100;
    }

    setStoneAnimations(newAnimations);

    // Start animations
    newAnimations.forEach(anim => {
      Animated.sequence([
        Animated.delay(anim.delay),
        Animated.parallel([
          Animated.spring(anim.stone, {
            toValue: anim.toPos,
            useNativeDriver: true,
            friction: 5
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true
          })
        ])
      ]).start();
    });

    // Check for capture
    if (currentPlayer === 0 && currentPit < 6 && newPits[currentPit] === 1) {
      const oppositePit = 12 - currentPit;
      if (newPits[oppositePit] > 0) {
        newPits[6] += newPits[oppositePit] + 1;
        newPits[oppositePit] = 0;
        newPits[currentPit] = 0;
        animatePit(6);
      }
    }

    setPits(newPits);

    // Check if game is over
    if (isGameOver(newPits)) {
      endGame(newPits);
      return;
    }

    // Switch turns unless landed in own store
    if (!(currentPlayer === 0 && currentPit === 6) &&
        !(currentPlayer === 1 && currentPit === 13)) {
      setCurrentPlayer(1);
      setTimeout(() => aiMove(newPits), 1000);
    }
  };

  const aiMove = (currentPits) => {
    if (gameOver) return;

    // Simple AI: choose pit with most stones
    let bestPit = 7;
    let maxStones = 0;
    
    for (let i = 7; i < 13; i++) {
      if (currentPits[i] > maxStones) {
        maxStones = currentPits[i];
        bestPit = i;
      }
    }
    
    let newPits = [...currentPits];
    let stones = newPits[bestPit];
    newPits[bestPit] = 0;
    let currentPit = bestPit;

    while (stones > 0) {
      currentPit = (currentPit + 1) % 14;
      if (currentPit === 6) continue;
      
      newPits[currentPit]++;
      stones--;
      animatePit(currentPit);
    }

    // Check for capture
    if (currentPit < 13 && currentPit > 6 && newPits[currentPit] === 1) {
      const oppositePit = 12 - currentPit;
      if (newPits[oppositePit] > 0) {
        newPits[13] += newPits[oppositePit] + 1;
        newPits[oppositePit] = 0;
        newPits[currentPit] = 0;
        animatePit(13);
      }
    }

    setPits(newPits);

    if (isGameOver(newPits)) {
      endGame(newPits);
      return;
    }

    if (currentPit !== 13) {
      setCurrentPlayer(0);
    } else {
      setTimeout(() => aiMove(newPits), 1000);
    }
  };

  const isGameOver = (currentPits) => {
    const playerEmpty = currentPits.slice(0, 6).every(stones => stones === 0);
    const aiEmpty = currentPits.slice(7, 13).every(stones => stones === 0);
    return playerEmpty || aiEmpty;
  };

  const endGame = (finalPits) => {
    let newPits = [...finalPits];
    
    // Collect remaining stones
    let playerTotal = newPits[6];
    let aiTotal = newPits[13];
    
    for (let i = 0; i < 6; i++) {
      playerTotal += newPits[i];
      aiTotal += newPits[i + 7];
      newPits[i] = 0;
      newPits[i + 7] = 0;
    }
    
    newPits[6] = playerTotal;
    newPits[13] = aiTotal;
    setPits(newPits);
    setGameOver(true);

    // Update score
    if (playerTotal > aiTotal) {
      const winnings = Math.floor((playerTotal - aiTotal) * 10);
      saveScore('mancala', getHighScore('mancala') + winnings);
    }

    // Show game over message
    Alert.alert(
      'Game Over!',
      playerTotal > aiTotal ? 
        `You win! Score: ${playerTotal}-${aiTotal}` : 
        playerTotal < aiTotal ? 
          `AI wins! Score: ${aiTotal}-${playerTotal}` : 
          `It's a tie! Score: ${playerTotal}-${aiTotal}`,
      [
        { 
          text: 'Play Again',
          onPress: initializeGame
        }
      ]
    );
  };

  const renderPit = (index) => {
    const stones = pits[index];
    const isStore = index === 6 || index === 13;
    const isPlayerPit = index < 6;
    const canPlay = !gameOver && currentPlayer === 0 && isPlayerPit && stones > 0;

    return (
      <TouchableOpacity
        key={index}
        style={[
          styles.pit,
          isStore ? styles.store : null,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: canPlay ? 1 : 0.7
          }
        ]}
        onPress={() => canPlay && makeMove(index)}
        disabled={!canPlay}
      >
        <Animated.View
          style={[
            styles.pitContent,
            { transform: [{ scale: animations[index] }] }
          ]}
        >
          <Text style={[styles.stoneCount, { color: theme.text }]}>
            {stones}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.board}>
        <View style={styles.storeContainer}>
          {renderPit(13)} {/* AI's store */}
        </View>
        <View style={styles.middleSection}>
          <View style={styles.row}>
            {[12, 11, 10, 9, 8, 7].map(index => renderPit(index))}
          </View>
          <View style={styles.row}>
            {[0, 1, 2, 3, 4, 5].map(index => renderPit(index))}
          </View>
        </View>
        <View style={styles.storeContainer}>
          {renderPit(6)} {/* Player's store */}
        </View>
      </View>

      {/* Animated stones */}
      {stoneAnimations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.animatedStone,
            {
              transform: [
                { translateX: anim.stone.x },
                { translateY: anim.stone.y }
              ],
              opacity: anim.opacity,
              backgroundColor: theme.accent
            }
          ]}
        />
      ))}

      <TouchableOpacity
        style={[styles.resetButton, { backgroundColor: theme.primary }]}
        onPress={initializeGame}
      >
        <Text style={styles.resetButtonText}>Reset Game</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  board: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  storeContainer: {
    justifyContent: 'center',
    height: PIT_SIZE * 4
  },
  middleSection: {
    marginHorizontal: 10
  },
  row: {
    flexDirection: 'row'
  },
  pit: {
    width: PIT_SIZE,
    height: PIT_SIZE,
    borderRadius: PIT_SIZE / 2,
    margin: 5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84
  },
  store: {
    height: PIT_SIZE * 2,
    width: PIT_SIZE,
    borderRadius: PIT_SIZE / 3
  },
  pitContent: {
    alignItems: 'center',
    justifyContent: 'center'
  },
  stoneCount: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  animatedStone: {
    position: 'absolute',
    width: STONE_SIZE,
    height: STONE_SIZE,
    borderRadius: STONE_SIZE / 2
  },
  resetButton: {
    marginTop: 20,
    padding: 10,
    borderRadius: 5
  },
  resetButtonText: {
    color: 'white',
    fontSize: 16
  }
});

export default MancalaGame;