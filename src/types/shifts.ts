export type ScreenId =
  | 'prehled-v2'
  | 'kalendar-v2'
  | 'skener-v1'
  | 'skener-v2'
  | 'kalendar-v1'
  | 'vykazy-v1'
  | 'vykazy-v2'
  | 'prehled-v1';

export type TransitionType = 'none' | 'push' | 'push_back';

export type ShiftType = 'R' | 'O' | 'N' | 'V' | 'D';

export type ShiftStatus = 'completed' | 'active' | 'planned' | 'needs_fix';

export interface ShiftRecord {
  id: string;
  date: string; // YYYY-MM-DD
  type: ShiftType;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  breakMinutes: number;
  hours: number;
  status: ShiftStatus;
  note?: string;
}

export interface PayrollSettings {
  hourlyRate: number;
  monthlyFundHours: number;
  nightBonusPct: number;
  weekendBonusPct: number;
  afternoonBonusPct: number;
  holidayBonusPct: number;
}

export interface ScannedShiftCandidate {
  id: string;
  date: string; // YYYY-MM-DD
  type: ShiftType;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  hours: number;
  confidence: number;
  selected: boolean;
  sourceLine: string;
}

export interface ScreenMetadata {
  id: ScreenId;
  title: string;
  subtitle: string;
  navPath: 'prehled' | 'kalendar' | 'skener-import' | 'vykazy-a-mzdy';
  version: 'v1' | 'v2';
}
