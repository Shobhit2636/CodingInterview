import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { User } from '../types';

interface DashboardScreenProps {
  user: User;
  onNavigate: (screen: string, params?: any) => void;
  onLogout: () => void;
}

export default function DashboardScreen({ user, onNavigate, onLogout }: DashboardScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Top Header */}
        <View style={styles.topHeader}>
          <View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>⚡ FAANG PREP PLAYGROUND</Text>
            </View>
            <Text style={styles.headerTitle}>Welcome back,</Text>
            <Text style={styles.headerName}>{user.name || 'Shobhit11'}!</Text>
          </View>
          <TouchableOpacity style={styles.avatarBtn} onPress={onLogout}>
            <Text style={styles.avatarText}>{(user.name || 'S').charAt(0).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>

        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTag}># FAANG INTERVIEW READY</Text>
          <Text style={styles.heroSubtext}>
            Your overall rating increased by <Text style={{ color: COLORS.emerald, fontWeight: '700' }}>+18</Text> this week. Keep solving to sharpen your DP & Graphs!
          </Text>
          <TouchableOpacity
            style={styles.heroBtn}
            onPress={() => onNavigate('questions')}
          >
            <Text style={styles.heroBtnText}>Solve Questions →</Text>
          </TouchableOpacity>
        </View>

        {/* 4 Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Platform Rating</Text>
              <Text style={styles.statEmoji}>🎖️</Text>
            </View>
            <Text style={styles.statValue}>{user.rating}</Text>
            <Text style={styles.statHint}>Top 8% in platform</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Points Earned</Text>
              <Text style={styles.statEmoji}>⚡</Text>
            </View>
            <Text style={styles.statValue}>{user.points}</Text>
            <Text style={styles.statHint}>Next rank at 800 XP</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Problems Solved</Text>
              <Text style={styles.statEmoji}>✅</Text>
            </View>
            <Text style={styles.statValue}>{user.solvedCount}</Text>
            <Text style={styles.statHint}>2 new solved today</Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statLabel}>Accuracy</Text>
              <Text style={styles.statEmoji}>🎯</Text>
            </View>
            <Text style={styles.statValue}>100%</Text>
            <Text style={styles.statHint}>+2.4% last week</Text>
          </View>
        </View>

        {/* Quick Launch Features */}
        <Text style={styles.sectionTitle}>Interview Modes</Text>
        <View style={styles.featuresList}>
          {/* AI Voice Interview */}
          <TouchableOpacity
            style={[styles.featureCard, { borderColor: COLORS.primary }]}
            onPress={() => onNavigate('interview')}
          >
            <View style={[styles.featureIcon, { backgroundColor: COLORS.primaryGlow }]}>
              <Text style={{ fontSize: 24 }}>🎙️</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>AI Voice Interview</Text>
              <Text style={styles.featureDesc}>Real-time spoken technical interview with AI</Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>

          {/* Question Bank */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => onNavigate('questions')}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
              <Text style={{ fontSize: 24 }}>💻</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Coding Workspace</Text>
              <Text style={styles.featureDesc}>LeetCode sandbox with multi-language execution</Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>

          {/* System Design */}
          <TouchableOpacity
            style={styles.featureCard}
            onPress={() => onNavigate('questions')}
          >
            <View style={[styles.featureIcon, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={{ fontSize: 24 }}>🏗️</Text>
            </View>
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>System Design Studio</Text>
              <Text style={styles.featureDesc}>High-level system design & scalability rounds</Text>
            </View>
            <Text style={styles.featureArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.xs,
  },
  badge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    color: COLORS.textMuted,
  },
  headerName: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.primaryLight,
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  heroCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 20,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  heroTag: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  heroSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  heroBtn: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 12,
  },
  heroBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 16,
    padding: SPACING.md,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  statEmoji: {
    fontSize: 14,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginVertical: 4,
  },
  statHint: {
    fontSize: 10,
    color: COLORS.textSubtle,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.sm,
  },
  featuresList: {
    gap: SPACING.sm,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 18,
    padding: SPACING.md,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  featureInfo: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  featureDesc: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  featureArrow: {
    fontSize: 18,
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
});
