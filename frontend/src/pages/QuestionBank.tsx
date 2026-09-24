import { useEffect, useState } from 'react';
import { 
  Search, BookOpen, ChevronRight, 
  Tag, Mic, RefreshCw
} from 'lucide-react';

interface Question {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
  companies: string[];
}

export default function QuestionBank({ 
  onSolve, onAIInterview 
}: { 
  onSolve: (id: string) => void;
  onAIInterview: (id: string) => void;
}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('All');
  const [selectedTag, setSelectedTag] = useState<string>('All');
  const [selectedCompany, setSelectedCompany] = useState<string>('All');

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://localhost:5000/api/questions');
      if (res.ok) {
        const list = await res.json();
        setQuestions(list);
      }
    } catch (e) {
      console.error('Failed to fetch questions, running Mock.', e);
      setQuestions([
        { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy', tags: ['Array', 'Hash Table'], companies: ['Google', 'Amazon', 'Microsoft'] },
        { id: 'longest-palindromic-substring', title: 'Longest Palindromic Substring', difficulty: 'Medium', tags: ['String', 'Dynamic Programming'], companies: ['Amazon', 'Microsoft'] },
        { id: 'course-schedule', title: 'Course Schedule', difficulty: 'Medium', tags: ['Graph', 'DFS', 'BFS'], companies: ['Google'] },
        { id: 'edit-distance', title: 'Edit Distance', difficulty: 'Hard', tags: ['String', 'Dynamic Programming'], companies: ['Google', 'Amazon', 'Microsoft'] },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // Filter unique lists
  const allTags = ['All', ...Array.from(new Set(questions.flatMap(q => q.tags)))];
  const allCompanies = ['All', ...Array.from(new Set(questions.flatMap(q => q.companies)))];

  const filteredQuestions = questions.filter(q => {
    const matchesSearch = q.title.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    const matchesTag = selectedTag === 'All' || q.tags.includes(selectedTag);
    const matchesCompany = selectedCompany === 'All' || q.companies.includes(selectedCompany);
    return matchesSearch && matchesDifficulty && matchesTag && matchesCompany;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Coding Question Bank</h1>
          <p className="text-slate-400 text-sm mt-1">Practice coding patterns curated directly from top company interviews.</p>
        </div>
      </div>

      {/* Searching and Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search problems by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none text-slate-200 text-sm font-medium transition-all duration-200"
          />
        </div>

        {/* Difficulty */}
        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value)}
          className="px-4 py-3 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none text-slate-400 text-sm font-semibold transition-all duration-200"
        >
          <option value="All">All Difficulties</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>

        {/* Companies */}
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="px-4 py-3 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple focus:ring-1 focus:ring-brand-purple outline-none text-slate-400 text-sm font-semibold transition-all duration-200"
        >
          <option value="All">All Companies</option>
          {allCompanies.filter(c => c !== 'All').map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Tags selector bubbles */}
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-slate-500 text-xs font-semibold mr-1 flex items-center gap-1">
          <Tag className="h-3.5 w-3.5" /> Tags:
        </span>
        {allTags.map(tag => {
          const isActive = selectedTag === tag;
          return (
            <button
              key={tag}
              onClick={() => setSelectedTag(tag)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-purple/20 text-brand-accent border-brand-purple/50' 
                  : 'bg-dark-900/60 text-slate-400 border-slate-850 hover:border-slate-700/60 hover:text-slate-200'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <RefreshCw className="h-8 w-8 animate-spin text-brand-purple" />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuestions.length === 0 ? (
            <div className="glass rounded-xl p-12 text-center border border-slate-850">
              <BookOpen className="h-12 w-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold">No Questions Match Filters</h3>
              <p className="text-slate-400 text-sm mt-1">Try resetting search string or tag conditions.</p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const diffColors = {
                Easy: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
                Medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
                Hard: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
              };

              return (
                <div 
                  key={q.id}
                  className="glass p-5 rounded-xl border border-slate-800/80 hover:border-slate-700/60 hover:bg-slate-900/20 transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${diffColors[q.difficulty]}`}>
                        {q.difficulty}
                      </span>
                      <h3 className="font-extrabold text-slate-100 hover:text-brand-accent transition-colors cursor-pointer" onClick={() => onSolve(q.id)}>
                        {q.title}
                      </h3>
                    </div>

                    <div className="flex flex-wrap gap-1.5 items-center">
                      {q.tags.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded bg-dark-900 text-slate-400 border border-slate-850 text-[10px] font-medium uppercase tracking-wider">
                          {t}
                        </span>
                      ))}
                      {q.companies.map(c => (
                        <span key={c} className="px-2 py-0.5 rounded bg-brand-indigo/10 text-brand-accent border border-brand-indigo/20 text-[10px] font-medium">
                          🏢 {c}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAIInterview(q.id)}
                      className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-brand-accent border border-indigo-500/30 transition-all duration-300"
                      title="Launch AI Voice Mock interview session for this question!"
                    >
                      <Mic className="h-3.5 w-3.5 animate-pulse" /> AI Interview
                    </button>
                    
                    <button
                      onClick={() => onSolve(q.id)}
                      className="flex items-center gap-1 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white transition-all duration-300"
                    >
                      Solve <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
