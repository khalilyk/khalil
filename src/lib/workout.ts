// Khalil's weekly training split. Static program — completions are logged per date.

export type Exercise = { name: string; detail: string }
export type Block = { heading?: string; exercises: Exercise[] }
export type WorkoutDay = { key: string; weekday: number; title: string; blocks: Block[] }

const CARDIO: Exercise = { name: 'Incline Walk', detail: '30 mins · Incline 10 · 5–5.5 km/h' }

export const PROGRAM: WorkoutDay[] = [
  {
    key: 'mon', weekday: 1, title: 'Chest + Back',
    blocks: [
      { exercises: [
        { name: 'Machine Chest Press', detail: '4 × 8–10' },
        { name: 'Incline Dumbbell Press', detail: '4 × 10–12' },
        { name: 'High to Low Cable Fly', detail: '3 × 12–15' },
        { name: 'Lat Pulldown', detail: '4 × 10–12' },
        { name: 'Dumbbell Row', detail: '4 × 10–12' },
        { name: 'Seated Cable Row', detail: '3 × 12' },
        { name: 'Face Pulls', detail: '3 × 15' },
        { name: 'Band Pull Outs', detail: '3 × 20' },
      ] },
      { heading: 'Cardio', exercises: [CARDIO] },
    ],
  },
  {
    key: 'tue', weekday: 2, title: 'Legs + Core',
    blocks: [
      { exercises: [
        { name: 'Hack Squat', detail: '4 × 8–10' },
        { name: 'Romanian Deadlift', detail: '4 × 8–10' },
        { name: 'Leg Press', detail: '3 × 12–15' },
        { name: 'Hip Thrust', detail: '4 × 10–12' },
        { name: 'Hamstring Curl', detail: '3 × 12' },
        { name: 'Standing Calf Raises', detail: '4 × 15' },
      ] },
      { heading: 'Core', exercises: [
        { name: 'Weighted Decline Sit-Ups', detail: '3 × 15' },
        { name: 'Cable Woodchoppers', detail: '3 × 15 each side' },
        { name: 'Plank', detail: '3 × 60 sec' },
      ] },
      { heading: 'Cardio', exercises: [CARDIO] },
    ],
  },
  {
    key: 'wed', weekday: 3, title: 'Recovery',
    blocks: [
      { heading: 'Recovery', exercises: [
        { name: '10,000–14,000 Steps', detail: 'Across the day' },
        { name: 'Stretching', detail: '15 mins' },
        { name: 'Shoulder Mobility', detail: '10 mins' },
        { name: 'Band External Rotations', detail: '3 × 20' },
        { name: 'Face Pulls', detail: '3 × 15' },
      ] },
    ],
  },
  {
    key: 'thu', weekday: 4, title: 'Shoulders + Arms',
    blocks: [
      { heading: 'Shoulders', exercises: [
        { name: 'Machine Shoulder Press (Pain Free)', detail: '4 × 10–12' },
        { name: 'Dumbbell Lateral Raises', detail: '4 × 15' },
        { name: 'Rear Delt Fly', detail: '4 × 15' },
        { name: 'Barbell Shrugs', detail: '4 × 15' },
      ] },
      { heading: 'Arms', exercises: [
        { name: 'Dumbbell Curls', detail: '4 × 10–12' },
        { name: 'Cable Hammer Curls', detail: '3 × 12' },
        { name: 'Rope Pushdowns', detail: '4 × 12' },
        { name: 'Overhead Cable Extensions', detail: '3 × 12–15' },
      ] },
      { heading: 'Cardio', exercises: [CARDIO] },
    ],
  },
  {
    key: 'fri', weekday: 5, title: 'Upper Body + Core',
    blocks: [
      { exercises: [
        { name: 'Cable Chest Fly', detail: '4 × 12–15' },
        { name: 'Wide Grip Pulldown', detail: '4 × 10–12' },
        { name: 'Cable Rows', detail: '4 × 12' },
        { name: 'Cable Lateral Raises', detail: '3 × 15' },
        { name: 'Leg Extension', detail: '3 × 20' },
        { name: 'EZ Bar Curl', detail: '3 × 12' },
        { name: 'Rope Pushdown', detail: '3 × 12' },
      ] },
      { heading: 'Core', exercises: [
        { name: 'Cable Crunches', detail: '4 × 20' },
        { name: 'Hanging Knee Raises', detail: '4 × 12–15' },
        { name: 'Plank', detail: '3 × 60 sec' },
      ] },
      { heading: 'Cardio', exercises: [CARDIO] },
    ],
  },
]

export function dayByWeekday(weekday: number): WorkoutDay | null {
  return PROGRAM.find(d => d.weekday === weekday) ?? null
}

export function totalExercises(day: WorkoutDay): number {
  return day.blocks.reduce((n, b) => n + b.exercises.length, 0)
}
