import { useEffect, useState } from 'react';
import { API_BASE_URL } from '../apiConfig';
import { 
  Award, CheckCircle2, Target, Calendar, 
  Sparkles, ArrowRight, Zap, RefreshCw, BarChart2
} from 'lucide-react';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend, Tooltip
} from 'recharts';

interface DashboardStats {
  profile: {
    username: string;
    points: number;
    rating: number;
    accuracy: number;
  };
  heatmap: Record<string, number>;
  solved: number;
  stats: { name: string; value: number }[];
}

export default function Dashboard({ onNavigate, userId }: { onNavigate: (page: string, data?: any) => void; userId?: string }) {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/dashboard/${userId || 'user_1'}`);
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
    } catch (e) {
      console.error('Failed to fetch dashboard stats, using mock.', e);
      // Premium Mock Dashboard Data
      const mockHeatmap: Record<string, number> = {};
      const now = new Date();
      for (let i = 0; i < 112; i++) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        if (Math.random() > 0.3) {
          mockHeatmap[dateStr] = Math.floor(Math.random() * 4) + 1;
        }
      }

      setData({
        profile: { username: 'Shobhit', points: 580, rating: 1680, accuracy: 81.2 },
        heatmap: mockHeatmap,
        solved: 24,
        stats: [
          { name: 'Accepted', value: 24 },
          { name: 'Wrong Answer', value: 8 },
          { name: 'Time Limit Exceeded', value: 3 },
          { name: 'Compile Error', value: 2 }
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="h-10 w-10 animate-spin text-brand-purple" />
          <p className="text-slate-400 font-medium">Crunching your performance metrics...</p>
        </div>
      </div>
    );
  }

  // Radar Chart data for skills
  const skillData = [
    { subject: 'Dynamic Programming', A: 85, fullMark: 100 },
    { subject: 'Graphs & Trees', A: 65, fullMark: 100 },
    { subject: 'Arrays & Lists', A: 95, fullMark: 100 },
    { subject: 'Strings & Maps', A: 90, fullMark: 100 },
    { subject: 'Sliding Window', A: 75, fullMark: 100 },
  ];

  // Pie chart coloring
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6'];

  // Heatmap generation
  const renderHeatmap = () => {
    const cells = [];
    const today = new Date();
    // Render last 16 weeks (112 days) to fit cleanly
    const daysToShow = 112;
    
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = data.heatmap[dateStr] || 0;
      
      let bg = 'bg-dark-900 border border-slate-800/20';
      let title = `${dateStr}: No submissions`;
      
      if (count === 1) { bg = 'bg-emerald-950 text-emerald-400'; title = `${dateStr}: 1 submission`; }
      else if (count === 2) { bg = 'bg-emerald-800 text-emerald-300'; title = `${dateStr}: 2 submissions`; }
      else if (count === 3) { bg = 'bg-emerald-600 text-emerald-200'; title = `${dateStr}: 3 submissions`; }
      else if (count >= 4) { bg = 'bg-emerald-400 text-emerald-950'; title = `${dateStr}: ${count} submissions!`; }

      cells.push(
        <div 
          key={dateStr} 
          className={`h-3 w-3 rounded-sm heatmap-cell ${bg} cursor-pointer`}
          title={title}
        />
      );
    }
    return cells;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass p-8 border border-slate-800">
        <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-violet/20 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-brand-cyan/15 blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-purple/10 border border-brand-purple/20 w-fit text-brand-accent text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> FAANG Interview Ready
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-slate-400">
              Welcome back, {data.profile.username}!
            </h1>
            <p className="text-slate-400 text-sm md:text-base max-w-xl">
              Your overall rating increased by <span className="text-emerald-400 font-semibold">+18</span> this week. Keep code submitting to sharpen your graph & DP weaknesses!
            </p>
          </div>
          <button 
            onClick={() => onNavigate('questions')} 
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white font-semibold transition-all duration-300 transform hover:scale-[1.02] shadow-lg shadow-brand-violet/25 w-fit"
          >
            Solve Questions <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Grid of stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Platform Rating', value: data.profile.rating, icon: Award, color: 'text-brand-purple bg-brand-purple/10 border-brand-purple/20', sub: 'Top 8% in platform' },
          { label: 'Points Earned', value: data.profile.points, icon: Zap, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', sub: 'Next rank at 800 XP' },
          { label: 'Problems Solved', value: data.solved, icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20', sub: '2 new solved today' },
          { label: 'Submission Accuracy', value: `${data.profile.accuracy}%`, icon: Target, color: 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/20', sub: '+2.4% last week' },
        ].map((stat, i) => (
          <div key={i} className="glass rounded-xl p-6 flex flex-col justify-between border border-slate-800/80 hover:border-slate-700/60 transition-all duration-300">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 text-sm font-medium">{stat.label}</span>
              <div className={`p-2.5 rounded-lg border ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <div className="mt-4 space-y-1">
              <h2 className="text-3xl font-extrabold tracking-tight">{stat.value}</h2>
              <p className="text-slate-500 text-xs font-medium">{stat.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Performance Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar & Pie Charts */}
        <div className="glass rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-brand-purple" />
            <h3 className="font-bold text-lg">Skill Strengths Analysis</h3>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillData}>
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#475569' }} />
                <Radar name="Proficiency" dataKey="A" stroke="#8b5cf6" fill="#7c3aed" fillOpacity={0.3} />
                <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1f2937', color: '#f1f5f9' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass rounded-2xl p-6 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <Target className="h-5 w-5 text-emerald-500" />
            <h3 className="font-bold text-lg">Submission Outcomes</h3>
          </div>
          <div className="h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.stats}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {data.stats.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#090d16', border: '1px solid #1f2937', color: '#f1f5f9' }} />
                <Legend formatter={(value) => <span className="text-slate-400 text-xs font-medium">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* GitHub-style Contribution Heatmap */}
      <div className="glass rounded-2xl p-6 border border-slate-800/80 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-brand-purple" />
            <h3 className="font-bold text-lg">Platform Submissions Heatmap</h3>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
            <span>Less</span>
            <div className="h-2.5 w-2.5 rounded-sm bg-dark-900" />
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-950" />
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-800" />
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-600" />
            <div className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            <span>More</span>
          </div>
        </div>
        <div className="overflow-x-auto pb-2">
          <div className="flex flex-wrap gap-1 min-w-[700px] justify-between">
            {renderHeatmap()}
          </div>
        </div>
        <p className="text-xs text-slate-500 font-medium">
          Note: Contribution map logs submissions over the past 16 weeks. Daily consistency raises your ranking score.
        </p>
      </div>
    </div>
  );
}
