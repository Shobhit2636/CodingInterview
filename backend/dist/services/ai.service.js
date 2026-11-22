"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.analyzeCodeWithAI = analyzeCodeWithAI;
const generative_ai_1 = require("@google/generative-ai");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const apiKey = process.env.GEMINI_API_KEY || '';
let genAI = null;
if (apiKey && apiKey !== 'YOUR_GEMINI_API_KEY') {
    try {
        // Correct standard GoogleGenerativeAI initialization
        genAI = new generative_ai_1.GoogleGenerativeAI(apiKey);
        console.log('Gemini AI Service initialized successfully.');
    }
    catch (error) {
        console.warn('Failed to initialize Gemini SDK. Using Mock fallback.', error);
    }
}
else {
    console.log('No GEMINI_API_KEY found in .env. Operating in Mock AI Mode.');
}
/**
 * Core text generator helper utilizing either real Gemini API or premium mock engine.
 */
async function analyzeCodeWithAI(prompt, context) {
    if (genAI) {
        try {
            const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
            const fullPrompt = context ? `${context}\n\nUser request:\n${prompt}` : prompt;
            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            return response.text();
        }
        catch (e) {
            console.error('Error invoking Gemini API, falling back to mock system:', e);
        }
    }
    // High-fidelity dynamic Mock AI generator
    return generateMockAIResponse(prompt);
}
/**
 * Dynamic Mock AI responder to simulate realistic evaluations
 */
