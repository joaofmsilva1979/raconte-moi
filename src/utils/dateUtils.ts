const DAYS_FR = ['dim.', 'lun.', 'mar.', 'mer.', 'jeu.', 'ven.', 'sam.'];
const MONTHS_FR = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatDateLabel(dateStr: string, today: Date = new Date()): string {
  const todayStr = formatDate(today);
  const yesterdayDate = new Date(today);
  yesterdayDate.setDate(today.getDate() - 1);
  const yesterdayStr = formatDate(yesterdayDate);

  if (dateStr === todayStr) return "Aujourd'hui";
  if (dateStr === yesterdayStr) return 'Hier';

  const date = new Date(dateStr + 'T12:00:00');
  const dayName = DAYS_FR[date.getDay()];
  const day = date.getDate();
  const month = MONTHS_FR[date.getMonth()];
  return `${dayName} ${day} ${month}`;
}

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + 'T12:00:00');
  date.setDate(date.getDate() + days);
  return formatDate(date);
}
