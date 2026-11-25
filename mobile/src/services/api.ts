import { User, Problem } from '../types';

export const API_BASE_URL = 'https://coding-interview-78ad.vercel.app/api';

// Sample mock problems
export const SAMPLE_PROBLEMS: Problem[] = [
  {
    id: 'p1',
    title: 'Two Sum',
    difficulty: 'Easy',
    category: 'Arrays & Hashing',
    acceptance: '51.2%',
    solved: true,
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.',
    starterCode: {
      python: 'def twoSum(nums: list[int], target: int) -> list[int]:\n    # Write your solution here\n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            return [seen[complement], i]\n        seen[num] = i\n    return []',
      javascript: 'function twoSum(nums, target) {\n  const map = new Map();\n  for (let i = 0; i < nums.length; i++) {\n    const comp = target - nums[i];\n    if (map.has(comp)) return [map.get(comp), i];\n    map.set(nums[i], i);\n  }\n  return [];\n}',
      cpp: 'class Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        unordered_map<int, int> m;\n        for (int i = 0; i < nums.size(); ++i) {\n            int comp = target - nums[i];\n            if (m.count(comp)) return {m[comp], i};\n            m[nums[i]] = i;\n        }\n        return {};\n    }\n};',
      java: 'class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int comp = target - nums[i];\n            if (map.containsKey(comp)) return new int[]{map.get(comp), i};\n            map.put(nums[i], i);\n        }\n        return new int[]{};\n    }\n}'
    }
  },
  {
    id: 'p2',
    title: 'Valid Palindrome',
    difficulty: 'Easy',
    category: 'Two Pointers',
    acceptance: '46.8%',
    solved: true,
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.',
    starterCode: {
      python: 'def isPalindrome(s: str) -> bool:\n    filtered = [c.lower() for c in s if c.isalnum()]\n    return filtered == filtered[::-1]',
      javascript: 'function isPalindrome(s) {\n  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");\n  return clean === clean.split("").reverse().join("");\n}',
      cpp: '// C++ Solution',
      java: '// Java Solution'
    }
  },
  {
    id: 'p3',
    title: 'Longest Substring Without Repeating Characters',
    difficulty: 'Medium',
    category: 'Sliding Window',
    acceptance: '34.5%',
    solved: false,
    description: 'Given a string s, find the length of the longest substring without repeating characters.',
    starterCode: {
      python: 'def lengthOfLongestSubstring(s: str) -> int:\n    char_set = set()\n    left = 0\n    res = 0\n    for right in range(len(s)):\n        while s[right] in char_set:\n            char_set.remove(s[left])\n            left += 1\n        char_set.add(s[right])\n        res = max(res, right - left + 1)\n    return res',
      javascript: 'function lengthOfLongestSubstring(s) {\n  // Implementation\n}',
      cpp: '// C++ Solution',
      java: '// Java Solution'
    }
  },
  {
    id: 'p4',
    title: 'Trapping Rain Water',
    difficulty: 'Hard',
    category: 'Two Pointers / Stack',
    acceptance: '60.1%',
    solved: false,
    description: 'Given n non-negative integers representing an elevation map where the width of each bar is 1, compute how much water it can trap after raining.',
    starterCode: {
      python: 'def trap(height: list[int]) -> int:\n    if not height: return 0\n    l, r = 0, len(height) - 1\n    leftMax, rightMax = height[l], height[r]\n    res = 0\n    while l < r:\n        if leftMax < rightMax:\n            l += 1\n            leftMax = max(leftMax, height[l])\n            res += leftMax - height[l]\n        else:\n            r -= 1\n            rightMax = max(rightMax, height[r])\n            res += rightMax - height[r]\n    return res',
      javascript: '// JS Solution',
      cpp: '// C++ Solution',
      java: '// Java Solution'
    }
  }
];

export async function loginUser(username: string): Promise<User> {
  // Simulates or connects with auth
  return {
    id: 'u_' + Date.now(),
    name: username || 'Shobhit',
    email: (username ? username.toLowerCase() : 'user') + '@example.com',
    rating: 1200,
    points: 100,
    solvedCount: 24,
    streak: 3
  };
}