function generateMockAIResponse(prompt) {
    const lowercasePrompt = prompt.toLowerCase();
    // 1a. FAANG LIVE CODING INTERVIEWER MOCK (Must be checked BEFORE generic review checks!)
    if (lowercasePrompt.includes('coding interviewer') || lowercasePrompt.includes('live technical round') || lowercasePrompt.includes('faang coding interviewer')) {
        // Extract user reply from prompt
        let userReply = '';
        const replyMatch = prompt.match(/The candidate's latest reply[^:]*:\s*"([^"]*)"/i);
        if (replyMatch && replyMatch[1]) {
            userReply = replyMatch[1].trim();
        }
        const replyLower = userReply.toLowerCase();
        // Extract conversation history to track context and avoid repetitive questions
        let history = [];
        const historyMatch = prompt.match(/Here is the conversation history so far:\s*(\[[^\]]*\])/is);
        if (historyMatch && historyMatch[1]) {
            try {
                history = JSON.parse(historyMatch[1]);
            }
            catch (_) { }
        }
        const historyText = JSON.stringify(history).toLowerCase();
        // Check 1: User provides concrete test inputs / arrays / numbers (e.g., "nums = {3, 3}; target = 6;")
        const hasNumbersOrArray = /\bnums\b|\btarget\b|\b\{\s*\d+|\b\[\s*\d+|\b\d+\s*,\s*\d+/.test(replyLower);
        if (hasNumbersOrArray) {
            return JSON.stringify({
                question: `Looking closely at your test case (${userReply}): as we iterate, calculating complement = target - num checks existing entries in constant time. How will you store the seen elements in memory, and what will be the Time and Space Complexities?`,
                evaluation: `Candidate effectively dry-ran a test case: "${userReply}".`,
                feedback: "Great habit of providing concrete test inputs! Tracing edge cases early prevents algorithmic errors."
            });
        }
        // Check 2: Willingness or confirmation to explain ("i can explain", "yes", "sure", "ok", "let me explain")
        if (/^(i can explain|let me explain|yes|yeah|sure|ok|okay|yep|start|i will explain|ready|proceed)\b/i.test(replyLower)) {
            if (!historyText.includes('data structure') && !historyText.includes('hash map')) {
                return JSON.stringify({
                    question: "Awesome, I'm listening! What data structure or algorithmic technique would you start with to solve this efficiently?",
                    evaluation: "Candidate acknowledged and is ready to explain.",
                    feedback: "Clear communication start! Explain your logic aloud step-by-step."
                });
            }
            else {
                return JSON.stringify({
                    question: "Go right ahead! Walk me through the exact steps of your algorithm.",
                    evaluation: "Candidate is explaining algorithm logic.",
                    feedback: "Keep vocalizing your line-by-line reasoning."
                });
            }
        }
        // Check 3: Hash Map / Dictionary / Hash Table
        if (/hash\s*map|hashmap|hash\s*table|map|dictionary|dict\b/i.test(replyLower)) {
            return JSON.stringify({
                question: "Using a Hash Map is optimal here! What will you store as the key and the value in the map, and how does it guarantee O(1) lookups?",
                evaluation: "Candidate selected optimal Hash Map approach.",
                feedback: "Excellent data structure choice. Detail what you store as key vs value."
            });
        }
        // Check 4: Two Pointers / Sorting
        if (/pointer|two\s*pointer|sort/i.test(replyLower)) {
            return JSON.stringify({
                question: "Two pointers is a strong technique! However, sorting takes O(N log N) time and alters indices. How would you return the original indices?",
                evaluation: "Candidate considered two pointer technique.",
                feedback: "Good thought! Always check whether sorting preserves original index requirements."
            });
        }
        // Check 5: Nested loop / Brute Force
        if (/nested|brute|loop|two\s*loops|o\(n\^2\)/i.test(replyLower)) {
            return JSON.stringify({
                question: "Checking every pair with nested loops gives an O(N^2) baseline. Can we optimize this down to linear O(N) time by using extra memory?",
                evaluation: "Candidate proposed O(N^2) brute force solution.",
                feedback: "Stating the brute force first is great. Now propose a hash-based optimization."
            });
        }
        // Check 6: Complexity Analysis (O(N), O(1), Time, Space)
        if (/o\(n\)|o\(1\)|time|space|complexity|linear|constant|big\s*o/i.test(replyLower)) {
            return JSON.stringify({
                question: "That Big-O complexity breakdown is spot on! Now let's write out the implementation in the code editor on the right. How will you structure the function?",
                evaluation: "Candidate accurately analyzed time and space bounds.",
                feedback: "Strong complexity grasp. Now transition to clean code."
            });
        }
        // Check 7: Edge cases / Duplicates / Negative numbers / Zeroes
        if (/edge|duplicate|negative|empty|zero|boundary/i.test(replyLower)) {
            return JSON.stringify({
                question: "Great attention to detail on edge cases! How will your code handle an empty array or when no two numbers sum up to the target?",
                evaluation: "Candidate evaluated boundary constraints.",
                feedback: "Proactively addressing edge cases is a big plus in technical rounds."
            });
        }
        // Check 8: Done / Code Written
        if (/done|finished|implemented|written|check|complete|submit/i.test(replyLower)) {
            return JSON.stringify({
                question: "The interview is now complete. Generating report card...",
                evaluation: "Candidate finished the interview session.",
                feedback: "Great job completing the challenge end-to-end!"
            });
        }
        // Check 9: Non-repeating progressive interview stages
        const progressiveStages = [
            {
                keyword: "algorithm",
                q: "Interesting point! Could you walk me through the specific algorithm and data structures you plan to use?",
                e: "Candidate shared preliminary thoughts.",
                f: "Break down the problem into small, manageable algorithmic steps."
            },
            {
                keyword: "potential edge",
                q: "Understood. How would you handle potential edge cases, such as an array with duplicate numbers or negative values?",
                e: "Candidate elaborated on their method.",
                f: "Always consider input bounds and corner cases."
            },
            {
                keyword: "worst-case",
                q: "That makes sense. What would be the worst-case Time Complexity and Space Complexity in terms of Big-O?",
                e: "Candidate discussed trade-offs.",
                f: "Practice calculating Big-O bounds quickly."
            },
            {
                keyword: "translate",
                q: "Great! Let's translate this into actual code. Please write your solution in the code editor on the right.",
                e: "Candidate is ready to write code.",
                f: "Write clean, readable variable names and functions."
            },
            {
                keyword: "complete",
                q: "The interview is now complete. Generating report card...",
                e: "Candidate completed the interview.",
                f: "Solid overall execution."
            }
        ];
        // Pick the first stage that hasn't appeared yet in the conversation
        for (const stage of progressiveStages) {
            if (!historyText.includes(stage.keyword)) {
                return JSON.stringify({
                    question: stage.q,
                    evaluation: stage.e,
                    feedback: stage.f
                });
            }
        }
        return JSON.stringify({
            question: "The interview is now complete. Generating report card...",
            evaluation: "Candidate completed the technical coding round.",
            feedback: "Great job walking through all the stages of the problem!"
        });
    }
    // 1b. COMPILER EXECUTOR MOCK PARSER
    if (lowercasePrompt.includes('compile') || lowercasePrompt.includes('stdout')) {
        // Find expected outputs or test cases
        let status = 'Accepted';
        let runtime = Math.floor(Math.random() * 95) + 18;
        let memory = Math.floor(Math.random() * 500) + 120;
        let stdout = 'Output matched expectations.';
        if (lowercasePrompt.includes('two-sum') || lowercasePrompt.includes('twosum')) {
            stdout = '0 1';
        }
        else if (lowercasePrompt.includes('longest-palindromic-substring') || lowercasePrompt.includes('longestpalindrome')) {
            stdout = 'bab';
        }
        else if (lowercasePrompt.includes('course-schedule') || lowercasePrompt.includes('canfinish')) {
            stdout = 'true';
        }
        else if (lowercasePrompt.includes('edit-distance') || lowercasePrompt.includes('mindistance')) {
            stdout = '3';
        }
        return JSON.stringify({
            status,
            stdout,
            stderr: '',
            runtime,
            memory
        });
    }
    // 2. AI CODE REVIEW MOCK
    if (lowercasePrompt.includes('comprehensive, professional ai code review') || lowercasePrompt.includes('code review') || (lowercasePrompt.includes('review') && !lowercasePrompt.includes('interviewer'))) {
        const isTwoSum = lowercasePrompt.includes('twosum') || lowercasePrompt.includes('two sum');
        const hasDoubleLoop = lowercasePrompt.includes('for') && (prompt.match(/for/g) || []).length >= 2;
        if (isTwoSum && hasDoubleLoop) {
            return `### 💡 AI Code Review - Optimization Needed

#### 📊 Complexity Analysis
* **Time Complexity**: **O(N²)** due to nested double loops checking every pair combination.
* **Space Complexity**: **O(1)** as you search in-place.

#### 🪳 Bug Audit
* **No critical crashes**, but highly inefficient for larger arrays. Will trigger a **Time Limit Exceeded (TLE)** on arrays of size $N > 10^4$.

#### 🚀 Recommended Optimizations
You can optimize this to **O(N) time complexity** and **O(N) space complexity** using a **Hash Map**.
By storing the *complement* ($target - nums[i]$) as you iterate through the list, you can check for the matching value in constant $O(1)$ lookup time!

#### 🛠️ Optimized Reference Implementation
\`\`\`python
def twoSum(nums, target):
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []
\`\`\`
*(Optimized Time: 28ms | Space: 14.1 MB)*`;
        }
        return `### 💡 AI Code Review

#### 📊 Complexity Analysis
* **Time Complexity**: **O(N)** - Your algorithm iterates over the structure linearly, which is optimal for this question state.
* **Space Complexity**: **O(N)** - Storing elements dynamically in helper buffers.

#### 🪳 Bug Audit
* **No bugs found**: Clean edge-case coverage (handles empty, negative, and extreme boundaries!).

#### 🚀 Recommended Optimizations
Your solution is already highly competitive! To squeeze out extra performance:
1. Try utilizing two-pointer algorithms instead of dynamic buffering if you want to optimize space down to $O(1)$.
2. Use native language operations or micro-buffers (like localized arrays instead of hash tables) to minimize overhead.`;
    }
    // 3. AI HINT DRAWER
    if (lowercasePrompt.includes('hint')) {
        if (lowercasePrompt.includes('level 1')) {
            return `### 🎯 Level 1 Hint
Think about storing values you have already processed. Can we use a data structure that provides fast searches to lookup the difference?`;
        }
        else if (lowercasePrompt.includes('level 2')) {
            return `### 🎯 Level 2 Hint
Try utilizing a **Hash Map** or **Hash Set**. As you loop through each element $x$ in the collection, calculate its complement: $complement = target - x$. If the complement exists in the map, you found your answer!`;
        }
        else {
            return `### 🏁 Full Approach (Explanation)
1. Initialize an empty hash map (e.g., \`seen = {}\`).
2. Iterate through the array using indices. For each element:
   - Calculate \`complement = target - current_element\`.
   - Check if \`complement\` is present in the hash map.
   - If present, return indices \`[seen[complement], current_index]\`.
   - If not, insert the current element with its index into the map (\`seen[current_element] = current_index\`).
3. If no such indices are found, return an empty array.`;
        }
    }
    // 4. AI ROADMAP GENERATOR
    if (lowercasePrompt.includes('roadmap') || lowercasePrompt.includes('weak') || lowercasePrompt.includes('plan')) {
        return JSON.stringify({
            weakTopics: ["Dynamic Programming (Knapsack, LCS)", "Graph Algorithms (Dijkstra, MST)", "Sliding Window Techniques"],
            strongTopics: ["Arrays & Array Manipulations", "Linked Lists", "Hash Maps & Sorting"],
            dailyPlan: [
                { day: "Day 1", focus: "Sliding Window Foundations", time: "1.5 hours", task: "Solve Longest Substring Without Repeating Characters, master the variable window size formula." },
                { day: "Day 2", focus: "Two-pointer Optimizations", time: "1 hour", task: "Solve Container With Most Water, understand how to move left/right markers logically." },
                { day: "Day 3", focus: "Graph Representation & BFS", time: "2 hours", task: "Implement Course Schedule, master topological sorting." },
                { day: "Day 4", focus: "Dynamic Programming: 1D Array", time: "2.5 hours", task: "Solve House Robber and Climbing Stairs, identify overlapping sub-problems." },
                { day: "Day 5", focus: "Dynamic Programming: 2D Grids", time: "2 hours", task: "Solve Unique Paths, construct bottom-up grid tables." },
                { day: "Day 6", focus: "Mock Coding Assessment", time: "3 hours", task: "Simulate a live contest on Google/Amazon interview sets with strict 45-minute timers." },
                { day: "Day 7", focus: "AI Interviewer Assessment", time: "1.5 hours", task: "Run a complete text-to-speech mock session on Graphs in the AI Interviewer tab." }
            ]
        });
    }
    // 5. AI BEHAVIORAL INTERVIEW MOCK
    if (lowercasePrompt.includes('behavioral') || lowercasePrompt.includes('conflict') || lowercasePrompt.includes('tell me about')) {
        return JSON.stringify({
            question: "Great. Tell me about a time when you had a conflict with a teammate or co-worker. How did you handle it and what was the outcome?",
            feedback: "Your response successfully touches on cooperation. However, you can refine it by applying the **STAR method** (Situation, Task, Action, Result). Highlight the *specific* compromise you proposed and quantify the successful final metrics (e.g. 'This resolved our merge conflict and saved 4 hours of weekly debugging').",
            rating: 85
        });
    }
    // 6. AI CONVERSATIONAL INTERVIEWER (SPEECH/TEXT INTERVIEW)
    if (lowercasePrompt.includes('system design architecture') || lowercasePrompt.includes('system design')) {
        return JSON.stringify({
            question: "That makes sense. To ensure high availability and prevent single points of failure, how would you set up database replication and scaling? Would you choose master-slave replication or a multi-master decentralized setup like Cassandra for this workload?",
            evaluation: "The candidate articulated the APIs and data flows well. Selecting appropriate DB replication will be key here.",
            feedback: "You explained the API endpoints clearly. Next, describe how replication lag might affect consistency."
        });
    }
    // 7. NEW REPORT GENERATIONS FALLBACK
    if (lowercasePrompt.includes('final assessment')) {
        return JSON.stringify({
            overallScore: 88,
            communication: 92,
            codeRating: 84,
            feedback: "You demonstrated solid communication skills, explaining your algorithms step-by-step before writing the code. Your coding quality is good, though you could optimize the space complexity by reusing array elements in-place. Consider dry-running index calculations for edge cases.",
            questionsCovered: [
                "Described array sliding index boundaries",
                "Formulated complement lookup logic using Hash Maps",
                "Analyzed O(N) linear time constraints"
            ]
        });
    }
    if (lowercasePrompt.includes('principal architect')) {
        return JSON.stringify({
            overall: 85,
            sharding: 90,
            caching: 80,
            feedback: "Excellent sharding blueprint utilizing consistent hashing rings to avoid partition hotspots. Your caching strategy (Redis with LRU eviction) covers spikes well. However, you should discuss cache consistency policies (e.g., write-through vs write-behind) in detail next time.",
            designBreakdowns: [
                "Distributed database partitioning constraints",
                "Consistent hashing ring calculations",
                "CDN assets cache eviction timelines"
            ]
        });
    }
    if (lowercasePrompt.includes('hiring manager')) {
        return JSON.stringify({
            score: 87,
            summary: "You demonstrated solid STAR alignment across your team conflict and delivery speed responses. Your answers show great compromise strategies. To score higher, make sure to quantify your actions with percentage outcomes (e.g., 'saved 14 hours of development time').",
            turns: []
        });
    }
    return JSON.stringify({
        question: "Interesting. You suggested a Hash Map approach to solve this in O(N). Could you explain what would be the exact worst-case Space Complexity in terms of Big-O, and what kind of inputs would trigger that worst case?",
        evaluation: "Excellent solution formulation. The space complexity is O(N) because, in the absolute worst-case scenario (such as when the target is at the end or no match exists), we must store all elements in our hash table.",
        feedback: "Your communication is highly clear! Keep sharing your thoughts aloud before writing the lines of code."
    });
}
