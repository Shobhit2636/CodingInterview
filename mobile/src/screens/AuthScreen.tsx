import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { loginUser, signupUser } from '../services/api';
import { User } from '../types';

interface AuthScreenProps {
  onLoginSuccess: (user: User) => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleTabSwitch = (loginState: boolean) => {
    setIsLogin(loginState);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUsername = username.trim();
    const cleanEmail = email.trim();

    // Validation
    if (!cleanUsername) {
      setErrorMsg(isLogin ? 'Please enter your username or email' : 'Please enter a username');
      return;
    }

    if (!isLogin && !cleanEmail) {
      setErrorMsg('Please enter your email address');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter a password');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters');
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const user = await loginUser(cleanUsername, password);
        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(user);
        }, 500);
      } else {
        const user = await signupUser(cleanUsername, cleanEmail, password);
        setSuccessMsg('Account created successfully! Welcome to CodeAI.');
        setTimeout(() => {
          onLoginSuccess(user);
        }, 600);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Authentication failed. Please check details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg('');
    setLoading(true);
    try {
      const user = await loginUser('Shobhit11', 'password123');
      onLoginSuccess(user);
    } catch {
      setErrorMsg('Could not log in as demo user.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header Badge */}
          <View style={styles.badgeContainer}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>✦ NEXT-GEN FAANG INTERVIEW PREP</Text>
            </View>
          </View>

          {/* Logo & Subtitle */}
          <View style={styles.titleContainer}>
            <View style={styles.logoRow}>
              <View style={styles.logoIcon}>
                <Text style={styles.logoIconText}>⚡</Text>
              </View>
              <Text style={styles.title}>Code<Text style={{ color: COLORS.cyan }}>AI</Text></Text>
            </View>
            <Text style={styles.tagline}>Autonomous Mobile Interview Studio</Text>
            <Text style={styles.subtext}>
              Practice FAANG interviews with autonomous speech AI, code in sandbox, and master system design.
            </Text>
          </View>

          {/* Auth Card */}
          <View style={styles.card}>
            {/* Toggle tabs */}
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, isLogin && styles.tabActive]}
                onPress={() => handleTabSwitch(true)}
              >
                <Text style={[styles.tabText, isLogin && styles.tabTextActive]}>Sign In</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, !isLogin && styles.tabActive]}
                onPress={() => handleTabSwitch(false)}
              >
                <Text style={[styles.tabText, !isLogin && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {errorMsg ? (
              <View style={styles.errorBanner}>
                <Text style={styles.errorIcon}>⚠️</Text>
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {/* Success Banner */}
            {successMsg ? (
              <View style={styles.successBanner}>
                <Text style={styles.successIcon}>✅</Text>
                <Text style={styles.successText}>{successMsg}</Text>
              </View>
            ) : null}

            {/* Inputs */}
            <View style={styles.form}>
              <Text style={styles.inputLabel}>{isLogin ? 'EMAIL OR USERNAME' : 'USERNAME'}</Text>
              <TextInput
                style={styles.input}
                placeholder={isLogin ? 'e.g. shobhit11 or shobhit11@gmail.com' : 'Choose a username (e.g. Shobhit11)'}
                placeholderTextColor={COLORS.textSubtle}
                value={username}
                onChangeText={(t) => { setUsername(t); setErrorMsg(''); }}
                autoCapitalize="none"
              />

              {!isLogin && (
                <>
                  <Text style={styles.inputLabel}>EMAIL ADDRESS</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={COLORS.textSubtle}
                    value={email}
                    onChangeText={(t) => { setEmail(t); setErrorMsg(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </>
              )}

              <Text style={styles.inputLabel}>PASSWORD</Text>
              <TextInput
                style={styles.input}
                placeholder="Min 6 characters"
                placeholderTextColor={COLORS.textSubtle}
                value={password}
                onChangeText={(t) => { setPassword(t); setErrorMsg(''); }}
                secureTextEntry
              />

              {!isLogin && (
                <>
                  <Text style={styles.inputLabel}>CONFIRM PASSWORD</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Repeat your password"
                    placeholderTextColor={COLORS.textSubtle}
                    value={confirmPassword}
                    onChangeText={(t) => { setConfirmPassword(t); setErrorMsg(''); }}
                    secureTextEntry
                  />
                </>
              )}

              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isLogin ? 'SIGN IN →' : 'CREATE ACCOUNT →'}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>OR QUICK ACCESS</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Demo Button */}
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={handleDemoLogin}
                disabled={loading}
              >
                <Text style={styles.demoBtnText}>⚡ Continue as Demo User (Shobhit11)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  badge: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
    borderColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 20,
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  logoIcon: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIconText: {
    fontSize: 18,
    color: '#fff',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.textWhite,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primaryLight,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    lineHeight: 18,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.bgCardBorder,
    borderWidth: 1,
    borderRadius: 24,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgDark,
    borderRadius: 12,
    padding: 3,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.4)',
    borderRadius: 12,
    padding: 10,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    color: '#f87171',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 12,
    padding: 10,
    marginBottom: SPACING.sm,
    gap: 8,
  },
  successIcon: {
    fontSize: 14,
  },
  successText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  form: {
    gap: SPACING.sm,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textSubtle,
    letterSpacing: 0.5,
    marginTop: SPACING.xs,
  },
  input: {
    backgroundColor: COLORS.bgDark,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    color: COLORS.textWhite,
    fontSize: 14,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.bgCardBorder,
  },
  dividerText: {
    marginHorizontal: SPACING.sm,
    fontSize: 10,
    color: COLORS.textSubtle,
    fontWeight: '600',
  },
  demoBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  demoBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
});
