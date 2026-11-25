import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { Problem } from '../types';

interface CodeEditorScreenProps {
  problem: Problem;
  onBack: () => void;
}

export default function CodeEditorScreen({ problem, onBack }: CodeEditorScreenProps) {
  const [lang, setLang] = useState<'python' | 'javascript' | 'cpp' | 'java'>('python');
  const [code, setCode] = useState(problem.starterCode.python);
  const [activeTab, setActiveTab] = useState<'description' | 'testcases' | 'output'>('description');
  const [running, setRunning] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleLangChange = (newLang: 'python' | 'javascript' | 'cpp' | 'java') => {
    setLang(newLang);
    setCode(problem.starterCode[newLang]);
  };

  const handleRunCode = () => {
    setRunning(true);
    setActiveTab('output');
    setTimeout(() => {
      setRunning(false);
      setTestResult({
        status: 'Accepted',
        runtime: '38ms',
        memory: '14.2MB',
        passedCount: 3,
        totalCount: 3,
        output: '[0, 1]',
        expected: '[0, 1]'
      });
    }, 1200);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Problems</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{problem.title}</Text>
        <TouchableOpacity style={styles.runHeaderBtn} onPress={handleRunCode} disabled={running}>
          <Text style={styles.runHeaderBtnText}>{running ? '...' : '▶ Run'}</Text>
        </TouchableOpacity>
      </View>

      {/* Language Selector Bar */}
      <View style={styles.langBar}>
        {(['python', 'javascript', 'cpp', 'java'] as const).map(l => (
          <TouchableOpacity
            key={l}
            style={[styles.langChip, lang === l && styles.langChipActive]}
            onPress={() => handleLangChange(l)}
          >
            <Text style={[styles.langChipText, lang === l && styles.langChipTextActive]}>
              {l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Tab navigation for Problem / Output */}
        <View style={styles.tabNav}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'description' && styles.tabItemActive]}
            onPress={() => setActiveTab('description')}
          >
            <Text style={[styles.tabItemText, activeTab === 'description' && styles.tabItemTextActive]}>
              Description
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'output' && styles.tabItemActive]}
            onPress={() => setActiveTab('output')}
          >
            <Text style={[styles.tabItemText, activeTab === 'output' && styles.tabItemTextActive]}>
              Output {testResult ? '✅' : ''}
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'description' ? (
          <View style={styles.descCard}>
            <View style={styles.tagRow}>
              <View style={[styles.diffBadge, { backgroundColor: COLORS.primaryGlow }]}>
                <Text style={{ color: COLORS.primaryLight, fontSize: 11, fontWeight: '700' }}>
                  {problem.difficulty}
                </Text>
              </View>
              <Text style={styles.categoryBadge}>{problem.category}</Text>
            </View>
            <Text style={styles.descText}>{problem.description}</Text>
          </View>
        ) : (
          <View style={styles.outputCard}>
            {running ? (
              <Text style={styles.runningText}>⚡ Compiling and executing test cases on cloud sandbox...</Text>
            ) : testResult ? (
              <View>
                <View style={styles.resultBanner}>
                  <Text style={styles.resultStatus}>🎉 {testResult.status}</Text>
                  <Text style={styles.resultStats}>
                    Runtime: {testResult.runtime} • Memory: {testResult.memory}
                  </Text>
                </View>
                <View style={styles.testDetail}>
                  <Text style={styles.testLabel}>Test Cases: 3 / 3 Passed</Text>
                  <Text style={styles.codeOutputLabel}>Your Output:</Text>
                  <Text style={styles.codeOutputText}>{testResult.output}</Text>
                  <Text style={styles.codeOutputLabel}>Expected:</Text>
                  <Text style={styles.codeOutputText}>{testResult.expected}</Text>
                </View>
              </View>
            ) : (
              <Text style={styles.emptyOutputText}>Click "Run Code" to compile and run test cases.</Text>
            )}
          </View>
        )}

        {/* Code Editor Area */}
        <View style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>CODE EDITOR ({lang.toUpperCase()})</Text>
          </View>
          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            multiline
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
          />
        </View>

        {/* Bottom Actions */}
        <View style={styles.bottomActions}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.runBtn]}
            onPress={handleRunCode}
            disabled={running}
          >
            <Text style={styles.runBtnText}>{running ? 'Compiling...' : '▶ Run Code'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.submitBtn]}
            onPress={handleRunCode}
          >
            <Text style={styles.submitBtnText}>Submit Solution 🚀</Text>
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
    paddingHorizontal: 8,
    backgroundColor: COLORS.bgCard,
    borderRadius: 8,
  },
  backBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
    maxWidth: 160,
  },
  runHeaderBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  runHeaderBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  langBar: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    backgroundColor: COLORS.bgCard,
    gap: 8,
  },
  langChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.bgDark,
  },
  langChipActive: {
    backgroundColor: COLORS.primary,
  },
  langChipText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  langChipTextActive: {
    color: '#fff',
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.bgCard,
    borderRadius: 10,
    padding: 3,
    marginBottom: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: COLORS.bgDark,
  },
  tabItemText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  tabItemTextActive: {
    color: COLORS.primaryLight,
    fontWeight: '700',
  },
  descCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    marginBottom: SPACING.md,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.sm,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadge: {
    color: COLORS.textMuted,
    fontSize: 11,
    paddingVertical: 2,
  },
  descText: {
    color: COLORS.textWhite,
    fontSize: 13,
    lineHeight: 19,
  },
  outputCard: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    marginBottom: SPACING.md,
  },
  runningText: {
    color: COLORS.cyan,
    fontSize: 12,
  },
  emptyOutputText: {
    color: COLORS.textSubtle,
    fontSize: 12,
  },
  resultBanner: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
  },
  resultStatus: {
    color: COLORS.emerald,
    fontSize: 15,
    fontWeight: '800',
  },
  resultStats: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  testDetail: {
    backgroundColor: COLORS.bgDark,
    borderRadius: 8,
    padding: 10,
  },
  testLabel: {
    color: COLORS.textWhite,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  codeOutputLabel: {
    color: COLORS.textSubtle,
    fontSize: 10,
    marginTop: 4,
  },
  codeOutputText: {
    color: COLORS.cyan,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  editorContainer: {
    backgroundColor: COLORS.bgCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    overflow: 'hidden',
    marginBottom: SPACING.md,
  },
  editorHeader: {
    backgroundColor: '#0c101d',
    paddingHorizontal: SPACING.md,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.bgCardBorder,
  },
  editorTitle: {
    fontSize: 10,
    color: COLORS.textSubtle,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  codeInput: {
    color: '#e2e8f0',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 12,
    padding: SPACING.md,
    minHeight: 220,
    textAlignVertical: 'top',
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  runBtn: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  runBtnText: {
    color: COLORS.primaryLight,
    fontWeight: '700',
    fontSize: 13,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
  },
  submitBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
});
