export interface WorkoutSet {
  id: string;
  weight: number | '';
  reps: number | '';
  completed: boolean;
  notes?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  exercises: Exercise[];
}

export interface TemplateExercise {
  name: string;
  sets: number;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  exercises: TemplateExercise[];
}

export interface AIAnalysisResult {
  summary: string;
  tips: string[];
  muscleGroupFocus: string;
}