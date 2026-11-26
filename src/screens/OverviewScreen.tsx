import React from 'react';
import {
  AlertTriangle,
  Calendar,
  CalendarPlus,
  ChevronRight,
  Coffee,
  Moon,
  Play,
  ScanLine,
  Square,
  Sun,
  Sunrise,
  Timer,
  TrendingUp,
  BedDouble,
} from 'lucide-react';
import {
  calculateMonthPayroll,
  calculateShiftPay,
  formatCzk,
  formatMonthYearCz,
  getDayNumber,
  getDayShortCz,
  SHIFT_TYPE_CONFIG,
  TODAY_ISO,
} from '../data/initialShifts';
import {
  PayrollSettings,
  ScreenId,
  ShiftRecord,
  TransitionType,
} from '../types/shifts';

interface OverviewScreenProps {
  variant: 'v1' | 'v2';
  shifts: ShiftRecord[];
  settings: PayrollSettings;
  elapsedSeconds: number;
  isShiftRunning: boolean;
  todayBreakAdded: number;
  alertSnoozed: boolean;
  onSnoozeAlert: () => void;
  onOpenFixYesterday: (shift: ShiftRecord) => void;
  onOpenAddShift: () => void;
  onEditShift: (shift: ShiftRecord) => void;
  onAddBreak30: () => void;
  onToggleShiftRunning: () => void;
  onEndActiveShift: () => void;
  onNavigate: (screen: ScreenId, transition?: TransitionType) => void;
}

