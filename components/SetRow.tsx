import React, { useEffect, useRef, useState } from 'react';
import { WorkoutSet } from '../types';
import { Check, Trash2, MessageSquare } from 'lucide-react';

interface SetRowProps {
  setNumber: number;
  set: WorkoutSet;
  previousSet?: WorkoutSet; // Optional previous data
  onUpdate: (field: 'weight' | 'reps' | 'completed' | 'notes', value: any) => void;
  onRemove: () => void;
  isLast: boolean;
}

export const SetRow: React.FC<SetRowProps> = ({ setNumber, set, previousSet, onUpdate, onRemove, isLast }) => {
  const weightInputRef = useRef<HTMLInputElement>(null);
  const [showNotes, setShowNotes] = useState(!!set.notes);

  // Auto-focus weight input when a new set is added (only if it's the last one and empty)
  useEffect(() => {
    if (isLast && set.weight === '' && set.reps === '') {
      weightInputRef.current?.focus();
    }
  }, [isLast]);

  const handleComplete = () => {
    // If completing and values are empty, use placeholders if available
    let newWeight = set.weight;
    let newReps = set.reps;

    if (newWeight === '' && previousSet?.weight !== undefined) {
        newWeight = previousSet.weight;
        onUpdate('weight', newWeight);
    }

    if (newReps === '' && previousSet?.reps !== undefined) {
        newReps = previousSet.reps;
        onUpdate('reps', newReps);
    }

    onUpdate('completed', !set.completed);
  };

  return (
    <div className="flex flex-col border-b border-zinc-800/50 last:border-0">
      <div className="flex gap-2 items-center py-2 transition-all">
        <div className="w-6 text-center text-zinc-500 font-mono text-sm shrink-0">
          {setNumber}
        </div>
        
        <div className="flex-1 min-w-0 relative">
          <input
            ref={weightInputRef}
            type="number"
            inputMode="decimal"
            placeholder={previousSet?.weight !== undefined ? `${previousSet.weight} kg` : "kg"}
            value={set.weight}
            onChange={(e) => onUpdate('weight', e.target.value === '' ? '' : parseFloat(e.target.value))}
            className={`w-full bg-zinc-900 border ${set.completed ? 'border-emerald-500/50 text-emerald-500 bg-emerald-900/10' : 'border-zinc-800 text-white'} rounded px-2 py-2 text-center focus:outline-none focus:border-emerald-500 transition-colors text-sm placeholder:text-zinc-700`}
            disabled={set.completed}
          />
        </div>

        <div className="flex-1 min-w-0 relative">
          <input
            type="number"
            inputMode="numeric"
            placeholder={previousSet?.reps !== undefined ? `${previousSet.reps} reps` : "reps"}
            value={set.reps}
            onChange={(e) => onUpdate('reps', e.target.value === '' ? '' : parseInt(e.target.value))}
            className={`w-full bg-zinc-900 border ${set.completed ? 'border-emerald-500/50 text-emerald-500 bg-emerald-900/10' : 'border-zinc-800 text-white'} rounded px-2 py-2 text-center focus:outline-none focus:border-emerald-500 transition-colors text-sm placeholder:text-zinc-700`}
            disabled={set.completed}
          />
        </div>

        <div className="flex justify-end gap-1 shrink-0">
           <button
            onClick={() => setShowNotes(!showNotes)}
            className={`p-2 rounded-md transition-colors ${showNotes || set.notes ? 'text-emerald-500 bg-emerald-500/10' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            <MessageSquare size={16} />
          </button>

          <button
            onClick={handleComplete}
            className={`p-2 rounded-md flex items-center justify-center transition-colors ${
              set.completed 
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-900/20' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-emerald-500 hover:text-white'
            }`}
          >
            <Check size={16} />
          </button>
          
          <button
            onClick={onRemove}
            className="p-2 text-zinc-600 hover:text-red-500 transition-colors rounded-md hover:bg-red-500/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
      
      {(showNotes || set.notes) && (
        <div className="px-8 pb-3 pt-1 animate-in slide-in-from-top-1 duration-200">
            <input 
                type="text"
                value={set.notes || ''}
                onChange={(e) => onUpdate('notes', e.target.value)}
                placeholder="Add notes..."
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
        </div>
      )}
    </div>
  );
};