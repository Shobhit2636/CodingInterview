import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '../../platform.db');

// Ensure parent directories exist
if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath);

export function dbRun(sql: string, params: any[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

export function dbAll(sql: string, params: any[] = []): Promise<any[]> {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

export function dbGet(sql: string, params: any[] = []): Promise<any> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

export async function initDatabase() {
  console.log('Initializing SQLite Database...');
  
  // Create tables
  await dbRun(`
    CREATE TABLE IF NOT EXISTS questions (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      difficulty TEXT NOT NULL,
      tags TEXT NOT NULL,
      companies TEXT NOT NULL,
      description TEXT NOT NULL,
      input_format TEXT,
      output_format TEXT,
      constraints TEXT,
      sample_input TEXT,
      sample_output TEXT,
      starter_code_py TEXT,
      starter_code_js TEXT,
      starter_code_cpp TEXT,
      starter_code_java TEXT,
      test_cases TEXT
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      question_id TEXT NOT NULL,
      language TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT NOT NULL,
      runtime INTEGER,
      memory INTEGER,
      error_message TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await dbRun(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      points INTEGER DEFAULT 0,
      rating INTEGER DEFAULT 1200,
      accuracy REAL DEFAULT 0.0,
      heatmaps TEXT DEFAULT '{}'
    )
  `);

  // Seed default user if not exists
  const user = await dbGet('SELECT * FROM users LIMIT 1');
  if (!user) {
    // Generate a default mock contribution heatmap for the user
    // Format: "YYYY-MM-DD": submissions_count
    const mockHeatmap: Record<string, number> = {};
    const now = new Date();
    for (let i = 0; i < 90; i++) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // random count for interesting aesthetics
      if (Math.random() > 0.4) {
        mockHeatmap[dateStr] = Math.floor(Math.random() * 5) + 1;
      }
    }

    await dbRun(
      'INSERT INTO users (id, username, points, rating, accuracy, heatmaps) VALUES (?, ?, ?, ?, ?, ?)',
      ['user_1', 'Shobhit', 450, 1680, 78.4, JSON.stringify(mockHeatmap)]
    );
  }

  // Seed default questions if table is empty
  const count = await dbGet('SELECT COUNT(*) as count FROM questions');
  if ((count as any).count === 0) {
    console.log('Seeding coding questions...');
    
    const seedQuestions = [
      {
        id: 'two-sum',
        title: 'Two Sum',
        difficulty: 'Easy',
        tags: 'Array,Hash Table',
        companies: 'Google,Amazon,Microsoft',
        description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.',
        input_format: 'First line contains length of array. Second line contains array elements. Third line contains the target.',
        output_format: 'Two indices separated by space.',
        constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
        sample_input: '4\n2 7 11 15\n9',
        sample_output: '0 1',
        starter_code_py: 'def twoSum(nums, target):\n    # Write your Python code here\n    pass',
        starter_code_js: 'function twoSum(nums, target) {\n    // Write your JavaScript code here\n    return [];\n}',
        starter_code_cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Write your C++ code here\n        return {};\n    }\n};',
        starter_code_java: 'import java.util.*;\n\nclass Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n        return new int[2];\n    }\n}',
        test_cases: JSON.stringify([
          { input: '4\n2 7 11 15\n9', output: '0 1' },
          { input: '3\n3 2 4\n6', output: '1 2' },
          { input: '2\n3 3\n6', output: '0 1' }
        ])
      },
      {
        id: 'longest-palindromic-substring',
        title: 'Longest Palindromic Substring',
        difficulty: 'Medium',
        tags: 'String,Dynamic Programming',
        companies: 'Amazon,Microsoft',
        description: 'Given a string `s`, return the longest palindromic substring in `s`.',
        input_format: 'A single string s.',
        output_format: 'The longest palindromic substring.',
        constraints: '1 <= s.length <= 1000\ns consists of only digits and English letters.',
        sample_input: 'babad',
        sample_output: 'bab',
        starter_code_py: 'def longestPalindrome(s: str) -> str:\n    # Write your Python code here\n    return ""',
        starter_code_js: 'function longestPalindrome(s) {\n    // Write your JavaScript code here\n    return "";\n}',
        starter_code_cpp: '#include <string>\nusing namespace std;\n\nclass Solution {\npublic:\n    string longestPalindrome(string s) {\n        // Write your C++ code here\n        return "";\n    }\n};',
        starter_code_java: 'class Solution {\n    public String longestPalindrome(String s) {\n        // Write your Java code here\n        return "";\n    }\n}',
        test_cases: JSON.stringify([
          { input: 'babad', output: 'bab' },
          { input: 'cbbd', output: 'bb' },
          { input: 'a', output: 'a' }
        ])
      },
      {
        id: 'course-schedule',
        title: 'Course Schedule',
        difficulty: 'Medium',
        tags: 'Graph,Depth-First Search,Breadth-First Search',
        companies: 'Google',
        description: 'There are a total of `numCourses` courses you have to take, labeled from `0` to `numCourses - 1`. You are given an array `prerequisites` where `prerequisites[i] = [ai, bi]` indicates that you must take course `bi` first if you want to take course `ai`.\n\nFor example, the pair `[0, 1]`, indicates that to take course `0` you must first take course `1`.\n\nReturn `true` if you can finish all courses. Otherwise, return `false`.',
        input_format: 'First line contains numCourses.\nSecond line contains number of prerequisite pairs.\nSubsequent lines contain pairs of prerequisite integers separated by space.',
        output_format: 'true or false',
        constraints: '1 <= numCourses <= 2000\n0 <= prerequisites.length <= 5000',
        sample_input: '2\n1\n1 0',
        sample_output: 'true',
        starter_code_py: 'def canFinish(numCourses: int, prerequisites: list) -> bool:\n    # Write your Python code here\n    return True',
        starter_code_js: 'function canFinish(numCourses, prerequisites) {\n    // Write your JavaScript code here\n    return true;\n}',
        starter_code_cpp: '#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    bool canFinish(int numCourses, vector<vector<int>>& prerequisites) {\n        // Write your C++ code here\n        return true;\n    }\n};',
        starter_code_java: 'import java.util.*;\n\nclass Solution {\n    public boolean canFinish(int numCourses, int[][] prerequisites) {\n        // Write your Java code here\n        return true;\n    }\n}',
        test_cases: JSON.stringify([
          { input: '2\n1\n1 0', output: 'true' },
          { input: '2\n2\n1 0\n0 1', output: 'false' }
        ])
      },
      {
        id: 'edit-distance',
        title: 'Edit Distance',
        difficulty: 'Hard',
        tags: 'String,Dynamic Programming',
        companies: 'Google,Amazon,Microsoft',
        description: 'Given two strings `word1` and `word2`, return the minimum number of operations required to convert `word1` to `word2`.\n\nYou have the following three operations permitted on a word:\n1. Insert a character\n2. Delete a character\n3. Replace a character',
        input_format: 'Two lines, first containing word1 and second containing word2.',
        output_format: 'Minimum operations count.',
        constraints: '0 <= word1.length, word2.length <= 500\nword1 and word2 consist of lowercase English letters.',
        sample_input: 'horse\nros',
        sample_output: '3',
        starter_code_py: 'def minDistance(word1: str, word2: str) -> int:\n    # Write your Python code here\n    return 0',
        starter_code_js: 'function minDistance(word1, word2) {\n    // Write your JavaScript code here\n    return 0;\n}',
        starter_code_cpp: '#include <string>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minDistance(string word1, string word2) {\n        // Write your C++ code here\n        return 0;\n    }\n};',
        starter_code_java: 'class Solution {\n    public int minDistance(String word1, String word2) {\n        // Write your Java code here\n        return 0;\n    }\n}',
        test_cases: JSON.stringify([
          { input: 'horse\nros', output: '3' },
          { input: 'intention\nexecution', output: '5' }
        ])
      }
    ];

    for (const q of seedQuestions) {
      await dbRun(
        `INSERT INTO questions (
          id, title, difficulty, tags, companies, description, 
          input_format, output_format, constraints, sample_input, sample_output,
          starter_code_py, starter_code_js, starter_code_cpp, starter_code_java, test_cases
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          q.id, q.title, q.difficulty, q.tags, q.companies, q.description,
          q.input_format, q.output_format, q.constraints, q.sample_input, q.sample_output,
          q.starter_code_py, q.starter_code_js, q.starter_code_cpp, q.starter_code_java, q.test_cases
        ]
      );
    }
    console.log('Seeding successful!');
  }
}
export default db;
