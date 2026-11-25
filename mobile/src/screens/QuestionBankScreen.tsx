import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  StatusBar
} from 'react-native';
import { COLORS, SPACING } from '../constants/theme';
import { SAMPLE_PROBLEMS } from '../services/api';
import { Problem } from '../types';

interface QuestionBankScreenProps {
  onSelectProblem: (problem: Problem) => void;
  onBack: () => void;
}

export default function QuestionBankScreen({ onSelectProblem, onBack }: QuestionBankScreenProps) {
  const [filter, setFilter] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>('All');
  const [search, setSearch] = useState('');

  const filteredProblems = SAMPLE_PROBLEMS.filter(p => {
    const matchesFilter = filter === 'All' || p.difficulty === filter;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getDifficultyColor = (diff: string) => {
    if (diff === 'Easy') return COLORS.easy;
    if (diff === 'Medium') return COLORS.medium;
    return COLORS.hard;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coding Questions</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by title, tag (e.g. DP, Two Pointers)..."
          placeholderTextColor={COLORS.textSubtle}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['All', 'Easy', 'Medium', 'Hard'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
            onPress={() => setFilter(tab)}
          >
            <Text style={[styles.filterTabText, filter === tab && styles.filterTabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Problem List */}
      <FlatList
        data={filteredProblems}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => onSelectProblem(item)}
          >
            <View style={styles.cardHeader}>
              <View style={styles.titleRow}>
                {item.solved && (
                  <View style={styles.solvedBadge}>
                    <Text style={styles.solvedCheck}>✓</Text>
                  </View>
                )}
                <Text style={styles.problemTitle}>{item.title}</Text>
              </View>
              <View style={[styles.diffBadge, { backgroundColor: getDifficultyColor(item.difficulty) + '22', borderColor: getDifficultyColor(item.difficulty) + '44' }]}>
                <Text style={[styles.diffText, { color: getDifficultyColor(item.difficulty) }]}>
                  {item.difficulty}
                </Text>
              </View>
            </View>

            <View style={styles.cardFooter}>
              <Text style={styles.categoryText}>🏷️ {item.category}</Text>
              <Text style={styles.acceptanceText}>Acceptance: {item.acceptance}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
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
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
  },
  backBtnText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textWhite,
  },
  searchContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 12,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.textWhite,
    fontSize: 13,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  filterTab: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
  },
  filterTabActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  listContent: {
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.bgCardBorder,
    borderRadius: 16,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  solvedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.emerald,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solvedCheck: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  problemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textWhite,
    flex: 1,
  },
  diffBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  categoryText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  acceptanceText: {
    fontSize: 11,
    color: COLORS.textSubtle,
  },
});
