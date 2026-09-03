export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'other';

export type ActivityType = string; // types prédéfinis + activités custom de l'utilisateur

export type SleepQuality = 1 | 2 | 3;

export type RessentCategory =
  | 'bloating'
  | 'nausea'
  | 'pain'
  | 'fatigue'
  | 'cycle'
  | 'good'
  | 'other';

export type RessentSubCategory =
  | 'head' | 'jaw' | 'neck' | 'shoulders' | 'chest'
  | 'upper_back' | 'lower_back' | 'belly' | 'hips' | 'pelvic' | 'legs'
  | 'flow_light' | 'flow_medium' | 'flow_heavy'
  | 'cramps' | 'mood_low' | 'breast_tension'
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
  enabled: number; // 1 = actif, 0 = désactivé
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
  gender: 'female' | 'male' | 'other' | null;
}

export interface HydrationLog {
  id: number;
  recorded_at: string;
  amount_ml: number;
}

export interface ColorPalette {
  name: string;
  primary: string;
  accent: string;
  background: string;
}

export type MedicationTiming = 'before' | 'during' | 'after';

export interface Medication {
  id: number;
  name: string;
  dosage: string | null;
  created_at: string;
}

export interface MedicationLog {
  id: number;
  medication_id: number;
  medication_name?: string;
  recorded_at: string;
  timing: MedicationTiming;
  meal_type: MealType | null;
  efficacy: 1 | 2 | 3 | null;
  note: string | null;
  created_at: string;
}

export interface ComfortAid {
  id: number;
  name: string;
  created_at: string;
}

export interface ComfortAidLog {
  id: number;
  comfort_aid_id: number;
  comfort_aid_name?: string;
  recorded_at: string;
  meal_type: MealType | 'morning' | null;
  note: string | null;
  created_at: string;
}

export interface ProNote {
  id: number;
  title: string;
  content: string | null;
  file_uri: string | null;
  file_name: string | null;
  file_type: 'pdf' | 'docx' | 'text' | null;
  created_at: string;
  updated_at: string;
}
