import React, { useEffect, useState, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../apiConfig';
import { 
  Mic, MicOff, RefreshCw, Award, 
  Sparkles, Smile, ArrowRight, AlertCircle, Send
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
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  const [reportCard, setReportCard] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);
  const aiSpeakingRef = useRef(false);
  const answerEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { aiSpeakingRef.current = aiSpeaking; }, [aiSpeaking]);

  // Auto-scroll to bottom of history
  useEffect(() => {
    answerEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, currentQuestion]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || aiSpeakingRef.current) return;
    try { recognitionRef.current.abort(); } catch (_) {}
    setTimeout(() => {
      if (!aiSpeakingRef.current) {
        try { recognitionRef.current?.start(); } catch (_) {}
      }
    }, 200);
  }, []);

  const speakTTS = useCallback((text: string, onComplete?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onComplete?.();
      return;
    }

    // Stop mic while AI speaks
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setRecognitionActive(false);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    utterance.onstart = () => setAiSpeaking(true);
    utterance.onend = () => {
      setAiSpeaking(false);
      onComplete?.();
    };
    utterance.onerror = () => {
      setAiSpeaking(false);
      onComplete?.();
    };

    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft')))
        || voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
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
        setUserAnswer(prev => final ? prev + final : prev + interim);
      };
      rec.onerror = () => setRecognitionActive(false);
      rec.onend = () => setRecognitionActive(false);
      recognitionRef.current = rec;
    }
  }, []);

  const toggleVoice = () => {
    if (!recognitionRef.current || aiSpeakingRef.current) return;
    if (recognitionActive) {
      try { recognitionRef.current.stop(); } catch (_) {}
    } else {
      try {
        recognitionRef.current.start();
      } catch (_) {
        try {
          recognitionRef.current.abort();
          setTimeout(() => { try { recognitionRef.current.start(); } catch (__) {} }, 200);
        } catch (__) {}
      }
    }
  };

  const handleStart = () => {
    setSessionActive(true);
    setTurns([]);
    setReportCard(null);
    setUserAnswer('');
    const openingQ = "Let's get started. Could you please introduce yourself and walk me through your background and key engineering achievements?";
    setCurrentQuestion(openingQ);
    speakTTS(openingQ, () => startListening());
  };

  const finishSession = async (finalTurns: BehavioralTurn[]) => {
    try {
      const reportRes = await fetch(`${API_BASE_URL}/api/ai/behavioral/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ turns: finalTurns })
      });
      if (reportRes.ok) {
        const finalReport = await reportRes.json();
        setReportCard(finalReport);
      } else {
        throw new Error('report failed');
      }
    } catch {
      const avgScore = Math.floor(finalTurns.reduce((acc, t) => acc + (t.score || 80), 0) / finalTurns.length);
      setReportCard({
        score: avgScore,
        summary: "Your verbal pacing is well-suited. You successfully utilize collaborative terms. Suggestion: Structure your conflict resolution answers to contrast the initial challenge against the compromises you implemented.",
        turns: finalTurns
      });
    }
    setSessionActive(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const submitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userAnswer.trim() || loading) return;

    if (recognitionRef.current && recognitionActive) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/behavioral`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          history: turns.map(t => ({ question: t.question, answer: t.answer })),
          userReply: userAnswer.trim()
        })
      });

      if (res.ok) {
        const out = await res.json();
        
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
          await finishSession(updatedTurns);
        } else {
          setCurrentQuestion(out.question);
          speakTTS(out.question, () => startListening());
        }
      } else {
        throw new Error('API error');
      }
    } catch (e) {
      const fallbackQuestions = [
        "Tell me about a time you had to resolve a high-stress conflict inside an engineering team. What actions did you take?",
        "Describe a situation where you had to deliver a project under a very tight deadline. How did you manage the pressure and prioritize tasks?"
      ];

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
        await finishSession(updated);
      } else {
        const nextQ = fallbackQuestions[updated.length - 1] || "Tell me about a time you had a significant impact on a team or product outcome.";
        setCurrentQuestion(nextQ);
        speakTTS(nextQ, () => startListening());
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
              Manager rounds evaluate your culture alignment and decision choices under high-pressure scenarios. We analyze structures using the <strong>STAR Method</strong>.
            </p>

            <div className="p-3 bg-dark-900 border border-slate-850 rounded-xl space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">What to expect:</span>
              {['Introduction & background', 'Team conflict resolution', 'Deadline pressure scenario'].map((s, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-slate-400 font-semibold">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-purple flex-shrink-0" />
                  {s}
                </div>
              ))}
            </div>

            <div className="p-3 bg-dark-900 border border-slate-850 rounded-xl text-xs font-semibold">
              {speechSupported ? (
                <span className="text-emerald-400">🎤 Voice answering: Ready — click mic to speak</span>
              ) : (
                <span className="text-amber-400">⚠️ Speech not supported. Use Chrome/Edge, or type answers.</span>
              )}
            </div>
            
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
                  {reportCard.turns?.map((t: any, i: number) => (
                    <div key={i} className="glass p-4 rounded-xl border border-slate-850 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-slate-400 text-xs font-bold">Q{i+1}: {t.question}</p>
                        {t.score && (
                          <span className="text-[10px] font-bold text-brand-accent bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20 flex-shrink-0">
                            {t.score}%
                          </span>
                        )}
                      </div>
                      <p className="text-slate-300 text-xs italic font-semibold">"{t.answer}"</p>
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
        <div className="glass p-6 rounded-2xl border border-slate-800 space-y-5 max-w-2xl mx-auto animate-fade-in">
          {/* Top session count with progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-brand-purple bg-brand-purple/10 px-2 py-0.5 rounded border border-brand-purple/20 uppercase tracking-widest">
                Prompt {turns.length + 1} of 3
              </span>
              <span className="text-xs text-slate-500 font-semibold uppercase flex items-center gap-1.5">
                {aiSpeaking && <span className="h-1.5 w-1.5 rounded-full bg-brand-purple animate-pulse" />}
                {aiSpeaking ? 'AI Speaking...' : 'Manager Round'}
              </span>
            </div>
            {/* Progress bar */}
            <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-violet to-brand-indigo rounded-full transition-all duration-500"
                style={{ width: `${((turns.length) / 3) * 100}%` }}
              />
            </div>
          </div>

          {/* Previous turns summary */}
          {turns.length > 0 && (
            <div className="space-y-2">
              {turns.map((t, i) => (
                <div key={i} className="p-3 bg-dark-900/60 border border-slate-850 rounded-xl space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] font-bold text-slate-500 uppercase">Q{i+1} Completed</span>
                    {t.score && <span className="text-[9px] font-bold text-emerald-400">{t.score}%</span>}
                  </div>
                  <p className="text-[10px] text-brand-accent font-semibold leading-normal">{t.feedback}</p>
                </div>
              ))}
            </div>
          )}

          {/* Current Question */}
          <div className="p-4 bg-dark-900 border border-brand-purple/20 rounded-xl text-slate-300 text-sm font-semibold leading-relaxed">
            {currentQuestion}
          </div>

          <form onSubmit={submitAnswer} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Your verbal response</label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={recognitionActive ? '🎤 Listening... speak your STAR answer' : 'Talk or type down your leadership or conflict answer using situation-action-results...'}
                className="w-full h-[150px] p-4 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-300 font-semibold resize-none leading-relaxed transition"
                required
              />
            </div>

            <div className="flex items-center justify-between flex-wrap gap-3 pt-2">
              {speechSupported ? (
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={aiSpeaking || loading}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border transition ${
                    recognitionActive
                      ? 'bg-rose-500/10 border-rose-500/35 text-rose-400 animate-pulse'
                      : aiSpeaking
                      ? 'bg-dark-900 border-slate-800 text-slate-600 cursor-not-allowed'
                      : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {recognitionActive ? (
                    <><MicOff className="h-3.5 w-3.5" /> Stop transcribing</>
                  ) : (
                    <><Mic className="h-3.5 w-3.5" /> {aiSpeaking ? 'Wait for AI...' : 'Speak verbal answer'}</>
                  )}
                </button>
              ) : (
                <span className="text-[10px] text-slate-500 font-semibold italic">Voice unavailable — type your answer.</span>
              )}

              <button
                type="submit"
                disabled={loading || !userAnswer.trim()}
                className="flex items-center gap-1.5 px-5 py-2 bg-brand-purple hover:bg-brand-violet text-white text-xs font-extrabold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <><Send className="h-3.5 w-3.5" /> Submit Answer</>}
              </button>
            </div>
          </form>
          <div ref={answerEndRef} />
        </div>
      )}
    </div>
  );
}
