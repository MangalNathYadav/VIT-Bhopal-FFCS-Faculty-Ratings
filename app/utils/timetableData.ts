export interface TimeSlotInfo {
  time: string;
  period: string;
  isLunchBreak?: boolean;
}

export const TIME_SLOTS: TimeSlotInfo[] = [
  { time: "08:30 - 10:00", period: "08:30 - 10:00" },
  { time: "10:05 - 11:35", period: "10:05 - 11:35" },
  { time: "11:40 - 13:10", period: "11:40 - 13:10" },
  { time: "LUNCH BREAK", period: "Lunch", isLunchBreak: true },
  { time: "13:15 - 14:45", period: "13:15 - 14:45" },
  { time: "14:50 - 16:20", period: "14:50 - 16:20" },
  { time: "16:25 - 17:55", period: "16:25 - 17:55" },
  { time: "18:00 - 19:30", period: "18:00 - 19:30" }
];

export const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export const SLOT_GRID: Record<string, (string | "Lunch")[]> = {
  MON: ["A11", "B11", "C11", "Lunch", "A21", "A14", "B21", "C21"],
  TUE: ["D11", "E11", "F11", "Lunch", "D21", "E14", "E21", "F21"],
  WED: ["A12", "B12", "C12", "Lunch", "A22", "B14", "B22", "A24"],
  THU: ["D12", "E12", "F12", "Lunch", "D22", "F14", "E22", "F22"],
  FRI: ["A13", "B13", "C13", "Lunch", "A23", "C14", "B23", "B24"],
  SAT: ["D13", "E13", "F13", "Lunch", "D23", "D14", "D24", "E23"]
};

// Map each slot code to its day and period index
export const SLOT_TO_POS: Record<string, { day: string; periodIndex: number }> = {};

DAYS.forEach(day => {
  SLOT_GRID[day].forEach((slotCode, idx) => {
    if (slotCode !== "Lunch") {
      SLOT_TO_POS[slotCode] = { day, periodIndex: idx };
    }
  });
});

export interface SelectedCourseEntry {
  courseCode: string;
  courseName: string;
  teacherName: string;
  rating: number;
  slot: string; // e.g. "A11+A12"
  venue?: string;
  color?: string;
}

export const SUBJECT_COLORS = [
  "#3b82f6", // Blue
  "#10b981", // Emerald
  "#f59e0b", // Amber
  "#ef4444", // Red
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
];

export function parseSlots(slotStr: string): string[] {
  if (!slotStr) return [];
  return slotStr.split('+').map(s => s.trim()).filter(Boolean);
}

export function checkSlotClash(slotStr1: string, slotStr2: string): boolean {
  const slots1 = parseSlots(slotStr1);
  const slots2 = parseSlots(slotStr2);
  return slots1.some(s => slots2.includes(s));
}

export interface SavedTimetable {
  id: string;
  name: string;
  createdAt: string;
  courses: SelectedCourseEntry[];
}

export function getSavedTimetables(): SavedTimetable[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem('ffcs_saved_timetables');
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load saved timetables", e);
    return [];
  }
}

export function saveTimetableToStorage(timetable: SavedTimetable): SavedTimetable[] {
  if (typeof window === 'undefined') return [];
  const current = getSavedTimetables();
  const existingIdx = current.findIndex(t => t.id === timetable.id);
  let updated: SavedTimetable[];
  if (existingIdx >= 0) {
    updated = [...current];
    updated[existingIdx] = timetable;
  } else {
    updated = [timetable, ...current];
  }
  localStorage.setItem('ffcs_saved_timetables', JSON.stringify(updated));
  return updated;
}

export function deleteTimetableFromStorage(id: string): SavedTimetable[] {
  if (typeof window === 'undefined') return [];
  const current = getSavedTimetables();
  const updated = current.filter(t => t.id !== id);
  localStorage.setItem('ffcs_saved_timetables', JSON.stringify(updated));
  return updated;
}
