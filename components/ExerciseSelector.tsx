import React, { useState } from 'react';
import { ChevronLeft, X, Search } from 'lucide-react';
import { EXERCISE_DATABASE } from '../data';

interface ExerciseSelectorProps {
  onSelect: (exerciseName: string) => void;
  onCancel: () => void;
}

export const ExerciseSelector: React.FC<ExerciseSelectorProps> = ({ onSelect, onCancel }) => {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);

  const muscleGroups = Object.keys(EXERCISE_DATABASE);

  return (
    <div className="fixed inset-0 z-[50] bg-[#09090b] flex flex-col animate-in slide-in-from-bottom duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {selectedMuscle ? (
            <button 
              onClick={() => setSelectedMuscle(null)}
              className="p-2 -ml-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <ChevronLeft size={24} />
            </button>
          ) : (
            <button 
              onClick={onCancel}
              className="p-2 -ml-2 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          )}
          <h2 className="text-xl font-bold text-white">
            {selectedMuscle || "Select Muscle Group"}
          </h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {!selectedMuscle ? (
          // Muscle Group Grid
          <div className="grid grid-cols-2 gap-4">
            {muscleGroups.map((muscle) => (
              <button
                key={muscle}
                onClick={() => setSelectedMuscle(muscle)}
                className="aspect-square bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex flex-col items-center justify-center gap-3 hover:border-emerald-500 hover:bg-zinc-800 transition-all group"
              >
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-emerald-500 font-bold text-lg group-hover:bg-emerald-500/10 group-hover:scale-110 transition-transform">
                  {muscle.substring(0, 1)}
                </div>
                <span className="font-semibold text-zinc-200">{muscle}</span>
              </button>
            ))}
          </div>
        ) : (
          // Exercise List
          <div className="space-y-2">
            {EXERCISE_DATABASE[selectedMuscle].map((exercise) => (
              <button
                key={exercise}
                onClick={() => onSelect(exercise)}
                className="w-full text-left p-4 bg-zinc-900 border border-zinc-800 rounded-xl hover:border-emerald-500 hover:bg-zinc-800/80 transition-all text-zinc-200 font-medium flex justify-between items-center group"
              >
                {exercise}
                <PlusIcon className="opacity-0 group-hover:opacity-100 text-emerald-500 transition-opacity" />
              </button>
            ))}
             <div className="mt-8 p-4 text-center">
                <p className="text-zinc-500 text-sm mb-2">Can't find your exercise?</p>
                 <button
                    onClick={() => {
                        // Allow typing custom name by passing a prompt or simple state
                        // For now we just allow the user to go back, but we can return "Custom"
                        // Or implemented a 'Custom' entry
                        const custom = prompt("Enter custom exercise name:");
                        if (custom) onSelect(custom);
                    }}
                    className="text-emerald-500 text-sm font-medium hover:underline"
                 >
                    Add Custom Exercise
                 </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

const PlusIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="M5 12h14"/><path d="M12 5v14"/>
  </svg>
);