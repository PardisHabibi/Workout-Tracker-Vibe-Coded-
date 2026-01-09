import React from 'react';
import { Exercise, WorkoutSet } from '../types';
import { SetRow } from './SetRow';
import { Plus, MoreVertical, X } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  previousSets?: WorkoutSet[]; // Added previous sets prop
  onUpdateSet: (setId: string, field: keyof WorkoutSet, value: any) => void;
  onAddSet: () => void;
  onRemoveSet: (setId: string) => void;
  onRemoveExercise: () => void;
}

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  previousSets,
  onUpdateSet,
  onAddSet,
  onRemoveSet,
  onRemoveExercise
}) => {
  return (
    <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl overflow-hidden mb-4 shadow-sm">
      <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-900/30">
        <h3 className="font-semibold text-lg text-white truncate pr-4">{exercise.name}</h3>
        <button 
          onClick={onRemoveExercise}
          className="text-zinc-500 hover:text-red-400 p-1 rounded hover:bg-red-400/10 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-10 gap-2 mb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider text-center">
          <div className="col-span-1">Set</div>
          <div className="col-span-3">kg</div>
          <div className="col-span-3">Reps</div>
          <div className="col-span-3 text-right pr-2">Done</div>
        </div>

        <div className="space-y-1">
          {exercise.sets.map((set, index) => (
            <SetRow
              key={set.id}
              setNumber={index + 1}
              set={set}
              previousSet={previousSets ? previousSets[index] : undefined}
              isLast={index === exercise.sets.length - 1}
              onUpdate={(field, value) => onUpdateSet(set.id, field, value)}
              onRemove={() => onRemoveSet(set.id)}
            />
          ))}
        </div>

        <button
          onClick={onAddSet}
          className="mt-4 w-full py-2 flex items-center justify-center gap-2 text-sm font-medium text-zinc-400 bg-zinc-900 border border-zinc-800 border-dashed rounded-lg hover:border-emerald-500 hover:text-emerald-500 transition-all group"
        >
          <Plus size={16} className="group-hover:scale-110 transition-transform" />
          Add Set
        </button>
      </div>
    </div>
  );
};