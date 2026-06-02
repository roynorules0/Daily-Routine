import React, { useState, useEffect } from 'react';
import { 
  Plus, CheckCircle, Trash2, BookOpen, AlertTriangle, RefreshCcw, 
  Award, BarChart3, ChevronRight, Activity, Filter, Eye, ListTodo, Calendar,
  TrendingUp, Star, ShieldAlert, Sparkles, BookCheck, ClipboardList
} from 'lucide-react';
import { NeetTopic, NeetDailyTarget } from '../types';

interface NeetTabProps {
  topics: NeetTopic[];
  toggleTopicStatus: (topicId: string, type: 'completed' | 'revised' | 'weak') => void;
  dailyTargets: NeetDailyTarget[];
  addDailyTarget: (title: string, subject: 'Biology' | 'Physics' | 'Chemistry') => void;
  toggleDailyTarget: (targetId: string) => void;
  deleteDailyTarget: (targetId: string) => void;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
}

interface MockTestScore {
  id: string;
  testName: string;
  date: string;
  biology: number; // 360
  physics: number; // 180
  chemistry: number; // 180
  total: number; // 720
}

export default function NeetTab({
  topics,
  toggleTopicStatus,
  dailyTargets,
  addDailyTarget,
  toggleDailyTarget,
  deleteDailyTarget,
  addToast
}: NeetTabProps) {
  const [activeSubjectTab, setActiveSubjectTab] = useState<'Biology' | 'Physics' | 'Chemistry'>('Biology');
  const [newTargetTitle, setNewTargetTitle] = useState('');
  const [newTargetSubject, setNewTargetSubject] = useState<'Biology' | 'Physics' | 'Chemistry'>('Biology');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock score tracker variables
  const [mockScores, setMockScores] = useState<MockTestScore[]>(() => {
    const saved = localStorage.getItem('roy_mock_scores');
    return saved ? JSON.parse(saved) : [
      { id: 'm1', testName: 'All India NEET Grand Mock 1', date: '2026-05-15', biology: 310, physics: 125, chemistry: 140, total: 575 },
      { id: 'm2', testName: 'Chemistry Inorganic Special Mock', date: '2026-05-28', biology: 325, physics: 140, chemistry: 155, total: 620 }
    ];
  });

  const [inputTestName, setInputTestName] = useState('');
  const [inputBio, setInputBio] = useState('320');
  const [inputPhys, setInputPhys] = useState('130');
  const [inputChem, setInputChem] = useState('140');
  const [showAddScore, setShowAddScore] = useState(false);

  // Sync mock scores
  useEffect(() => {
    localStorage.setItem('roy_mock_scores', JSON.stringify(mockScores));
  }, [mockScores]);

  // Filter topics based on active subject, filter term
  const filteredTopics = topics.filter(t => 
    t.subject === activeSubjectTab && 
    (t.topicName.toLowerCase().includes(searchTerm.toLowerCase()) || 
     t.chapter.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Completion stats percentages
  const getSubjectSymmetricProgress = (subj: 'Biology' | 'Physics' | 'Chemistry') => {
    const subjTopics = topics.filter(t => t.subject === subj);
    const completed = subjTopics.filter(t => t.isCompleted).length;
    return subjTopics.length > 0 ? Math.round((completed / subjTopics.length) * 100) : 0;
  };

  const getSubjectRevisedProgress = (subj: 'Biology' | 'Physics' | 'Chemistry') => {
    const subjTopics = topics.filter(t => t.subject === subj);
    const revised = subjTopics.filter(t => t.isRevised).length;
    return subjTopics.length > 0 ? Math.round((revised / subjTopics.length) * 100) : 0;
  };

  // Extract critical Weak parts
  const weakTopics = topics.filter(t => t.isWeak);

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetTitle.trim()) {
      addToast('Daily MCQ target locks cannot be empty', 'error');
      return;
    }
    addDailyTarget(newTargetTitle, newTargetSubject);
    setNewTargetTitle('');
    addToast('NEET daily revision goal added successfully!', 'success');
  };

  const handleAddMockScore = (e: React.FormEvent) => {
    e.preventDefault();
    const bio = Math.min(360, Math.max(0, Number(inputBio) || 0));
    const phys = Math.min(180, Math.max(0, Number(inputPhys) || 0));
    const chem = Math.min(180, Math.max(0, Number(inputChem) || 0));
    const total = bio + phys + chem;

    const newScore: MockTestScore = {
      id: 'mock-' + Date.now(),
      testName: inputTestName.trim() || `NEET Mock Practice #${mockScores.length + 1}`,
      date: new Date().toISOString().substring(0, 10),
      biology: bio,
      physics: phys,
      chemistry: chem,
      total: total
    };

    setMockScores([newScore, ...mockScores]);
    setInputTestName('');
    setShowAddScore(false);
    addToast(`Mock score logged! Current total: ${total}/720. Let's improve further.`, 'success');

    // Experience boost reward points for mock completion
    const existingXp = Number(localStorage.getItem('roy_beast_xp')) || 340;
    localStorage.setItem('roy_beast_xp', String(existingXp + 45));
  };

  const handleDeleteScore = (id: string) => {
    setMockScores(prev => prev.filter(s => s.id !== id));
    addToast('Mock score deleted successfully from cache.', 'info');
  };

  const getSubjectColorClass = (subj: string) => {
    switch (subj) {
      case 'Biology': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/15';
      case 'Physics': return 'text-amber-400 bg-amber-500/10 border-amber-500/15';
      case 'Chemistry': return 'text-violet-400 bg-violet-500/10 border-violet-500/15';
      default: return 'text-zinc-400 bg-zinc-500/10 border-zinc-500/15';
    }
  };

  // Generate local AI Syllabus recommendations based on syllabus completion
  const getAISyllabusDiagnostics = () => {
    const bioComp = getSubjectSymmetricProgress('Biology');
    const physComp = getSubjectSymmetricProgress('Physics');
    const chemComp = getSubjectSymmetricProgress('Chemistry');

    let subjectPris = "Concentrate on Biological organic structures";
    let priorityTip = "Physics is at lower levels. Solve relative mechanics problems!";

    if (physComp <= bioComp && physComp <= chemComp) {
      subjectPris = "Physics Practice Drills (MCQ sets)";
      priorityTip = "Formulate custom NEET targets to solve at least 45 kinematics / modern physics formulas daily. Weak list needs sorting.";
    } else if (chemComp <= bioComp && chemComp <= physComp) {
      subjectPris = "Chemistry Nomenclature & Mechanism Revisions";
      priorityTip = "Revise SN1/SN2 mechanisms and solid states. Complete weekly d-block organic revisions.";
    } else {
      subjectPris = "Biology NCERT Memorization";
      priorityTip = "Highlight ecology definitions and reproduction cycle lines. NCERT details are crucial.";
    }

    return { subjectPris, priorityTip };
  };

  const aiDiag = getAISyllabusDiagnostics();

  // Score stats averages
  const latestScore = mockScores[0]?.total || 0;
  const averageMockScore = mockScores.length > 0 ? Math.round(mockScores.reduce((acc, curr) => acc + curr.total, 0) / mockScores.length) : 0;

  return (
    <div className="space-y-6 pb-26 animate-fade-in" id="neet-command-center">
      
      {/* 🔮 DIAGNOSTICS HUD: Syllabus completion by Subject */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-850/80 relative text-left">
        <div className="flex items-center gap-2 mb-4">
          <BookCheck className="w-4 h-4 text-emerald-405" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">NEET SYLLABUS DISCIPLINE METRICS</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { name: 'Biology', label: 'NCERT Zoology & Botany', color: 'from-emerald-500 to-teal-400', progress: getSubjectSymmetricProgress('Biology'), revised: getSubjectRevisedProgress('Biology') },
            { name: 'Physics', label: 'Classical Mechanics & Optics', color: 'from-amber-500 to-orange-400', progress: getSubjectSymmetricProgress('Physics'), revised: getSubjectRevisedProgress('Physics') },
            { name: 'Chemistry', label: 'Organic, Inorganic, Physical', color: 'from-violet-500 to-indigo-400', progress: getSubjectSymmetricProgress('Chemistry'), revised: getSubjectRevisedProgress('Chemistry') }
          ].map((item) => (
            <div key={item.name} className="p-4 bg-black/45 border border-zinc-900 rounded-2xl flex flex-col justify-between relative group hover:border-zinc-800 transition-all duration-300">
              <div className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <h4 className="text-sm font-bold text-white tracking-tight">{item.name}</h4>
                  <span className="text-xs font-mono font-black text-zinc-300">{item.progress}% Read</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-medium font-sans">{item.label}</p>
              </div>

              {/* Advanced multi-bar progress: Read vs Revised */}
              <div className="mt-4 space-y-2">
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-550 font-mono mb-0.5">
                    <span>Syllabus Read</span>
                    <span>{item.progress}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900/60 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r ${item.color}`} style={{ width: `${item.progress}%` }} />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-[9px] text-zinc-550 font-mono mb-0.5">
                    <span>Revised Count</span>
                    <span>{item.revised}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-zinc-950 border border-zinc-900/60 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${item.revised}%` }} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 🚨 CRITICAL WEAK TOPICS BULLETINS */}
      {weakTopics.length > 0 && (
        <div className="bg-red-950/10 border border-red-500/15 rounded-3xl p-5 flex items-start gap-4 relative overflow-hidden text-left animate-slide-up">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-16 h-16 bg-red-500/10 rounded-full blur-xl pointer-events-none" />
          <div className="p-2.5 bg-red-500/15 rounded-xl text-red-400 border border-red-500/15 shrink-0">
            <AlertTriangle className="w-5 h-5 shrink-0" />
          </div>
          <div className="space-y-2">
            <div>
              <h3 className="text-xs font-bold text-red-300 uppercase tracking-widest font-mono">WEAK SEGMENTS RECONNAISSANCE ({weakTopics.length} CHAPTERS FLAGGED)</h3>
              <p className="text-[11px] text-zinc-400 leading-relaxed font-sans mt-0.5">
                NCERT syllabus parameters indicate low comprehension ratings on these chapters. Lock these targeted topics directly into your 90-minute daily revision schedules!
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {weakTopics.slice(0, 7).map(topic => (
                <button 
                  key={topic.id}
                  type="button"
                  onClick={() => toggleTopicStatus(topic.id, 'weak')}
                  className={`text-[9px] font-extrabold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${getSubjectColorClass(topic.subject)} cursor-pointer hover:bg-zinc-900 duration-200`}
                  title="Click to mark as resolved/not weak"
                >
                  <Star className="w-2.5 h-2.5 fill-current" />
                  {topic.topicName}
                </button>
              ))}
              {weakTopics.length > 7 && (
                <span className="text-[9px] font-bold text-zinc-550 pt-1">+ {weakTopics.length - 7} more Chapters</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🎯 NEET DAILY TARGETS CONTROLLER */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-850/80 text-left">
        <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
          <ListTodo className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">NEET DAILY FOCUS TARGET LOGS</h3>
        </div>

        {/* Custom Target Builder */}
        <form onSubmit={handleAddTarget} className="flex flex-col md:flex-row gap-3 mb-4 text-left">
          <input
            type="text"
            value={newTargetTitle}
            onChange={(e) => setNewTargetTitle(e.target.value)}
            placeholder="Add custom target (e.g. solve 45 organic Chemistry MCQ drills, read NCERT Plant Kingdom...)"
            className="flex-1 px-4 py-3 bg-zinc-950 border border-zinc-900 text-xs rounded-2xl text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-purple-500 duration-200"
          />
          <div className="flex gap-2">
            <select
              value={newTargetSubject}
              onChange={(e: any) => setNewTargetSubject(e.target.value)}
              className="px-3.5 py-3 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded-2xl text-zinc-400 focus:outline-none focus:border-purple-500 cursor-pointer"
            >
              <option value="Biology">Biology</option>
              <option value="Physics">Physics</option>
              <option value="Chemistry">Chemistry</option>
            </select>
            <button
              type="submit"
              className="bg-purple-600 hover:bg-purple-505 text-white font-extrabold text-xs px-5 py-3 rounded-2xl transition-all shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Lock Target
            </button>
          </div>
        </form>

        {/* Logged targets list */}
        <div className="space-y-2.5">
          {dailyTargets.length === 0 ? (
            <div className="text-center py-8 bg-black/25 border border-dashed border-zinc-900 rounded-2xl">
              <p className="text-[11px] text-zinc-550 font-medium">No NEET objectives logged today. Write a mock MCQ drill target or NCERT reading goal above!</p>
            </div>
          ) : (
            dailyTargets.map((target) => (
              <div 
                key={target.id}
                id={`target-row-${target.id}`}
                className="flex items-center justify-between p-3.5 bg-black/45 border border-zinc-900 rounded-2xl hover:border-zinc-800 transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    id={`toggle-target-completed-${target.id}`}
                    onClick={() => toggleDailyTarget(target.id)}
                    className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      target.isCompleted ? 'bg-purple-500 border-purple-500 text-zinc-950 hover:bg-purple-405' : 'border-zinc-700 bg-zinc-950'
                    }`}
                  >
                    {target.isCompleted && <CheckCircle className="w-3.5 h-3.5 stroke-[3.5]" />}
                  </button>
                  <div className="min-w-0 truncate text-left">
                    <span className={`text-xs font-bold tracking-tight ${target.isCompleted ? 'line-through text-zinc-550' : 'text-zinc-200'}`}>
                      {target.title}
                    </span>
                    <span className={`align-middle font-bold text-[8px] uppercase tracking-wider ml-2 px-1.5 py-0.2 rounded border ${getSubjectColorClass(target.subject)}`}>
                      {target.subject}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  id={`delete-target-${target.id}`}
                  onClick={() => deleteDailyTarget(target.id)}
                  className="p-1.5 hover:bg-rose-500/15 rounded-lg text-zinc-650 hover:text-red-400 opacity-40 group-hover:opacity-100 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 📈 MOCK PERFORMANCE ANALYTICS LEADERBOARD */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-850/80 text-left">
        <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-purple-400" />
              MOCK PRESTIGE EXAMINATION SCORES
            </h3>
            <p className="text-[10px] text-zinc-550 mt-0.5">Logs the total sum out of 720 (Biology 360, Physics/Chemistry 180)</p>
          </div>
          
          <button
            type="button"
            onClick={() => setShowAddScore(!showAddScore)}
            className="p-1 px-3 text-xs bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-450 hover:text-white rounded-xl font-bold cursor-pointer transition-colors"
          >
            {showAddScore ? 'Minimize Panel' : 'Log New Score'}
          </button>
        </div>

        {showAddScore && (
          <form onSubmit={handleAddMockScore} className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-900 space-y-4 text-left">
            <span className="text-[9px] font-black text-purple-400 uppercase tracking-wider font-mono">Insert Mock Exam Scoresheet</span>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[10px] text-zinc-500 font-bold uppercase">Test Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NEET Grand Test #3 (Aakash/Allen Prep)"
                  value={inputTestName}
                  onChange={e => setInputTestName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-850 text-white rounded-xl p-2.5 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Biology (out of 360)</label>
                  <input
                    type="number"
                    max={360}
                    min={0}
                    required
                    value={inputBio}
                    onChange={e => setInputBio(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 text-white font-mono rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Physics (out of 180)</label>
                  <input
                    type="number"
                    max={180}
                    min={0}
                    required
                    value={inputPhys}
                    onChange={e => setInputPhys(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 text-white font-mono rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Chemistry (out of 180)</label>
                  <input
                    type="number"
                    max={180}
                    min={0}
                    required
                    value={inputChem}
                    onChange={e => setInputChem(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-850 text-white font-mono rounded-xl p-2.5 focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowAddScore(false)}
                className="px-3 py-1.5 text-zinc-500 hover:text-white"
              >
                Discard
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-505 text-white font-bold rounded-xl cursor-pointer"
              >
                Record Scoresheet
              </button>
            </div>
          </form>
        )}

        {/* Analytics scoreboard displays */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div className="p-4 bg-black/45 border border-zinc-900 rounded-2xl">
            <span className="text-[9px] font-bold text-zinc-550 block uppercase font-mono">Latest Score logged</span>
            <span className="text-2xl font-black text-white font-mono tracking-tight">{latestScore}</span>
            <span className="text-[10px] text-zinc-500 font-medium font-sans"> / 720 max rating</span>
          </div>
          
          <div className="p-4 bg-black/45 border border-zinc-900 rounded-2xl">
            <span className="text-[9px] font-bold text-zinc-550 block uppercase font-mono">Mock Scores Average</span>
            <span className="text-2xl font-black text-purple-400 font-mono tracking-tight">{averageMockScore}</span>
            <span className="text-[10px] text-zinc-500 font-medium font-sans"> / 720 rating mean</span>
          </div>

          <div className="p-4 bg-black/45 border border-zinc-900 rounded-2xl">
            <span className="text-[9px] font-bold text-zinc-550 block uppercase font-mono">NCERT Exam Readiness</span>
            <span className="text-2xl font-black text-emerald-450 font-mono tracking-tight">
              {averageMockScore >= 600 ? '👑 SECURED' : averageMockScore >= 500 ? '⚡ TARGETED' : '⚠️ UNSECURED'}
            </span>
            <span className="text-[10px] text-zinc-500 font-medium font-sans block mt-0.5">Threshold: 600 points</span>
          </div>
        </div>

        {/* Scores logs list */}
        <div className="space-y-2">
          {mockScores.map((score) => (
            <div key={score.id} className="p-3.5 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:border-zinc-850 duration-200">
              <div className="text-left space-y-1">
                <h5 className="text-xs font-extrabold text-zinc-200 tracking-tight leading-tight">{score.testName}</h5>
                <p className="text-[10px] text-zinc-550 font-mono">{score.date}</p>
                
                {/* Subject splits */}
                <div className="flex gap-2 text-[9px] font-mono font-semibold pt-1">
                  <span className="text-emerald-500 px-1.5 py-0.2 bg-emerald-500/5 rounded border border-emerald-500/10">Bio: {score.biology}/360</span>
                  <span className="text-amber-500 px-1.5 py-0.2 bg-amber-500/5 rounded border border-amber-500/10">Phys: {score.physics}/180</span>
                  <span className="text-violet-500 px-1.5 py-0.2 bg-violet-500/5 rounded border border-violet-500/10">Chem: {score.chemistry}/180</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
                <span className="text-sm font-black font-mono text-purple-400 bg-purple-500/15 border border-purple-500/15 px-3 py-1 rounded-xl">
                  {score.total}/720
                </span>
                
                <button
                  type="button"
                  onClick={() => handleDeleteScore(score.id)}
                  className="p-1 hover:bg-rose-950/15 rounded-md text-zinc-650 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 💡 NEET AI RECOMMENDATIONS SUMMARY BOARD */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-850/80 text-left relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-12 -mt-12 w-24 h-24 bg-gradient-to-br from-purple-600/10 to-transparent rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center gap-2 border-b border-zinc-900 pb-3 mb-4">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">AI Syllabus Advisor Directives</h3>
        </div>

        <div className="space-y-3 font-sans">
          <div className="space-y-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-purple-450 font-mono">Syllabus Weakpoint Highlight</span>
            <p className="text-sm font-extrabold text-white">{aiDiag.subjectPris}</p>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed bg-black/45 p-3 rounded-xl border border-zinc-900">
            {aiDiag.priorityTip}
          </p>
          <div className="text-[10px] text-zinc-550 flex items-start gap-1">
            <Star className="w-3.5 h-3.5 text-zinc-650 shrink-0 mt-0.5" />
            <span>AI recommendation updates dynamically on revision check events within the NCERT syllabus directory below.</span>
          </div>
        </div>
      </div>

      {/* 📖 CHAPTER COMPILATION SYLLABUS DIRECTORY CHECKLIST */}
      <div className="premium-glass rounded-3xl p-6 border-zinc-850/80 text-left">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-zinc-900 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-405" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 font-mono">COMPLETE NCERT SYLLABUS GRID</h3>
          </div>
          
          <div className="flex gap-1.5 p-1 bg-black/60 rounded-xl border border-zinc-900">
            {['Biology', 'Physics', 'Chemistry'].map((subj) => (
              <button
                key={subj}
                type="button"
                id={`subject-tab-${subj}`}
                onClick={() => setActiveSubjectTab(subj as any)}
                className={`px-3.5 py-1.5 text-[10px] font-extrabold uppercase rounded-lg tracking-wider transition-colors cursor-pointer ${
                  activeSubjectTab === subj
                    ? 'bg-zinc-900 text-white shadow border border-zinc-800'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {subj}
              </button>
            ))}
          </div>
        </div>

        {/* Search tool block */}
        <div className="mb-4">
          <input
            type="text"
            placeholder={`Search ${activeSubjectTab} chapter files or subcategories...`}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-900 text-xs text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-purple-500 placeholder-zinc-700"
          />
        </div>

        {/* Interactive chapters database list */}
        <div className="space-y-3">
          {filteredTopics.length === 0 ? (
            <div className="text-center py-6 text-zinc-550 text-xs">
              No matching NCERT chapters found under active criteria.
            </div>
          ) : (
            filteredTopics.map((topic) => (
              <div 
                key={topic.id}
                id={`topic-row-${topic.id}`}
                className="p-3.5 bg-black/35 hover:bg-zinc-900/10 border border-zinc-900 hover:border-zinc-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 duration-200"
              >
                <div className="text-left space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-white tracking-tight leading-snug">
                    {topic.topicName}
                  </h4>
                  <span className="text-[10px] text-zinc-550 block font-mono">
                    Category: {topic.chapter || 'General NCERT Focus'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:self-auto self-start">
                  
                  {/* Action 1: Syllabus Read completion */}
                  <button
                    type="button"
                    onClick={() => toggleTopicStatus(topic.id, 'completed')}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-colors cursor-pointer ${
                      topic.isCompleted 
                        ? 'bg-emerald-500/10 border-emerald-500/15 text-emerald-400' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {topic.isCompleted ? '✓ NCERT Read' : 'Unread'}
                  </button>

                  {/* Action 2: Revision complete */}
                  <button
                    type="button"
                    onClick={() => toggleTopicStatus(topic.id, 'revised')}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-colors cursor-pointer ${
                      topic.isRevised 
                        ? 'bg-indigo-500/10 border-indigo-500/15 text-indigo-400' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-300 hover:border-zinc-700'
                    }`}
                  >
                    {topic.isRevised ? '✓ Revised' : 'Revise'}
                  </button>

                  {/* Action 3: Weak chapter toggle */}
                  <button
                    type="button"
                    onClick={() => toggleTopicStatus(topic.id, 'weak')}
                    className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-colors cursor-pointer ${
                      topic.isWeak 
                        ? 'bg-rose-500/15 border-rose-500/20 text-rose-400 animate-pulse' 
                        : 'bg-zinc-950 border-zinc-900 text-zinc-550 hover:text-zinc-350'
                    }`}
                  >
                    {topic.isWeak ? '⚠️ Weak Chapter' : 'Strong Form'}
                  </button>

                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
