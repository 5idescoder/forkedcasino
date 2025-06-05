import React, { createContext, useState, useContext, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  isLoggedIn: boolean;
  currentUser: any;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loginAsGuest: () => void;
  saveScore: (game: string, score: number) => Promise<void>;
  getHighScore: (game: string) => number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    checkUser();
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN') {
        setIsLoggedIn(true);
        await fetchUserData(session?.user?.id);
      } else if (event === 'SIGNED_OUT') {
        setIsLoggedIn(false);
        setCurrentUser(null);
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setIsLoggedIn(true);
        await fetchUserData(session.user.id);
      }
    } catch (error) {
      console.error('Error checking user:', error);
    }
  };

  const fetchUserData = async (userId: string) => {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*, user_scores(*)')
        .eq('id', userId)
        .single();

      if (error) throw error;

      setCurrentUser({
        id: user.id,
        username: user.username,
        email: user.email,
        isAdmin: user.is_admin,
        scores: user.user_scores.reduce((acc: any, score: any) => {
          acc[score.game] = score.score;
          return acc;
        }, {}),
        lastFaucetClaim: user.last_login,
        created: user.created_at
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  };

  const loginAsGuest = () => {
    const guestId = Math.random().toString(36).substring(7);
    setCurrentUser({
      username: `Guest_${guestId}`,
      id: Date.now(),
      email: '',
      scores: {
        fish: 100,
        keno: 100,
        mancala: 100,
        plinko: 100,
        slot: 100,
        spin: 100
      },
      isGuest: true,
      created: Date.now()
    });
    setIsLoggedIn(true);
  };

  const saveScore = async (game: string, score: number) => {
    if (!isLoggedIn || currentUser?.isGuest) return;

    try {
      const { error } = await supabase
        .from('user_scores')
        .upsert({
          user_id: currentUser.id,
          game,
          score: Math.max(score, getHighScore(game))
        }, {
          onConflict: 'user_id,game'
        });

      if (error) throw error;

      setCurrentUser((prev: any) => ({
        ...prev,
        scores: {
          ...prev.scores,
          [game]: Math.max(score, getHighScore(game))
        }
      }));
    } catch (error) {
      console.error('Error saving score:', error);
    }
  };

  const getHighScore = (game: string) => {
    if (!isLoggedIn || !currentUser?.scores) {
      return 100;
    }
    return currentUser.scores[game] || 100;
  };

  return (
    <AuthContext.Provider value={{
      isLoggedIn,
      currentUser,
      login,
      logout,
      loginAsGuest,
      saveScore,
      getHighScore
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};