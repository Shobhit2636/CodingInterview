import { useEffect, useState, useRef } from 'react';
import { 
  Sparkles, RefreshCw, Mic, MicOff, Video, Database, Layers
} from 'lucide-react';

interface DesignQuestion {
  id: string;
  title: string;
  requirements: string;
  scalingGoals: string;
}

interface ConversationTurn {
  role: 'interviewer' | 'candidate';
  text: string;
}

export default function SystemDesignRound() {
  const [sessionActive, setSessionActive] = useState(false);
  const [selectedQ, setSelectedQ] = useState('tinyurl');
  const [history, setHistory] = useState<ConversationTurn[]>([]);
  const [whiteboardText, setWhiteboardText] = useState('');
  const [candidateSpeech, setCandidateSpeech] = useState('');
  
  // Voice states
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [recognitionActive, setRecognitionActive] = useState(false);
  const [loadingReply, setLoadingReply] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);

  const [reportCard, setReportCard] = useState<any | null>(null);

  const recognitionRef = useRef<any>(null);

  const designQuestions: DesignQuestion[] = [
    {
      id: 'tinyurl',
      title: 'Design TinyURL (URL Shortener)',
      requirements: 'Generate short aliases for long URLs. High read requests, 301 redirection logs, scale to 100M URLs daily.',
      scalingGoals: 'Scale with custom key generation service (KGS), cache popular URLs using Redis, partition DB using consistent hashing.'
    },
    {
      id: 'netflix',
      title: 'Design Netflix (Video Streaming)',
      requirements: 'Upload videos, distribute content to global audiences with low-latency playback on any network bandwidth.',
      scalingGoals: 'Integrate dynamic multi-bitrate encoding, structure a global Content Delivery Network (CDN), build cache hierarchies.'
    },
    {
      id: 'uber',
      title: 'Design Uber (Ride Sharing dispatcher)',
      requirements: 'Track passenger and driver locations in real-time, dispatch closest driver under 5 seconds, handle geo-fenced spikes.',
      scalingGoals: 'Utilize dynamic quadtree/geohash indexing for spatial tracking, scale real-time WebSocket signals.'
    }
  ];

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
        setCandidateSpeech(final || interim);
      };
      rec.onerror = () => setRecognitionActive(false);
      rec.onend = () => setRecognitionActive(false);
      recognitionRef.current = rec;
    }
  }, []);

  const speakTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setAiSpeaking(true);
      utterance.onend = () => setAiSpeaking(false);
      utterance.onerror = () => setAiSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const startSession = () => {
    setSessionActive(true);
    setReportCard(null);
    const selectedTitle = designQuestions.find(q => q.id === selectedQ)?.title || 'System Design';
    
    setWhiteboardText(`# Whiteboard notes: ${selectedTitle}\n\n1. API Design:\n\n2. Database Schema:\n\n3. High-level Architecture scaling (CDNs, Redis, Partitioning):\n`);
    
    const openingMsg = `Welcome to the System Design Round. Today, we'll design: ${selectedTitle}. To start, how would you design the high-level architecture diagram and API endpoints? Where will the major write load go?`;
    
    setHistory([{ role: 'interviewer', text: openingMsg }]);
    speakTTS(openingMsg);
  };

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (recognitionActive) recognitionRef.current.stop();
    else {
      setCandidateSpeech('');
      recognitionRef.current.start();
    }
  };

  const submitReply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!candidateSpeech.trim()) return;

    if (recognitionRef.current && recognitionActive) {
      recognitionRef.current.stop();
    }

    const candidateTurn: ConversationTurn = { role: 'candidate', text: candidateSpeech.trim() };
    const updatedHistory = [...history, candidateTurn];
    setHistory(updatedHistory);
    setCandidateSpeech('');
    setLoadingReply(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQ,
          history: updatedHistory,
          userReply: candidateTurn.text,
          code: whiteboardText,
          language: 'System Design Architecture'
        })
      });

      if (res.ok) {
        const reply = await res.json();
        setHistory(prev => [...prev, { role: 'interviewer', text: reply.question }]);
        speakTTS(reply.question);
      }
    } catch (err) {
      const followUp = "Understood. How would you handle database partitioning to store billions of records? Why Cassandra or SQL over MongoDB in this scenario?";
      setHistory(prev => [...prev, { role: 'interviewer', text: followUp }]);
      speakTTS(followUp);
    } finally {
      setLoadingReply(false);
    }
  };

  const concludeSession = async () => {
    setLoadingReply(true);
    try {
      const res = await fetch('http://localhost:5000/api/ai/systemdesign/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: selectedQ,
          history,
          whiteboardText
        })
      });
      if (res.ok) {
        const report = await res.json();
        setReportCard(report);
        setSessionActive(false);
        setHistory([]);
      }
    } catch (e) {
      console.error('Failed to generate system design report:', e);
      setReportCard({
        overall: 86,
        sharding: 90,
        caching: 85,
        feedback: "You demonstrated excellent choices regarding database sharding. Caching policies (Redis eviction bounds) were correctly evaluated. Suggestion: Discuss CDN edge pulls for media assets early in Uber/Netflix-like setups. (Offline Fallback)",
        designBreakdowns: [
          "Consistent hashing calculations",
          "Key Generation Service scaling limits"
        ]
      });
      setSessionActive(false);
      setHistory([]);
    } finally {
      setLoadingReply(false);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">AI System Design Round</h1>
        <p className="text-slate-400 text-sm mt-1">Scale distributed structures under high traffic. Draw sharding components, CDNs, and database partitions with AI critique.</p>
      </div>

      {!sessionActive && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Settings block */}
          <div className="glass p-6 rounded-2xl border border-slate-800 space-y-5 lg:col-span-1">
            <h3 className="font-extrabold text-lg text-slate-100 flex items-center gap-2">
              <Layers className="h-5 w-5 text-brand-purple" /> Architectural Intake
            </h3>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase">Select Architecture Prompt</label>
                <select
                  value={selectedQ}
                  onChange={(e) => setSelectedQ(e.target.value)}
                  className="w-full px-3 py-2.5 bg-dark-900 border border-slate-800 rounded-xl outline-none focus:border-brand-purple text-slate-300 text-sm font-semibold transition"
                >
                  {designQuestions.map(q => (
                    <option key={q.id} value={q.id}>{q.title}</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-dark-900 border border-slate-850 rounded-xl text-xs text-slate-400 font-semibold space-y-1">
                <span className="font-bold text-slate-350">Requirements:</span>
                <p className="leading-relaxed">{designQuestions.find(q => q.id === selectedQ)?.requirements}</p>
              </div>

              <button
                onClick={startSession}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white font-bold transition transform hover:scale-[1.02] shadow-lg shadow-brand-violet/20"
              >
                <Database className="h-4 w-4 animate-pulse" /> Launch System Design
              </button>
            </div>
          </div>

          {/* Assessment reports */}
          {reportCard ? (
            <div className="lg:col-span-2 glass p-6 rounded-2xl border border-brand-purple/20 bg-brand-purple/5 space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-brand-purple/20">
                  <h3 className="text-lg font-black flex items-center gap-1.5">
                    <Sparkles className="h-5 w-5 text-brand-purple" /> Architecture Audit Card
                  </h3>
                  <span className="text-sm font-extrabold text-brand-accent uppercase tracking-wider">
                    Score: {reportCard.overall}%
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="glass p-3.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">DB Sharding Rank</span>
                    <h4 className="text-xl font-extrabold text-brand-cyan mt-0.5">{reportCard.sharding}%</h4>
                  </div>
                  <div className="glass p-3.5 rounded-xl border border-slate-800 text-center">
                    <span className="text-[9px] text-slate-500 font-bold uppercase">CDN/Caching Policies</span>
                    <h4 className="text-xl font-extrabold text-emerald-400 mt-0.5">{reportCard.caching}%</h4>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Review comments:</h4>
                  <p className="p-4 bg-dark-900 border border-slate-850 rounded-xl text-slate-350 text-xs leading-relaxed font-semibold">
                    {reportCard.feedback}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="lg:col-span-2 glass p-8 rounded-2xl border border-slate-850 flex flex-col items-center justify-center text-center space-y-3">
              <Database className="h-12 w-12 text-slate-600" />
              <h3 className="text-lg font-bold">No Architectural Report</h3>
              <p className="text-slate-400 text-xs max-w-sm">
                Pick a design problem and initialize. Your database sharding and caching selections will be evaluated by Gemini models.
              </p>
            </div>
          )}
        </div>
      )}

      {sessionActive && (
        <div className="h-[78vh] flex flex-col md:flex-row gap-4 animate-fade-in">
          {/* Left Panel: Dialogue & Voice wave */}
          <div className="w-full md:w-1/2 flex flex-col gap-4 overflow-y-auto pr-1">
            <div className="glass rounded-xl p-5 border border-slate-800 flex items-center justify-between bg-dark-900/40">
              <div className="flex items-center gap-3">
                <Video className="h-5 w-5 text-brand-purple" />
                <div>
                  <h4 className="text-xs font-bold">AI Principal Architect</h4>
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wide">Conversing scaling choices</span>
                </div>
              </div>

              <div className="flex gap-0.5 items-center">
                {aiSpeaking ? (
                  [0.5, 0.8, 0.4, 0.9, 0.3].map((h, i) => (
                    <div key={i} style={{ height: `${h * 16}px` }} className="w-0.5 bg-brand-purple rounded-full animate-pulse" />
                  ))
                ) : (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-600 animate-ping" />
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
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-extrabold border ${
                        isInt ? 'bg-brand-purple/10 border-brand-purple/20 text-brand-accent' : 'bg-dark-900 border-slate-800 text-slate-300'
                      }`}>
                        {isInt ? 'AI' : 'You'}
                      </div>
                      <div className={`flex-1 p-3.5 rounded-2xl text-xs leading-relaxed font-semibold ${
                        isInt ? 'bg-dark-900 border border-slate-850 text-slate-350' : 'bg-brand-purple/10 border border-brand-purple/20 text-brand-accent'
                      }`}>
                        {turn.text}
                      </div>
                    </div>
                  );
                })}
                {loadingReply && (
                  <div className="flex gap-2 items-center text-slate-500 text-xs italic">
                    <RefreshCw className="h-3 w-3 animate-spin text-brand-purple" /> AI is evaluating architecture details...
                  </div>
                )}
              </div>

              {/* Input forms */}
              <form onSubmit={submitReply} className="p-4 bg-dark-900 border-t border-slate-850 space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={candidateSpeech}
                    onChange={(e) => setCandidateSpeech(e.target.value)}
                    placeholder="Describe sharding, CDN caching..."
                    className="flex-1 px-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-xs text-slate-200 font-semibold transition"
                  />

                  {speechSupported && (
                    <button
                      type="button"
                      onClick={toggleVoice}
                      className={`p-2.5 rounded-xl border transition ${
                        recognitionActive ? 'bg-rose-500/10 border-rose-500/35 text-rose-400 animate-pulse' : 'bg-dark-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {recognitionActive ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  )}

                  <button type="submit" className="px-4 py-2.5 bg-brand-purple hover:bg-brand-violet text-white text-xs font-bold rounded-xl transition">
                    Send
                  </button>
                </div>

                <div className="flex justify-between items-center flex-wrap gap-2 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold italic">Discuss CDN scale limits.</span>
                  <button
                    type="button"
                    onClick={concludeSession}
                    className="px-3 py-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/25 text-rose-400 text-[9px] font-bold uppercase transition"
                  >
                    Finish Design Audit
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Panel: Whiteboard Architecture Notes */}
          <div className="w-full md:w-1/2 flex flex-col gap-3">
            <div className="glass rounded-xl p-3 border border-slate-800">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                ✏️ Architecture Whiteboard Notes
              </span>
            </div>
            <textarea
              value={whiteboardText}
              onChange={(e) => setWhiteboardText(e.target.value)}
              className="flex-1 p-4 bg-dark-900/60 border border-slate-800 rounded-xl focus:border-brand-purple outline-none font-mono text-xs text-slate-300 leading-relaxed resize-none transition"
              placeholder="# Whiteboard diagrams & API designs..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
