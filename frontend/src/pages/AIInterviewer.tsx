import React, { useEffect, useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Mic, MicOff, Send, BrainCircuit, RefreshCw,
  Video, User, Sparkles, LogOut, Code
} from 'lucide-react';

interface QuestionSummary {
  id: string;
  title: string;
  difficulty: string;
}

interface ConversationTurn {
  role: 'interviewer' | 'candidate';
  text: string;
}

export default function AIInterviewer() {
  const [questions, setQuestions] = useState<QuestionSummary[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedQ, setSelectedQ] = useState<string>('');
  
  // Session States
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [code, setCode] = useState('// Write code during your interview here...');
  const [language, setLanguage] = useState('javascript');
  const [userSpeech, setUserSpeech] = useState('');
  
  // Voice Integration States
  const [aiIsSpeaking, setAiIsSpeaking] = useState(false);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);

  // Report Card State
  const [reportCard, setReportCard] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);
  const aiIsSpeakingRef = useRef(false);
  const historyEndRef = useRef<HTMLDivElement>(null);

  // Keep speaking ref in sync
  useEffect(() => {
    aiIsSpeakingRef.current = aiIsSpeaking;
  }, [aiIsSpeaking]);

  // Auto scroll conversation
  useEffect(() => {
    historyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, loadingReply]);

  // Text-To-Speech Speaking
  const speakTTS = useCallback((text: string, onComplete?: () => void) => {
    if (!('speechSynthesis' in window)) {
      onComplete?.();
      return;
    }

    // Stop any active recognition while AI speaks to prevent feedback loop
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }
    setRecognitionActive(false);

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    
    utterance.onstart = () => setAiIsSpeaking(true);
    utterance.onend = () => {
      setAiIsSpeaking(false);
      onComplete?.();
    };
    utterance.onerror = () => {
      setAiIsSpeaking(false);
      onComplete?.();
    };

    // Try to get a good English voice
    const trySpeak = () => {
      const voices = window.speechSynthesis.getVoices();
      const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Google') || v.name.includes('Microsoft') || v.name.includes('Natural')))
        || voices.find(v => v.lang.startsWith('en'));
      if (englishVoice) utterance.voice = englishVoice;
      window.speechSynthesis.speak(utterance);
    };

    // Voices may not be loaded yet
    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
    } else {
      window.speechSynthesis.onvoiceschanged = () => {
        trySpeak();
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  // Initialize Speech Synthesis and Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;      // Single utterance per session - more reliable
      rec.interimResults = true;
      rec.lang = 'en-US';
      rec.maxAlternatives = 1;

      rec.onstart = () => setRecognitionActive(true);

      rec.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        setUserSpeech(finalTranscript || interimTranscript);
      };

      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err.error);
        // Don't show error for 'no-speech' — it's normal
        setRecognitionActive(false);
      };

      rec.onend = () => {
        setRecognitionActive(false);
      };

      recognitionRef.current = rec;
    }

    fetchQuestions();
  }, []);

  const fetchQuestions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/questions');
      if (res.ok) {
        const data = await res.json();
        setQuestions(data);
        if (data.length > 0) setSelectedQ(data[0].id);
      }
    } catch (e) {
      setQuestions([
        { id: 'two-sum', title: 'Two Sum', difficulty: 'Easy' },
        { id: 'longest-palindromic-substring', title: 'Longest Substring', difficulty: 'Medium' }
      ]);
      setSelectedQ('two-sum');
    } finally {
      setLoadingList(false);
    }
  };

  const startInterview = () => {
    setInterviewStarted(true);
    setReportCard(null);
    setHistory([]);
    setUserSpeech('');
    
    const openingMsg = `Hello! Thank you for joining today's technical coding round. We'll be solving the question: ${
      questions.find(q => q.id === selectedQ)?.title || 'selected challenge'
    }. To get started, could you please explain your initial approach before writing down any code?`;

    const firstTurn: ConversationTurn = { role: 'interviewer', text: openingMsg };
    setHistory([firstTurn]);
    speakTTS(openingMsg);
  };

  // Toggle Speech Recognition listening
  const toggleSpeechRecognition = () => {
    if (!recognitionRef.current || aiIsSpeakingRef.current) return;

    if (recognitionActive) {
      try { recognitionRef.current.stop(); } catch (_) {}
    } else {
      setUserSpeech('');
      try { recognitionRef.current.start(); } catch (_) {
        // If already started, abort and restart
        try {
          recognitionRef.current.abort();
          setTimeout(() => {
            try { recognitionRef.current.start(); } catch (__) {}
          }, 200);
        } catch (__) {}
      }
    }
  };

  // Submit Candidate spoken reply to backend AI
  const submitAnswer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userSpeech.trim() || loadingReply) return;

    // Stop mic before submitting
    if (recognitionRef.current && recognitionActive) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    const candidateTurn: ConversationTurn = { role: 'candidate', text: userSpeech.trim() };
    const updatedHistory = [...history, candidateTurn];
    setHistory(updatedHistory);
    setUserSpeech('');
    setLoadingReply(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQ,
          history: updatedHistory,
          userReply: candidateTurn.text,
          code,
          language
        })
      });

      if (res.ok) {
        const reply = await res.json();
        const interviewerTurn: ConversationTurn = { role: 'interviewer', text: reply.question };
        setHistory(prev => [...prev, interviewerTurn]);
        speakTTS(reply.question);
      } else {
        throw new Error('API error');
      }
    } catch (e) {
      const followUp = "Excellent approach explanation. Let's see how you initialize your variables. How would you handle an empty list constraint?";
      setHistory(prev => [...prev, { role: 'interviewer', text: followUp }]);
      speakTTS(followUp);
    } finally {
      setLoadingReply(false);
    }
  };

  // Evaluate & finish interview report card
  const handleFinishInterview = async () => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (_) {}
    }

    setLoadingReply(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/interview/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQ,
          history,
          code,
          language
        })
      });
      if (res.ok) {
        const report = await res.json();
        setReportCard(report);
        setInterviewStarted(false);
        setHistory([]);
      } else {
        throw new Error('API error');
      }
    } catch (e) {
      setReportCard({
        overallScore: 84,
        communication: 90,
        codeRating: 80,
        feedback: "You demonstrated solid logical formulation. You shared your thoughts clearly during initial dry-runs. Optimization suggestion: Keep dry-running empty collections or border limits before wrapping up code submissions.",
        questionsCovered: [
          "Explain starter logic",
          "Explain worst-case space complexity bounds",
          "Edge case bounds validation"
        ]
      });
      setInterviewStarted(false);
      setHistory([]);
    } finally {
      setLoadingReply(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI Voice Interviewer</h1>
        <p className="text-slate-400 text-sm mt-1">Practice a high-pressure coding round. The AI interviewer speaks questions aloud and transcribes your voice.</p>
      </div>

      {/* 1. SETUP / REPORT CARD DISPLAY */}
      {!interviewStarted && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Intake settings */}
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-1">
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-brand-purple" /> Interview Settings
            </h3>
            
            {loadingList ? (
              <RefreshCw className="h-6 w-6 animate-spin text-brand-purple" />
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Select Target Question</label>
                  <select
                    value={selectedQ}
                    onChange={(e) => setSelectedQ(e.target.value)}
                    className="w-full px-3 py-2.5 bg-dark-900 border border-slate-800 rounded-xl outline-none focus:border-brand-purple text-slate-300 text-sm font-semibold transition"
                  >
                    {questions.map(q => (
                      <option key={q.id} value={q.id}>{q.title} ({q.difficulty})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Voice Status</label>
                  <div className="p-3 bg-dark-900 border border-slate-850 rounded-xl text-xs font-semibold leading-relaxed">
                    {speechSupported ? (
                      <span className="text-emerald-400">🎤 Browser Speech Recognition: Ready</span>
                    ) : (
                      <span className="text-amber-400">⚠️ Speech Recognition not supported. Use Chrome or Edge. You can still type your answers.</span>
                    )}
                  </div>
                </div>

                <button
                  onClick={startInterview}
                  disabled={!selectedQ}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white font-bold transition transform hover:scale-[1.02] shadow-lg shadow-brand-violet/20 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <Video className="h-4 w-4" /> Start Live Mock Round
                </button>
              </div>
            )}
          </div>

          {/* Report card display if exists */}
          {reportCard ? (
            <div className="lg:col-span-2 glass p-8 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 space-y-6 animate-fade-in flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-brand-purple/20 pb-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-purple" />
                    <h3 className="text-xl font-black">AI Mock Assessment Summary</h3>
                  </div>
                  <span className="text-[10px] uppercase font-bold text-brand-accent bg-brand-purple/10 px-2.5 py-1 rounded border border-brand-purple/20">
                    FAANG Standard
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Overall Score', val: `${reportCard.overallScore}%`, col: 'text-brand-purple' },
                    { label: 'Coding Quality', val: `${reportCard.codeRating}%`, col: 'text-brand-cyan' },
                    { label: 'Communication', val: `${reportCard.communication}%`, col: 'text-emerald-400' }
                  ].map((s, i) => (
                    <div key={i} className="glass p-4 rounded-xl border border-slate-800/80 text-center">
                      <span className="text-[10px] text-slate-500 font-semibold uppercase">{s.label}</span>
                      <h4 className={`text-2xl font-black mt-1 ${s.col}`}>{s.val}</h4>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mock feedback:</h4>
                  <p className="p-4 bg-dark-900 border border-slate-850 rounded-xl text-slate-300 text-xs leading-relaxed font-semibold">
                    {reportCard.feedback}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 glass p-8 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-3">
              <User className="h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-bold">No Active Assessment</h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Start a live mock round. When you submit your solutions, Gemini AI will evaluate your communication and code logic to generate a report.
              </p>
            </div>
          )}
        </div>
      )}

      {/* 2. ACTIVE LIVE INTERVIEW PANEL */}
      {interviewStarted && (
        <div className="h-[78vh] flex flex-col md:flex-row gap-4">
          {/* Left panel: Live call simulator & Chat Transcript */}
          <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto">
            {/* Call Screen simulator */}
            <div className="glass rounded-xl p-5 border border-slate-800 flex items-center justify-between flex-wrap gap-4 bg-dark-900/40">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center text-brand-accent">
                  <Video className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">FAANG Interviewer AI</h4>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 ${aiIsSpeaking ? 'text-brand-purple animate-pulse' : 'text-emerald-400'}`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${aiIsSpeaking ? 'bg-brand-purple' : 'bg-emerald-400'}`} />
                    {aiIsSpeaking ? 'AI Speaking...' : 'Listening Mode'}
                  </span>
                </div>
              </div>

              {/* Speech soundwaves visualizer */}
              <div className="flex gap-0.5 items-center bg-dark-900 border border-slate-850 px-3 py-1.5 rounded-xl h-[32px]">
                <span className="text-[9px] text-slate-500 font-bold uppercase mr-1.5">
                  {aiIsSpeaking ? 'AI Speaking' : recognitionActive ? 'Listening' : 'Idle'}
                </span>
                
                {aiIsSpeaking ? (
                  [0.6, 0.9, 0.4, 0.7, 0.2].map((h, i) => (
                    <div 
                      key={i} 
                      style={{ height: `${h * 16}px` }} 
                      className="w-0.5 bg-brand-purple rounded-full animate-pulse" 
                    />
                  ))
                ) : recognitionActive ? (
                  [0.5, 0.8, 0.3, 0.9, 0.4].map((h, i) => (
                    <div 
                      key={i} 
                      style={{ height: `${h * 16}px` }} 
                      className="w-0.5 bg-rose-400 rounded-full animate-pulse" 
                    />
                  ))
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                )}
              </div>
            </div>

            {/* Conversation list */}
            <div className="glass rounded-xl border border-slate-800 flex-1 flex flex-col h-[300px] overflow-hidden">
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-dark-950/40">
                {history.map((turn, i) => {
                  const isInt = turn.role === 'interviewer';
                  return (
                    <div key={i} className={`flex gap-3 items-start ${isInt ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold border flex-shrink-0 ${
                        isInt 
                          ? 'bg-brand-purple/10 border-brand-purple/20 text-brand-accent' 
                          : 'bg-dark-900 border-slate-800 text-slate-300'
                      }`}>
                        {isInt ? 'AI' : 'You'}
                      </div>
                      
                      <div className={`flex-1 p-3.5 rounded-2xl text-xs leading-relaxed font-semibold ${
                        isInt 
                          ? 'bg-dark-900 border border-slate-850 text-slate-350' 
                          : 'bg-brand-purple/10 border border-brand-purple/20 text-brand-accent'
                      }`}>
                        {turn.text}
                      </div>
                    </div>
                  );
                })}
                {loadingReply && (
                  <div className="flex gap-2 items-center text-slate-500 text-xs italic">
                    <RefreshCw className="h-3 w-3 animate-spin text-brand-purple" /> Interviewer is formulating feedback...
                  </div>
                )}
                <div ref={historyEndRef} />
              </div>

              {/* Bottom user speaking/typing deck */}
              <form onSubmit={submitAnswer} className="p-4 bg-dark-900 border-t border-slate-850 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userSpeech}
                    onChange={(e) => setUserSpeech(e.target.value)}
                    placeholder={recognitionActive ? '🎤 Listening... speak your answer' : 'Speak or type your explanation here...'}
                    className="flex-1 px-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-200 font-semibold transition"
                  />
                  
                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleSpeechRecognition}
                      disabled={aiIsSpeaking || loadingReply}
                      className={`p-2.5 rounded-xl border transition ${
                        recognitionActive 
                          ? 'bg-rose-500/10 border-rose-500/35 text-rose-400 animate-pulse'
                          : aiIsSpeaking
                          ? 'bg-dark-900 border-slate-800 text-slate-600 cursor-not-allowed'
                          : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title={aiIsSpeaking ? 'Wait for AI to finish speaking' : recognitionActive ? 'Stop Listening' : 'Speak Answer'}
                    >
                      {recognitionActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={!userSpeech.trim() || loadingReply}
                    className="px-4 py-2.5 bg-brand-purple hover:bg-brand-violet text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Send <Send className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-850/50">
                  <span className="text-[10px] text-slate-500 font-semibold italic">
                    {aiIsSpeaking ? '🔇 Mic muted while AI speaks' : 'Tip: Discuss big-O steps before typing lines.'}
                  </span>
                  
                  <button
                    type="button"
                    onClick={handleFinishInterview}
                    className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[10px] font-bold uppercase transition"
                  >
                    <LogOut className="h-3 w-3" /> Conclude Interview
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right panel: Collaborative Coding Editor */}
          <div className="w-full md:w-1/2 flex flex-col gap-3">
            <div className="glass rounded-xl p-3 border border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="h-4 w-4 text-brand-purple" /> Live Code Board
              </span>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1 bg-dark-900 border border-slate-850 rounded-lg text-slate-350 text-xs font-semibold focus:border-brand-purple outline-none"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>

            <div className="flex-1 rounded-xl border border-slate-800 overflow-hidden min-h-[300px]">
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => setCode(val || '')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono',
                  automaticLayout: true,
                  tabSize: 4
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
