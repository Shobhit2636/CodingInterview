import { useEffect, useState, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { 
  Users, MessageSquare, Send, Mic,
  Copy, Check, ArrowRight, Zap, PhoneCall, PhoneOff
} from 'lucide-react';

interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: string;
}

interface CollabUser {
  username: string;
  cursorColor: string;
  cursorPos?: { lineNumber: number; column: number };
}

export default function CollabRoom() {
  const [inRoom, setInRoom] = useState(false);
  const [roomId, setRoomId] = useState('');
  const [username, setUsername] = useState('Shobhit');
  
  // Real-time states
  const socketRef = useRef<Socket | null>(null);
  const [code, setCode] = useState('// Welcome to the Collaborative Interview Room!\n// Start coding together in real-time...');
  const [language, setLanguage] = useState('javascript');
  const [roomUsers, setRoomUsers] = useState<Record<string, CollabUser>>({});
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  // WebRTC voice call states
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Record<string, RTCPeerConnection>>({});
  const remoteAudioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const editorRef = useRef<any>(null);
  const roomIdRef = useRef('');
  const usernameRef = useRef('Shobhit');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Keep refs in sync
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);
  useEffect(() => { usernameRef.current = username; }, [username]);

  // Auto scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const createPeerConnection = useCallback((peerId: string) => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    });

    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // On receiving remote track, play it
    pc.ontrack = (event) => {
      if (!remoteAudioRefs.current[peerId]) {
        const audio = new Audio();
        audio.autoplay = true;
        remoteAudioRefs.current[peerId] = audio;
      }
      remoteAudioRefs.current[peerId].srcObject = event.streams[0];
    };

    // ICE candidate signaling
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('webrtc-signal', {
          roomId: roomIdRef.current,
          signal: { type: 'ice-candidate', candidate: event.candidate },
          to: peerId
        });
      }
    };

    peerConnectionsRef.current[peerId] = pc;
    return pc;
  }, []);

  const startVoiceCall = useCallback(async () => {
    setVoiceError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      setVoiceActive(true);

      // For each existing peer, create offer
      Object.keys(roomUsers).forEach(async (peerId) => {
        const pc = createPeerConnection(peerId);
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socketRef.current?.emit('webrtc-signal', {
          roomId: roomIdRef.current,
          signal: { type: 'offer', sdp: offer },
          to: peerId
        });
      });
    } catch (err: any) {
      setVoiceError('Microphone access denied. Please allow mic permissions.');
      console.error('getUserMedia error:', err);
    }
  }, [roomUsers, createPeerConnection]);

  const stopVoiceCall = useCallback(() => {
    // Stop local stream
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;

    // Close all peer connections
    Object.values(peerConnectionsRef.current).forEach(pc => pc.close());
    peerConnectionsRef.current = {};

    // Stop remote audios
    Object.values(remoteAudioRefs.current).forEach(audio => {
      audio.srcObject = null;
    });
    remoteAudioRefs.current = {};

    setVoiceActive(false);
    setVoiceError('');
  }, []);

  // Initialize socket when joining room
  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim() || !username.trim()) return;

    const newSocket = io('http://localhost:5000');
    socketRef.current = newSocket;

    newSocket.emit('join-room', { 
      roomId: roomId.trim(), 
      username: username.trim(),
      language
    });

    newSocket.on('room-state', ({ code: sCode, language: sLang, users }) => {
      setCode(sCode || '// Start coding here...');
      setLanguage(sLang || 'javascript');
      setRoomUsers(users || {});
      setInRoom(true);
    });

    newSocket.on('user-joined', ({ id, user }) => {
      setRoomUsers(prev => ({ ...prev, [id]: user }));
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          username: 'System',
          text: `${user.username} joined the session!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      // If we have an active voice call, create offer to new peer
      if (localStreamRef.current) {
        (async () => {
          const pc = createPeerConnection(id);
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          newSocket.emit('webrtc-signal', {
            roomId: roomIdRef.current,
            signal: { type: 'offer', sdp: offer },
            to: id
          });
        })();
      }
    });

    newSocket.on('editor-sync', ({ code: syncedCode }) => {
      setCode(syncedCode);
    });

    newSocket.on('language-sync', ({ language: syncedLang }) => {
      setLanguage(syncedLang);
    });

    newSocket.on('cursor-sync', ({ userId, cursorPos }) => {
      setRoomUsers(prev => {
        if (prev[userId]) {
          return { ...prev, [userId]: { ...prev[userId], cursorPos } };
        }
        return prev;
      });
    });

    newSocket.on('receive-message', (msg: Message) => {
      setMessages(prev => [...prev, msg]);
    });

    newSocket.on('user-left', ({ id, username: userN }) => {
      setRoomUsers(prev => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      // Close peer connection if voice active
      if (peerConnectionsRef.current[id]) {
        peerConnectionsRef.current[id].close();
        delete peerConnectionsRef.current[id];
      }
      if (remoteAudioRefs.current[id]) {
        remoteAudioRefs.current[id].srcObject = null;
        delete remoteAudioRefs.current[id];
      }
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          username: 'System',
          text: `${userN} left the session.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    });

    // Handle incoming WebRTC signals
    newSocket.on('webrtc-signal', async ({ signal, from }) => {
      if (signal.type === 'offer') {
        // Create peer connection and answer
        const pc = createPeerConnection(from);
        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        newSocket.emit('webrtc-signal', {
          roomId: roomIdRef.current,
          signal: { type: 'answer', sdp: answer },
          to: from
        });
      } else if (signal.type === 'answer') {
        const pc = peerConnectionsRef.current[from];
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
        }
      } else if (signal.type === 'ice-candidate') {
        const pc = peerConnectionsRef.current[from];
        if (pc && signal.candidate) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
          } catch (e) {
            console.error('Error adding ICE candidate:', e);
          }
        }
      }
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    const val = value || '';
    setCode(val);
    socketRef.current?.emit('editor-change', { roomId: roomIdRef.current, code: val });
  };

  const handleLanguageChange = (lang: string) => {
    setLanguage(lang);
    socketRef.current?.emit('language-change', { roomId: roomIdRef.current, language: lang });
  };

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
    editor.onDidChangeCursorPosition((e: any) => {
      socketRef.current?.emit('cursor-move', {
        roomId: roomIdRef.current,
        cursorPos: {
          lineNumber: e.position.lineNumber,
          column: e.position.column
        }
      });
    });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', { roomId: roomIdRef.current, username: usernameRef.current, text: chatInput.trim() });
    setChatInput('');
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const generateRoomId = () => {
    const id = 'room-' + Math.random().toString(36).substring(2, 9);
    setRoomId(id);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopVoiceCall();
      socketRef.current?.disconnect();
    };
  }, [stopVoiceCall]);

  if (!inRoom) {
    return (
      <div className="flex h-[80vh] items-center justify-center animate-fade-in px-4">
        <div className="w-full max-w-md glass p-8 rounded-2xl border border-slate-800 space-y-6">
          <div className="text-center space-y-2">
            <div className="h-12 w-12 rounded-xl bg-brand-purple/10 border border-brand-purple/20 flex items-center justify-center mx-auto text-brand-accent">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-black">Collaborative Interview Room</h2>
            <p className="text-slate-400 text-xs leading-normal">
              Code side-by-side with real-time voice calls, live cursor sync, and instant chat.
            </p>
          </div>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Your Nickname</label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter nickname"
                className="w-full px-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-slate-200 text-sm font-semibold transition"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase">Room Session ID</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter or generate ID"
                  className="flex-1 px-4 py-2.5 bg-dark-900 border border-slate-800 rounded-xl focus:border-brand-purple outline-none text-slate-200 text-sm font-semibold transition"
                />
                <button
                  type="button"
                  onClick={generateRoomId}
                  className="px-3 py-2.5 bg-dark-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-400 hover:text-white text-xs font-bold transition flex items-center gap-1"
                >
                  <Zap className="h-3.5 w-3.5 text-amber-500" /> New
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-brand-violet to-brand-indigo hover:from-brand-purple hover:to-brand-violet text-white font-bold transition transform hover:scale-[1.02] shadow-lg shadow-brand-violet/20"
            >
              Initialize Shared Board <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[92vh] flex flex-col lg:flex-row gap-4 -m-6 p-4">
      {/* LEFT AREA: Editor & Synced State */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Sync Controls */}
        <div className="glass rounded-xl p-3 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold animate-pulse">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Synced
            </div>
            
            <button
              onClick={copyRoomId}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-dark-900 border border-slate-850 hover:border-slate-700 text-slate-350 hover:text-slate-200 text-xs font-bold transition"
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5 text-emerald-400" /> Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> ID: {roomId}</>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Real WebRTC Voice Call toggle */}
            <button
              onClick={voiceActive ? stopVoiceCall : startVoiceCall}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                voiceActive 
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 animate-pulse'
                  : 'bg-dark-900 border-slate-850 text-slate-400 hover:text-slate-200'
              }`}
            >
              {voiceActive ? (
                <><PhoneOff className="h-3.5 w-3.5" /> End Call</>
              ) : (
                <><PhoneCall className="h-3.5 w-3.5" /> Start Voice Call</>
              )}
            </button>

            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 bg-dark-900 border border-slate-850 rounded-lg text-slate-300 text-xs font-semibold focus:border-brand-purple outline-none"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>
          </div>
        </div>

        {/* Voice active indicator */}
        {voiceActive && (
          <div className="glass rounded-xl p-3 border border-rose-500/20 flex items-center justify-between gap-4 bg-rose-950/5 animate-fade-in">
            <span className="text-xs text-rose-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Mic className="h-3.5 w-3.5" /> Voice call active — {Object.keys(peerConnectionsRef.current).length} peer(s) connected
            </span>
            <div className="flex gap-0.5 items-center">
              {[0.4, 0.9, 0.3, 0.7, 0.2, 0.8, 0.5, 0.9, 0.4].map((h, i) => (
                <div 
                  key={i} 
                  style={{ height: `${h * 16}px` }} 
                  className="w-0.5 bg-rose-400 rounded-full animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Voice error */}
        {voiceError && (
          <div className="glass rounded-xl p-3 border border-amber-500/20 bg-amber-950/5 text-amber-400 text-xs font-semibold">
            ⚠️ {voiceError}
          </div>
        )}

        {/* Monaco Synchronized Editor */}
        <div className="flex-1 rounded-xl border border-slate-800 overflow-hidden min-h-[350px] relative">
          <Editor
            height="100%"
            language={language}
            theme="vs-dark"
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
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

      {/* RIGHT AREA: Active users & Sync Chat */}
      <div className="w-full lg:w-[320px] flex flex-col gap-4">
        {/* Active Members Grid */}
        <div className="glass rounded-xl p-4 border border-slate-800 space-y-3">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="h-4 w-4 text-brand-purple" /> Active candidates ({Object.keys(roomUsers).length + 1})
          </h4>
          <div className="space-y-2">
            {/* Current user */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-dark-900 border border-slate-850">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-brand-purple" />
                <span className="text-xs font-bold text-slate-200">{username} (You)</span>
              </div>
              <span className="text-[9px] font-bold text-brand-purple bg-brand-purple/10 px-1.5 py-0.5 rounded border border-brand-purple/20 uppercase">
                Host
              </span>
            </div>

            {/* Other room users synced */}
            {Object.entries(roomUsers).map(([id, user]) => (
              <div key={id} className="flex items-center justify-between p-2 rounded-lg bg-dark-900/60 border border-slate-850/60">
                <div className="flex items-center gap-2">
                  <div style={{ backgroundColor: user.cursorColor }} className="h-2 w-2 rounded-full" />
                  <span className="text-xs font-bold text-slate-350">{user.username}</span>
                </div>
                {user.cursorPos && (
                  <span className="text-[9px] font-mono text-slate-500 font-semibold">
                    Ln {user.cursorPos.lineNumber}, Col {user.cursorPos.column}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Sync Chat component */}
        <div className="glass rounded-xl border border-slate-800 flex-1 flex flex-col h-[300px] lg:h-auto overflow-hidden">
          <div className="bg-dark-900 px-4 py-3 border-b border-slate-850 flex items-center gap-1.5">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Room Discussion</h4>
          </div>

          {/* Sync Chat List */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-dark-950/40">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <span className="text-slate-600 text-xs italic">No messages sent yet. Ask follow ups!</span>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.username === username;
                const isSys = m.username === 'System';

                if (isSys) {
                  return (
                    <div key={m.id} className="text-center font-semibold text-[10px] text-slate-500 italic py-1 border-y border-slate-900/30">
                      {m.text}
                    </div>
                  );
                }

                return (
                  <div key={m.id} className={`space-y-0.5 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-[9px] font-bold text-slate-500">{m.username}</span>
                      <span className="text-[8px] font-medium text-slate-600">{m.timestamp}</span>
                    </div>
                    <div className={`px-3 py-2 rounded-xl text-xs max-w-[85%] leading-normal font-semibold ${
                      isMe 
                        ? 'bg-brand-purple/20 text-brand-accent border border-brand-purple/35 rounded-tr-none' 
                        : 'bg-dark-900 text-slate-300 border border-slate-850 rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat entry form */}
          <form onSubmit={sendMessage} className="p-3 bg-dark-900/60 border-t border-slate-850 flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type interview question..."
              className="flex-1 px-3 py-2 bg-dark-900 border border-slate-850 rounded-lg focus:border-brand-purple outline-none text-xs text-slate-200 font-semibold transition"
            />
            <button
              type="submit"
              className="p-2 rounded-lg bg-brand-purple hover:bg-brand-violet text-white transition flex items-center justify-center"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
