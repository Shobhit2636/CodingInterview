import React, { useEffect, useState, useRef } from 'react';
import { 
  Mic, MicOff, RefreshCw, Award, 
  Sparkles, Smile, ArrowRight, AlertCircle
} from 'lucide-react';

interface BehavioralTurn {
  question: string;
  answer?: string;
  feedback?: string;
  score?: number;
}

export default function BehavioralMock() {
  const [sessionActive, setSessionActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState("Let's get started. Could you please introduce yourself and walk me through your background and key engineering achievements?");
  const [userAnswer, setUserAnswer] = useState('');
  const [turns, setTurns] = useState<BehavioralTurn[]>([]);
  const [loading, setLoading] = useState(false);

  // Voice States
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const [reportCard, setReportCard] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => setRecognitionActive(true);
      rec.onresult = (event: any) => {
        let interim = '';
        let final = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        setUserAnswer(final || interim);
      };
      rec.onerror = () => setRecognitionActive(false);
      rec.onend = () => setRecognitionActive(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (recognitionActive) recognitionRef.current.stop();
    else {
      setUserAnswer('');
      recognitionRef.current.start();
    }
  };

  const handleStart = () => {
    setSessionActive(true);
    setTurns([]);
    setReportCard(null);
    setCurrentQuestion("Let's get started. Could you please introduce yourself and walk me through your background and key engineering achievements?");
  };

  const submitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim()) return;

    if (recognitionRef.current && recognitionActive) {
      recognitionRef.current.stop();
    }

    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/behavioral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: turns.map(t => ({ question: t.question, answer: t.answer })),
          userReply: userAnswer.trim()
        })
      });

      if (res.ok) {
        const out = await res.json();
        
        // Save current turn
        const newTurn: BehavioralTurn = {
          question: currentQuestion,
          answer: userAnswer.trim(),
          feedback: out.feedback,
          score: out.rating
        };

        const updatedTurns = [...turns, newTurn];
        setTurns(updatedTurns);
        setUserAnswer('');

        if (updatedTurns.length >= 3) {
          try {
            const reportRes = await fetch('http://localhost:5000/api/ai/behavioral/report', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ turns: updatedTurns })
            });
            if (reportRes.ok) {
              const finalReport = await reportRes.json();
              setReportCard(finalReport);
            } else {
              throw new Error('Failed to generate report');
            }
          } catch (err) {
            console.error('Failed to get real report:', err);
            const avgScore = Math.floor(updatedTurns.reduce((acc, t) => acc + (t.score || 80), 0) / updatedTurns.length);
            setReportCard({
              score: avgScore,
              summary: "Your verbal pacing is well-suited. You successfully utilize collaborative terms. Suggestion: Structure your conflict resolution answers to contrast the initial challenge against the compromises you implemented. (Offline Fallback)",
              turns: updatedTurns
            });
          }
          setSessionActive(false);
        } else {
          setCurrentQuestion(out.question);
        }
      }
    } catch (e) {
      // Mock Turn fallback
      const mockTurn: BehavioralTurn = {
        question: currentQuestion,
        answer: userAnswer.trim(),
        feedback: "Your phrasing structured standard achievements well. Consider quantifying outcomes using concrete percentage numbers (e.g. 'boosted speeds by 24%').",
        score: 85
      };
      const updated = [...turns, mockTurn];
      setTurns(updated);
      setUserAnswer('');

      if (updated.length >= 3) {
        try {
          const reportRes = await fetch('http://localhost:5000/api/ai/behavioral/report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ turns: updated })
          });
          if (reportRes.ok) {
            const finalReport = await reportRes.json();
            setReportCard(finalReport);
          } else {
            throw new Error('Failed to generate report');
          }
        } catch (err) {
          setReportCard({
            score: 85,
            summary: "Good STAR framework utilization. Your communication is professional and clear. Quantify results extra to push scores above 90%! (Offline Fallback)",
            turns: updated
          });
        }
        setSessionActive(false);
      } else {
        setCurrentQuestion("Excellent. Tell me about a time you had to resolve a high-stress conflict inside an engineering team. What actions did you take?");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Mock Behavioral Round</h1>
        <p className="text-slate-400 text-sm mt-1">Conquer mock manager rounds focusing on leadership, conflict compromises, and team goals.</p>
      </div>

      {!sessionActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Landing details */}
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-4 lg:col-span-1">
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Smile className="h-5 w-5 text-brand-purple" /> Behavioral Prep
            </h3>
            <p className="text-slate-400 text-xs leading-normal">
              Manager rounds evaluate your culture alignment and decision choices under high-pressure scenarios. We analyze structures using the **STAR Method**.
            </p>
            
            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white font-bold transition transform hover:scale-[1.02] shadow-lg shadow-brand-violet/20"
            >
              Start Behavioral Assessment <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Report summary if available */}
          {reportCard ? (
            <div className="lg:col-span-2 glass p-6 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-purple/20">
                  <h3 className="text-lg font-black flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-brand-purple" /> Leadership Audit Report
                  </h3>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase font-bold text-brand-accent bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20">
                      Overall Rating
                    </span>
                    <span className="text-lg font-black text-brand-accent">{reportCard.score}%</span>
                  </div>
                </div>

                <div className="p-4 bg-dark-900 border border-slate-850 rounded-xl text-slate-350 text-xs leading-relaxed font-semibold">
                  {reportCard.summary}
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">STAR Round turns audit:</h4>
                  {reportCard.turns.map((t: any, i: number) => (
                    <div key={i} className="glass p-4 rounded-xl border border-slate-850 space-y-2">
                      <p className="text-slate-400 text-xs font-bold">Q{i+1}: {t.question}</p>
                      <p className="text-slate-300 text-xs italic font-semibold">" {t.answer} "</p>
                      <div className="text-[10px] text-brand-accent leading-normal font-semibold border-t border-slate-850/50 pt-2 flex items-start gap-1">
                        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 text-brand-purple mt-0.5" />
                        <span>{t.feedback}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 glass p-8 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-3">
              <Award className="h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-bold">Behavioral History Empty</h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Begin a session to walk through three core manager prompts. Real-time feedback reports will appear here.
              </p>
            </div>
          )}
        </div>
      )}

      {sessionActive && (
        <div className="glass p-6 rounded-2xl border border-slate-800 space-y-6 max-w-2xl mx-auto animate-fade-in">
          {/* Top session count */}
          <div className="flex items-center justify-between border-b border-slate-850 pb-3">
            <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20 uppercase tracking-widest">
              Prompt {turns.length + 1} of 3
            </span>
            <span className="text-xs text-slate-500 font-semibold uppercase">Manager Round</span>
          </div>

          <div className="p-4 bg-dark-900 border border-slate-850 rounded-xl text-slate-300 text-sm font-semibold leading-relaxed">
            {currentQuestion}
          </div>

          <form onSubmit={submitAnswer} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Your verbal response</label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Talk or type down your leadership or conflict answer using situation-action-results..."
                className="w-full h-[150px] p-4 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-300 font-semibold resize-none leading-relaxed transition"
                required
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              {speechSupported ? (
                <button
                  type="button"
                  onClick={toggleVoice}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    recognitionActive
                      ? 'bg-rose-500/10 border-rose-500/35 text-rose-400 animate-pulse'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {recognitionActive ? (
                    <>
                      <MicOff className="h-3.5 w-3.5" /> Stop transcribing voice
                    </>
                  ) : (
                    <>
                      <Mic className="h-3.5 w-3.5 animate-pulse" /> Speak verbal answer
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold italic">Speak capability unavailable.</span>
              )}

              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2 bg-brand-purple hover:bg-brand-violet text-white text-xs font-extrabold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : 'Submit Answer'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
