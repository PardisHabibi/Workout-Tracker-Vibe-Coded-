import React, { useState, useEffect } from 'react';
import { Plus, Play, Save, Dumbbell, Sparkles, Activity, Clock, Calendar, ChevronRight, History, Trophy, LayoutGrid, RotateCcw, X as XIcon, Trash2, List, Timer as TimerIcon, ChevronDown, ArrowLeft, MessageSquare } from 'lucide-react';
import { Workout, Exercise, WorkoutSet, AIAnalysisResult, WorkoutTemplate, TemplateExercise } from './types';
import { ExerciseCard } from './components/ExerciseCard';
import { Timer } from './components/Timer';
import { ExerciseSelector } from './components/ExerciseSelector';
import { analyzeWorkout } from './services/geminiService';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Default templates with set counts
const DEFAULT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 't1',
    category: "Chest",
    name: "Chest Focus",
    description: "Build a bigger chest with these compound and isolation movements.",
    exercises: [
      { name: "Barbell Bench Press", sets: 3 },
      { name: "Incline Dumbbell Press", sets: 3 },
      { name: "Cable Flys", sets: 3 },
      { name: "Push-ups", sets: 3 }
    ]
  },
  {
    id: 't2',
    category: "Back",
    name: "Back Builder",
    description: "Widen your lats and thicken your back.",
    exercises: [
      { name: "Lat Pulldowns", sets: 3 },
      { name: "Barbell Rows", sets: 3 },
      { name: "Face Pulls", sets: 3 },
      { name: "Deadlifts", sets: 3 }
    ]
  },
  {
    id: 't3',
    category: "Legs",
    name: "Leg Day",
    description: "The foundation of strength. Quads, hams, and glutes.",
    exercises: [
      { name: "Squats", sets: 4 },
      { name: "Leg Press", sets: 3 },
      { name: "Romanian Deadlifts", sets: 3 },
      { name: "Calf Raises", sets: 4 }
    ]
  },
  {
    id: 't4',
    category: "Shoulders",
    name: "Boulder Shoulders",
    description: "Develop 3D delts with overhead and isolation work.",
    exercises: [
      { name: "Overhead Press", sets: 4 },
      { name: "Lateral Raises", sets: 3 },
      { name: "Front Raises", sets: 3 },
      { name: "Shrugs", sets: 3 }
    ]
  },
  {
    id: 't5',
    category: "Arms",
    name: "Arm Farm",
    description: "Biceps and triceps supersets for maximum pump.",
    exercises: [
      { name: "Barbell Curls", sets: 3 },
      { name: "Tricep Pushdowns", sets: 3 },
      { name: "Hammer Curls", sets: 3 },
      { name: "Skullcrushers", sets: 3 }
    ]
  }
];

type Tab = 'history' | 'workouts';

