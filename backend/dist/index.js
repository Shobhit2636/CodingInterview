"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const http_1 = __importDefault(require("http"));
const dotenv_1 = __importDefault(require("dotenv"));
const uuid_1 = require("uuid");
const database_1 = require("./db/database");
const execution_service_1 = require("./services/execution.service");
const ai_service_1 = require("./services/ai.service");
const trace_service_1 = require("./services/trace.service");
const socket_service_1 = require("./services/socket.service");
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Main HTTP and Socket.io Server
const server = http_1.default.createServer(app);
(0, socket_service_1.initSocketService)(server);
// --- REST API ENDPOINTS ---
// --- 0. AUTHENTICATION ENDPOINTS ---
// 0a. SIGN UP
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email and password are required' });
    }
    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: 'Please enter a valid email address' });
    }
    try {
        const existing = await (0, database_1.dbGet)('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)', [email.trim(), username.trim()]);
        if (existing) {
            if (existing.email && existing.email.toLowerCase() === email.trim().toLowerCase()) {
                return res.status(400).json({ error: 'An account with this email already exists' });
            }
            return res.status(400).json({ error: 'Username is already taken' });
        }
        const userId = `user_${(0, uuid_1.v4)().substring(0, 8)}`;
        const hashedPassword = (0, database_1.hashPassword)(password);
        const today = new Date().toISOString().split('T')[0];
        const initialHeatmap = JSON.stringify({ [today]: 1 });
        await (0, database_1.dbRun)('INSERT INTO users (id, username, email, password, points, rating, accuracy, heatmaps) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [userId, username.trim(), email.trim(), hashedPassword, 100, 1200, 100.0, initialHeatmap]);
        const newUser = await (0, database_1.dbGet)('SELECT id, username, email, points, rating, accuracy FROM users WHERE id = ?', [userId]);
        res.status(201).json({
            user: newUser,
            message: 'Account created successfully'
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 0b. LOGIN
app.post('/api/auth/login', async (req, res) => {
    const emailOrUsername = req.body.emailOrUsername || req.body.identifier || req.body.email || req.body.username;
    const { password } = req.body;
    if (!emailOrUsername || !password) {
        return res.status(400).json({ error: 'Username/Email and password are required' });
    }
    try {
        const user = await (0, database_1.dbGet)('SELECT * FROM users WHERE LOWER(email) = LOWER(?) OR LOWER(username) = LOWER(?)', [emailOrUsername.trim(), emailOrUsername.trim()]);
        if (!user) {
            return res.status(401).json({ error: 'User not found. Please sign up first.' });
        }
        const hashedPassword = (0, database_1.hashPassword)(password);
        if (user.password && user.password !== hashedPassword) {
            return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }
        res.json({
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                points: user.points,
                rating: user.rating,
                accuracy: user.accuracy
            },
            message: 'Login successful'
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 0c. GET CURRENT USER
app.get('/api/auth/me/:userId', async (req, res) => {
    try {
        const user = await (0, database_1.dbGet)('SELECT id, username, email, points, rating, accuracy FROM users WHERE id = ?', [req.params.userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 1. GET ALL QUESTIONS
app.get('/api/questions', async (req, res) => {
    try {
        const questions = await (0, database_1.dbAll)('SELECT id, title, difficulty, tags, companies FROM questions');
        // Format response tags and companies arrays
        const formatted = questions.map((q) => ({
            ...q,
            tags: q.tags ? q.tags.split(',') : [],
            companies: q.companies ? q.companies.split(',') : []
        }));
        res.json(formatted);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 2. GET SINGLE QUESTION
app.get('/api/questions/:id', async (req, res) => {
    try {
        const question = await (0, database_1.dbGet)('SELECT * FROM questions WHERE id = ?', [req.params.id]);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        const q = question;
        res.json({
            ...q,
            tags: q.tags ? q.tags.split(',') : [],
            companies: q.companies ? q.companies.split(',') : [],
            test_cases: q.test_cases ? JSON.parse(q.test_cases) : []
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 3. EXECUTE / SUBMIT CODE
app.post('/api/submissions', async (req, res) => {
    const { questionId, language, code, customInput, userId } = req.body;
    try {
        const question = await (0, database_1.dbGet)('SELECT * FROM questions WHERE id = ?', [questionId]);
        if (!question) {
            return res.status(404).json({ error: 'Question not found' });
        }
        const q = question;
        const testCases = q.test_cases ? JSON.parse(q.test_cases) : [];
        let result;
        if (customInput !== undefined) {
            // Custom execution run
            result = await (0, execution_service_1.executeCode)(language, code, customInput);
        }
        else {
            // Evaluate official test cases (run against first test case or loop)
            const primaryTest = testCases[0] || { input: q.sample_input, output: q.sample_output };
            result = await (0, execution_service_1.executeCode)(language, code, primaryTest.input, primaryTest.output);
            // Save submission record to SQLite
            const submissionId = (0, uuid_1.v4)();
            await (0, database_1.dbRun)('INSERT INTO submissions (id, question_id, language, code, status, runtime, memory, error_message) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
                submissionId,
                questionId,
                language,
                code,
                result.status,
                result.runtime,
                result.memory,
                result.stderr || null
            ]);
            // Update user contribution count in SQLite
            const targetUserId = userId || 'user_1';
            let user = await (0, database_1.dbGet)('SELECT * FROM users WHERE id = ?', [targetUserId]);
            if (!user) {
                user = await (0, database_1.dbGet)('SELECT * FROM users WHERE id = ?', ['user_1']);
            }
            if (user) {
                const heatmap = JSON.parse(user.heatmaps || '{}');
                const today = new Date().toISOString().split('T')[0];
                heatmap[today] = (heatmap[today] || 0) + 1;
                // Increase points for accepted submissions
                let addPoints = 5;
                if (result.status === 'Accepted') {
                    addPoints = q.difficulty === 'Easy' ? 10 : q.difficulty === 'Medium' ? 20 : 35;
                }
                const newPoints = user.points + addPoints;
                const newRating = user.rating + (result.status === 'Accepted' ? 12 : -5);
                await (0, database_1.dbRun)('UPDATE users SET points = ?, rating = ?, heatmaps = ? WHERE id = ?', [newPoints, newRating, JSON.stringify(heatmap), user.id]);
            }
        }
        res.json(result);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 4. AI CODE REVIEW
app.post('/api/ai/review', async (req, res) => {
    const { questionId, language, code } = req.body;
    try {
        const question = await (0, database_1.dbGet)('SELECT title, description FROM questions WHERE id = ?', [questionId]);
        const qTitle = question ? question.title : 'Coding Question';
        const prompt = `Perform a comprehensive, professional AI Code Review on this user submission.
Question: "${qTitle}"
Language: "${language}"

User Code:
\`\`\`
${code}
\`\`\`

Analyze:
1. Time Complexity and Space Complexity (in big-O notation, explain why).
2. Bug audit (explain any edge cases missed, infinite loops, or memory overflows).
3. Optimized Approach (suggest a better time/space complexity approach, e.g. using hash maps, binary search, sliding windows).
4. Reference Implementation (Provide a complete, fully functional, optimized code snippet).

Provide the review in clean, professional GitHub-style Markdown with glowing icons.`;
        const review = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        res.json({ review });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 5. AI HINTS
app.post('/api/ai/hint', async (req, res) => {
    const { questionId, level, code } = req.body;
    try {
        const question = await (0, database_1.dbGet)('SELECT title, description FROM questions WHERE id = ?', [questionId]);
        const qTitle = question ? question.title : 'Coding Question';
        const qDesc = question ? question.description : '';
        const prompt = `The user is stuck solving this coding question: "${qTitle}".
Here is the question description:
${qDesc}

User's current code:
\`\`\`
${code || '// Empty code'}
\`\`\`

The user has requested Level ${level} Hint.
Rules for hint generation:
- Level 1 Hint: High-level conceptual direction or structural guide. Do NOT mention details of variables or code syntax.
- Level 2 Hint: Mention optimal data structures or algorithmic hints (e.g. hash maps, two pointers). Do NOT write complete code.
- Level 3 (Full Approach): Provide step-by-step algorithms or pseudo-code explanations. Do NOT provide exact complete solutions in code, let them implement it themselves.

Return the hint response in clean formatting.`;
        const hint = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        res.json({ hint });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 6. AI CONVERSATIONAL INTERVIEWER (SPEECH/TEXT INTERVIEW)
app.post('/api/ai/interview', async (req, res) => {
    const { questionId, history, userReply, code, language } = req.body;
    try {
        const question = await (0, database_1.dbGet)('SELECT title, description FROM questions WHERE id = ?', [questionId]);
        const qTitle = question ? question.title : 'Coding Question';
        const prompt = `You are playing the role of a senior, professional FAANG coding interviewer conducting a live technical round.
The candidate is solving the question: "${qTitle}".
Candidate's current code state (${language}):
\`\`\`
${code || ''}
\`\`\`

Here is the conversation history so far:
${JSON.stringify(history || [])}

The candidate's latest reply (transcribed voice or text):
"${userReply}"

Your task:
1. Briefly evaluate their reply.
2. Formulate a highly relevant, single follow-up question. (e.g., asking to explain complexity, why they chose a hashmap over an array, how they would handle empty edge-cases, or how to optimize a nested loop).
3. If they are completely done and code is accepted, wrap up the interview and say "The interview is now complete. Generating report card...".

Return a JSON document inside a markdown block with the following exact keys:
- "question": Your next follow-up spoken query or wrapping message.
- "evaluation": Short notes on what the candidate did well or wrong.
- "feedback": Helpful communication tips for the candidate.`;
        const responseText = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        // Parse JSON safely
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        let parsed = null;
        if (jsonMatch) {
            try {
                parsed = JSON.parse(jsonMatch[0]);
            }
            catch (_) { }
        }
        if (parsed && typeof parsed.question === 'string' && parsed.question.trim().length > 0) {
            res.json(parsed);
        }
        else {
            res.json({
                question: "Could you explain the space and time complexity of your approach?",
                evaluation: "Candidate explained high level logic.",
                feedback: "Keep practicing dry-running edge cases."
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 7. AI BEHAVIORAL INTERVIEW
app.post('/api/ai/behavioral', async (req, res) => {
    const { history, userReply } = req.body;
    try {
        const prompt = `You are a professional hiring manager conducting a mock behavioral round (leadership, teamwork, conflict resolution).
History:
${JSON.stringify(history || [])}

Candidate's latest answer:
"${userReply || ''}"

Your task:
1. Evaluate their response based on the STAR framework (Situation, Task, Action, Result).
2. Generate the next behavioral prompt or conclude if it is the 3rd question.

Return a JSON block containing:
- "question": Your next interview question (or wrap up statement).
- "feedback": Evaluation and coaching feedback.
- "rating": Numeric rating score out of 100.`;
        const responseText = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        }
        else {
            res.json({
                question: "Tell me about a time you had to make a tough decision under a tight deadline. What was your action?",
                feedback: "Focus on articulating your individual action using 'I' instead of 'we'.",
                rating: 80
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 8. AI ROADMAP GENERATOR
app.post('/api/ai/roadmap', async (req, res) => {
    const { resumeText, targetCompany, weakTopics } = req.body;
    try {
        const prompt = `You are a world-class AI Career Coach.
Generate a high-fidelity, customized study roadmap for a software engineer targeting "${targetCompany || 'FAANG'}".
Weak Topics: "${weakTopics || 'None specified'}"
Resume Context:
"${resumeText || 'Entry level engineer'}"

Construct a personalized, daily study plan spanning 7 days.
Return a JSON document with these exact keys:
- "weakTopics": Array of key weak areas.
- "strongTopics": Array of key strong areas based on resume.
- "dailyPlan": Array of objects containing:
  - "day": string (e.g. "Day 1")
  - "focus": string (the core topic)
  - "time": string (estimated prep time)
  - "task": string (specific actions & problems to solve)

Return ONLY this JSON.`;
        const responseText = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        }
        else {
            res.json({
                weakTopics: ["Dynamic Programming", "Graphs"],
                strongTopics: ["Arrays"],
                dailyPlan: [{ day: "Day 1", focus: "Arrays", time: "2 hours", task: "Solve Two Sum and study HashMap buckets." }]
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 8b. AI CODING INTERVIEW REPORT GENERATION
app.post('/api/ai/interview/report', async (req, res) => {
    const { questionId, history, code, language } = req.body;
    try {
        const question = await (0, database_1.dbGet)('SELECT title FROM questions WHERE id = ?', [questionId]);
        const qTitle = question ? question.title : 'Coding Question';
        const prompt = `You are a FAANG coding interviewer. Conduct a final assessment of the candidate's coding interview session.
Question: "${qTitle}"
Language: "${language}"

Final Code State:
\`\`\`
${code}
\`\`\`

Conversation Transcript:
${JSON.stringify(history || [])}

Return a JSON document with these exact keys:
- "overallScore": integer (0 to 100)
- "communication": integer (0 to 100)
- "codeRating": integer (0 to 100)
- "feedback": string (critique of code logic, style, and communication delivery)
- "questionsCovered": array of strings (key discussion points addressed)

Return ONLY the JSON document.`;
        const review = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        const jsonMatch = review.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        }
        else {
            res.json({
                overallScore: 80,
                communication: 80,
                codeRating: 80,
                feedback: "Solid performance overall. Code is functional but can be optimized.",
                questionsCovered: ["Discussed basic solution structure"]
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 8c. AI SYSTEM DESIGN REPORT GENERATION
app.post('/api/ai/systemdesign/report', async (req, res) => {
    const { questionId, history, whiteboardText } = req.body;
    try {
        const question = await (0, database_1.dbGet)('SELECT title FROM questions WHERE id = ?', [questionId]);
        const qTitle = question ? question.title : 'System Design';
        const prompt = `You are a Principal Architect. Assess the candidate's system design performance.
Topic: "${qTitle}"

Whiteboard Notes & Diagram Plan:
${whiteboardText || ''}

Conversation Transcript:
${JSON.stringify(history || [])}

Return a JSON document with these exact keys:
- "overall": integer (0 to 100)
- "sharding": integer (0 to 100)
- "caching": integer (0 to 100)
- "feedback": string (critique of database selection, partitioning, and scaling tradeoffs)
- "designBreakdowns": array of strings (core architecture components discussed)

Return ONLY the JSON document.`;
        const review = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        const jsonMatch = review.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        }
        else {
            res.json({
                overall: 80,
                sharding: 80,
                caching: 80,
                feedback: "Good structural explanation. Focus more on sharding boundaries.",
                designBreakdowns: ["High-level routing set up"]
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 8d. AI BEHAVIORAL REPORT GENERATION
app.post('/api/ai/behavioral/report', async (req, res) => {
    const { turns } = req.body;
    try {
        const prompt = `You are a hiring manager. Compile a final behavioral assessment report based on the candidate's STAR responses.
Interview turns and scores:
${JSON.stringify(turns || [])}

Return a JSON document with these exact keys:
- "score": integer (overall average score)
- "summary": string (detailed critique of their STAR delivery, leadership qualities, and areas of growth)
- "turns": the original array of turns updated with final review comments if needed

Return ONLY the JSON document.`;
        const review = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        const jsonMatch = review.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            res.json(JSON.parse(jsonMatch[0]));
        }
        else {
            res.json({
                score: 80,
                summary: "Demonstrated good teamwork and execution capabilities. Elaborate more on actions and outcomes.",
                turns: turns || []
            });
        }
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 8e. AI CODE EXECUTION STEP TRACER
app.post('/api/ai/trace', async (req, res) => {
    const { language, code, customInput } = req.body;
    try {
        const steps = await (0, trace_service_1.traceCodeExecution)(language, code, customInput);
        res.json({ steps });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// 9. GET USER DASHBOARD STATS
app.get('/api/dashboard/:userId', async (req, res) => {
    try {
        const requestedId = req.params.userId || 'user_1';
        let user = await (0, database_1.dbGet)('SELECT * FROM users WHERE id = ?', [requestedId]);
        if (!user) {
            user = await (0, database_1.dbGet)('SELECT * FROM users WHERE id = ?', ['user_1']);
        }
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Get submission statistics
        const submissions = await (0, database_1.dbAll)('SELECT status, COUNT(*) as count FROM submissions GROUP BY status');
        // Get total solved count (Accepted status)
        const solvedCount = await (0, database_1.dbGet)('SELECT COUNT(DISTINCT question_id) as count FROM submissions WHERE status = "Accepted"');
        res.json({
            profile: {
                id: user.id,
                username: user.username,
                email: user.email,
                points: user.points,
                rating: user.rating,
                accuracy: user.accuracy
            },
            heatmap: JSON.parse(user.heatmaps || '{}'),
            solved: solvedCount ? solvedCount.count : 0,
            stats: submissions.map(s => ({ name: s.status, value: s.count }))
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- SERVER STARTUP ---
async function startServer() {
    await (0, database_1.initDatabase)();
    server.listen(port, () => {
        console.log(`Express API Server running on port ${port}`);
    });
}
startServer().catch((err) => {
    console.error('Failed to bootstrap server:', err);
});