function formatHms(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
    s
  ).padStart(2, '0')}`;
}

export const OverviewScreen: React.FC<OverviewScreenProps> = ({
  variant,
  shifts,
  settings,
  elapsedSeconds,
  isShiftRunning,
  todayBreakAdded,
  alertSnoozed,
  onSnoozeAlert,
  onOpenFixYesterday,
  onOpenAddShift,
  onEditShift,
  onAddBreak30,
  onToggleShiftRunning,
  onEndActiveShift,
  onNavigate,
}) => {
  const activeMonth = '2025-05';
  const summary = calculateMonthPayroll(shifts, activeMonth, settings);
  const needsFixShift = shifts.find((s) => s.status === 'needs_fix');
  const activeShift = shifts.find(
    (s) => s.date === TODAY_ISO && s.status === 'active'
  );
  const todayShift =
    activeShift || shifts.find((s) => s.date === TODAY_ISO) || null;

  const upcomingShifts = shifts
    .filter((s) => s.date > TODAY_ISO && s.date.startsWith('2025-05'))
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, variant === 'v2' ? 3 : 4);

  const liveHoursDecimal = elapsedSeconds / 3600;
  const liveEstimateCzk = Math.round(
    Math.max(0, liveHoursDecimal - todayBreakAdded / 60) * settings.hourlyRate +
      220
  );
  const remainingMins = Math.max(
    0,
    Math.round(8.5 * 60 - elapsedSeconds / 60)
  );
  const remH = Math.floor(remainingMins / 60);
  const remM = remainingMins % 60;

  const renderShiftIcon = (type: ShiftRecord['type']) => {
    switch (type) {
      case 'N':
        return <Moon className="w-4 h-4 text-[#f0abfc]" />;
      case 'O':
        return <Sun className="w-4 h-4 text-[#fbbf24]" />;
      case 'R':
        return <Sunrise className="w-4 h-4 text-[#34d399]" />;
      case 'V':
        return <BedDouble className="w-4 h-4 text-[#94a3b8]" />;
      case 'D':
        return <Calendar className="w-4 h-4 text-[#4cd7f6]" />;
    }
  };

  if (variant === 'v1') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-[#e4e1e8] tracking-tight">
              Přehled a dnešní směna
            </h1>
            <p className="text-xs text-[#908fa0] mt-0.5">
              {formatMonthYearCz(activeMonth)} · Klasické rozložení
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenAddShift}
            className="min-h-[44px] px-4 rounded-xl bg-[#c0c1ff] text-[#1000a9] text-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <CalendarPlus className="w-4 h-4" />
            <span>Zadat směnu</span>
          </button>
        </div>

        {/* Today card */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#34d399]">
              Dnešní směna · {todayShift ? SHIFT_TYPE_CONFIG[todayShift.type].label : 'Volno'}
            </span>
            <span className="font-num text-xs text-[#908fa0]">
              {todayShift ? `${todayShift.startTime} – ${todayShift.endTime}` : 'Bez směny'}
            </span>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="font-num text-3xl font-extrabold text-[#e4e1e8]">
              {formatHms(elapsedSeconds)}
            </span>
            <span className="font-num text-base font-bold text-[#4cd7f6]">
              {formatCzk(liveEstimateCzk)} Kč
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={onAddBreak30}
              className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-sm font-semibold text-[#e4e1e8] flex items-center justify-center gap-2 cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-[#d0bcff]" />
              <span>Pauza (+30 min)</span>
            </button>
            <button
              type="button"
              onClick={isShiftRunning ? onEndActiveShift : onToggleShiftRunning}
              className={`min-h-[48px] rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer ${
                isShiftRunning
                  ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white'
                  : 'bg-[#c0c1ff] text-[#1000a9]'
              }`}
            >
              {isShiftRunning ? (
                <>
                  <Square className="w-4 h-4" />
                  <span>Ukončit směnu</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Spustit směnu</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Monthly compact summary */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#908fa0]">Odpracováno v květnu</p>
            <p className="font-num text-xl font-bold text-[#e4e1e8] mt-0.5">
              {summary.workedHours} / {settings.monthlyFundHours} h
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#908fa0]">Orientační čistá mzda</p>
            <p className="font-num text-xl font-bold text-[#d0bcff] mt-0.5">
              {formatCzk(summary.netPay)} Kč
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => onNavigate('skener-v2', 'push')}
            className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] border border-white/[0.06] text-sm font-semibold text-[#e4e1e8] flex items-center justify-center gap-2 cursor-pointer"
          >
            <ScanLine className="w-4 h-4 text-[#d0bcff]" />
            <span>Skenovat rozpis</span>
          </button>
          <a
            href="#kalendar"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('kalendar-v2', 'push');
            }}
            className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] border border-white/[0.06] text-sm font-semibold text-[#c0c1ff] flex items-center justify-center gap-1.5"
          >
            <span>Zobrazit kalendář</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] divide-y divide-white/[0.06]">
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#e4e1e8]">Nadcházející směny</h2>
            <span className="text-xs text-[#908fa0]">Nejbližší dny</span>
          </div>
          {upcomingShifts.map((shift) => {
            const cfg = SHIFT_TYPE_CONFIG[shift.type];
            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => onEditShift(shift)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-[#2a292f]/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-8 h-8 rounded-lg border flex items-center justify-center font-num text-xs font-bold ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                  >
                    {cfg.code}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#e4e1e8]">
                      {getDayShortCz(shift.date)} {getDayNumber(shift.date)}. 5. · {cfg.label}
                    </p>
                    <p className="font-num text-xs text-[#908fa0]">
                      {shift.type === 'V'
                        ? 'Bez naplánované směny'
                        : `${shift.startTime} – ${shift.endTime} · ${shift.hours} h`}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#908fa0]" />
              </button>
            );
          })}
        </section>
      </div>
    );
  }

  // v2 Layout (matches visual reference with responsive desktop 12-col expansion & clean hairline borders)
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left Primary Column (7 cols on desktop) */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        {/* 1. Unfinished Shift Alert */}
        {needsFixShift && !alertSnoozed && (
          <section
            aria-label="Upozornění na neukončenou směnu"
            className="rounded-2xl bg-[#1e1b2e] border border-[#a855f7]/30 p-4 flex items-start gap-3.5"
          >
            <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 border border-[#818cf8]/30 text-[#a5b4fc] flex items-center justify-center shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs">
                <span className="font-bold text-[#f59e0b]">
                  Vyžaduje pozornost
                </span>
                <span className="text-[#908fa0] font-medium">Včera · 14. 5.</span>
              </div>
              <h2 className="text-[15px] font-bold text-[#e4e1e8] mt-1 leading-snug">
                Směna z včerejška (14. 5.) nebyla ukončena
              </h2>
              <p className="text-[13px] text-[#c7c4d7] mt-1">
                Chybí zaznamenat skutečný konec ranní směny.
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => onOpenFixYesterday(needsFixShift)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9] text-[13px] font-bold flex items-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Calendar className="w-4 h-4" />
                  <span>Opravit čas</span>
                </button>
                <button
                  type="button"
                  onClick={onSnoozeAlert}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-[#c7c4d7] text-[13px] font-medium active:scale-[0.98] transition-all cursor-pointer"
                >
                  Později
                </button>
              </div>
            </div>
          </section>
        )}

        {/* 2. Monthly Overview Card (Hero focal anchor) */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Calendar className="w-5 h-5 text-[#c0c1ff] shrink-0" />
              <h1 className="text-[16px] font-bold text-[#e4e1e8] tracking-tight truncate">
                Měsíční přehled ({formatMonthYearCz(activeMonth)})
              </h1>
            </div>
            <span className="font-num text-xs font-semibold text-[#908fa0] shrink-0">
              Fond {settings.monthlyFundHours} h
            </span>
          </div>

          <div>
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5 font-num">
                <span className="text-[30px] font-extrabold text-[#e4e1e8] tracking-tight leading-none">
                  {summary.workedHours}
                </span>
                <span className="text-sm font-semibold text-[#908fa0]">
                  / {settings.monthlyFundHours} h
                </span>
              </div>
              <span className="font-num text-sm font-bold text-[#c0c1ff]">
                {summary.progressPct} %
              </span>
            </div>

            <div className="w-full h-2.5 rounded-full bg-[#35343a] overflow-hidden mt-2.5">
              <div
                className="h-full rounded-full bg-[#c0c1ff] transition-all duration-300"
                style={{ width: `${summary.progressPct}%` }}
              />
            </div>

            <div className="flex justify-between items-center mt-2 text-xs text-[#908fa0]">
              <span className="font-num">
                Zbývá {summary.remainingHours} h do fondu
              </span>
              <span className="font-num">
                {summary.workedShiftsCount} z {summary.plannedShiftsCount} směn
              </span>
            </div>
          </div>

          <div className="pt-3.5 border-t border-white/[0.06] flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-[#908fa0] font-medium">
                Orientační čistá mzda
              </p>
              <div className="flex items-baseline gap-1 font-num mt-0.5">
                <span className="text-xl font-bold text-[#d0bcff]">
                  {formatCzk(summary.netPay)}
                </span>
                <span className="text-xs font-semibold text-[#d0bcff]">Kč</span>
              </div>
            </div>
            <div className="text-right">
              <p className="font-num text-xs font-semibold text-[#4cd7f6] flex items-center justify-end gap-1">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>+{formatCzk(summary.totalBonuses)} Kč příplatky</span>
              </p>
              <p className="text-[11px] text-[#908fa0] mt-0.5">
                vč. nočních a víkendů
              </p>
            </div>
          </div>
        </section>

        {/* 3. Quick Actions Row */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onOpenAddShift}
            className="min-h-[48px] rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9] font-bold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap px-3"
          >
            <CalendarPlus className="w-4 h-4 shrink-0" />
            <span>Zadat směnu</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('skener-v2', 'push')}
            className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] border border-white/[0.06] text-[#e4e1e8] font-semibold text-[14px] flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer whitespace-nowrap px-3"
          >
            <ScanLine className="w-4 h-4 text-[#d0bcff] shrink-0" />
            <span>Skenovat rozpis</span>
          </button>
        </div>

        {/* 5. Live Active Today's Shift Tracker */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.08] p-5 flex flex-col gap-3.5">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-[#34d399]">
                {todayShift ? SHIFT_TYPE_CONFIG[todayShift.type].label : 'Dnešní směna'}
              </span>
              <span className="text-[#908fa0]" aria-hidden="true">
                ·
              </span>
              <span className="font-num text-[#c7c4d7]">
                {todayShift ? `${todayShift.startTime} – ${todayShift.endTime}` : '06:00 – 14:30'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-[#4cd7f6] font-num font-semibold">
              <Timer className="w-3.5 h-3.5" />
              <span>
                {isShiftRunning
                  ? `Zbývá ${remH}h ${remM}m`
                  : todayShift?.status === 'completed'
                  ? 'Směna ukončena'
                  : 'Pozastaveno'}
              </span>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4 pt-1">
            <div>
              <p className="text-xs font-semibold text-[#908fa0]">
                {isShiftRunning ? 'Právě probíhá' : 'Odpracováno dnes'}
              </p>
              <p
                id="live-shift-timer"
                className="font-num text-[32px] font-extrabold text-[#e4e1e8] tracking-tight leading-none mt-1"
              >
                {formatHms(elapsedSeconds)}
              </p>
              {todayBreakAdded > 0 && (
                <p className="text-[11px] text-[#908fa0] mt-1 font-num">
                  Zaplacená/zadaná pauza navíc: {todayBreakAdded} min
                </p>
              )}
            </div>

            <div className="text-right">
              <p className="text-xs text-[#908fa0] font-medium">Dnešní odhad</p>
              <div className="flex items-baseline justify-end gap-1 font-num mt-0.5">
                <span className="text-[22px] font-bold text-[#4cd7f6]">
                  {formatCzk(liveEstimateCzk)}
                </span>
                <span className="text-xs font-semibold text-[#4cd7f6]">Kč</span>
              </div>
              <p className="font-num text-[11px] text-[#908fa0]">
                {settings.hourlyRate} Kč/h + příplatky
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <button
              type="button"
              onClick={onAddBreak30}
              className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[#e4e1e8] px-3 text-[13px] font-semibold cursor-pointer"
            >
              <Coffee className="w-4 h-4 text-[#d0bcff] shrink-0" />
              <span>Pauza (+30 min)</span>
            </button>

            <button
              type="button"
              onClick={isShiftRunning ? onEndActiveShift : onToggleShiftRunning}
              className={`min-h-[48px] rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 px-3 text-[13px] font-bold cursor-pointer ${
                isShiftRunning
                  ? 'bg-[#ef4444] hover:bg-[#dc2626] text-white'
                  : 'bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9]'
              }`}
            >
              {isShiftRunning ? (
                <>
                  <Square className="w-4 h-4 shrink-0" />
                  <span>Ukončit směnu</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 shrink-0" />
                  <span>Pokračovat v směně</span>
                </>
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Right Secondary Column (5 cols on desktop): Upcoming Shifts */}
      <section className="lg:col-span-5 flex flex-col gap-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-[16px] font-bold text-[#e4e1e8] tracking-tight">
            Nadcházející směny
          </h2>
          <a
            href="#kalendar"
            onClick={(e) => {
              e.preventDefault();
              onNavigate('kalendar-v2', 'push');
            }}
            className="min-h-[44px] inline-flex items-center gap-0.5 text-[13px] text-[#c0c1ff] font-semibold hover:underline"
          >
            <span>Zobrazit kalendář</span>
            <ChevronRight className="w-4 h-4" />
          </a>
        </div>

        <div className="flex flex-col gap-2.5">
          {upcomingShifts.map((shift) => {
            const cfg = SHIFT_TYPE_CONFIG[shift.type];
            const pay = calculateShiftPay(shift, settings);
            const isTomorrow = shift.date === '2025-05-16';
            return (
              <button
                key={shift.id}
                type="button"
                onClick={() => onEditShift(shift)}
                className={`w-full text-left rounded-2xl p-3.5 flex items-center justify-between gap-3 border transition-colors cursor-pointer ${
                  shift.type === 'V'
                    ? 'bg-[#1b1b20] border-white/[0.05] hover:border-white/[0.12]'
                    : 'bg-[#1f1f24] border-white/[0.07] hover:border-white/[0.16]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-[#2a292f] flex flex-col items-center justify-center shrink-0">
                    <span className="text-[11px] font-bold text-[#908fa0]">
                      {getDayShortCz(shift.date)}
                    </span>
                    <span className="font-num text-[16px] font-extrabold text-[#e4e1e8] leading-none mt-0.5">
                      {getDayNumber(shift.date)}
                    </span>
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`w-5 h-5 rounded-md border text-[11px] font-bold flex items-center justify-center shrink-0 font-num ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                      >
                        {cfg.code}
                      </span>
                      <span className="text-[14px] font-bold text-[#e4e1e8] truncate">
                        {cfg.label}
                      </span>
                      {renderShiftIcon(shift.type)}
                    </div>
                    <p className="text-[12px] text-[#908fa0] mt-0.5 font-num truncate">
                      {shift.type === 'V'
                        ? shift.note || 'Bez naplánované směny'
                        : `${shift.startTime} – ${shift.endTime} (${shift.hours.toFixed(
                            1
                          )} h)`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-end shrink-0 text-right">
                  {shift.type === 'N' ? (
                    <>
                      <span className="font-num text-xs font-bold text-[#f0abfc]">
                        +{settings.nightBonusPct} % noční
                      </span>
                      <span className="text-[11px] text-[#908fa0] mt-0.5">
                        {isTomorrow ? 'Zítra' : formatCzk(pay.gross) + ' Kč'}
                      </span>
                    </>
                  ) : shift.type === 'V' ? (
                    <span className="text-xs text-[#94a3b8] font-medium">
                      Volno
                    </span>
                  ) : (
                    <>
                      <span className="font-num text-[14px] font-bold text-[#e4e1e8]">
                        {formatCzk(pay.gross)} Kč
                      </span>
                      <span className="font-num text-[11px] text-[#908fa0] mt-0.5">
                        Sazba {settings.hourlyRate} Kč/h
                      </span>
                    </>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