const App: React.FC = () => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<Tab>('history');
  
  // Data State
  const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<Workout[]>([]);
  const [customTemplates, setCustomTemplates] = useState<WorkoutTemplate[]>([]);

  // Editing State
  const [editingHistoryWorkout, setEditingHistoryWorkout] = useState<Workout | null>(null);
  const [isWorkoutMinimized, setIsWorkoutMinimized] = useState(false);

  // UI State - Active Workout
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<AIAnalysisResult | null>(null);
  const [isTimerOpen, setIsTimerOpen] = useState(false);

  // UI State - Naming Modal
  const [showNameModal, setShowNameModal] = useState(false);
  const [customWorkoutName, setCustomWorkoutName] = useState('');

  // UI State - Template Creator
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateExerciseInput, setNewTemplateExerciseInput] = useState('');
  const [newTemplateExerciseSets, setNewTemplateExerciseSets] = useState<number>(3);
  const [newTemplateExercises, setNewTemplateExercises] = useState<TemplateExercise[]>([]);

  // ---------------- Persistence ----------------

  useEffect(() => {
    const loadData = () => {
      // Active Workout
      const savedActive = localStorage.getItem('activeWorkout');
      if (savedActive) {
        try {
          const parsed = JSON.parse(savedActive);
          parsed.startTime = new Date(parsed.startTime);
          setActiveWorkout(parsed);
        } catch (e) { localStorage.removeItem('activeWorkout'); }
      }

      // History
      const savedHistory = localStorage.getItem('workoutHistory');
      if (savedHistory) {
        try {
          const parsedHistory = JSON.parse(savedHistory);
          const historyWithDates = parsedHistory.map((w: any) => ({
            ...w,
            startTime: new Date(w.startTime),
            endTime: w.endTime ? new Date(w.endTime) : undefined
          }));
          setWorkoutHistory(historyWithDates);
        } catch (e) { console.error("Failed to parse history", e); }
      }

      // Custom Templates
      const savedTemplates = localStorage.getItem('customTemplates');
      if (savedTemplates) {
        try {
          const parsed = JSON.parse(savedTemplates);
          const migrated = parsed.map((t: any) => ({
            ...t,
            exercises: t.exercises.map((e: any) => typeof e === 'string' ? { name: e, sets: 3 } : e)
          }));
          setCustomTemplates(migrated);
        } catch (e) { console.error("Failed to parse templates", e); }
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeWorkout) {
      localStorage.setItem('activeWorkout', JSON.stringify(activeWorkout));
    } else {
      localStorage.removeItem('activeWorkout');
    }
  }, [activeWorkout]);

  useEffect(() => {
    localStorage.setItem('workoutHistory', JSON.stringify(workoutHistory));
  }, [workoutHistory]);

  useEffect(() => {
    localStorage.setItem('customTemplates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  // ---------------- Logic: Helper Functions ----------------

  const getLastExerciseStats = (exerciseName: string): WorkoutSet[] | undefined => {
    const sortedHistory = [...workoutHistory].sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
    );

    for (const workout of sortedHistory) {
        const found = workout.exercises.find(e => e.name.toLowerCase() === exerciseName.toLowerCase());
        if (found) {
            return found.sets;
        }
    }
    return undefined;
  };

  // ---------------- Logic: Workout Management ----------------

  const handleStartWorkoutClick = (templateName?: string, templateExercises?: TemplateExercise[]) => {
      if (templateName) {
          startNewWorkout(templateName, templateExercises);
      } else {
          setCustomWorkoutName('');
          setShowNameModal(true);
      }
  };

  const startNewWorkout = (name: string, templateExercises?: TemplateExercise[]) => {
    const exercises: Exercise[] = templateExercises 
      ? templateExercises.map(ex => ({
          id: generateId(),
          name: ex.name,
          sets: Array.from({ length: ex.sets || 3 }).map(() => ({ 
            id: generateId(), weight: '', reps: '', completed: false 
          }))
        }))
      : [];

    const workout: Workout = {
      id: generateId(),
      name: name || `Workout ${new Date().toLocaleDateString()}`,
      startTime: new Date(),
      exercises: exercises
    };
    setActiveWorkout(workout);
    setIsWorkoutMinimized(false);
    setAiResult(null);
  };

  const finishWorkout = () => {
    if (!activeWorkout) return;
    const finishedWorkout: Workout = { 
        ...activeWorkout, 
        endTime: activeWorkout.endTime || new Date() 
    };
    setWorkoutHistory(prev => [finishedWorkout, ...prev]);
    setActiveWorkout(null);
    setAiResult(null);
    setActiveTab('history'); 
  };

  const saveHistoryWorkout = () => {
    if (!editingHistoryWorkout) return;
    setWorkoutHistory(prev => prev.map(w => w.id === editingHistoryWorkout.id ? editingHistoryWorkout : w));
    setEditingHistoryWorkout(null);
  };

  // ---------------- Logic: Generic Workout Editing ----------------
  
  // Generic handler to update either active or editing workout
  const modifyWorkout = (modifier: (w: Workout) => Workout) => {
    if (editingHistoryWorkout) {
        setEditingHistoryWorkout(modifier(editingHistoryWorkout));
    } else if (activeWorkout) {
        setActiveWorkout(modifier(activeWorkout));
    }
  };

  const addExercise = (name: string) => {
    modifyWorkout(workout => {
        const newExercise: Exercise = {
            id: generateId(),
            name: name,
            sets: [{ id: generateId(), weight: '', reps: '', completed: false }]
        };
        return { ...workout, exercises: [...workout.exercises, newExercise] };
    });
    setIsAddingExercise(false);
  };

  const removeExercise = (exerciseId: string) => {
    modifyWorkout(workout => ({
        ...workout,
        exercises: workout.exercises.filter(e => e.id !== exerciseId)
    }));
  };

  const addSet = (exerciseId: string) => {
    modifyWorkout(workout => ({
        ...workout,
        exercises: workout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            const previousSet = ex.sets[ex.sets.length - 1];
            const newSet: WorkoutSet = {
                id: generateId(),
                weight: previousSet ? previousSet.weight : '',
                reps: previousSet ? previousSet.reps : '',
                completed: false
            };
            return { ...ex, sets: [...ex.sets, newSet] };
        })
    }));
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof WorkoutSet, value: any) => {
    modifyWorkout(workout => ({
        ...workout,
        exercises: workout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            return { ...ex, sets: ex.sets.map(s => s.id === setId ? { ...s, [field]: value } : s) };
        })
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    modifyWorkout(workout => ({
        ...workout,
        exercises: workout.exercises.map(ex => {
            if (ex.id !== exerciseId) return ex;
            return { ...ex, sets: ex.sets.filter(s => s.id !== setId) };
        })
    }));
  };

  const updateWorkoutTime = (type: 'start' | 'end', timeStr: string) => {
    modifyWorkout(workout => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date(workout.startTime);
        date.setHours(hours, minutes);
        
        if (type === 'start') {
            return {...workout, startTime: date};
        } else {
            return {...workout, endTime: date};
        }
    });
  };

  // ---------------- Logic: Analysis ----------------

  const handleAIAnalysis = async () => {
    const target = editingHistoryWorkout || activeWorkout;
    if (!target) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzeWorkout(target);
      setAiResult(result);
    } catch (e) { console.error(e); } finally { setIsAnalyzing(false); }
  };

  // ---------------- Logic: Templates ----------------

  const handleAddTemplateExercise = () => {
    if (!newTemplateExerciseInput.trim()) return;
    setNewTemplateExercises([
      ...newTemplateExercises, 
      { name: newTemplateExerciseInput.trim(), sets: Math.max(1, newTemplateExerciseSets) }
    ]);
    setNewTemplateExerciseInput('');
    setNewTemplateExerciseSets(3);
  };

  const handleRemoveTemplateExercise = (index: number) => {
    setNewTemplateExercises(newTemplateExercises.filter((_, i) => i !== index));
  };

  const handleSaveTemplate = () => {
    if (!newTemplateName.trim() || newTemplateExercises.length === 0) {
      alert("Please enter a name and at least one exercise.");
      return;
    }
    const newTemplate: WorkoutTemplate = {
      id: generateId(),
      name: newTemplateName.trim(),
      category: "Custom",
      exercises: newTemplateExercises
    };
    setCustomTemplates([...customTemplates, newTemplate]);
    setIsCreatingTemplate(false);
    setNewTemplateName('');
    setNewTemplateExercises([]);
    setNewTemplateExerciseInput('');
    setNewTemplateExerciseSets(3);
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm("Are you sure you want to delete this template?")) {
      setCustomTemplates(customTemplates.filter(t => t.id !== id));
    }
  };

  // ---------------- Views ----------------

  const renderNavbar = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur-md border-t border-zinc-800 z-50 flex justify-around items-center h-16 safe-area-bottom">
      <button 
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <History size={20} />
        <span className="text-[10px] font-medium">History</span>
      </button>
      
      <div className="w-px h-6 bg-zinc-800"></div>

      <button 
        onClick={() => setActiveTab('workouts')}
        className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'workouts' ? 'text-emerald-500' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <LayoutGrid size={20} />
        <span className="text-[10px] font-medium">Workouts</span>
      </button>
    </div>
  );

  const renderHistoryTab = () => (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-32 overflow-x-hidden">
      <div className="mb-8 p-6 bg-gradient-to-br from-zinc-900 to-zinc-900/50 border border-zinc-800 rounded-2xl relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-zinc-400 mb-6 max-w-sm">Ready to crush another session? Check your history or start a new workout.</p>
          <button 
            onClick={() => handleStartWorkoutClick()}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-emerald-900/20"
          >
            <Play size={20} fill="currentColor" />
            Quick Start (Empty)
          </button>
        </div>
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      </div>

      <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <History size={18} className="text-emerald-500" />
        Workout History
      </h2>
      
      {workoutHistory.length === 0 ? (
        <div className="text-center py-10 bg-zinc-900/30 border border-zinc-800 border-dashed rounded-xl">
          <p className="text-zinc-500 text-sm">No workouts logged yet. Go lift something!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {workoutHistory.map((workout) => (
            <div 
                key={workout.id} 
                onClick={() => setEditingHistoryWorkout(workout)}
                className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 transition-colors hover:border-zinc-600 cursor-pointer group"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-white group-hover:text-emerald-400 transition-colors">{workout.name}</h3>
                  <p className="text-xs text-zinc-500 flex items-center gap-1 mt-1">
                    <Calendar size={12} />
                    {new Date(workout.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at {new Date(workout.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                   {workout.endTime && (
                     <span className="text-xs text-zinc-500 bg-zinc-900/50 px-2 py-1 rounded border border-zinc-800/50">
                       <span className="text-zinc-400">Duration: </span>
                       {Math.round((new Date(workout.endTime).getTime() - new Date(workout.startTime).getTime()) / 60000)} min
                     </span>
                   )}
                </div>
              </div>
              
              <div className="bg-zinc-950/30 rounded-lg p-2 border border-zinc-800/50">
                {workout.exercises.map((ex, i) => (
                  <div key={i} className="flex justify-between items-center text-sm text-zinc-300 border-b border-zinc-800/50 last:border-0 py-2 first:pt-0 last:pb-0">
                    <span className="truncate pr-4">{ex.name}</span>
                    <span className="text-zinc-500 font-mono text-xs whitespace-nowrap bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                      {ex.sets.filter(s => s.completed).length} sets
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderWorkoutsTab = () => (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-32 overflow-x-hidden">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-white">Workouts</h1>
        <button 
          onClick={() => setIsCreatingTemplate(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-lg transition-colors shadow-lg shadow-emerald-900/20"
        >
          <Plus size={24} />
        </button>
      </div>

      {customTemplates.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">My Templates</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customTemplates.map(template => (
              <div key={template.id} className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 relative group">
                <div className="absolute top-4 right-4 flex gap-2">
                   <button 
                      onClick={() => handleDeleteTemplate(template.id)}
                      className="p-1.5 text-zinc-600 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>
                <h3 className="text-white font-semibold mb-1 pr-8">{template.name}</h3>
                <p className="text-xs text-zinc-500 mb-4">{template.exercises.length} exercises</p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {template.exercises.slice(0, 3).map((ex, i) => (
                    <span key={i} className="text-[10px] bg-zinc-950 text-zinc-400 px-2 py-1 rounded border border-zinc-800/50">
                      {ex.name} ({ex.sets} sets)
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => handleStartWorkoutClick(template.name, template.exercises)}
                  className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white border border-emerald-600/20 hover:border-emerald-600 rounded-lg text-sm font-medium transition-all"
                >
                  Start Workout
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-3">Premade Routines</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {DEFAULT_TEMPLATES.map((template) => (
            <div
              key={template.id}
              className="flex flex-col text-left p-4 bg-zinc-900/30 border border-zinc-800 rounded-xl"
            >
              <div className="flex justify-between items-start w-full mb-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider border border-zinc-800 px-1.5 py-0.5 rounded">{template.category}</span>
              </div>
              <h3 className="text-white font-semibold mb-1">{template.name}</h3>
              <p className="text-xs text-zinc-500 mb-4 line-clamp-2">{template.description}</p>
              <button
                onClick={() => handleStartWorkoutClick(template.name, template.exercises)}
                className="mt-auto w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-sm font-medium transition-colors border border-zinc-700 hover:border-zinc-600"
              >
                Start Workout
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTemplateCreator = () => (
    <div className="max-w-xl mx-auto px-4 py-6 pb-24 h-screen flex flex-col overflow-x-hidden">
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => setIsCreatingTemplate(false)}
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-colors"
        >
          <ChevronRight size={20} className="rotate-180" />
        </button>
        <h1 className="text-xl font-bold text-white">Create New Workout</h1>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 pr-1">
        {/* Template creator fields (kept same as before) */}
        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Workout Name</label>
          <input
            type="text"
            placeholder="e.g. Pull Day Variation"
            value={newTemplateName}
            onChange={(e) => setNewTemplateName(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 mb-2 uppercase">Exercises</label>
          <div className="space-y-2 mb-3">
            {newTemplateExercises.map((ex, i) => (
              <div key={i} className="flex justify-between items-center bg-zinc-900/50 border border-zinc-800 px-4 py-3 rounded-xl">
                <div className="flex flex-col">
                  <span className="text-zinc-200 font-medium">{ex.name}</span>
                  <span className="text-xs text-zinc-500">{ex.sets} sets</span>
                </div>
                <button 
                  onClick={() => handleRemoveTemplateExercise(i)}
                  className="text-zinc-500 hover:text-red-400 p-1"
                >
                  <XIcon size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-end">
            <div className="flex-[2]">
              <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block">Exercise Name</label>
              <input
                type="text"
                placeholder="e.g. Deadlift"
                value={newTemplateExerciseInput}
                onChange={(e) => setNewTemplateExerciseInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTemplateExercise()}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase mb-1.5 block text-center">Sets</label>
              <input
                type="number"
                min="1"
                placeholder="#"
                value={newTemplateExerciseSets}
                onChange={(e) => setNewTemplateExerciseSets(parseInt(e.target.value) || 0)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddTemplateExercise()}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-2 py-2 text-center focus:outline-none focus:border-emerald-500 text-sm"
              />
            </div>
            <button 
              onClick={handleAddTemplateExercise}
              className="bg-zinc-800 hover:bg-zinc-700 text-white h-[38px] w-[38px] flex items-center justify-center rounded-lg transition-colors shrink-0 mb-[1px]"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="pt-4 border-t border-zinc-800 mt-auto">
        <button
          onClick={handleSaveTemplate}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-900/20"
        >
          Save Workout Plan
        </button>
      </div>
    </div>
  );

  const renderWorkoutEditor = () => {
    const workout = editingHistoryWorkout || activeWorkout;
    if (!workout) return null;
    const isHistoryMode = !!editingHistoryWorkout;

    // Formatting for time inputs
    const startTimeStr = new Date(workout.startTime).toTimeString().slice(0, 5);
    const endTimeStr = workout.endTime 
        ? new Date(workout.endTime).toTimeString().slice(0, 5) 
        : new Date().toTimeString().slice(0, 5);

    return (
      <div className="pb-24 max-w-xl mx-auto w-full px-4 overflow-x-hidden">
        {/* Header */}
        <div className="py-6 flex flex-col gap-4 sticky top-0 bg-[#09090b]/95 backdrop-blur-sm z-20 border-b border-zinc-800/50 mb-6">
            <div className="flex justify-between items-start">
                <div className="flex items-start gap-2">
                    {/* Back/Minimize Button */}
                    <button 
                        onClick={() => {
                            if (isHistoryMode) {
                                setEditingHistoryWorkout(null);
                            } else {
                                setIsWorkoutMinimized(true);
                            }
                        }}
                        className="mt-1 p-1 -ml-1 text-zinc-400 hover:text-white"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h2 className="text-xl font-bold text-white mb-2">{workout.name}</h2>
                        <div className="flex gap-4">
                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-500 uppercase">Start</label>
                                <input 
                                    type="time"
                                    value={startTimeStr}
                                    onChange={(e) => updateWorkoutTime('start', e.target.value)}
                                    className="bg-transparent text-zinc-300 text-sm focus:outline-none focus:text-white"
                                />
                            </div>
                            <div className="flex flex-col">
                                <label className="text-[10px] text-zinc-500 uppercase">End (Est)</label>
                                <input 
                                    type="time"
                                    value={endTimeStr}
                                    onChange={(e) => updateWorkoutTime('end', e.target.value)}
                                    className="bg-transparent text-zinc-300 text-sm focus:outline-none focus:text-white"
                                />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => setIsTimerOpen(true)}
                        className="bg-zinc-800 hover:bg-zinc-700 text-emerald-500 px-3 py-2 rounded-lg transition-colors border border-zinc-700"
                    >
                        <TimerIcon size={20} />
                    </button>
                    <button 
                        onClick={isHistoryMode ? saveHistoryWorkout : finishWorkout}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-emerald-900/20"
                    >
                        {isHistoryMode ? 'Save' : 'Finish'}
                    </button>
                </div>
            </div>
        </div>

        {/* AI Analysis Section */}
        <div className="mb-6">
          {!aiResult ? (
            <button 
              onClick={handleAIAnalysis}
              disabled={isAnalyzing}
              className="w-full bg-gradient-to-r from-purple-900/20 to-blue-900/20 border border-purple-500/30 hover:border-purple-500/50 rounded-xl p-4 flex items-center justify-between group transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                  <Sparkles size={20} className={isAnalyzing ? 'animate-pulse' : ''} />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold text-purple-200">AI Coach Analysis</h3>
                  <p className="text-xs text-purple-300/60">Get insights on your current session</p>
                </div>
              </div>
              {isAnalyzing ? (
                <span className="text-xs text-purple-400 animate-pulse">Thinking...</span>
              ) : (
                <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Analyze</span>
              )}
            </button>
          ) : (
            <div className="bg-zinc-900/50 border border-purple-500/30 rounded-xl p-4 animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-purple-300 font-semibold flex items-center gap-2">
                  <Sparkles size={16} /> Coach Insights
                </h3>
                <button onClick={() => setAiResult(null)} className="text-zinc-500 hover:text-white text-xs">Close</button>
              </div>
              <p className="text-sm text-zinc-300 mb-3">{aiResult.summary}</p>
              <div className="space-y-2">
                {aiResult.tips.map((tip, i) => (
                  <div key={i} className="flex gap-2 text-xs text-zinc-400">
                    <span className="text-purple-500">•</span>
                    {tip}
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-zinc-800/50 flex justify-between items-center">
                <span className="text-xs text-zinc-500">Focus</span>
                <span className="text-xs font-medium text-emerald-400">{aiResult.muscleGroupFocus}</span>
              </div>
            </div>
          )}
        </div>

        {/* Exercises List */}
        <div className="space-y-4">
          {workout.exercises.map(exercise => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              previousSets={getLastExerciseStats(exercise.name)}
              onUpdateSet={(setId, field, value) => updateSet(exercise.id, setId, field, value)}
              onAddSet={() => addSet(exercise.id)}
              onRemoveSet={(setId) => removeSet(exercise.id, setId)}
              onRemoveExercise={() => removeExercise(exercise.id)}
            />
          ))}
        </div>

        {/* Add Exercise UI */}
        <div className="mt-6">
          {isAddingExercise ? (
            <ExerciseSelector 
                onSelect={addExercise}
                onCancel={() => setIsAddingExercise(false)}
            />
          ) : (
            <button
              onClick={() => setIsAddingExercise(true)}
              className="w-full py-4 bg-zinc-900 border border-zinc-800 hover:border-emerald-500/50 hover:bg-zinc-800 text-zinc-400 hover:text-emerald-500 rounded-xl flex items-center justify-center gap-2 transition-all font-medium"
            >
              <Plus size={20} />
              Add Exercise
            </button>
          )}
        </div>
        
        {/* Timer Component */}
        <Timer isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />
      </div>
    );
  };

  const renderNameModal = () => (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
              <h2 className="text-lg font-bold text-white mb-4">Name Your Workout</h2>
              <input 
                  autoFocus
                  type="text"
                  placeholder={`Workout ${new Date().toLocaleDateString()}`}
                  value={customWorkoutName}
                  onChange={(e) => setCustomWorkoutName(e.target.value)}
                  onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                          startNewWorkout(customWorkoutName);
                          setShowNameModal(false);
                      }
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500 mb-6"
              />
              <div className="flex gap-3">
                  <button 
                      onClick={() => setShowNameModal(false)}
                      className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl font-medium transition-colors"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={() => {
                          startNewWorkout(customWorkoutName);
                          setShowNameModal(false);
                      }}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-colors"
                  >
                      Start
                  </button>
              </div>
          </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b]">
      {/* Name Modal */}
      {showNameModal && renderNameModal()}

      {/* Main Rendering Logic */}
      {(activeWorkout && !isWorkoutMinimized) || editingHistoryWorkout ? (
        renderWorkoutEditor()
      ) : (
        <>
          {isCreatingTemplate ? (
            renderTemplateCreator()
          ) : (
            <div className="animate-in fade-in duration-300">
              {activeTab === 'history' ? renderHistoryTab() : renderWorkoutsTab()}
              
              {renderNavbar()}

              {/* Resume Workout Banner */}
              {activeWorkout && isWorkoutMinimized && (
                  <div className="fixed bottom-20 left-4 right-4 z-40">
                      <div className="bg-zinc-900/90 backdrop-blur-md border border-zinc-800 p-4 rounded-xl shadow-2xl flex justify-between items-center animate-in slide-in-from-bottom-5">
                          <div>
                              <p className="text-xs text-emerald-500 font-bold uppercase tracking-wider mb-1">Workout in Progress</p>
                              <h3 className="font-bold text-white text-sm">{activeWorkout.name}</h3>
                          </div>
                          <button 
                              onClick={() => setIsWorkoutMinimized(false)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg"
                          >
                              Resume
                          </button>
                      </div>
                  </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default App;