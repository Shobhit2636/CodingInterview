import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from './src/constants/theme';
import { User, Problem } from './src/types';
import { SAMPLE_PROBLEMS } from './src/services/api';

import AuthScreen from './src/screens/AuthScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import QuestionBankScreen from './src/screens/QuestionBankScreen';
import CodeEditorScreen from './src/screens/CodeEditorScreen';
import AIVoiceMockScreen from './src/screens/AIVoiceMockScreen';

export default function App() {
  const [user, setUser] = useState<User | null>({
    id: 'u_1',
    name: 'Shobhit11',
    email: 'shobhit11@gmail.com',
    rating: 1200,
    points: 100,
    solvedCount: 24,
    streak: 3
  });

  const [currentScreen, setCurrentScreen] = useState<'dashboard' | 'questions' | 'editor' | 'interview'>('dashboard');
  const [selectedProblem, setSelectedProblem] = useState<Problem>(SAMPLE_PROBLEMS[0]);

  const handleSelectProblem = (problem: Problem) => {
    setSelectedProblem(problem);
    setCurrentScreen('editor');
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgDark }}>
        <AuthScreen onLoginSuccess={(u) => { setUser(u); setCurrentScreen('dashboard'); }} />
        <StatusBar style="light" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar style="light" />

      {/* Screen Content */}
      <View style={styles.screenWrapper}>
        {currentScreen === 'dashboard' && (
          <DashboardScreen
            user={user}
            onNavigate={(screen) => setCurrentScreen(screen as any)}
            onLogout={handleLogout}
          />
        )}

        {currentScreen === 'questions' && (
          <QuestionBankScreen
            onSelectProblem={handleSelectProblem}
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}

        {currentScreen === 'editor' && (
          <CodeEditorScreen
            problem={selectedProblem}
            onBack={() => setCurrentScreen('questions')}
          />
        )}

        {currentScreen === 'interview' && (
          <AIVoiceMockScreen
            onBack={() => setCurrentScreen('dashboard')}
          />
        )}
      </View>

      {/* Bottom Navigation Bar */}
      <SafeAreaView style={styles.navBarWrapper}>
        <View style={styles.navBar}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('dashboard')}
          >
            <Text style={styles.navIcon}>📊</Text>
            <Text style={[styles.navLabel, currentScreen === 'dashboard' && styles.navLabelActive]}>
              Dashboard
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('questions')}
          >
            <Text style={styles.navIcon}>💻</Text>
            <Text style={[styles.navLabel, (currentScreen === 'questions' || currentScreen === 'editor') && styles.navLabelActive]}>
              Problems
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => setCurrentScreen('interview')}
          >
            <View style={styles.voiceNavIconWrap}>
              <Text style={styles.voiceNavIcon}>🎙️</Text>
            </View>
            <Text style={[styles.navLabel, currentScreen === 'interview' && styles.navLabelActive]}>
              AI Voice
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={handleLogout}
          >
            <Text style={styles.navIcon}>🚪</Text>
            <Text style={styles.navLabel}>
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  screenWrapper: {
    flex: 1,
  },
  navBarWrapper: {
    backgroundColor: COLORS.bgCard,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.bgCardBorder,
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 4 : 10,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    fontSize: 20,
    marginBottom: 3,
  },
  navLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.textSubtle,
  },
  navLabelActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  voiceNavIconWrap: {
    backgroundColor: COLORS.primaryGlow,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 2,
  },
  voiceNavIcon: {
    fontSize: 18,
  },
});
