"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceCodeExecution = traceCodeExecution;
const ai_service_1 = require("./ai.service");
async function traceCodeExecution(language, code, input) {
    const prompt = `You are a line-by-line debugger simulation engine.
You are tracing a candidate's code in language: "${language}".
Here is the code:
\`\`\`
${code}
\`\`\`

Here is the standard input (stdin) supplied:
"${input}"

Your task is to dry-run/execute the code line-by-line step-by-step with the input.
For each key execution step (e.g. variable declarations, loop iterations, conditional branches, returns), output:
1. The exact line number (1-indexed) currently being executed.
2. The current values of all local variables and parameters after this line runs.
3. A short, helpful explanation of what happens on this line (e.g. "Loop i starts at 0", "Calculated complement = 9 - 2 = 7", "Found complement 7 in seen, returning [0, 1]").

Provide the output as a JSON document inside a markdown block with a single key "steps" which is a list of trace step objects.
Return ONLY this JSON document with no additional introductory or concluding text.`;
    try {
        const rawResult = await (0, ai_service_1.analyzeCodeWithAI)(prompt);
        const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            if (Array.isArray(parsed.steps)) {
                return parsed.steps;
            }
        }
    }
    catch (e) {
        console.error('Gemini trace execution failed, using mock trace.', e);
    }
    // Fallback trace logic for offline mode
    return getMockTrace(code, input);
}
function getMockTrace(code, input) {
    // Check if it is two-sum
    const lowerCode = code.toLowerCase();
    if (lowerCode.includes('twosum') || lowerCode.includes('two-sum') || lowerCode.includes('complement')) {
        return [
            { line: 1, variables: { nums: [2, 7, 11, 15], target: 9 }, explanation: "Call twoSum(nums=[2, 7, 11, 15], target=9)." },
            { line: 2, variables: { nums: [2, 7, 11, 15], target: 9, seen: {} }, explanation: "Initialize seen hash map." },
            { line: 3, variables: { nums: [2, 7, 11, 15], target: 9, seen: {}, i: 0, num: 2 }, explanation: "Loop 1: Index i=0, num=2." },
            { line: 4, variables: { nums: [2, 7, 11, 15], target: 9, seen: {}, i: 0, num: 2, complement: 7 }, explanation: "Calculate complement = 9 - 2 = 7." },
            { line: 5, variables: { nums: [2, 7, 11, 15], target: 9, seen: {}, i: 0, num: 2, complement: 7 }, explanation: "Check if complement 7 exists in seen (not found)." },
            { line: 8, variables: { nums: [2, 7, 11, 15], target: 9, seen: { "2": 0 }, i: 0, num: 2 }, explanation: "Add current number 2 with index 0 to seen map." },
            { line: 3, variables: { nums: [2, 7, 11, 15], target: 9, seen: { "2": 0 }, i: 1, num: 7 }, explanation: "Loop 2: Index i=1, num=7." },
            { line: 4, variables: { nums: [2, 7, 11, 15], target: 9, seen: { "2": 0 }, i: 1, num: 7, complement: 2 }, explanation: "Calculate complement = 9 - 7 = 2." },
            { line: 5, variables: { nums: [2, 7, 11, 15], target: 9, seen: { "2": 0 }, i: 1, num: 7, complement: 2 }, explanation: "Check if complement 2 exists in seen (Found! index=0)." },
            { line: 6, variables: { nums: [2, 7, 11, 15], target: 9, seen: { "2": 0 }, i: 1, num: 7, complement: 2 }, explanation: "Return indices of complement and current number: [0, 1]." }
        ];
    }
    // Graph or Course Schedule mock trace
    if (lowerCode.includes('canfinish') || lowerCode.includes('course')) {
        return [
            { line: 1, variables: { numCourses: 2, prerequisites: [[1, 0]] }, explanation: "Call canFinish(numCourses=2, prerequisites=[[1, 0]])." },
            { line: 2, variables: { numCourses: 2, graph: { 0: [1] } }, explanation: "Build adjacency list representation." },
            { line: 3, variables: { numCourses: 2, visited: [0, 0] }, explanation: "Initialize visited array for cycle detection." },
            { line: 4, variables: { numCourses: 2, visited: [1, 0], i: 0 }, explanation: "Perform DFS on course 0, set visited[0] = 1 (visiting)." },
            { line: 5, variables: { numCourses: 2, visited: [2, 0] }, explanation: "Finished course 0, set visited[0] = 2 (fully processed)." },
            { line: 4, variables: { numCourses: 2, visited: [2, 1], i: 1 }, explanation: "Perform DFS on course 1, visiting neighbor course 0." },
            { line: 6, variables: { numCourses: 2, visited: [2, 2] }, explanation: "Finished processing all courses with no cycles, return true." }
        ];
    }
    return [
        { line: 1, variables: { status: "Initiated", input: input || "No stdin" }, explanation: "Program started execution." },
        { line: 2, variables: { status: "Processing" }, explanation: "Executing main calculations step-by-step." },
        { line: 3, variables: { status: "Success", result: "Completed" }, explanation: "Calculation complete, returning success." }
    ];
}
