import React, { useState } from 'react';
import { Mic, MicOff, Award, Sparkles, Send, ShieldAlert, BadgeInfo, CheckCircle, BrainCircuit } from 'lucide-react';

interface VoiceAndUniverseProps {
  geminiApiKey?: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  addXp: (amount: number, reason: string) => void;
  onVoiceTriggerAction: (actionCode: string) => void; // callbacks to App.tsx to change tabs or focus e.g. 'beast_focus', 'motivation', 'gym'
  userLevel: number;
  userXp: number;
}

export default function VoiceAndUniverse({
  geminiApiKey,
  addToast,
  addXp,
  onVoiceTriggerAction,
  userLevel,
  userXp
}: VoiceAndUniverseProps) {
  // --- 1. VOICE COMMAND CONTROL STATE ---
  const [isListening, setIsListening] = useState(false);
  const [voiceInputText, setVoiceInputText] = useState('');
  const [micError, setMicError] = useState<string | null>(null);

  const startSpeechRecognition = () => {
    // Check if webkitSpeechRecognition is available
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicError("Speech recognition API not supported by standard iframe permissions. Write manual speech prompts below!");
      setIsListening(true);
      return;
    }

    setMicError(null);
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      addToast('Voice listener active. Speak command now...', 'info');
    };

    recognition.onerror = (e: any) => {
      console.error(e);
      setMicError("Speech capture blocked. Use manual typing control fallback!");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const resultsText = event.results[0][0].transcript || '';
      setVoiceInputText(resultsText);
      processCommand(resultsText);
    };

    recognition.start();
  };

  const processCommand = (rawText: string) => {
    const text = rawText.toLowerCase();
    addToast(`Processing voice transcript command: "${rawText}"`, 'info');

    if (text.includes('study') || text.includes('focus') || text.includes('beast')) {
      onVoiceTriggerAction('beast_focus');
      addToast('Voice command matches: "Entering Beast Focus Mode!"', 'success');
      addXp(20, 'Voice trigger: enter beast focus');
    } else if (text.includes('motivation') || text.includes('goggins') || text.includes('hinglish') || text.includes('roast')) {
      onVoiceTriggerAction('motivation');
      addToast('Voice command matches: "Opening daily motivational vault!"', 'success');
      addXp(20, 'Voice trigger: read motivational quote');
    } else if (text.includes('gym') || text.includes('lift') || text.includes('squat')) {
      onVoiceTriggerAction('gym');
      addToast('Voice command matches: "Activating Gym workout planner!"', 'success');
      addXp(20, 'Voice trigger: plan gym lift');
    } else if (text.includes('money') || text.includes('expense') || text.includes('audit')) {
      onVoiceTriggerAction('money');
      addToast('Voice command matches: "Pulling ledger capital dashboard!"', 'success');
    } else {
      addToast(`Command recognized: "${rawText}". No preset trigger matched. Try 'study mode', 'gym lift', 'motivation roast'!`, 'info');
    }
  };

  const handleManualCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!voiceInputText.trim()) return;
    processCommand(voiceInputText);
    setIsListening(false);
  };

  // --- 2. ROY NO RULES UNIVERSE STATE ---
  const [loadingUniverse, setLoadingUniverse] = useState(false);
  const [universeResult, setUniverseResult] = useState<any>(() => {
    const saved = localStorage.getItem('roy_universe_wisdom');
    return saved ? JSON.parse(saved) : null;
  });

  const syncRoyUniverseSyncScore = async () => {
    setLoadingUniverse(true);
    
    // Dynamic overall status data assembly
    const statsPayload = {
      level: userLevel,
      xp: userXp,
      water: Number(localStorage.getItem('roy_beast_water')) || 0,
      studyHours: Number(localStorage.getItem('roy_beast_study_total')) || 12.5
    };

    const countdownsSaved = localStorage.getItem('roy_beast_countdown_goals');
    const countdownsParsed = countdownsSaved ? JSON.parse(countdownsSaved) : [];
    
    const habitsSaved = localStorage.getItem('roy_custom_habits');
    const habitsParsed = habitsSaved ? JSON.parse(habitsSaved) : [];

    const cashSaved = localStorage.getItem('roy_beast_transactions');
    const cashParsed = cashSaved ? JSON.parse(cashSaved) : [];

    const bikeOdo = Number(localStorage.getItem('re_hunter_odo')) || 5280;

    try {
      const res = await fetch('/api/ai-universe-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stats: statsPayload,
          countdowns: countdownsParsed,
          habits: habitsParsed,
          money: { transactionsCount: cashParsed.length },
          bike: { odometer: bikeOdo },
          geminiApiKey
        })
      });

      const data = await res.json();
      setUniverseResult(data);
      localStorage.setItem('roy_universe_wisdom', JSON.stringify(data));
      addToast('Unified Roy Universe sync completes! Quantum score index re-weighted.', 'success');
      addXp(150, 'Master Roy Universe Intelligence Sync complete');
    } catch {
      addToast('Discipline universe sync pipeline failed. Loaded cached recommendation deck.', 'error');
    } finally {
      setLoadingUniverse(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left">
      
      {/* 🧠 SECTION A. VOICE COMMANDS (5 cols) */}
      <div className="lg:col-span-5 bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Mic className="w-5 h-5 text-indigo-400 animate-pulse" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Cybernetic Voice Deck</h2>
          </div>
          <span className="text-xs font-bold font-mono text-zinc-400">Speech API</span>
        </div>

        <p className="text-xs text-zinc-400 leading-relaxed">
          Control tabs using micro voice captures. Try triggers like <code>"start study mode"</code>, <code>"show workouts"</code>, <code>"get motivation"</code>.
        </p>

        <div className="flex flex-col items-center justify-center p-4 bg-zinc-950 rounded-2xl border border-zinc-900 gap-3">
          <button
            onClick={startSpeechRecognition}
            className={`w-14 h-14 rounded-full flex items-center justify-center border-0 shadow-lg cursor-pointer ${
              isListening ? 'bg-red-650 animate-ping text-white' : 'bg-indigo-650 text-white'
            }`}
          >
            {isListening ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </button>
          <span className="text-[10px] font-mono text-zinc-500 font-extrabold uppercase">
            {isListening ? 'CAPTURE ACTIVE • LISTEN...' : 'TAP TRANSMITTER TO CAPTURE'}
          </span>
        </div>

        {/* Typing Fallback */}
        <form onSubmit={handleManualCommandSubmit} className="space-y-2">
          <span className="text-[9px] font-bold text-zinc-550 uppercase font-mono block">Simulation Speech Trigger Input Fallback:</span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. start study mode"
              value={voiceInputText}
              onChange={(e) => setVoiceInputText(e.target.value)}
              className="flex-1 bg-zinc-950 border border-zinc-850 rounded-lg px-2.5 py-1.5 text-xs text-white"
            />
            <button
              type="submit"
              className="bg-zinc-950 hover:bg-zinc-905 border border-zinc-850 px-3 py-1.5 rounded-lg text-xs text-zinc-300 font-mono"
            >
              Simulate Voice
            </button>
          </div>
          {micError && (
            <p className="text-[9.5px] font-mono text-amber-500 leading-relaxed text-left">
              💡 {micError}
            </p>
          )}
        </form>
      </div>

      {/* 🚀 SECTION B. ROY NO RULES UNIVERSE SYSTEM (7 cols) */}
      <div className="lg:col-span-7 bg-zinc-900/35 border border-zinc-850 rounded-3xl p-6 text-left space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-850 pb-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h2 className="text-sm font-bold uppercase text-white tracking-widest font-mono">Roy No Rules Universe HUD</h2>
          </div>
          <span className="text-xs font-bold font-mono text-amber-500">SUPREME COGNITION</span>
        </div>

        {!universeResult ? (
          <div className="text-center py-10 space-y-4 bg-zinc-950 p-6 rounded-2xl border border-zinc-900">
            <span className="text-xs text-zinc-555 font-mono italic block">Micro integrated analysis systems are offline.</span>
            <p className="text-xs text-zinc-400">This module binds your count down targets, Royal Enfield maintenance intervals, pocket statements, and physical stats to compute an overall Synchronization Coefficient.</p>
            <button
              onClick={syncRoyUniverseSyncScore}
              disabled={loadingUniverse}
              className="w-full bg-gradient-to-r from-red-650 to-amber-600 hover:from-red-600 hover:to-amber-550 text-white font-mono font-bold text-xs py-3 rounded-xl cursor-pointer transition-all border-0 shadow-md uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              {loadingUniverse ? 'Synchronizing absolute universe indexes...' : 'Initialize Universe Integration Synergism'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in text-xs">
            {/* Visual Gauge Rating Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-zinc-950 p-4 rounded-xl border border-zinc-900">
              
              <div className="sm:col-span-1 text-center py-2 border-r border-zinc-900 font-mono space-y-1">
                <span className="text-[9px] text-zinc-550 font-black uppercase tracking-wider block">Discipline Sync</span>
                <p className="text-3xl font-black text-rose-500">{universeResult.syncDisciplineScore || 75}%</p>
                <span className="text-[8px] bg-red-650/10 text-red-400 border border-red-500/10 px-1 py-0.5 rounded uppercase font-bold">
                  Autonomy Coefficient
                </span>
              </div>

              <div className="sm:col-span-2 text-left space-y-1.5 p-1">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest block font-mono">Quantum Universe Assessment:</span>
                <p className="text-zinc-350 leading-relaxed italic text-[11.5px]">
                  "{universeResult.universeStatusSummary}"
                </p>
              </div>

            </div>

            {/* Prescriptions Lists */}
            <div className="space-y-2">
              <span className="text-[9px] font-black text-amber-500 uppercase font-mono tracking-widest block">Supreme Personal Prescriptions:</span>
              <ul className="space-y-2">
                {universeResult.personalizedRecommendations?.map((rec: string, idx: number) => (
                  <li key={idx} className="bg-zinc-950 p-3 rounded-xl border border-zinc-900 text-zinc-300 leading-relaxed text-left flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={syncRoyUniverseSyncScore}
              disabled={loadingUniverse}
              className="w-full bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-400 hover:text-white font-mono text-[9px] font-bold tracking-widest py-2.5 rounded-lg cursor-pointer uppercase text-center"
            >
              {loadingUniverse ? 'Synchronizing matrices...' : 'Recalibrate Master Universe HUD Index'}
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
