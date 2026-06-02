import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, RotateCcw, Youtube, BookOpen, AlertTriangle, CheckCircle, 
  Award, Plus, Minus, ArrowLeft, Eye, ShieldAlert, Dumbbell,
  X, Edit2, Trash2, Copy, Save, ArrowUp, ArrowDown, Upload, Download,
  Sparkles, ChevronRight, ChevronLeft, Flame, Clock, Heart, HelpCircle, RefreshCw
} from 'lucide-react';
import { WorkoutDay, Exercise } from '../types';
import AiGymPlanner from './AiGymPlanner';

interface GymTabProps {
  currentDay: string;
  workouts: WorkoutDay[];
  onSaveWorkouts: (workouts: WorkoutDay[]) => void;
  youtubeApiKey: string;
  addToast: (text: string, type: 'success' | 'error' | 'info') => void;
  gymProgress: { [exerciseId: string]: boolean };
  toggleGymExercise: (exerciseId: string) => void;
  isGymTimeAuto: boolean;
  geminiApiKey?: string;
}

export default function GymTab({
  currentDay,
  workouts,
  onSaveWorkouts,
  youtubeApiKey,
  addToast,
  gymProgress,
  toggleGymExercise,
  isGymTimeAuto,
  geminiApiKey
}: GymTabProps) {
  const [selectedDay, setSelectedDay] = useState<string>(currentDay);
  const [subTab, setSubTab] = useState<'schedule' | 'ai-planner'>('schedule');
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activePlayerVideo, setActivePlayerVideo] = useState<{ videoId: string; title: string } | null>(null);

  // Custom Workout Editor States
  const [editingExerciseId, setEditingExerciseId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Exercise>>({});
  const [showEditorInline, setShowEditorInline] = useState(false);

  // Esc key logic to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActivePlayerVideo(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Rest Timer State
  const [timerDuration, setTimerDuration] = useState<number>(90); // 90 seconds default
  const [secondsLeft, setSecondsLeft] = useState<number>(90);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Manual override if Gym Mode is inactive in standard hours
  const [forcedGymMode, setForcedGymMode] = useState<boolean>(false);

  // Active items derived from state
  const activeWorkout = workouts.find(w => w.day === selectedDay) || workouts[0];
  const isGymModeVisible = isGymTimeAuto || forcedGymMode;

  // Initialize selected exercise when active workout day changes
  useEffect(() => {
    if (activeWorkout && activeWorkout.exercises.length > 0) {
      setSelectedExercise(activeWorkout.exercises[0]);
      const initialRest = parseInt(activeWorkout.exercises[0].restTime) || 90;
      setTimerDuration(initialRest);
      setSecondsLeft(initialRest);
      setIsTimerRunning(false);
      fetchTutorialVideos(activeWorkout.exercises[0].name);
    } else {
      setSelectedExercise(null);
    }
  }, [selectedDay]);

  const scrollToSelectedExerciseDetail = () => {
    setTimeout(() => {
      const el = document.getElementById('exercise-detail-viewer');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleSelectExercise = (ex: Exercise) => {
    const isSame = selectedExercise?.id === ex.id;
    setSelectedExercise(ex);

    if (!isSame) {
      const parsedRest = parseInt(ex.restTime) || 90;
      setTimerDuration(parsedRest);
      setSecondsLeft(parsedRest);
      setIsTimerRunning(false);
      fetchTutorialVideos(ex.youtubeKeyword || ex.name);
    }
    scrollToSelectedExerciseDetail();
  };

  // Custom Workout Creation & Modifying handlers
  const handleCreateExercise = () => {
    const newEx: Exercise = {
      id: 'custom-' + Date.now(),
      name: 'New Custom Exercise',
      targetMuscle: 'Upper Body',
      sets: '3',
      reps: '12',
      restTime: '90s',
      difficulty: 'Intermediate',
      instructions: [
        'Engage abdominal muscles for stabilization core.',
        'Pull under uniform control, fully shortening targeted fibers.',
        'Release concentric phase with eccentric resistance.'
      ],
      commonMistakes: [
        'Using heavy jerky movements over clean mechanics.',
        'Limiting range of motion during terminal repetitions.'
      ],
      benefits: [
        'Increases relative muscular contraction power.',
        'Secures tendon joints and balances physical postures.'
      ],
      notes: 'Focus on pure force application, Ritik!',
      youtubeKeyword: ''
    };

    const updatedWorkouts = workouts.map(w => {
      if (w.day === selectedDay) {
        return {
          ...w,
          exercises: [...w.exercises, newEx]
        };
      }
      return w;
    });

    onSaveWorkouts(updatedWorkouts);
    setSelectedExercise(newEx);
    setEditingExerciseId(newEx.id);
    setEditFormData({ ...newEx });
    addToast('New custom exercise injected! Edit details below.', 'success');
  };

  const handleDeleteExercise = (exId: string) => {
    if (!window.confirm('Delete this exercise from your routine permanently?')) return;

    if (selectedExercise?.id === exId) {
      setSelectedExercise(null);
    }

    const updatedWorkouts = workouts.map(w => {
      if (w.day === selectedDay) {
        return {
          ...w,
          exercises: w.exercises.filter(ex => ex.id !== exId)
        };
      }
      return w;
    });

    onSaveWorkouts(updatedWorkouts);
    addToast('Exercise deleted successfully.', 'info');
  };

  const handleStartEdit = (ex: Exercise) => {
    setEditingExerciseId(ex.id);
    setEditFormData({ ...ex });
  };

  const handleSaveEdit = (exId: string) => {
    if (!editFormData.name?.trim()) {
      addToast('Exercise name cannot be blank.', 'error');
      return;
    }

    const updatedWorkouts = workouts.map(w => {
      if (w.day === selectedDay) {
        return {
          ...w,
          exercises: w.exercises.map(ex => {
            if (ex.id === exId) {
              return {
                ...ex,
                ...editFormData
              } as Exercise;
            }
            return ex;
          })
        };
      }
      return w;
    });

    onSaveWorkouts(updatedWorkouts);
    setEditingExerciseId(null);
    setEditFormData({});
    addToast('Exercise parameters saved inline successfully!', 'success');

    // Sync selected element reference
    const freshlySaved = updatedWorkouts.find(w => w.day === selectedDay)?.exercises.find(e => e.id === exId);
    if (freshlySaved) {
      setSelectedExercise(freshlySaved);
    }
  };

  const moveExercise = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= activeWorkout.exercises.length) return;

    const reorderedList = [...activeWorkout.exercises];
    const temp = reorderedList[index];
    reorderedList[index] = reorderedList[targetIdx];
    reorderedList[targetIdx] = temp;

    const updatedWorkouts = workouts.map(w => {
      if (w.day === selectedDay) {
        return { ...w, exercises: reorderedList };
      }
      return w;
    });

    onSaveWorkouts(updatedWorkouts);
    addToast('Exercise collection reordered!', 'success');
  };

  const fetchTutorialVideos = async (searchQuery: string) => {
    setLoadingVideos(true);
    setApiError(null);
    try {
      const response = await fetch('/api/youtube-tutorials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          youtubeApiKey,
          searchQuery: searchQuery + ' exercise form guide'
        })
      });
      const data = await response.json();
      setVideos(data.videos || []);
      if (data.isError) {
        setApiError('Standard Youtube API quota exceeded. Falling back to localized instructional cards.');
      }
    } catch {
      setApiError('Could not sync online videos. Loading local guidelines.');
    } finally {
      setLoadingVideos(false);
    }
  };

  // Rest timer tick effect
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            addToast('⏰ Rest finished! Get back to the sets!', 'success');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning]);

  const handleStartTimer = () => {
    if (secondsLeft === 0) setSecondsLeft(timerDuration);
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    setSecondsLeft(timerDuration);
  };

  const adjustTimerMultiplier = (offset: number) => {
    setTimerDuration(prev => {
      const updated = Math.max(10, prev + offset);
      if (!isTimerRunning) setSecondsLeft(updated);
      return updated;
    });
  };

  // Stats computation
  const completedCount = activeWorkout.exercises.filter(ex => gymProgress[ex.id]).length;
  const totalCount = activeWorkout.exercises.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  
  // Approximate calorie burn calculations (e.g. 100 kcal base + 35 kcal per completed exercise)
  const estimatedCaloriesBurned = 100 + (completedCount * 45);
  const workoutDurationEstimated = totalCount * 10; // ~10 min average per exercise

  const handleBackupExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workouts, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `roy_workout_planner_data_backup.json`);
    dlAnchor.click();
    addToast('Workout database downloaded!', 'success');
  };

  const handleBackupImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            onSaveWorkouts(parsed);
            addToast('Workout configuration restored perfectly!', 'success');
          } else {
            addToast('Invalid configuration file structure.', 'error');
          }
        } catch {
          addToast('File reading error. Check JSON validity.', 'error');
        }
      };
      reader.readAsText(files[0]);
    }
  };

  return (
    <div className="space-y-6 pb-26 animate-fade-in" id="gym-mode-container">
      
      {/* OFF-HOUR GATEWAY SCREEN */}
      {!isGymModeVisible ? (
        <div className="premium-glass rounded-3xl p-8 text-center border-zinc-805 text-left max-w-xl mx-auto my-6 space-y-4">
          <div className="p-4 bg-zinc-900/60 border border-zinc-800 rounded-2xl w-16 h-16 flex items-center justify-center text-zinc-550 mx-auto animate-pulse">
            <Dumbbell className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold tracking-tight text-white uppercase text-center font-mono">Gym Routine Gates Suspended</h2>
            <p className="text-xs text-zinc-400 leading-normal text-center font-sans">
              To guarantee bulletproof academic concentration on NEET preps, Hardcore Gym Mode and schedule panels lock automatically during non-training hours (active: 04:30 AM to 06:30 AM).
            </p>
          </div>
          <div className="pt-2 text-center">
            <button
              type="button"
              id="force-gym-mode-btn"
              onClick={() => setForcedGymMode(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-red-650 to-amber-600 font-bold hover:from-red-500 hover:to-amber-500 text-white text-xs rounded-xl cursor-pointer shadow-lg ease-out duration-300 transform active:scale-95 uppercase tracking-wider font-mono flex items-center gap-2 mx-auto"
            >
              <Flame className="w-4 h-4 text-white" />
              Manual Override: Trigger Gym Mode Now
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* TOP HEADER STATUS */}
          <div className="relative overflow-hidden rounded-3xl premium-glass p-5 border-zinc-850 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-500/10 border border-red-500/15 rounded-2xl text-red-400">
                <Dumbbell className="w-6 h-6 animate-pulse" />
              </div>
              <div className="text-left space-y-0.5">
                <span className="text-[10px] font-black text-red-455 tracking-widest uppercase font-mono">HYPER TROPHY ENFORCEMENT ACTIVE</span>
                <h1 className="text-xl font-black text-white uppercase tracking-tight">GYM COMMAND CONSOLE V3</h1>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setSubTab('schedule')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${subTab === 'schedule' ? 'bg-red-650 text-white font-extrabold border-red-500/20 shadow' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
              >
                Iron Schedule
              </button>
              <button
                type="button"
                onClick={() => setSubTab('ai-planner')}
                className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${subTab === 'ai-planner' ? 'bg-red-650 text-white font-extrabold border-red-500/20 shadow' : 'bg-zinc-900 border border-zinc-800 text-zinc-400'}`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                AI Gym Planner Pro
              </button>
              {forcedGymMode && (
                <button
                  type="button"
                  id="exit-forced-gym-btn"
                  onClick={() => setForcedGymMode(false)}
                  className="px-3.5 py-2 text-xs bg-zinc-950 border border-zinc-900 hover:text-white text-zinc-550 rounded-xl"
                >
                  Close Override
                </button>
              )}
            </div>
          </div>

          {subTab === 'ai-planner' ? (
            <div className="bg-transparent">
              <AiGymPlanner 
                youtubeApiKey={youtubeApiKey}
                addToast={addToast}
                geminiApiKey={geminiApiKey}
                activeWorkoutDay={selectedDay}
                workouts={workouts}
                onSaveWorkouts={onSaveWorkouts}
                onSelectExerciseForVideos={handleSelectExercise}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* PRIMARY LEFT PANEL: ACTIVE SCHEDULE & WORKOUT SETS */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* 7-DAY ROTATOR HEADER */}
                <div className="premium-glass p-4 rounded-3xl border-zinc-850/80">
                  <div className="flex items-center justify-between gap-1 overflow-x-auto invisible-scrollbar pb-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const active = selectedDay === day;
                      const hasSession = workouts.find(w => w.day === day)?.exercises.length || 0;
                      return (
                        <button
                          key={day}
                          id={`day-select-btn-${day}`}
                          onClick={() => setSelectedDay(day)}
                          className={`flex-1 min-w-[72px] py-3 rounded-2xl flex flex-col items-center justify-center transition-all cursor-pointer border ${
                            active 
                              ? 'bg-red-650 text-white font-extrabold border-red-500/30' 
                              : 'bg-zinc-950 border-zinc-900 text-zinc-500 hover:text-zinc-300'
                          }`}
                        >
                          <span className="text-[10px] font-black uppercase tracking-wider font-mono">{day.substring(0,3)}</span>
                          <span className={`text-[9px] font-medium block mt-1 ${active ? 'text-red-200' : 'text-zinc-650'}`}>
                            {hasSession > 0 ? `${hasSession} Ex` : 'Rest Day'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CURRENT FOCUS CARD METRICS */}
                <div className="premium-glass p-6 rounded-3xl border-zinc-850/80 relative text-left space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3 mb-1">
                    <div>
                      <span className="text-[10px] text-zinc-500 uppercase font-bold font-mono">Muscle Targets In Focus</span>
                      <h3 className="text-sm font-black text-white uppercase tracking-tight font-sans mt-0.5">
                        {activeWorkout ? activeWorkout.focus : 'General Recovery'}
                      </h3>
                    </div>
                    
                    <span className="text-[10px] font-bold font-mono px-2 py-1 text-red-400 bg-red-400/10 border border-red-400/15 rounded-lg uppercase">
                      {progressPercent}% Complete
                    </span>
                  </div>

                  {/* Aesthetic Circular Rings Row */}
                  <div className="grid grid-cols-3 gap-2.5 text-center">
                    <div className="p-3 bg-black/45 border border-zinc-900 rounded-2xl">
                      <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-zinc-500 block uppercase font-mono">Est Calories</span>
                      <span className="text-sm font-black text-white font-mono mt-0.5 inline-block">{estimatedCaloriesBurned} kcal</span>
                    </div>
                    
                    <div className="p-3 bg-black/45 border border-zinc-900 rounded-2xl">
                      <Clock className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-zinc-500 block uppercase font-mono">Duration</span>
                      <span className="text-sm font-black text-white font-mono mt-0.5 inline-block">{workoutDurationEstimated} mins</span>
                    </div>

                    <div className="p-3 bg-black/45 border border-zinc-900 rounded-2xl">
                      <Award className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                      <span className="text-[10px] font-bold text-zinc-500 block uppercase font-mono">Exercises</span>
                      <span className="text-sm font-black text-white font-mono mt-0.5 inline-block">{completedCount} / {totalCount}</span>
                    </div>
                  </div>

                  <div className="w-full h-2.5 bg-zinc-950 border border-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-650 to-orange-500 duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {/* EXERCISES ITEM COLUMN */}
                <div className="premium-glass p-5 rounded-3xl border-zinc-850/80 space-y-4">
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                    <div>
                      <h3 className="text-xs font-bold text-zinc-455 uppercase tracking-widest font-mono">Exercises List</h3>
                      <p className="text-[10px] text-zinc-550 mt-0.5">Toggle complete to boost daily discipline score</p>
                    </div>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowEditorInline(!showEditorInline)}
                        className="p-1 px-3 text-xs border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 hover:text-white text-zinc-400 rounded-xl cursor-pointer font-bold transition-colors"
                      >
                        {showEditorInline ? 'Hide Config' : 'Quick Modifiers'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateExercise}
                        className="p-1.5 bg-red-650 hover:bg-red-500 text-white rounded-xl cursor-pointer shadow flex items-center gap-1 text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Incline Ex
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {activeWorkout.exercises.length === 0 ? (
                      <div className="text-center py-10 bg-black/25 border border-dashed border-zinc-900 rounded-2xl text-zinc-550 space-y-2">
                        <Dumbbell className="w-8 h-8 text-zinc-700 mx-auto" />
                        <p className="text-xs font-medium">Rest Day - Proper recovery is priority. Read NEET Biology.</p>
                      </div>
                    ) : (
                      activeWorkout.exercises.map((ex, index) => {
                        const isSelected = selectedExercise?.id === ex.id;
                        const isDone = !!gymProgress[ex.id];

                        return (
                          <div 
                            key={ex.id}
                            id={`exercise-row-${ex.id}`}
                            className={`flex flex-col gap-2 p-3.5 rounded-2xl border transition-all duration-300 transform relative text-left overflow-hidden ${
                              isSelected 
                                ? 'bg-zinc-900/40 border-[var(--theme-primary,#ef4444)]/45' 
                                : 'bg-black/35 border-zinc-900/70 hover:border-zinc-800 hover:bg-black/45'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                {/* Toggle Execution Checkbox */}
                                <button
                                  type="button"
                                  id={`toggle-exercise-done-${ex.id}`}
                                  onClick={() => toggleGymExercise(ex.id)}
                                  className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                                    isDone 
                                      ? 'bg-red-650 border-red-650 text-white font-black hover:bg-red-500' 
                                      : 'border-zinc-750 bg-zinc-950 hover:border-zinc-500'
                                  }`}
                                >
                                  {isDone && <CheckCircle className="w-3.5 h-3.5 stroke-[3.5]" />}
                                </button>

                                <div className="min-w-0" onClick={() => handleSelectExercise(ex)}>
                                  <h4 className={`text-xs sm:text-sm font-extrabold tracking-tight cursor-pointer ${isDone ? 'line-through text-zinc-550' : 'text-zinc-200'}`}>
                                    {ex.name}
                                  </h4>
                                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                                      {ex.targetMuscle}
                                    </span>
                                    <span className="text-[10px] text-zinc-400 font-mono">
                                      • {ex.sets} Sets × {ex.reps} Reps
                                    </span>
                                    <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.2 rounded">
                                      {ex.difficulty}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* ACTIONS ROW */}
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  id={`select-ex-detail-btn-${ex.id}`}
                                  onClick={() => handleSelectExercise(ex)}
                                  className={`p-1.5 rounded-lg border text-zinc-400 hover:text-white transition-all cursor-pointer ${isSelected ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-zinc-950 border-zinc-900'}`}
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                                
                                {showEditorInline && (
                                  <div className="flex items-center gap-1 ml-1.5">
                                    <button
                                      type="button"
                                      disabled={index === 0}
                                      onClick={() => moveExercise(index, 'up')}
                                      className="p-1 hover:bg-zinc-800 text-zinc-550 hover:text-white disabled:opacity-30 rounded"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={index === activeWorkout.exercises.length - 1}
                                      onClick={() => moveExercise(index, 'down')}
                                      className="p-1 hover:bg-zinc-800 text-zinc-550 hover:text-white disabled:opacity-30 rounded"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(ex)}
                                      className="p-1 hover:bg-zinc-800 text-zinc-450 hover:text-white rounded"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteExercise(ex.id)}
                                      className="p-1 hover:bg-zinc-850 text-rose-500 rounded"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* INLINE EDIT FORM EXPANSION */}
                            {editingExerciseId === ex.id && (
                              <div className="p-3.5 bg-black/60 rounded-xl border border-zinc-850 mt-2 space-y-3">
                                <span className="text-[9px] font-black text-red-400 uppercase font-mono">Parameters Modifier</span>
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                  <div className="space-y-1 col-span-2">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Name</label>
                                    <input
                                      type="text"
                                      value={editFormData.name || ''}
                                      onChange={e => setEditFormData({...editFormData, name: e.target.value})}
                                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded p-1.5 text-xs focus:outline-none focus:border-red-500"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Muscle Group</label>
                                    <input
                                      type="text"
                                      value={editFormData.targetMuscle || ''}
                                      onChange={e => setEditFormData({...editFormData, targetMuscle: e.target.value})}
                                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded p-1.5 text-xs focus:outline-none focus:border-red-500"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Difficulty</label>
                                    <select
                                      value={editFormData.difficulty || 'Beginner'}
                                      onChange={e => setEditFormData({...editFormData, difficulty: e.target.value as any})}
                                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded p-1.5 text-xs focus:outline-none cursor-pointer"
                                    >
                                      <option value="Beginner">Beginner</option>
                                      <option value="Intermediate">Intermediate</option>
                                      <option value="Advanced">Advanced</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Sets</label>
                                    <input
                                      type="text"
                                      value={editFormData.sets || ''}
                                      onChange={e => setEditFormData({...editFormData, sets: e.target.value})}
                                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded p-1.5 text-xs focus:outline-none focus:border-red-500"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Reps</label>
                                    <input
                                      type="text"
                                      value={editFormData.reps || ''}
                                      onChange={e => setEditFormData({...editFormData, reps: e.target.value})}
                                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded p-1.5 text-xs focus:outline-none focus:border-red-500"
                                    />
                                  </div>
                                  <div className="space-y-1 col-span-2">
                                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Rest Time</label>
                                    <input
                                      type="text"
                                      value={editFormData.restTime || ''}
                                      onChange={e => setEditFormData({...editFormData, restTime: e.target.value})}
                                      className="w-full bg-zinc-950 border border-zinc-900 text-white rounded p-1.5 text-xs focus:outline-none focus:border-red-500"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                  <button
                                    type="button"
                                    className="px-2 py-1 bg-zinc-900 text-zinc-400 hover:text-white rounded"
                                    onClick={() => setEditingExerciseId(null)}
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    className="px-3.5 py-1 bg-red-650 text-white rounded font-bold"
                                    onClick={() => handleSaveEdit(ex.id)}
                                  >
                                    Save Config
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* WORKOUT SYSTEM DATABASE EXPORTER  */}
                <div className="premium-glass p-4.5 rounded-3xl border-zinc-850/80 flex flex-wrap items-center justify-between gap-3 text-left">
                  <div>
                    <h5 className="text-[11px] font-bold text-zinc-400 uppercase font-mono">Backup Database</h5>
                    <p className="text-[10px] text-zinc-550 font-sans">Export configuration or restore files instantly</p>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleBackupExport}
                      className="p-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Back Up
                    </button>
                    <label className="p-1.5 px-3 bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 text-zinc-100 hover:text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 text-zinc-400" />
                      Restore
                      <input type="file" accept=".json" onChange={handleBackupImport} className="hidden" />
                    </label>
                  </div>
                </div>

              </div>

              {/* SECONDARY RIGHT PANEL: SMART EXERCISE EXPERIENCE & SECURE VIDEOS */}
              <div className="lg:col-span-5 space-y-6" id="exercise-detail-viewer">
                
                {selectedExercise ? (
                  <div className="premium-glass p-6 rounded-3xl border-zinc-850/80 text-left space-y-5 animate-slide-up">
                    
                    {/* EXERCISE TITLE */}
                    <div className="border-b border-zinc-900 pb-4">
                      <span className="text-[9px] uppercase tracking-widest text-indigo-400 font-extrabold font-mono">Smart Exercise Assistant</span>
                      <h2 className="text-lg font-black text-white tracking-tight font-sans mt-1">
                        {selectedExercise.name}
                      </h2>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[9px] font-bold rounded px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/15 uppercase font-mono">
                          Target: {selectedExercise.targetMuscle}
                        </span>
                        <span className="text-[9px] font-bold rounded px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 uppercase font-mono">
                          Rest: {selectedExercise.restTime || '90s'}
                        </span>
                        <span className="text-[9px] font-bold rounded px-2 py-0.5 bg-zinc-950 text-zinc-400 border border-zinc-900 uppercase font-mono">
                          {selectedExercise.difficulty} Volume
                        </span>
                      </div>
                    </div>

                    {/* REST TIMER SECTION */}
                    <div className="p-4 bg-black/60 rounded-2xl border border-zinc-900 space-y-3.5 text-center">
                      <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider font-mono">REST INTERVAL CONTROL</span>
                        
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => adjustTimerMultiplier(-15)}
                            className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs"
                          >
                            -15
                          </button>
                          <button
                            type="button"
                            onClick={() => adjustTimerMultiplier(15)}
                            className="w-6 h-6 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 flex items-center justify-center font-bold text-xs"
                          >
                            +15
                          </button>
                        </div>
                      </div>

                      <div className="flex items-baseline justify-center gap-2 font-mono">
                        <span className="text-3xl font-black text-white">{secondsLeft}</span>
                        <span className="text-xs text-zinc-500 font-bold uppercase font-sans">s remaining</span>
                      </div>

                      <div className="flex items-center justify-center gap-1.5 pt-1">
                        {!isTimerRunning ? (
                          <button
                            type="button"
                            onClick={handleStartTimer}
                            className="px-6 py-2.5 bg-emerald-650 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                          >
                            <Play className="w-3.5 h-3.5 fill-white" />
                            Start Rest
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={handlePauseTimer}
                            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow"
                          >
                            <Pause className="w-3.5 h-3.5" />
                            Pause Rest
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={handleResetTimer}
                          className="p-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl border border-zinc-800"
                          title="Reset Timer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* SMART EXPANDABLE EXERCISE LOGICS */}
                    <div className="space-y-4">
                      
                      {/* HOW TO SECURED */}
                      {selectedExercise.instructions && selectedExercise.instructions.length > 0 && (
                        <div className="space-y-1.5 text-left">
                          <span className="text-[10px] font-black text-zinc-455 uppercase tracking-wider font-mono flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                            How To Do Section
                          </span>
                          <ol className="space-y-1.5">
                            {selectedExercise.instructions.map((inst, i) => (
                              <li key={i} className="text-[11px] leading-relaxed text-zinc-300 flex items-start gap-2">
                                <span className="font-mono text-indigo-400 font-black text-[10px] bg-indigo-500/10 min-w-[18px] h-4.5 flex items-center justify-center rounded mt-0.5">{i+1}</span>
                                <span className="pt-0.5">{inst}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}

                      {/* COMMON MISTAKES HIGHLIGHT */}
                      {selectedExercise.commonMistakes && selectedExercise.commonMistakes.length > 0 && (
                        <div className="space-y-1.5 text-left bg-rose-950/10 border border-rose-500/10 rounded-2xl p-4.5">
                          <span className="text-[10px] font-black text-rose-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-455" />
                            Critical Faults to Avoid
                          </span>
                          <ul className="space-y-1.5 md:space-y-1 mt-1.5">
                            {selectedExercise.commonMistakes.map((mist, idx) => (
                              <li key={idx} className="text-[11px] leading-relaxed text-zinc-400 flex items-start gap-1.5">
                                <span className="text-rose-500 font-bold shrink-0 mt-0.5">⚠️</span>
                                <span>{mist}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* BENEFITS HIGHLIGHT */}
                      {selectedExercise.benefits && selectedExercise.benefits.length > 0 && (
                        <div className="space-y-1.5 text-left bg-emerald-950/10 border border-emerald-500/10 rounded-2xl p-4.5">
                          <span className="text-[10px] font-black text-emerald-355 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            Muscle Trophy Benefits
                          </span>
                          <ul className="space-y-1 mt-1.5">
                            {selectedExercise.benefits.map((ben, idx) => (
                              <li key={idx} className="text-[11px] leading-relaxed text-zinc-400 flex items-start gap-1.5">
                                <span className="text-emerald-500 font-bold shrink-0">✓</span>
                                <span>{ben}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* BEGINNER VS ADVANCED VERSIONS */}
                      <div className="space-y-1.5 p-3.5 bg-zinc-950/50 border border-zinc-900 rounded-2xl text-left">
                        <span className="text-[9px] font-black text-amber-500 uppercase font-mono block">Volume Variations</span>
                        <div className="grid grid-cols-2 gap-3 mt-1 text-xs">
                          <div>
                            <p className="text-[9px] font-extrabold uppercase text-zinc-500">Beginner Form</p>
                            <p className="text-[11px] text-zinc-350 mt-0.5 leading-normal">Fewer sets, deliberate rest up to 120s, lighter weights focused on exact vector mechanics.</p>
                          </div>
                          <div>
                            <p className="text-[9px] font-extrabold uppercase text-zinc-500">Beast Version</p>
                            <p className="text-[11px] text-zinc-350 mt-0.5 leading-normal">High volume overload, drop sets at final repetition limit, strict rest restricted to 60s.</p>
                          </div>
                        </div>
                      </div>

                      {/* NOTES */}
                      {selectedExercise.notes && (
                        <div className="text-xs text-zinc-400 italic bg-black/30 p-3 rounded-xl border border-zinc-900 text-left">
                          <strong>Note:</strong> "{selectedExercise.notes}"
                        </div>
                      )}

                    </div>

                    {/* VIDEOS AND GUIDELINES */}
                    <div className="space-y-3.5 border-t border-zinc-900 pt-4" id="exercise-guide-container">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[10px] font-black text-zinc-455 uppercase tracking-wider font-mono flex items-center gap-1.5">
                          <Youtube className="w-4 h-4 text-red-500" />
                          Watch Form Guides ({selectedExercise.name})
                        </h4>
                        
                        <button
                          type="button"
                          onClick={() => fetchTutorialVideos(selectedExercise.name)}
                          className="p-1 px-2.5 text-[9px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded-lg cursor-pointer transition-colors"
                        >
                          Hard Reload Video List
                        </button>
                      </div>

                      {loadingVideos ? (
                        <div className="py-8 text-center space-y-3">
                          <div className="relative inline-flex">
                            <div className="w-8 h-8 border-3 border-red-500/20 border-t-red-500 rounded-full animate-spin" />
                          </div>
                          <p className="text-xs text-zinc-500 font-medium font-mono uppercase tracking-wider">Syncing YouTube Database...</p>
                        </div>
                      ) : apiError ? (
                        <div className="space-y-3 text-left">
                          <div className="p-3 bg-zinc-950 border border-zinc-900 rounded-xl flex items-center gap-2">
                            <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                            <p className="text-[10px] text-zinc-500 max-w-sm mt-0.5">{apiError}</p>
                          </div>
                          
                          {/* OFFLINE FALLBACK VIDEO RECOMMENDATION CARDS */}
                          <div className="space-y-2">
                            {[
                              { title: `${selectedExercise.name} - Professional Form Tutorial`, channel: 'Athlean-X Fallback', duration: '5:40' },
                              { title: `How To Correctly Perform ${selectedExercise.name}`, channel: 'Jeremy Ethier Fallback', duration: '6:12' }
                            ].map((v, i) => (
                              <div key={i} className="p-3 bg-zinc-950/60 border border-zinc-900 rounded-xl flex justify-between items-center hover:border-zinc-800">
                                <div>
                                  <h5 className="text-[11px] font-bold text-zinc-300 line-clamp-1">{v.title}</h5>
                                  <p className="text-[10px] text-zinc-550 mt-0.5">{v.channel}</p>
                                </div>
                                <span className="text-[9px] font-mono bg-zinc-900 px-2 py-0.5 rounded text-zinc-500">{v.duration}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2 text-left">
                          {videos.slice(0, 3).map((vid) => {
                            const currentVideoId = vid?.videoId || vid?.id?.videoId || '';
                            const currentTitle = vid?.title || vid?.snippet?.title || 'Form Tutorial';
                            const currentThumbnail = vid?.thumbnail || vid?.snippet?.thumbnails?.default?.url || 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=480&auto=format&fit=crop&q=60';
                            const currentChannel = vid?.channelTitle || vid?.snippet?.channelTitle || 'Exercise Coach';
                            
                            return (
                              <button
                                key={currentVideoId}
                                type="button"
                                id={`watch-video-${currentVideoId}`}
                                onClick={() => setActivePlayerVideo({ videoId: currentVideoId, title: currentTitle })}
                                className="w-full p-2.5 bg-zinc-950/60 hover:bg-zinc-950 border border-zinc-900 hover:border-zinc-800 rounded-2xl flex items-center gap-3 transition-colors text-left group"
                              >
                                <div className="w-16 h-11 bg-zinc-900 rounded-lg overflow-hidden shrink-0 relative flex items-center justify-center">
                                  <img src={currentThumbnail} alt="thumbnail" className="w-full h-full object-cover group-hover:scale-105 duration-300" referrerPolicy="no-referrer" />
                                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Play className="w-3.5 h-3.5 text-white fill-white group-hover:scale-110 duration-200" />
                                  </div>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h5 className="text-[11px] font-bold text-zinc-300 group-hover:text-white leading-tight line-clamp-1 transition-colors">
                                    {currentTitle}
                                  </h5>
                                  <p className="text-[9px] text-zinc-550 truncate mt-0.5 font-mono">{currentChannel}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}

                    </div>

                  </div>
                ) : (
                  <div className="premium-glass p-12 text-center border-zinc-850/80 rounded-3xl text-zinc-650 space-y-3">
                    <BookOpen className="w-10 h-10 mx-auto text-zinc-700 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider font-mono">No Active Exercises Selected</p>
                    <p className="text-[11px] text-zinc-550 leading-relaxed max-w-xs mx-auto">Click "Watch" or "Eye" icon on any schedule item above to unlock our smart targeted instructions and form-correcting guides.</p>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* ACTIVE VIDEO FULL PANEL YOUTUBE PLAYER MODAL */}
          {activePlayerVideo && (
            <div className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col justify-center items-center p-4">
              <div className="w-full max-w-3xl bg-zinc-950 border border-zinc-900 rounded-3xl overflow-hidden relative shadow-2xl">
                
                <div className="p-4 bg-zinc-900 border-b border-zinc-850 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-left pr-4">
                    <Youtube className="w-4 h-4 text-red-500 shrink-0" />
                    <h4 className="text-xs font-black text-white truncate uppercase tracking-tight">{activePlayerVideo.title}</h4>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setActivePlayerVideo(null)}
                    className="p-1.5 px-3 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close Guide
                  </button>
                </div>

                <div className="relative aspect-video w-full bg-zinc-950">
                  <iframe
                    title={activePlayerVideo.title}
                    src={`https://www.youtube.com/embed/${activePlayerVideo.videoId}?autoplay=1`}
                    className="absolute inset-0 w-full h-full border-0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
