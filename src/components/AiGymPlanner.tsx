import React, { useState } from 'react';
import { 
  Sparkles, ShieldAlert, Dumbbell, Play, RefreshCw, 
  Trash2, Clipboard, Save, Plus, HelpCircle, AlertTriangle, 
  Activity, Clock, Flame, ChevronRight, Eye, Video, Download, CheckCircle, Edit2
} from 'lucide-react';
import { Exercise, WorkoutDay } from '../types';

interface AiGymPlannerProps {
  youtubeApiKey: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  geminiApiKey?: string;
  activeWorkoutDay: string;
  workouts: WorkoutDay[];
  onSaveWorkouts: (workouts: WorkoutDay[]) => void;
  onSelectExerciseForVideos: (ex: Exercise) => void;
}

interface GeneratedWorkout {
  workoutName: string;
  focus: string;
  goal: string;
  difficulty: string;
  summary: {
    totalExercises: number;
    totalSets: number;
    estimatedDurationMin: number;
    caloriesBurned: number;
    targetMuscles: string[];
    difficultyRating: string;
  };
  sections: {
    warmUp: any[];
    withoutMachine: any[];
    machine: any[];
    finisher: any[];
    coolDown: any[];
    stretching: any[];
  };
}

export default function AiGymPlanner({
  youtubeApiKey,
  addToast,
  geminiApiKey,
  activeWorkoutDay,
  workouts,
  onSaveWorkouts,
  onSelectExerciseForVideos
}: AiGymPlannerProps) {
  const [promptInput, setPromptInput] = useState('Chest + Triceps Routine');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [goal, setGoal] = useState('Muscle Gain');
  
  const [generating, setGenerating] = useState(false);
  const [generatedWorkout, setGeneratedWorkout] = useState<GeneratedWorkout | null>(null);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Edit inline States
  const [editingIndex, setEditingIndex] = useState<{ section: string; idx: number } | null>(null);
  const [editExerciseData, setEditExerciseData] = useState<any>(null);

  const suggestionPresets = [
    "I want to train Chest + Triceps today",
    "Today I want Legs",
    "Beginner Chest Workout",
    "Advanced Back Workout",
    "Arm Blast with only dumbbells",
    "Cardio and Abs home workout"
  ];

  const smartModifiers = [
    { label: "Dumbbells Only", text: " with only dumbbells" },
    { label: "No Machines", text: " without machines" },
    { label: "Home Workout", text: " at home workout" },
    { label: "Full Gym", text: " with full gym machines" }
  ];

  const handleGenerate = async () => {
    if (!promptInput.trim()) {
      addToast('Please write a target muscle focus or training prompt first!', 'error');
      return;
    }

    setGenerating(true);
    setWarningMessage(null);
    try {
      const res = await fetch('/api/ai-gym-planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: promptInput,
          difficulty,
          goal,
          geminiApiKey
        })
      });

      const data = await res.json();
      if (data.workout) {
        setGeneratedWorkout(data.workout);
        setIsAiGenerated(!!data.isAiGenerated);
        if (data.apiWarn) {
          setWarningMessage(`Note: Showing structured biometric plan (${data.apiWarn})`);
        } else {
          addToast('AI Workout Plan generated successfully!', 'success');
        }
      } else {
        throw new Error(data.error || 'Failed to construct workout plan');
      }
    } catch (err: any) {
      addToast(`Plan generation error: ${err.message}`, 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleApplyPreset = (prefix: string) => {
    setPromptInput(prefix);
  };

  const handleAddModifier = (modText: string) => {
    if (!promptInput.includes(modText)) {
      setPromptInput(prev => prev.trim() + modText);
    }
  };

  const handleCopyWorkoutToClipboard = () => {
    if (!generatedWorkout) return;

    let text = `🏋️‍♂️ AI WORKOUT PLAN PRO: ${generatedWorkout.workoutName}\n`;
    text += `Focus: ${generatedWorkout.focus} | Goal: ${generatedWorkout.goal} | Difficulty: ${generatedWorkout.difficulty}\n`;
    text += `Summary: ${generatedWorkout.summary.totalExercises} Exercises | ${generatedWorkout.summary.totalSets} Sets | ${generatedWorkout.summary.estimatedDurationMin} mins | ${generatedWorkout.summary.caloriesBurned} Calories\n\n`;

    const getSectionText = (title: string, list: any[]) => {
      if (!list || list.length === 0) return '';
      let sText = `--- ${title} ---\n`;
      list.forEach((ex, i) => {
        sText += `${i + 1}. ${ex.name} - ${ex.sets} sets x ${ex.reps} reps (Rest: ${ex.restTime})\n`;
        sText += `   * Benefits: ${ex.benefits?.join(', ')}\n`;
        sText += `   * Mistakes to avoid: ${ex.commonMistakes?.join(', ')}\n`;
        sText += `   * Guide: ${ex.instructions?.join(' -> ')}\n\n`;
      });
      return sText;
    };

    text += getSectionText('Warm Up', generatedWorkout.sections.warmUp);
    text += getSectionText('Without Machine Exercises', generatedWorkout.sections.withoutMachine);
    text += getSectionText('Machine / Cable Exercises', generatedWorkout.sections.machine);
    text += getSectionText('Finisher Exercises', generatedWorkout.sections.finisher);
    text += getSectionText('Cool Down', generatedWorkout.sections.coolDown);
    text += getSectionText('Stretching Recoveries', generatedWorkout.sections.stretching);

    navigator.clipboard.writeText(text);
    addToast('Workout plan copied as formatted text to clipboard!', 'success');
  };

  // Convert custom exercises structure to global model and inject into target routine day
  const handleAddWorkoutToToday = () => {
    if (!generatedWorkout) return;

    // Convert everything to Exercise types
    const newExercises: Exercise[] = [];
    const collectFromSec = (secName: string, list: any[]) => {
      if (!list) return;
      list.forEach((ex, i) => {
        const uniqueId = `ai-${secName}-${Date.now()}-${i}`;
        newExercises.push({
          id: uniqueId,
          name: `${ex.name} (${secName.toUpperCase()})`,
          targetMuscle: ex.targetMuscle || 'General',
          sets: String(ex.sets || '3'),
          reps: String(ex.reps || '10'),
          restTime: String(ex.restTime || '60s'),
          difficulty: (ex.difficulty && ['Beginner', 'Intermediate', 'Advanced'].includes(ex.difficulty)) ? ex.difficulty : difficulty,
          instructions: ex.instructions || ['Perform rep under complete control'],
          commonMistakes: ex.commonMistakes || ['Incorrect form speed control'],
          benefits: ex.benefits || ['Direct hypertrophy activation stimulation'],
          notes: `Created via AI Planner Pro • Goal: ${generatedWorkout.goal}`,
          youtubeKeyword: ex.name
        });
      });
    };

    collectFromSec('warm-up', generatedWorkout.sections.warmUp);
    collectFromSec('free', generatedWorkout.sections.withoutMachine);
    collectFromSec('machine', generatedWorkout.sections.machine);
    collectFromSec('finisher', generatedWorkout.sections.finisher);
    collectFromSec('cool-down', generatedWorkout.sections.coolDown);
    collectFromSec('stretch', generatedWorkout.sections.stretching);

    const updatedWorkouts = workouts.map(w => {
      if (w.day === activeWorkoutDay) {
        return {
          ...w,
          focus: `${w.focus} + AI Blast`,
          exercises: [...w.exercises, ...newExercises]
        };
      }
      return w;
    });

    onSaveWorkouts(updatedWorkouts);
    addToast(`Successfully injected ${newExercises.length} customized exercises into your ${activeWorkoutDay} routine! Scroll down/check exercises.`, 'success');
  };

  // Download export backup as JSON
  const handleExportWorkoutJson = () => {
    if (!generatedWorkout) return;
    try {
      const jsonStr = JSON.stringify(generatedWorkout, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roy_ai_workout_planner_${generatedWorkout.workoutName.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast('AI Workout Plan JSON schema exported!', 'success');
    } catch (err) {
      addToast('Failed to export AI plan.', 'error');
    }
  };

  // Save Workout directly as custom day replacement
  const handleSaveToDayOverwrite = () => {
    if (!generatedWorkout) return;

    const newExercises: Exercise[] = [];
    const collectFromSec = (secName: string, list: any[]) => {
      if (!list) return;
      list.forEach((ex, i) => {
        newExercises.push({
          id: `ai-save-${secName}-${Date.now()}-${i}`,
          name: `${ex.name} (${secName.toUpperCase()})`,
          targetMuscle: ex.targetMuscle || 'General',
          sets: String(ex.sets || '3'),
          reps: String(ex.reps || '10'),
          restTime: String(ex.restTime || '60s'),
          difficulty: difficulty,
          instructions: ex.instructions || ['Hold balanced form'],
          commonMistakes: ex.commonMistakes || ['Shrugging shoulders'],
          benefits: ex.benefits || ['Core hypertrophy activation'],
          notes: 'AI Blueprint Base Block',
          youtubeKeyword: ex.name
        });
      });
    };

    collectFromSec('warm', generatedWorkout.sections.warmUp);
    collectFromSec('free', generatedWorkout.sections.withoutMachine);
    collectFromSec('mach', generatedWorkout.sections.machine);
    collectFromSec('fin', generatedWorkout.sections.finisher);
    collectFromSec('cool', generatedWorkout.sections.coolDown);
    collectFromSec('stretch', generatedWorkout.sections.stretching);

    const updatedWorkouts = workouts.map(w => {
      if (w.day === activeWorkoutDay) {
        return {
          ...w,
          focus: generatedWorkout.focus,
          exercises: newExercises
        };
      }
      return w;
    });

    onSaveWorkouts(updatedWorkouts);
    addToast(`Saved & replaced your original ${activeWorkoutDay} routine with the new complete AI plan!`, 'success');
  };

  const startEditExercise = (section: string, idx: number, ex: any) => {
    setEditingIndex({ section, idx });
    setEditExerciseData({ ...ex });
  };

  const saveEditedExercise = () => {
    if (!generatedWorkout || !editingIndex || !editExerciseData) return;

    const updatedSections = { ...generatedWorkout.sections };
    const list = [...(updatedSections as any)[editingIndex.section]];
    list[editingIndex.idx] = editExerciseData;
    (updatedSections as any)[editingIndex.section] = list;

    setGeneratedWorkout({
      ...generatedWorkout,
      sections: updatedSections
    } as any);

    setEditingIndex(null);
    setEditExerciseData(null);
    addToast('Exercise details customized successfully!', 'success');
  };

  const handleLaunchTutorial = (ex: any) => {
    // Generate unified model compatibility mapping
    const structuredEx: Exercise = {
      id: ex.id || 'ai-virtual-' + Date.now(),
      name: ex.name,
      targetMuscle: ex.targetMuscle || 'General',
      sets: String(ex.sets || '3'),
      reps: String(ex.reps || '10'),
      restTime: String(ex.restTime || '90s'),
      difficulty: 'Intermediate',
      instructions: ex.instructions || ['Step 1: Set position accurately', 'Step 2: Lift under target tension'],
      commonMistakes: ex.commonMistakes || ['Using aggressive sway inertia'],
      benefits: ex.benefits || ['Accelerates biomechanic cell hypertrophy'],
      notes: 'Dynamic online search guide activation',
      youtubeKeyword: ex.name
    };

    onSelectExerciseForVideos(structuredEx);
    addToast(`Opening guides & triggering auto-scroll search for "${ex.name}"!`, 'info');
  };

  return (
    <div className="bg-zinc-900/30 border border-zinc-850 rounded-2xl p-6 space-y-6 text-left">
      <div className="flex items-center justify-between border-b border-zinc-850 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-655/10 rounded-xl border border-red-500/20">
            <Sparkles className="w-5 h-5 text-red-505" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">AI Gym Planner Pro</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Generate high-intensity smart workout blueprints powered by Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Preset Suggestions Section */}
      <div className="space-y-4">
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2">Preset Ideas</span>
          <div className="flex flex-wrap gap-2">
            {suggestionPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="text-xs px-3 py-1.5 bg-zinc-950 hover:bg-zinc-900 text-zinc-300 hover:text-white rounded-lg border border-zinc-900 transition-colors cursor-pointer"
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Modifiers */}
        <div>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest block mb-2 font-mono">Smart modifiers (Append)</span>
          <div className="flex flex-wrap gap-2">
            {smartModifiers.map((mod, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddModifier(mod.text)}
                className="text-[11px] px-2.5 py-1.5 bg-zinc-900/40 hover:bg-zinc-900 text-zinc-400 hover:text-red-400 rounded-lg border border-zinc-850/60 transition-colors cursor-pointer flex items-center gap-1"
              >
                <Plus className="w-3 h-3 text-red-500" />
                {mod.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input parameters */}
        <div className="space-y-4 pt-2">
          {/* Main prompt bar */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block font-sans">Target Focus / Desired Muscles</label>
            <div className="relative">
              <input
                type="text"
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                placeholder="e.g. Chest + Triceps home workout, Legs with dumbbells only..."
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl pl-4 pr-12 py-3.5 text-xs text-white placeholder-zinc-600 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500/40"
              />
              <Dumbbell className="absolute right-4 top-3.5 w-4.5 h-4.5 text-zinc-600" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Workout Difficulty Level</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setDifficulty(level)}
                    className={`text-xs py-2 px-3 rounded-lg border font-bold transition-all cursor-pointer text-center ${
                      difficulty === level 
                        ? 'bg-red-655 border-red-500 text-white shadow-lg shadow-red-600/10' 
                        : 'bg-zinc-950 border-zinc-900 hover:bg-zinc-900 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal selection */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Goal Focus</label>
              <select
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-white focus:border-red-500/50 focus:outline-none"
              >
                <option value="Fat Loss">🔥 Fat Loss & Burn</option>
                <option value="Muscle Gain">💪 Muscle Growth (Hypertrophy)</option>
                <option value="Strength">🏋️‍♂️ Absolute Power & Strength</option>
                <option value="Endurance">🫁 Muscular & Cardio Endurance</option>
                <option value="Body Recomposition">🔄 Athletic Recomposition</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="w-full bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-40 text-white font-bold text-xs py-3.5 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed border-0 font-sans tracking-wide uppercase"
          >
            {generating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                Planning and Optimizing Workout Biometrics...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
                Generate Custom AI Workout Plan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Generated output sheet block */}
      {generatedWorkout && (
        <div className="space-y-6 pt-4 border-t border-zinc-850" id="ai-planner-results-block animate-fade-in">
          {warningMessage && (
            <div className="text-xs bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 text-amber-300 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Workout Header Board */}
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start gap-3 border-b border-zinc-900/80 pb-3">
              <div>
                <span className="text-[9px] uppercase tracking-widest text-red-500 font-bold bg-red-500/10 px-2 py-0.5 rounded-md">
                  Active {isAiGenerated ? 'Gemini AI Verified' : 'Standard Fit Engine'} Plan
                </span>
                <h3 className="text-lg font-bold text-zinc-100 tracking-tight mt-1">{generatedWorkout.workoutName}</h3>
                <p className="text-xs text-zinc-400 font-medium">Muscle Focus: {generatedWorkout.focus}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap shrink-0">
                <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md font-mono border border-zinc-850">Goal: {generatedWorkout.goal}</span>
                <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2.5 py-1 rounded-md font-mono border border-zinc-850">Plan Level: {generatedWorkout.difficulty}</span>
              </div>
            </div>

            {/* Core workout indicators row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-900 flex items-center gap-2.5">
                <Dumbbell className="w-4.5 h-4.5 text-zinc-400" />
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-sans font-bold">Total Exercises</span>
                  <span className="text-xs font-bold text-white font-mono">{generatedWorkout.summary.totalExercises}</span>
                </div>
              </div>

              <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-900 flex items-center gap-2.5">
                <Clock className="w-4.5 h-4.5 text-zinc-400" />
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-sans font-bold">Est. Duration</span>
                  <span className="text-xs font-bold text-white font-mono">{generatedWorkout.summary.estimatedDurationMin} mins</span>
                </div>
              </div>

              <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-900 flex items-center gap-2.5">
                <Flame className="w-4.5 h-4.5 text-zinc-400" />
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-sans font-bold">Calories Burned</span>
                  <span className="text-xs font-bold text-white font-mono">{generatedWorkout.summary.caloriesBurned} kcal</span>
                </div>
              </div>

              <div className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-900 flex items-center gap-2.5">
                <Activity className="w-4.5 h-4.5 text-zinc-400" />
                <div>
                  <span className="text-[9px] text-zinc-500 block uppercase font-sans font-bold">Difficulty Rating</span>
                  <span className="text-xs font-bold text-white font-mono">{generatedWorkout.summary.difficultyRating}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SECTIONS GRID BLOCK LIST */}
          <div className="space-y-5">
            {[
              { id: 'warmUp', title: '1. Warm Up & Joint Prep Checks', list: generatedWorkout.sections.warmUp },
              { id: 'withoutMachine', title: '2. Free Weight & Bodyweight Activators', list: generatedWorkout.sections.withoutMachine },
              { id: 'machine', title: '3. Machine & Stabilized Pulleys', list: generatedWorkout.sections.machine },
              { id: 'finisher', title: '4. Fibers Finisher (Peak Burnout)', list: generatedWorkout.sections.finisher },
              { id: 'coolDown', title: '5. Cool Down & Cardiac Regulation', list: generatedWorkout.sections.coolDown },
              { id: 'stretching', title: '6. Static Recovery Stretching', list: generatedWorkout.sections.stretching }
            ].map((section) => {
              if (!section.list || section.list.length === 0) return null;

              return (
                <div key={section.id} className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5 pl-1">
                    <ChevronRight className="w-3.5 h-3.5 text-red-500" />
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-1 gap-2.5">
                    {section.list.map((ex, exIdx) => {
                      const isEditing = editingIndex?.section === section.id && editingIndex?.idx === exIdx;

                      if (isEditing) {
                        return (
                          <div key={exIdx} className="bg-zinc-950 p-4 border border-red-555 rounded-xl space-y-4">
                            <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider block border-b border-zinc-900 pb-1.5">Customize Plan Exercise</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase">Exercise Name</label>
                                <input
                                  type="text"
                                  value={editExerciseData.name}
                                  onChange={(e) => setEditExerciseData({ ...editExerciseData, name: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase">Sets</label>
                                <input
                                  type="text"
                                  value={editExerciseData.sets}
                                  onChange={(e) => setEditExerciseData({ ...editExerciseData, sets: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[9px] font-bold text-zinc-500 uppercase">Reps</label>
                                <input
                                  type="text"
                                  value={editExerciseData.reps}
                                  onChange={(e) => setEditExerciseData({ ...editExerciseData, reps: e.target.value })}
                                  className="w-full bg-zinc-900 border border-zinc-850 rounded-lg p-2 text-xs text-white"
                                />
                              </div>
                            </div>
                            <div className="flex gap-2 justify-end">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingIndex(null);
                                  setEditExerciseData(null);
                                }}
                                className="text-xs px-3 py-1.5 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 rounded-lg cursor-pointer"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={saveEditedExercise}
                                className="text-xs px-3 py-1.5 bg-red-655 text-white font-bold rounded-lg cursor-pointer border-0"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={exIdx}
                          className="bg-zinc-950 p-4 rounded-xl border border-zinc-900 hover:border-zinc-850 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition-all"
                        >
                          {/* Left Description info */}
                          <div className="space-y-1.5 flex-1 text-left min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h5 className="text-xs font-bold text-zinc-200 tracking-tight">{ex.name}</h5>
                              <span className="text-[8px] text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">{ex.targetMuscle || 'General'}</span>
                              <span className="text-[8px] font-mono text-zinc-500">Est. {ex.estimatedCalories || 30} kcal</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 flex flex-wrap gap-x-3 text-left">
                              <span>Sets: <strong className="text-zinc-200">{ex.sets}</strong></span>
                              <span>Reps: <strong className="text-zinc-200">{ex.reps}</strong></span>
                              <span>Rest: <strong className="text-zinc-200">{ex.restTime || '60s'}</strong></span>
                            </p>
                            
                            {/* Steps list */}
                            {ex.instructions && ex.instructions.length > 0 && (
                              <div className="pt-1.5 space-y-1 border-t border-zinc-900/40 text-left">
                                <span className="text-[8px] uppercase tracking-wider text-zinc-500 font-bold block">Execution Technique</span>
                                <ul className="list-decimal pl-3.5 space-y-0.5">
                                  {ex.instructions.map((step: string, stepIdx: number) => (
                                    <li key={stepIdx} className="text-[10px] text-zinc-400 leading-tight font-medium text-left">{step}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Common Mistakes */}
                            {ex.commonMistakes && ex.commonMistakes.length > 0 && (
                              <div className="text-left pt-1">
                                <span className="text-[8px] font-bold text-rose-455 uppercase tracking-wider">Mistakes Avoid:</span>
                                <p className="text-[10px] text-zinc-400 italic font-mono inline pl-1">{ex.commonMistakes.join(', ')}</p>
                              </div>
                            )}
                          </div>

                          {/* Action controls */}
                          <div className="flex items-center gap-1.5 self-end xl:self-center shrink-0">
                            <button
                              type="button"
                              onClick={() => startEditExercise(section.id, exIdx, ex)}
                              className="p-1 px-2.5 bg-zinc-900 hover:bg-zinc-850 rounded-lg text-[10px] text-zinc-400 hover:text-white transition-colors cursor-pointer border border-zinc-850"
                            >
                              <Edit2 className="w-3 h-3 inline mr-1" /> Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => handleLaunchTutorial(ex)}
                              className="p-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 hover:border-zinc-700 text-[10.5px] font-bold text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center gap-1 border border-zinc-850"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Guide & Videos
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Save/Toolbar Drawer */}
          <div className="p-4 bg-zinc-950 rounded-2xl border border-zinc-900 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-widest">Apply Active Generated Plan</span>
            </div>
            
            <p className="text-xs text-zinc-500">
              Save this plan directly into Roy's customized workout routine database, append it to your active standard training list, or export it as file coordinates.
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-2">
              {/* Overwrite schedule plan */}
              <button
                type="button"
                onClick={handleSaveToDayOverwrite}
                className="px-4 py-2 bg-red-655 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer border-0 flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Overwrite {activeWorkoutDay} Schedule
              </button>

              {/* Append routine today */}
              <button
                type="button"
                onClick={handleAddWorkoutToToday}
                className="px-4 py-2 bg-zinc-900 hover:bg-zinc-850 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-800 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 text-zinc-400" />
                Add To Today's Routine
              </button>

              {/* Copy plain format */}
              <button
                type="button"
                onClick={handleCopyWorkoutToClipboard}
                className="p-2 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-colors border border-zinc-800 cursor-pointer flex items-center gap-1"
              >
                <Clipboard className="w-3.5 h-3.5" />
                Copy Workout
              </button>

              {/* JSON export backup schema */}
              <button
                type="button"
                onClick={handleExportWorkoutJson}
                className="p-2 px-3 bg-zinc-900 hover:bg-zinc-850 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-colors border border-zinc-800 cursor-pointer flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                Export Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
