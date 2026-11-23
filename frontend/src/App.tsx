import { useState } from 'react';
import { 
  LayoutDashboard, BookOpen, Users, Mic, Smile, 
  Map, Award, Zap, Database, LogOut
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import QuestionBank from './pages/QuestionBank';
import CodingWorkspace from './pages/CodingWorkspace';
import CollabRoom from './pages/CollabRoom';
import AIInterviewer from './pages/AIInterviewer';
import BehavioralMock from './pages/BehavioralMock';
import RoadmapGenerator from './pages/RoadmapGenerator';
import SystemDesignRound from './pages/SystemDesignRound';
import AuthPage, { AuthUser } from './pages/AuthPage';
import InstallAppButton from './components/InstallAppButton';

type Page = 'dashboard' | 'questions' | 'coding' | 'collab' | 'interview' | 'behavioral' | 'roadmap' | 'systemdesign';

export default function App() {
  // Authentication State
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('codeai_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [activePage, setActivePage] = useState<Page>('dashboard');
  const [selectedQuestionId, setSelectedQuestionId] = useState<string>('two-sum');

  const handleLoginSuccess = (authUser: AuthUser) => {
    setUser(authUser);
    localStorage.setItem('codeai_user', JSON.stringify(authUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('codeai_user');
    setActivePage('dashboard');
  };

  // Trigger solve coding page
  const handleSolveQuestion = (qId: string) => {
    setSelectedQuestionId(qId);
    setActivePage('coding');
  };

  // Trigger direct mock voice interview from questions tab
  const handleStartAIInterview = (qId: string) => {
    setSelectedQuestionId(qId);
    setActivePage('interview');
  };

  // If user is not authenticated, render Login & Sign-Up Screen
  if (!user) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Navigations switcher
  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard onNavigate={(page) => setActivePage(page as Page)} userId={user.id} />;
      case 'questions':
        return (
          <QuestionBank 
            onSolve={handleSolveQuestion} 
            onAIInterview={handleStartAIInterview} 
          />
        );
      case 'coding':
        return (
          <CodingWorkspace 
            questionId={selectedQuestionId} 
            onBack={() => setActivePage('questions')} 
            userId={user.id}
          />
        );
      case 'collab':
        return <CollabRoom defaultUsername={user.username} />;
      case 'interview':
        return <AIInterviewer />;
      case 'behavioral':
        return <BehavioralMock />;
      case 'roadmap':
        return <RoadmapGenerator />;
      case 'systemdesign':
        return <SystemDesignRound />;
      default:
        return <Dashboard onNavigate={(page) => setActivePage(page as Page)} userId={user.id} />;
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'questions', label: 'Question Bank', icon: BookOpen },
    { id: 'collab', label: 'Collab Interview', icon: Users },
    { id: 'interview', label: 'AI Voice Interview', icon: Mic },
    { id: 'systemdesign', label: 'System Design', icon: Database },
    { id: 'behavioral', label: 'Behavioral Mock', icon: Smile },
    { id: 'roadmap', label: 'Career Roadmap', icon: Map },
  ];

  const userInitials = (user.username ? user.username.slice(0, 2) : 'US').toUpperCase();

  return (
    <div className="flex h-screen overflow-hidden bg-dark-950 font-sans text-slate-200">
      
      {/* SIDEBAR NAVIGATION LAYOUT */}
      <aside className="w-64 bg-dark-900 border-r border-slate-800 flex flex-col justify-between hidden md:flex">
        
        {/* LOGO DECK */}
        <div className="space-y-6 p-6">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-violet to-brand-indigo flex items-center justify-center shadow-lg shadow-brand-violet/25">
              <Zap className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight text-white glow-text">CodeAI</h2>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest leading-none">FAANG Prep Playground</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 pt-4">
            {navItems.map((item) => {
              const isActive = activePage === item.id || (item.id === 'questions' && activePage === 'coding');
              return (
                <button
                  key={item.id}
                  onClick={() => setActivePage(item.id as Page)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-wider border transition-all duration-300 ${
                    isActive 
                      ? 'bg-brand-purple/10 border-brand-purple/35 text-brand-accent shadow-md shadow-brand-purple/5'
                      : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <item.icon className="h-4.5 w-4.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* INSTALL APP PROMPT */}
        <div className="px-5 pb-2">
          <InstallAppButton />
        </div>

        {/* PROFILE OVERVIEW CARD */}
        <div className="p-4 border-t border-slate-850 bg-dark-900/60 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-9 w-9 rounded-full bg-brand-purple/20 border border-brand-purple/35 flex items-center justify-center text-xs font-bold text-brand-accent uppercase flex-shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-200 leading-normal truncate">{user.username}</h3>
                <span className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1">
                  <Award className="h-3 w-3 text-amber-500 flex-shrink-0" /> Rating: {user.rating || 1200}
                </span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition flex-shrink-0"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* MOBILE HEADER FOR RESPONSIVENESS */}
      <div className="flex flex-col flex-1 h-full overflow-hidden">
        
        <header className="h-16 border-b border-slate-800 bg-dark-900 flex items-center justify-between px-4 md:hidden gap-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-brand-purple/10 flex items-center justify-center">
              <Zap className="h-4 w-4 text-brand-accent" />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider hidden sm:block">CodeAI</h2>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto py-1">
            <InstallAppButton className="!py-1.5 !px-2.5 !text-[10px]" />
            <div className="flex gap-1">
              {navItems.map(item => (
                <button 
                  key={item.id}
                  onClick={() => setActivePage(item.id as Page)}
                  className={`p-2 rounded-lg border ${
                    activePage === item.id ? 'bg-brand-purple/10 border-brand-purple/35 text-brand-accent' : 'bg-transparent border-transparent text-slate-400'
                  }`}
                  title={item.label}
                >
                  <item.icon className="h-4 w-4" />
                </button>
              ))}
            </div>

            <button
              onClick={handleLogout}
              className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition"
              title="Log Out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* MAIN VIEWPANE GRID */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-dark-950">
          {renderActivePage()}
        </main>
      </div>

    </div>
  );
}
