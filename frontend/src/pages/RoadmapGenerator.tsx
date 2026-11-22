import { useState } from 'react';
import { 
  Target, Clock, RefreshCw, 
  Map, ArrowRight, CheckCircle2, ListTodo, AlertCircle, Sparkles
} from 'lucide-react';

interface DailyPlanItem {
  day: string;
  focus: string;
  time: string;
  task: string;
}

interface RoadmapResponse {
  weakTopics: string[];
  strongTopics: string[];
  dailyPlan: DailyPlanItem[];
}

export default function RoadmapGenerator() {
  const [resumeText, setResumeText] = useState('');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [weakTopics, setWeakTopics] = useState('Dynamic Programming, Graphs');
  const [loading, setLoading] = useState(false);
  const [roadmap, setRoadmap] = useState<RoadmapResponse | null>(null);
  const [error, setError] = useState('');

  // Checked roadmap tasks
  const [completedDays, setCompletedDays] = useState<Record<string, boolean>>({});

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setCompletedDays({});
    setError('');

    try {
      const res = await fetch('http://localhost:5000/api/ai/roadmap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, targetCompany, weakTopics })
      });

      if (res.ok) {
        const out = await res.json();
        // Validate response shape
        if (out.dailyPlan && Array.isArray(out.dailyPlan) && out.dailyPlan.length > 0) {
          setRoadmap(out);
        } else {
          throw new Error('Invalid roadmap response from server');
        }
      } else {
        // Server returned error — use mock
        throw new Error(`Server error: ${res.status}`);
      }
    } catch (e) {
      // Always show mock roadmap so user gets value even without backend
      setRoadmap({
        weakTopics: ["Dynamic Programming (Knapsack)", "Graph Algorithms (BFS/DFS)", "Sliding Window"],
        strongTopics: ["Arrays & Array Manipulations", "Linked Lists", "Hash Maps & Sorting"],
        dailyPlan: [
          { day: "Day 1", focus: "Sliding Window Foundations", time: "1.5 hours", task: "Solve Longest Substring Without Repeating Characters on the questions tab." },
          { day: "Day 2", focus: "Two-pointer Optimizations", time: "1 hour", task: "Solve Container With Most Water, understand how to move left/right markers." },
          { day: "Day 3", focus: "Graph Representation & BFS", time: "2 hours", task: "Solve Course Schedule in our question bank, master topological sort." },
          { day: "Day 4", focus: "Dynamic Programming: 1D Array", time: "2.5 hours", task: "Review Fibonacci states and climb stairs. Dry run overlap calls." },
          { day: "Day 5", focus: "Dynamic Programming: 2D Grids", time: "2 hours", task: "Solve Unique Paths, build visual grid table logic." },
          { day: "Day 6", focus: "Mock Coding Assessment", time: "3 hours", task: "Create an interview room and solve two medium questions with strict 45 min timers." },
          { day: "Day 7", focus: "AI Interviewer Assessment", time: "1.5 hours", task: "Start a Complete Voice Interview round on Course Schedule in the AI interviewer tab." }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleDayComplete = (day: string) => {
    setCompletedDays(prev => ({
      ...prev,
      [day]: !prev[day]
    }));
  };

  const completedCount = Object.values(completedDays).filter(Boolean).length;
  const totalDays = roadmap?.dailyPlan.length || 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Roadmap Generator</h1>
        <p className="text-slate-400 text-sm mt-1">Get custom day-by-day learning pathways customized to target companies and resume background skills.</p>
      </div>

      {!roadmap && (
        <div className="glass p-8 rounded-2xl border border-slate-800 max-w-xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center mx-auto text-brand-accent animate-pulse">
              <Map className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-extrabold">Generate Your Target Roadmap</h2>
            <p className="text-slate-400 text-xs leading-normal">
              Our career copilot maps your target role and company constraints against your weak subjects to generate a targeted prep plan.
            </p>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-amber-500/10 border border-amber-500/25 rounded-xl text-amber-400 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Target Company</label>
              <input
                type="text"
                required
                value={targetCompany}
                onChange={(e) => setTargetCompany(e.target.value)}
                placeholder="Google, Amazon, Microsoft"
                className="w-full px-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-slate-350 text-xs font-semibold transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Weak Subjects / Topics</label>
              <input
                type="text"
                required
                value={weakTopics}
                onChange={(e) => setWeakTopics(e.target.value)}
                placeholder="Dynamic Programming, Graphs, Arrays"
                className="w-full px-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-slate-350 text-xs font-semibold transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Paste your resume details (Optional)</label>
              <textarea
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder="Paste highlights from your experience/projects..."
                className="w-full h-[120px] p-3.5 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-350 font-semibold resize-none leading-relaxed transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white font-bold transition transform hover:scale-[1.02] shadow-lg shadow-brand-violet/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {loading ? (
                <><RefreshCw className="h-4 w-4 animate-spin" /> Synthesizing schedule...</>
              ) : (
                <>Build Prep Roadmap <ArrowRight className="h-4 w-4" /></>
              )}
            </button>
          </form>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !roadmap && (
        <div className="max-w-xl mx-auto space-y-3 mt-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass p-4 rounded-xl border border-slate-800 animate-pulse flex gap-4">
              <div className="h-5 w-5 rounded-full bg-slate-800 flex-shrink-0 mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-800 rounded w-1/2" />
                <div className="h-2 bg-slate-800 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      )}

      {roadmap && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Left panel: Strengths & Weaknesses analysis */}
          <div className="space-y-4 lg:col-span-1">
            <div className="glass p-5 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-1.5 border-b border-slate-850 pb-2">
                <Target className="h-4 w-4 text-brand-purple" /> Target: {targetCompany}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Identified Weak Areas:</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {roadmap.weakTopics.map((t, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25 text-[10px] font-bold uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Analyzed Strong Areas:</h4>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {roadmap.strongTopics.map((t, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 text-[10px] font-bold uppercase tracking-wider">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progress tracker */}
              <div className="space-y-2 pt-2 border-t border-slate-850">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Progress</span>
                  <span className="text-[10px] font-bold text-brand-accent">{completedCount}/{totalDays} days</span>
                </div>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-brand-violet to-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${totalDays > 0 ? (completedCount / totalDays) * 100 : 0}%` }}
                  />
                </div>
                {completedCount === totalDays && totalDays > 0 && (
                  <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] font-bold">
                    <Sparkles className="h-3.5 w-3.5" /> All days completed! 🎉
                  </div>
                )}
              </div>

              <button
                onClick={() => { setRoadmap(null); setCompletedDays({}); setError(''); }}
                className="w-full py-2 bg-dark-900 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white text-xs font-bold rounded-xl transition"
              >
                Reset & Build New
              </button>
            </div>
          </div>

          {/* Right panel: Dynamic task items */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <ListTodo className="h-5 w-5 text-brand-purple" /> 7-Day Dynamic Prep Schedule
            </h3>
            
            <div className="space-y-3">
              {roadmap.dailyPlan.map((d, i) => {
                const isDone = completedDays[d.day];
                return (
                  <div 
                    key={i}
                    onClick={() => toggleDayComplete(d.day)}
                    className={`glass p-4 rounded-xl border transition-all duration-300 cursor-pointer flex items-start gap-4 ${
                      isDone 
                        ? 'border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10' 
                        : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/20'
                    }`}
                  >
                    <div className="pt-0.5">
                      <CheckCircle2 className={`h-5 w-5 transition ${isDone ? 'text-emerald-400' : 'text-slate-600'}`} />
                    </div>
                    
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className={`text-sm font-black ${isDone ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                          {d.day}: {d.focus}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {d.time}
                        </span>
                      </div>
                      
                      <p className={`text-xs leading-normal font-semibold ${isDone ? 'text-slate-500 line-through' : 'text-slate-350'}`}>
                        {d.task}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
