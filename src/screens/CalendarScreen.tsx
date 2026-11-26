import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Edit3,
  Plus,
  ScanLine,
  Trash2,
} from 'lucide-react';
import {
  calculateMonthPayroll,
  calculateShiftPay,
  CZECH_DAYS_MON_FIRST,
  formatCzk,
  formatDateCz,
  formatMonthYearCz,
  getDayShortCz,
  SHIFT_TYPE_CONFIG,
  TODAY_ISO,
} from '../data/initialShifts';
import {
  PayrollSettings,
  ScreenId,
  ShiftRecord,
  ShiftType,
  TransitionType,
} from '../types/shifts';

interface CalendarScreenProps {
  variant: 'v1' | 'v2';
  shifts: ShiftRecord[];
  settings: PayrollSettings;
  onAddShiftForDate: (date: string) => void;
  onEditShift: (shift: ShiftRecord) => void;
  onDeleteShift: (id: string) => void;
  onNavigate: (screen: ScreenId, transition?: TransitionType) => void;
}

const MONTHS = ['2025-04', '2025-05', '2025-06'];

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  variant,
  shifts,
  settings,
  onAddShiftForDate,
  onEditShift,
  onDeleteShift,
  onNavigate,
}) => {
  const [monthIdx, setMonthIdx] = useState(1); // 2025-05
  const [selectedDate, setSelectedDate] = useState<string>(TODAY_ISO);
  const [filterType, setFilterType] = useState<'ALL' | ShiftType>('ALL');

  const activeMonth = MONTHS[monthIdx];
  const [yearNum, monthNum] = activeMonth.split('-').map(Number);

  const monthSummary = useMemo(
    () => calculateMonthPayroll(shifts, activeMonth, settings),
    [shifts, activeMonth, settings]
  );

  const shiftByDate = useMemo(() => {
    const map = new Map<string, ShiftRecord>();
    for (const s of shifts) {
      if (s.date.startsWith(activeMonth)) {
        map.set(s.date, s);
      }
    }
    return map;
  }, [shifts, activeMonth]);

  // Build Monday-first calendar cells
  const calendarCells = useMemo(() => {
    const firstDay = new Date(yearNum, monthNum - 1, 1);
    const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
    // JS getDay(): Sun=0, Mon=1..Sat=6 -> Mon-first offset: (getDay() + 6) % 7
    const startOffset = (firstDay.getDay() + 6) % 7;

    const cells: Array<{ date: string | null; dayNum: number | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, dayNum: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${activeMonth}-${String(d).padStart(2, '0')}`;
      cells.push({ date: iso, dayNum: d });
    }
    return cells;
  }, [yearNum, monthNum, activeMonth]);

  const selectedShift = shiftByDate.get(selectedDate) || null;
  const selectedPay = selectedShift
    ? calculateShiftPay(selectedShift, settings)
    : null;

  const filteredList = useMemo(() => {
    return shifts
      .filter((s) => s.date.startsWith(activeMonth))
      .filter((s) => (filterType === 'ALL' ? true : s.type === filterType))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [shifts, activeMonth, filterType]);

  if (variant === 'v1') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#e4e1e8]">
              Měsíční kalendář směn
            </h1>
            <p className="text-xs text-[#908fa0] mt-0.5">
              {formatMonthYearCz(activeMonth)} · {monthSummary.workedHours} h
              odpracováno
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={monthIdx === 0}
              onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
              aria-label="Předchozí měsíc"
              className="w-11 h-11 rounded-xl bg-[#2a292f] disabled:opacity-40 flex items-center justify-center text-[#e4e1e8] cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              disabled={monthIdx === MONTHS.length - 1}
              onClick={() =>
                setMonthIdx((i) => Math.min(MONTHS.length - 1, i + 1))
              }
              aria-label="Následující měsíc"
              className="w-11 h-11 rounded-xl bg-[#2a292f] disabled:opacity-40 flex items-center justify-center text-[#e4e1e8] cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] divide-y divide-white/[0.06]">
          {filteredList.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#908fa0]">
              V tomto měsíci zatím nejsou žádné směny.
            </div>
          ) : (
            filteredList.map((s) => {
              const cfg = SHIFT_TYPE_CONFIG[s.type];
              const pay = calculateShiftPay(s, settings);
              return (
                <div
                  key={s.id}
                  className="px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={`w-9 h-9 rounded-lg border flex items-center justify-center font-num text-xs font-bold shrink-0 ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                    >
                      {cfg.code}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#e4e1e8] truncate">
                        {formatDateCz(s.date)} ({getDayShortCz(s.date)}) ·{' '}
                        {cfg.label}
                      </p>
                      <p className="font-num text-xs text-[#908fa0]">
                        {s.type === 'V'
                          ? 'Volno'
                          : `${s.startTime}–${s.endTime} · ${s.hours} h`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {s.type !== 'V' && (
                      <span className="font-num text-xs font-bold text-[#d0bcff]">
                        {formatCzk(pay.gross)} Kč
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => onEditShift(s)}
                      aria-label={`Upravit ${s.date}`}
                      className="w-10 h-10 rounded-xl bg-[#2a292f] flex items-center justify-center text-[#c7c4d7] hover:text-[#e4e1e8] cursor-pointer"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Month Header, Filters, Calendar Grid */}
      <div className="lg:col-span-8 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-[#e4e1e8] tracking-tight">
              {formatMonthYearCz(activeMonth)}
            </h1>
            <p className="text-xs text-[#908fa0] font-num mt-0.5">
              {monthSummary.workedHours} h odpracováno ·{' '}
              {monthSummary.plannedTotalHours} h naplánováno · Fond{' '}
              {settings.monthlyFundHours} h
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate('skener-v2', 'push')}
              className="min-h-[44px] px-3.5 rounded-xl bg-[#2a292f] hover:bg-[#35343a] border border-white/[0.06] text-xs font-semibold text-[#e4e1e8] flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4 text-[#d0bcff]" />
              <span>Importovat rozpis</span>
            </button>

            <div className="flex items-center gap-1 bg-[#1f1f24] p-1 rounded-xl border border-white/[0.06]">
              <button
                type="button"
                disabled={monthIdx === 0}
                onClick={() => {
                  const next = Math.max(0, monthIdx - 1);
                  setMonthIdx(next);
                  setSelectedDate(`${MONTHS[next]}-01`);
                }}
                aria-label="Předchozí měsíc"
                className="w-10 h-10 rounded-lg disabled:opacity-35 flex items-center justify-center text-[#e4e1e8] hover:bg-[#2a292f] cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                disabled={monthIdx === MONTHS.length - 1}
                onClick={() => {
                  const next = Math.min(MONTHS.length - 1, monthIdx + 1);
                  setMonthIdx(next);
                  setSelectedDate(`${MONTHS[next]}-01`);
                }}
                aria-label="Následující měsíc"
                className="w-10 h-10 rounded-lg disabled:opacity-35 flex items-center justify-center text-[#e4e1e8] hover:bg-[#2a292f] cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ['ALL', 'Vše'],
              ['R', 'Ranní'],
              ['O', 'Odpolední'],
              ['N', 'Noční'],
              ['V', 'Volno'],
              ['D', 'Dovolená'],
            ] as const
          ).map(([code, label]) => {
            const active = filterType === code;
            return (
              <button
                key={code}
                type="button"
                onClick={() => setFilterType(code)}
                className={`min-h-[40px] px-3.5 rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  active
                    ? 'bg-[#c0c1ff] text-[#1000a9]'
                    : 'bg-[#1f1f24] text-[#c7c4d7] hover:bg-[#2a292f] border border-white/[0.06]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* 7-column Calendar Grid */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-3 sm:p-4">
          <div className="grid grid-cols-7 gap-1.5 mb-2">
            {CZECH_DAYS_MON_FIRST.map((day, idx) => (
              <div
                key={day}
                className={`text-center text-[11px] font-bold py-1 ${
                  idx >= 5 ? 'text-[#d0bcff]' : 'text-[#908fa0]'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {calendarCells.map((cell, idx) => {
              if (!cell.date || !cell.dayNum) {
                return <div key={`empty-${idx}`} className="min-h-[58px]" />;
              }
              const shift = shiftByDate.get(cell.date);
              const matchesFilter =
                filterType === 'ALL' || (shift && shift.type === filterType);
              const isSelected = selectedDate === cell.date;
              const isToday = cell.date === TODAY_ISO;
              const cfg = shift ? SHIFT_TYPE_CONFIG[shift.type] : null;

              return (
                <button
                  key={cell.date}
                  type="button"
                  onClick={() => setSelectedDate(cell.date!)}
                  className={`min-h-[60px] sm:min-h-[68px] rounded-xl p-1.5 flex flex-col items-center justify-between border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#2a292f] border-[#c0c1ff] ring-1 ring-[#c0c1ff]/50'
                      : isToday
                      ? 'bg-[#2a292f]/70 border-[#4cd7f6]/50'
                      : 'bg-[#1b1b20] border-white/[0.05] hover:border-white/[0.14]'
                  } ${!matchesFilter ? 'opacity-30' : ''}`}
                >
                  <span
                    className={`font-num text-xs font-bold ${
                      isToday
                        ? 'text-[#4cd7f6]'
                        : isSelected
                        ? 'text-[#c0c1ff]'
                        : 'text-[#c7c4d7]'
                    }`}
                  >
                    {cell.dayNum}
                  </span>

                  {cfg ? (
                    <div className="flex flex-col items-center gap-0.5 w-full">
                      <span
                        className={`w-6 h-6 rounded-md border text-[11px] font-bold flex items-center justify-center font-num ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                      >
                        {cfg.code}
                      </span>
                      <span className="hidden sm:block font-num text-[10px] text-[#908fa0] leading-none">
                        {shift?.type === 'V' ? 'Volno' : `${shift?.hours}h`}
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-[#464554]">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      </div>

      {/* Right: Selected Day Detail Panel */}
      <aside className="lg:col-span-4 flex flex-col gap-4">
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-[#908fa0]">
                Detail dne · {getDayShortCz(selectedDate)}
              </p>
              <h2 className="font-num text-lg font-bold text-[#e4e1e8] mt-0.5">
                {formatDateCz(selectedDate)}
              </h2>
            </div>
            {selectedDate === TODAY_ISO && (
              <span className="text-xs font-bold text-[#4cd7f6]">Dnes</span>
            )}
          </div>

          {selectedShift ? (
            <>
              <div className="flex items-center gap-3 p-3.5 rounded-xl bg-[#2a292f] border border-white/[0.06]">
                <span
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center font-num text-base font-bold shrink-0 ${
                    SHIFT_TYPE_CONFIG[selectedShift.type].bgClass
                  } ${SHIFT_TYPE_CONFIG[selectedShift.type].borderClass} ${
                    SHIFT_TYPE_CONFIG[selectedShift.type].textClass
                  }`}
                >
                  {selectedShift.type}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#e4e1e8]">
                    {SHIFT_TYPE_CONFIG[selectedShift.type].label}
                  </p>
                  <p className="font-num text-xs text-[#c7c4d7] mt-0.5">
                    {selectedShift.type === 'V'
                      ? 'Den odpočinku a regenerace'
                      : `${selectedShift.startTime} – ${selectedShift.endTime} · Pauza ${selectedShift.breakMinutes} min`}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 rounded-xl bg-[#1b1b20] border border-white/[0.05]">
                  <p className="text-xs text-[#908fa0]">Čistý čas</p>
                  <p className="font-num text-base font-bold text-[#e4e1e8] mt-0.5">
                    {selectedShift.hours.toFixed(1)} h
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-[#1b1b20] border border-white/[0.05]">
                  <p className="text-xs text-[#908fa0]">Hrubý výdělek</p>
                  <p className="font-num text-base font-bold text-[#d0bcff] mt-0.5">
                    {formatCzk(selectedPay?.gross || 0)} Kč
                  </p>
                </div>
              </div>

              {selectedPay && selectedPay.totalBonus > 0 && (
                <p className="font-num text-xs text-[#4cd7f6]">
                  Včetně příplatků: +{formatCzk(selectedPay.totalBonus)} Kč
                </p>
              )}

              {selectedShift.note && (
                <p className="text-xs text-[#c7c4d7] bg-[#1b1b20] px-3 py-2 rounded-xl border border-white/[0.05]">
                  Poznámka: {selectedShift.note}
                </p>
              )}

              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => onEditShift(selectedShift)}
                  className="min-h-[48px] rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9] text-sm font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Upravit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteShift(selectedShift.id)}
                  className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#93000a]/40 text-[#ffb4ab] text-sm font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Smazat</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 py-2">
              <p className="text-sm text-[#908fa0]">
                Pro tento den není naplánovaná žádná směna.
              </p>
              <button
                type="button"
                onClick={() => onAddShiftForDate(selectedDate)}
                className="min-h-[48px] w-full rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Přidat směnu na {formatDateCz(selectedDate)}</span>
              </button>
            </div>
          )}
        </section>

        {/* Legend & Monthly Quick Totals */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-[#c7c4d7]">Legenda směn</h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {(['R', 'O', 'N', 'V', 'D'] as ShiftType[]).map((code) => {
              const cfg = SHIFT_TYPE_CONFIG[code];
              return (
                <div key={code} className="flex items-center gap-2">
                  <span
                    className={`w-5 h-5 rounded-md border flex items-center justify-center font-num text-[11px] font-bold ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                  >
                    {cfg.code}
                  </span>
                  <span className="text-[#c7c4d7] truncate">{cfg.shortLabel}</span>
                </div>
              );
            })}
          </div>
        </section>
      </aside>
    </div>
  );
};
