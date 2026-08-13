export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'other';

export type ActivityType = 'walk' | 'swim' | 'yoga' | 'bike' | 'stretch' | 'gym' | 'other';

export type SleepQuality = 1 | 2 | 3;

export type RessentCategory =
  | 'bloating'
  | 'nausea'
  | 'pain'
  | 'fatigue'
  | 'good'
  | 'other';

export type RessentSubCategory =
  | 'head' | 'jaw' | 'neck' | 'shoulders' | 'chest'
  | 'upper_back' | 'lower_back' | 'belly' | 'hips' | 'pelvic' | 'legs'
  | 'other';

export type GoalType = 'watch' | 'remember' | 'other';

export interface Entry {
  id: number;
  recorded_at: string;
  meal_type: MealType;
  transcript: string;
  raw_text: string | null;
  edited_at: string | null;
  photo_uri: string | null;
  created_at: string;
}

export interface Ressenti {
  id: number;
  recorded_at: string;
  category: RessentCategory;
  sub_category: RessentSubCategory | null;
  note: string | null;
  entry_id: number | null;
  meal_type: MealType | null;
  meal_date: string | null; // YYYY-MM-DD — jour du repas (peut différer de recorded_at)
  delay_minutes: number | null;
  context: 'morning' | 'feeling' | null; // mode d'entrée (null = données anciennes)
}

export interface Activity {
  id: number;
  recorded_at: string;
  activity_type: ActivityType;
  duration_minutes: number;
  note: string | null;
}

export interface SleepLog {
  id: number;
  recorded_at: string;
  log_date: string;
  quality: SleepQuality;
}

export interface CustomPainLocation {
  id: number;
  label: string;
}

export interface MealSlot {
  meal_type: MealType;
  label: string;
  icon: string;
  start_hour: number;
  end_hour: number;
}

export interface AppSettings {
  first_name: string;
  primary_color: string;
  goal: GoalType;
  onboarding_done: boolean;
  icloud_backup: boolean;
  backup_interval: number; // jours
  last_backup_at: string | null;
  notifications_enabled: boolean;
  notifications_breakfast: boolean;
  notifications_lunch: boolean;
  notifications_snack: boolean;
  notifications_dinner: boolean;
  // Google Drive
  google_access_token: string | null;
  google_refresh_token: string | null;
  google_token_expiry: string | null;
  google_user_email: string | null;
  google_last_backup_at: string | null;
}

export interface ColorPalette {
  name: string;
  primary: string;
  accent: string;
  background: string;
}
