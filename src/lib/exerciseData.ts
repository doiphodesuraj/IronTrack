export interface ExerciseDef {
  exerciseId: string;
  name: string;
  category: string;
}

export const PREDEFINED_EXERCISES: ExerciseDef[] = [
  // Chest
  { exerciseId: 'bench_press_barbell', name: 'Barbell Bench Press', category: 'Chest' },
  { exerciseId: 'bench_press_dumbbell', name: 'Dumbbell Bench Press', category: 'Chest' },
  { exerciseId: 'incline_bench_press_barbell', name: 'Incline Barbell Bench Press', category: 'Chest' },
  { exerciseId: 'incline_bench_press_dumbbell', name: 'Incline Dumbbell Bench Press', category: 'Chest' },
  { exerciseId: 'chest_fly_dumbbell', name: 'Dumbbell Chest Fly', category: 'Chest' },
  { exerciseId: 'push_ups', name: 'Push Ups', category: 'Chest' },
  { exerciseId: 'dips_chest', name: 'Chest Dips', category: 'Chest' },
  
  // Back
  { exerciseId: 'deadlift_barbell', name: 'Barbell Deadlift', category: 'Back' },
  { exerciseId: 'pull_ups', name: 'Pull Ups', category: 'Back' },
  { exerciseId: 'lat_pulldown_cable', name: 'Cable Lat Pulldown', category: 'Back' },
  { exerciseId: 'seated_row_cable', name: 'Cable Seated Row', category: 'Back' },
  { exerciseId: 'bent_over_row_barbell', name: 'Barbell Bent Over Row', category: 'Back' },
  { exerciseId: 'one_arm_dumbbell_row', name: 'One Arm Dumbbell Row', category: 'Back' },
  { exerciseId: 'face_pull_cable', name: 'Cable Face Pull', category: 'Back' },

  // Legs
  { exerciseId: 'squat_barbell', name: 'Barbell Squat', category: 'Legs' },
  { exerciseId: 'leg_press', name: 'Leg Press', category: 'Legs' },
  { exerciseId: 'lunges_dumbbell', name: 'Dumbbell Lunges', category: 'Legs' },
  { exerciseId: 'leg_extension_machine', name: 'Machine Leg Extension', category: 'Legs' },
  { exerciseId: 'leg_curl_machine', name: 'Machine Leg Curl', category: 'Legs' },
  { exerciseId: 'calf_raise_standing', name: 'Standing Calf Raise', category: 'Legs' },
  { exerciseId: 'romanian_deadlift_barbell', name: 'Barbell Romanian Deadlift', category: 'Legs' },

  // Shoulders
  { exerciseId: 'overhead_press_barbell', name: 'Barbell Overhead Press', category: 'Shoulders' },
  { exerciseId: 'overhead_press_dumbbell', name: 'Dumbbell Overhead Press', category: 'Shoulders' },
  { exerciseId: 'lateral_raise_dumbbell', name: 'Dumbbell Lateral Raise', category: 'Shoulders' },
  { exerciseId: 'front_raise_dumbbell', name: 'Dumbbell Front Raise', category: 'Shoulders' },
  { exerciseId: 'reverse_fly_dumbbell', name: 'Dumbbell Reverse Fly', category: 'Shoulders' },

  // Arms
  { exerciseId: 'bicep_curl_barbell', name: 'Barbell Bicep Curl', category: 'Arms' },
  { exerciseId: 'bicep_curl_dumbbell', name: 'Dumbbell Bicep Curl', category: 'Arms' },
  { exerciseId: 'hammer_curl_dumbbell', name: 'Dumbbell Hammer Curl', category: 'Arms' },
  { exerciseId: 'tricep_pushdown_cable', name: 'Cable Tricep Pushdown', category: 'Arms' },
  { exerciseId: 'skullcrusher_barbell', name: 'Barbell Skullcrusher', category: 'Arms' },
  { exerciseId: 'dips_triceps', name: 'Tricep Dips', category: 'Arms' },

  // Core
  { exerciseId: 'plank', name: 'Plank', category: 'Core' },
  { exerciseId: 'crunch', name: 'Crunch', category: 'Core' },
  { exerciseId: 'leg_raise_hanging', name: 'Hanging Leg Raise', category: 'Core' },
  { exerciseId: 'russian_twist', name: 'Russian Twist', category: 'Core' }
];
