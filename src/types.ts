import { Timestamp } from './lib/firebase';

export interface Exercise {
  exerciseId: string;
  name: string;
}

export interface ExerciseTemplate {
  exerciseId: string;
  name: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}

export interface WorkoutTemplate {
  id: string;
  userId: string;
  name: string;
  exercises: ExerciseTemplate[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SetLog {
  reps: number;
  weight: number;
  isPR?: boolean;
}

export interface ExerciseSession {
  exerciseId: string;
  name: string;
  sets: SetLog[];
}

export enum WorkoutStatus {
  ACTIVE = 'active',
  COMPLETED = 'completed'
}

export interface WorkoutSession {
  id: string;
  userId: string;
  templateId?: string;
  name: string;
  startTime: Timestamp;
  endTime?: Timestamp;
  status: WorkoutStatus;
  exercises: ExerciseSession[];
  totalVolume?: number;
}

export interface PersonalRecord {
  userId: string;
  exerciseId: string;
  exerciseName: string;
  maxWeight: number;
  date: Timestamp;
  sessionId: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: Timestamp;
  stats: {
    totalWorkouts: number;
    streak: number;
    lastWorkoutDate: Timestamp | null;
  };
}
