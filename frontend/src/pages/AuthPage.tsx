import React, { useState } from 'react';
import { API_BASE_URL } from '../apiConfig';
import { 
  Zap, Lock, Mail, User, ArrowRight, Eye, EyeOff, 
  Sparkles, AlertCircle, CheckCircle2, ShieldCheck, Code2, Users, Mic
} from 'lucide-react';
import InstallAppButton from '../components/InstallAppButton';

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  points: number;
  rating: number;
  accuracy: number;
}

interface AuthPageProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Form fields
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Feedback states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        let loggedInUser: AuthUser | null = null;
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              emailOrUsername: email || username,
              password
            })
          });

          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            try {
              const data = await res.json();
              if (data && data.user) loggedInUser = data.user;
            } catch (_) {}
          }
        } catch {
          // Server offline / Vercel static hosting fallback
        }

        // If server didn't handle it, use LocalStorage User DB
        if (!loggedInUser) {
          const rawUsers = localStorage.getItem('codeai_users_db');
          const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];
          const query = (email || username).trim().toLowerCase();
          const found = users.find(
            u => (u.username?.toLowerCase() === query || u.email?.toLowerCase() === query) && u.password === password
          );

          if (found) {
            loggedInUser = {
              id: found.id,
              username: found.username,
              email: found.email,
              points: found.points || 100,
              rating: found.rating || 1200,
              accuracy: found.accuracy || 100.0
            };
          } else if (
            (query === 'shobhit' || query === 'shobhit@example.com') &&
            password === 'password123'
          ) {
            loggedInUser = {
              id: 'user_1',
              username: 'Shobhit',
              email: 'shobhit@example.com',
              points: 625,
              rating: 1747,
              accuracy: 78.4
            };
          } else {
            throw new Error('Invalid username/email or password. Please try again.');
          }
        }

        setSuccessMsg('Login successful! Redirecting...');
        setTimeout(() => {
          onLoginSuccess(loggedInUser!);
        }, 500);

      } else {
        // SIGN UP
        let signedUpUser: AuthUser | null = null;
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              username: username.trim(),
              email: email.trim(),
              password
            })
          });

          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            try {
              const data = await res.json();
              if (data && data.user) signedUpUser = data.user;
            } catch (_) {}
          } else if (!res.ok && contentType.includes('application/json')) {
            try {
              const errData = await res.json();
              if (errData && errData.error) throw new Error(errData.error);
            } catch (err: any) {
              if (err.message && !err.message.includes('JSON')) throw err;
            }
          }
        } catch (fetchErr: any) {
          if (fetchErr.message && !fetchErr.message.includes('fetch') && !fetchErr.message.includes('JSON')) {
            throw fetchErr;
          }
          // Server offline / Vercel static hosting fallback
        }

        // If server was offline or static Vercel, store locally
        if (!signedUpUser) {
          const rawUsers = localStorage.getItem('codeai_users_db');
          const users: any[] = rawUsers ? JSON.parse(rawUsers) : [];
          const existing = users.find(
            u => u.username?.toLowerCase() === username.trim().toLowerCase() ||
                 u.email?.toLowerCase() === email.trim().toLowerCase()
          );
          if (existing) {
            throw new Error('An account with this email or username already exists');
          }

          signedUpUser = {
            id: 'user_' + Math.random().toString(36).substring(2, 9),
            username: username.trim(),
            email: email.trim(),
            points: 100,
            rating: 1200,
            accuracy: 100.0
          };

          // Save to local storage DB
          users.push({ ...signedUpUser, password });
          localStorage.setItem('codeai_users_db', JSON.stringify(users));
        }

        setSuccessMsg('Account created successfully! Welcome to CodeAI.');
        setTimeout(() => {
          onLoginSuccess(signedUpUser!);
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Login for evaluators & quick testing
  const handleDemoLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: 'Shobhit',
          password: 'password123'
        })
      });

      const data = await res.json();
      if (res.ok && data.user) {
        onLoginSuccess(data.user);
      } else {
        // Fallback demo user
        onLoginSuccess({
          id: 'user_1',
          username: 'Shobhit',
          email: 'shobhit@example.com',
          points: 625,
          rating: 1747,
          accuracy: 78.4
        });
      }
    } catch {
      onLoginSuccess({
        id: 'user_1',
        username: 'Shobhit',
        email: 'shobhit@example.com',
        points: 625,
        rating: 1747,
        accuracy: 78.4
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      
      {/* Background ambient decorative glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-brand-violet/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-brand-indigo/15 rounded-full blur-[130px] pointer-events-none" />
      
      <div className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center z-10">
        
        {/* Left Side: Brand Teaser & Highlights */}
        <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
          
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-purple/10 border border-brand-purple/20 text-brand-accent text-xs font-bold tracking-wide animate-fade-in">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen FAANG Interview Prep
          </div>

          <div className="flex items-center justify-center lg:justify-start gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-brand-violet to-brand-indigo flex items-center justify-center shadow-xl shadow-brand-violet/30">
              <Zap className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-white glow-text">CodeAI</h1>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Autonomous Interview Studio</span>
            </div>
          </div>

          <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto lg:mx-0">
            Practice real-time technical interviews with an autonomous speech AI, collaborate with peers on synchronized boards, and master high-level system design.
          </p>

          {/* Features Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            {[
              { icon: Mic, title: 'AI Voice Mock', desc: 'Real-time spoken tech rounds' },
              { icon: Users, title: 'Collab Rooms', desc: 'Live multi-cursor sync + audio' },
              { icon: Code2, title: 'Sandboxed Code', desc: 'Instant compile & Big-O audits' },
            ].map((f, i) => (
              <div key={i} className="glass p-3.5 rounded-2xl border border-slate-800/80 text-left space-y-1 bg-dark-900/40">
                <f.icon className="h-5 w-5 text-brand-accent mb-1" />
                <h4 className="text-xs font-bold text-slate-200">{f.title}</h4>
                <p className="text-[10px] text-slate-500 leading-snug">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Trust badge */}
          <div className="flex items-center justify-center lg:justify-start gap-2 text-xs text-slate-500 pt-1">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>Secure account storage & persistent problem streaks</span>
          </div>

        </div>

        {/* Right Side: Auth Form Card */}
        <div className="lg:col-span-6 w-full max-w-md mx-auto">
          <div className="glass p-8 rounded-3xl border border-slate-800 shadow-2xl bg-dark-900/70 backdrop-blur-xl space-y-6">
            
            {/* Tab Switcher: Sign In vs Sign Up */}
            <div className="flex p-1 bg-dark-950/80 rounded-xl border border-slate-850">
              <button
                type="button"
                onClick={() => { setIsLogin(true); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  isLogin 
                    ? 'bg-gradient-to-r from-brand-violet to-brand-indigo text-white shadow-md shadow-brand-violet/25' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsLogin(false); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
                  !isLogin 
                    ? 'bg-gradient-to-r from-brand-violet to-brand-indigo text-white shadow-md shadow-brand-violet/25' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Title / Description */}
            <div>
              <h2 className="text-xl font-black text-white">
                {isLogin ? 'Welcome Back!' : 'Join CodeAI Today'}
              </h2>
              <p className="text-slate-400 text-xs mt-1">
                {isLogin 
                  ? 'Sign in to access your interview dashboard & stats.' 
                  : 'Start practicing with voice AI interviewers in seconds.'}
              </p>
            </div>

            {/* Error / Success Alert Banners */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-400 text-xs font-semibold animate-shake">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {successMsg && (
              <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-xl text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Username (Always in Sign-up, or optional in Sign-in) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Username</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. shobhit26"
                      className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-200 font-semibold transition placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* Email / Username field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  {isLogin ? 'Email or Username' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={isLogin ? 'text' : 'email'}
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={isLogin ? 'shobhit@example.com or Shobhit' : 'you@example.com'}
                    className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-200 font-semibold transition placeholder:text-slate-600"
                  />
                </div>
              </div>

              {/* Password field */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 bg-dark-950 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-200 font-semibold transition placeholder:text-slate-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-300 transition"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password (Sign-up only) */}
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      className="w-full pl-10 pr-4 py-2.5 bg-dark-950 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-200 font-semibold transition placeholder:text-slate-600"
                    />
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white font-bold text-xs uppercase tracking-wider transition transform hover:scale-[1.01] shadow-lg shadow-brand-violet/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span>Processing...</span>
                ) : (
                  <>
                    <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Login Option */}
            <div className="pt-2 border-t border-slate-850 space-y-3">
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-slate-500">
                <span className="bg-dark-900 px-2 -mt-4">Or Quick Access</span>
              </div>

              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-dark-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-bold transition group"
              >
                <Zap className="h-3.5 w-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Continue as Demo User (Shobhit)</span>
              </button>

              <InstallAppButton />
            </div>

          </div>
        </div>

      </div>

    </div>
  );
}
