export interface RoutineItem {
  id: string;
  name: string;
  start: string; // "HH:MM" 24h
  end: string;   // "HH:MM" 24h
  isTask: boolean; // if completion tracking applies
  category: 'study' | 'gym' | 'clinic' | 'revision' | 'sleep' | 'rest' | 'walking';
}

export interface Exercise {
  id: string;
  name: string;
  targetMuscle: string;
  sets: string;
  reps: string;
  restTime: string; // e.g. "90s"
  instructions: string[];
  commonMistakes: string[];
  benefits: string[];
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  notes?: string;
  youtubeKeyword?: string;
}

export interface WorkoutDay {
  day: string; // e.g., "Monday"
  focus: string; // e.g., "Chest + Triceps"
  exercises: Exercise[];
}

export interface NeetTopic {
  id: string;
  subject: 'Biology' | 'Physics' | 'Chemistry';
  chapter: string;
  topicName: string;
  isCompleted: boolean;
  isRevised: boolean;
  isWeak: boolean;
}

export interface NeetDailyTarget {
  id: string;
  title: string;
  subject: 'Biology' | 'Physics' | 'Chemistry';
  isCompleted: boolean;
  date: string; // YYYY-MM-DD
}

export interface Streak {
  study: number;
  gym: number;
  revision: number;
  routine: number;
  lastUpdated: string; // YYYY-MM-DD
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  condition: string;
}

export interface AdminSettings {
  geminiApiKey: string;
  youtubeApiKey: string;
  telegramBotToken: string;
  telegramChannel: string;
  notifications: {
    study: boolean;
    gym: boolean;
    revision: boolean;
    sleep: boolean;
    walking: boolean;
    dailyReports: boolean;
    weeklyReports: boolean;
    aiMotivation: boolean;
  };
  theme: 'midnight-black' | 'royal-purple' | 'neon-blue' | 'crimson-red' | 'emerald-green' | 'custom-theme' | 'dark' | 'light';
  customAccentColor?: string; // Hex code for custom themes
  customBgColor?: string; // Hex code for custom backgrounds
  userLanguage?: 'Hindi' | 'Hinglish' | 'English'; // user language preference
  userName?: string; // e.g. "Ritik" or "Roy"
  studyHoursGoal: number; // default e.g. 5
}

export interface DailyTracking {
  date: string; // YYYY-MM-DD
  studyCompleted: boolean;
  studyHours: number;
  gymCompleted: boolean;
  revisionCompleted: boolean;
  walkingCompleted: boolean;
  sleepCompleted: boolean;
  clinicCompleted: boolean;
  disciplineScore: number;
  missedTasksAlerted: string[]; // list of taskNames
}

export interface TelegramLog {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'error';
  message: string;
}
