import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Animated
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { InterviewMessage } from '../types';

interface AIVoiceMockScreenProps {
  onBack: () => void;
}

export default function AIVoiceMockScreen({ onBack }: AIVoiceMockScreenProps) {
  const [isListening, setIsListening] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [messages, setMessages] = useState<InterviewMessage[]>([
    {
      id: 'm1',
      sender: 'ai',
      text: 'Hello! I am your AI Technical Interviewer. Today we will focus on designing a scalable Rate Limiter or solving an algorithmic problem. Whenever you are ready, tap the mic and walk me through your initial thoughts.',
      timestamp: 'Just now'
    }
  ]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const toggleMic = () => {
    if (!isListening) {
      setIsListening(true);
      // Simulate user speaking after 3 seconds
      setTimeout(() => {
        setIsListening(false);
        const userMsg: InterviewMessage = {
          id: 'm_' + Date.now(),
          sender: 'user',
          text: 'Sure! For a Rate Limiter, I would start by clarifying throughput and distributed requirements. We could use Redis with Token Bucket or Sliding Window log algorithm.',
          timestamp: 'Just now'
        };
        const aiReply: InterviewMessage = {
          id: 'm_ai_' + Date.now(),
          sender: 'ai',
          text: 'Great start! Token Bucket handles bursts well with low memory footprint. How would you handle race conditions when multiple worker nodes update the counter concurrently in Redis?',
          timestamp: 'Just now'
        };
        setMessages(prev => [...prev, userMsg, aiReply]);
      }, 3000);
    } else {
      setIsListening(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Exit</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>AI Voice Interviewer</Text>
          <View style={styles.statusLive}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>READY</Text>
          </View>
        </View>
        <View style={{ width: 45 }} />
      </View>

      {/* Message Transcripts */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.msgBubble,
              msg.sender === 'ai' ? styles.aiBubble : styles.userBubble
            ]}
          >
            <Text style={styles.msgSender}>{msg.sender === 'ai' ? '🤖 AI Interviewer' : '👤 You'}</Text>
            <Text style={styles.msgText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Audio Visualizer & Mic Control */}
      <View style={styles.micSection}>
        <Text style={styles.micHint}>
          {isListening ? '🎙️ Listening to your speech... Speak now!' : 'Tap the microphone to speak to the AI'}
        </Text>

        <TouchableOpacity onPress={toggleMic} activeOpacity={0.8}>
          <Animated.View
            style={[
              styles.micCircle,
              isListening ? styles.micCircleActive : styles.micCircleIdle,
              { transform: [{ scale: pulseAnim }] }
            ]}
          >
            <Text style={styles.micIconText}>{isListening ? '⏹️' : '🎙️'}</Text>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.speechTip}>Powered by real-time speech synthesis & FAANG rubric</Text>
      </View>
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
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  statusLive: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.emerald,
  },
  liveText: {
    fontSize: 9,
    color: COLORS.emerald,
    fontWeight: '700',
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
    paddingBottom: 20,
  },
  msgBubble: {
    borderRadius: 16,
    padding: SPACING.md,
    maxWidth: '88%',
    marginBottom: 4,
  },
  aiBubble: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    alignSelf: 'flex-start',
  },
  userBubble: {
    backgroundColor: COLORS.primary,
    alignSelf: 'flex-end',
  },
  msgSender: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryLight,
    marginBottom: 4,
  },
  msgText: {
    color: COLORS.textWhite,
    fontSize: 13,
    lineHeight: 19,
  },
  micSection: {
    backgroundColor: COLORS.bgCard,
    borderTopWidth: 1,
    borderTopColor: COLORS.bgCardBorder,
    padding: SPACING.md,
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  micHint: {
    color: COLORS.textMuted,
    fontSize: 12,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
  micCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  micCircleIdle: {
    backgroundColor: COLORS.primary,
  },
  micCircleActive: {
    backgroundColor: COLORS.rose,
  },
  micIconText: {
    fontSize: 28,
  },
  speechTip: {
    color: COLORS.textSubtle,
    fontSize: 10,
    marginTop: SPACING.md,
  },
});
