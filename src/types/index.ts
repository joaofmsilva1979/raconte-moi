export type MealType = 'breakfast' | 'lunch' | 'snack' | 'dinner' | 'other';

export type RessentCategory =
  | 'bloating'
  | 'nausea'
  | 'pain'
  | 'fatigue'
  | 'good'
  | 'other';

export type RessentSubCategory = 'belly' | 'head' | 'other';

export type GoalType = 'watch' | 'remember' | 'other';

export interface Entry {
  id: number;
  recorded_at: string; // ISO datetime
  meal_type: MealType;
  transcript: string;
  raw_text: string | null;
  edited_at: string | null;
  created_at: string;
}

export interface Ressenti {
  id: number;
  recorded_at: string;
  category: RessentCategory;
  sub_category: RessentSubCategory | null;
  note: string | null;
  entry_id: number | null;
  delay_minutes: number | null;
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
}

export interface ColorPalette {
  name: string;
  primary: string;
  accent: string;
  background: string;
}
