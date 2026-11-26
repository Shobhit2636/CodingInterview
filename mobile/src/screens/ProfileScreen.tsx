import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { User } from '../types';

interface ProfileScreenProps {
  user: User;
  onLogout: () => void;
  onBack: () => void;
}

export default function ProfileScreen({ user, onLogout, onBack }: ProfileScreenProps) {
  const handleLogoutPress = () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out of CodeAI?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: onLogout
        }
      ]
    );
  };

  const initial = (user.name || 'U').charAt(0).toUpperCase();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Dashboard</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 80 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.userName}>{user.name || 'User'}</Text>
          <Text style={styles.userEmail}>{user.email || 'No email attached'}</Text>

          <View style={styles.badgeRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>🏆 FAANG CANDIDATE</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: 'rgba(16, 185, 129, 0.15)', borderColor: 'rgba(16, 185, 129, 0.3)' }]}>
              <Text style={[styles.badgeText, { color: COLORS.emerald }]}>ACTIVE STREAK: {user.streak || 3}D 🔥</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <Text style={styles.sectionTitle}>Account Performance</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Rating</Text>
            <Text style={styles.statBoxValue}>{user.rating || 1200}</Text>
            <Text style={styles.statBoxSub}>Top 8% in platform</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Problems Solved</Text>
            <Text style={styles.statBoxValue}>{user.solvedCount || 24}</Text>
            <Text style={styles.statBoxSub}>100% accuracy</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>XP Points</Text>
            <Text style={styles.statBoxValue}>{user.points || 100}</Text>
            <Text style={styles.statBoxSub}>Next level: 800 XP</Text>
          </View>

          <View style={styles.statBox}>
            <Text style={styles.statBoxLabel}>Storage Status</Text>
            <Text style={[styles.statBoxValue, { fontSize: 16, color: COLORS.emerald }]}>Synced ✅</Text>
            <Text style={styles.statBoxSub}>AsyncStorage & Cloud</Text>
          </View>
        </View>

        {/* Account Actions */}
        <Text style={styles.sectionTitle}>Session & Security</Text>
        <View style={styles.actionCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Account ID</Text>
            <Text style={styles.infoValue}>{user.id || 'u_local'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Status</Text>
            <Text style={[styles.infoValue, { color: COLORS.emerald }]}>Authenticated</Text>
          </View>
        </View>

        {/* LOGOUT BUTTON */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogoutPress}>
          <Text style={styles.logoutBtnText}>🚪 Log Out of CodeAI</Text>
        </TouchableOpacity>

        <Text style={styles.logoutHint}>
          Logging out will end your current active session and return to the login screen.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgCardBorder,
  },
  backBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: COLORS.bgCard,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  profileCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 20,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
    marginBottom: SPACING.sm,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  badge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.35)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textWhite,
    marginBottom: SPACING.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  statBox: {
    width: '48%',
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 14,
    padding: SPACING.md,
  },
  statBoxLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  statBoxValue: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textWhite,
    marginVertical: 4,
  },
  statBoxSub: {
    fontSize: 10,
    color: COLORS.textSubtle,
  },
  actionCard: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 16,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textWhite,
  },
  infoDivider: {
    height: 1,
    backgroundColor: COLORS.bgCardBorder,
    marginVertical: 4,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  logoutBtnText: {
    color: '#ef4444',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutHint: {
    fontSize: 11,
    color: COLORS.textSubtle,
    textAlign: 'center',
    paddingHorizontal: SPACING.md,
  },
});
