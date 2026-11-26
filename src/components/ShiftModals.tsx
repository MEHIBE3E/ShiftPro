import React, { useEffect, useState } from 'react';
import { Check, Clock, Layers, Trash2, X } from 'lucide-react';
import {
  computeHoursFromTimes,
  formatDateCz,
  SCREEN_META,
  SHIFT_TYPE_CONFIG,
} from '../data/initialShifts';
import {
  PayrollSettings,
  ScreenId,
  ShiftRecord,
  ShiftStatus,
  ShiftType,
} from '../types/shifts';

interface ShiftEditorModalProps {
  isOpen: boolean;
  initialShift?: ShiftRecord | null;
  defaultDate?: string;
  onClose: () => void;
  onSave: (shift: ShiftRecord) => void;
  onDelete?: (id: string) => void;
}

export const ShiftEditorModal: React.FC<ShiftEditorModalProps> = ({
  isOpen,
  initialShift,
  defaultDate,
  onClose,
  onSave,
  onDelete,
}) => {
  const [date, setDate] = useState(defaultDate || '2025-05-18');
  const [type, setType] = useState<ShiftType>('R');
  const [startTime, setStartTime] = useState('06:00');
  const [endTime, setEndTime] = useState('14:30');
  const [breakMinutes, setBreakMinutes] = useState(30);
  const [status, setStatus] = useState<ShiftStatus>('planned');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    if (initialShift) {
      setDate(initialShift.date);
      setType(initialShift.type);
      setStartTime(initialShift.startTime);
      setEndTime(initialShift.endTime);
      setBreakMinutes(initialShift.breakMinutes);
      setStatus(initialShift.status);
      setNote(initialShift.note || '');
    } else {
      const cfg = SHIFT_TYPE_CONFIG.R;
      setDate(defaultDate || '2025-05-18');
      setType('R');
      setStartTime(cfg.defaultStart);
      setEndTime(cfg.defaultEnd);
      setBreakMinutes(cfg.defaultBreak);
      setStatus('planned');
      setNote('');
    }
  }, [isOpen, initialShift, defaultDate]);

  if (!isOpen) return null;

  const handleTypeSelect = (nextType: ShiftType) => {
    setType(nextType);
    const cfg = SHIFT_TYPE_CONFIG[nextType];
    setStartTime(cfg.defaultStart);
    setEndTime(cfg.defaultEnd);
    setBreakMinutes(cfg.defaultBreak);
  };

  const calculatedHours = computeHoursFromTimes(
    startTime,
    endTime,
    breakMinutes,
    type
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialShift?.id || `s-${date}-${Date.now()}`,
      date,
      type,
      startTime,
      endTime,
      breakMinutes,
      hours: calculatedHours,
      status: type === 'V' ? (date <= '2025-05-15' ? 'completed' : 'planned') : status,
      note: note.trim() || undefined,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={initialShift ? 'Upravit směnu' : 'Zadat novou směnu'}
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#1b1b20] border border-white/[0.08] shadow-2xl max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-[#464554]" />
        </div>
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-[17px] font-bold text-[#e4e1e8]">
            {initialShift ? 'Upravit směnu' : 'Zadat směnu'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#908fa0] hover:text-[#e4e1e8] hover:bg-[#2a292f] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          {/* Typ směny */}
          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-2">
              Typ směny
            </label>
            <div className="grid grid-cols-5 gap-2">
              {(Object.keys(SHIFT_TYPE_CONFIG) as ShiftType[]).map((key) => {
                const cfg = SHIFT_TYPE_CONFIG[key];
                const active = type === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleTypeSelect(key)}
                    className={`min-h-[48px] rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer ${
                      active
                        ? `${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`
                        : 'bg-[#2a292f] border-white/[0.06] text-[#908fa0] hover:text-[#e4e1e8]'
                    }`}
                  >
                    <span className="font-num text-sm font-bold">{cfg.code}</span>
                    <span className="text-[10px] font-medium truncate max-w-full px-1">
                      {cfg.shortLabel}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
                Datum
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
                Stav
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as ShiftStatus)}
                className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] focus:outline-none focus:border-[#c0c1ff]"
              >
                <option value="planned">Naplánováno</option>
                <option value="completed">Odpracováno</option>
                <option value="active">Právě probíhá</option>
              </select>
            </div>
          </div>

          {type !== 'V' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
                  Začátek
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
                  Konec
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
                  Pauza (min)
                </label>
                <input
                  type="number"
                  min={0}
                  max={180}
                  step={15}
                  value={breakMinutes}
                  onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
                  className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
              Poznámka (volitelné)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Např. předání linky, přesčas..."
              className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] placeholder:text-[#908fa0]/70 focus:outline-none focus:border-[#c0c1ff]"
            />
          </div>

          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1f1f24] border border-white/[0.06]">
            <span className="text-xs text-[#c7c4d7]">Čistá délka směny</span>
            <span className="font-num text-sm font-bold text-[#4cd7f6]">
              {calculatedHours.toFixed(1)} h
            </span>
          </div>

          <div className="flex items-center gap-2.5 pt-1">
            {initialShift && onDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialShift.id);
                  onClose();
                }}
                aria-label="Smazat směnu"
                className="min-h-[48px] px-4 rounded-xl bg-[#93000a]/30 hover:bg-[#93000a]/50 text-[#ffb4ab] text-sm font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Smazat</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="min-h-[48px] flex-1 rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-[#c7c4d7] text-sm font-semibold transition-colors cursor-pointer"
            >
              Zrušit
            </button>
            <button
              type="submit"
              className="min-h-[48px] flex-1 rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9] text-sm font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Uložit směnu</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

interface FixYesterdayModalProps {
  isOpen: boolean;
  shift: ShiftRecord | null;
  onClose: () => void;
  onConfirm: (endTime: string, breakMinutes: number) => void;
}

export const FixYesterdayModal: React.FC<FixYesterdayModalProps> = ({
  isOpen,
  shift,
  onClose,
  onConfirm,
}) => {
  const [endTime, setEndTime] = useState('14:30');
  const [breakMinutes, setBreakMinutes] = useState(30);

  useEffect(() => {
    if (shift) {
      setEndTime(shift.endTime || '14:30');
      setBreakMinutes(shift.breakMinutes ?? 30);
    }
  }, [shift]);

  if (!isOpen || !shift) return null;

  const hours = computeHoursFromTimes(
    shift.startTime,
    endTime,
    breakMinutes,
    shift.type
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Doplnit konec směny"
    >
      <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl bg-[#1b1b20] border border-white/[0.08] shadow-2xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-[#f59e0b]">
              Doplnění odchodu · {formatDateCz(shift.date)}
            </p>
            <h3 className="text-[17px] font-bold text-[#e4e1e8] mt-0.5">
              Opravit čas konce směny
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#908fa0] hover:text-[#e4e1e8] hover:bg-[#2a292f] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-[#c7c4d7]">
          Začátek ranní směny zaznamenán v{' '}
          <span className="font-num font-bold text-[#e4e1e8]">
            {shift.startTime}
          </span>
          . Vyberte skutečný čas odchodu:
        </p>

        <div className="grid grid-cols-3 gap-2">
          {['14:00', '14:30', '15:30'].map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => setEndTime(preset)}
              className={`min-h-[44px] rounded-xl font-num text-sm font-bold border transition-colors cursor-pointer ${
                endTime === preset
                  ? 'bg-[#c0c1ff]/20 border-[#c0c1ff] text-[#c0c1ff]'
                  : 'bg-[#2a292f] border-white/[0.06] text-[#c7c4d7] hover:text-[#e4e1e8]'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
              Vlastní čas konce
            </label>
            <div className="relative">
              <Clock className="w-4 h-4 text-[#908fa0] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full h-11 pl-9 pr-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
              Pauza (min)
            </label>
            <input
              type="number"
              min={0}
              max={120}
              step={15}
              value={breakMinutes}
              onChange={(e) => setBreakMinutes(Number(e.target.value) || 0)}
              className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
            />
          </div>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-[#1f1f24] border border-white/[0.06]">
          <span className="text-xs text-[#c7c4d7]">Zapíše se odpracováno</span>
          <span className="font-num text-sm font-bold text-[#34d399]">
            {hours.toFixed(1)} h
          </span>
        </div>

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] flex-1 rounded-xl bg-[#2a292f] text-[#c7c4d7] text-sm font-semibold cursor-pointer"
          >
            Později
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm(endTime, breakMinutes);
              onClose();
            }}
            className="min-h-[48px] flex-1 rounded-xl bg-[#c0c1ff] text-[#1000a9] text-sm font-bold cursor-pointer"
          >
            Potvrdit čas
          </button>
        </div>
      </div>
    </div>
  );
};

interface ProfileSettingsModalProps {
  isOpen: boolean;
  settings: PayrollSettings;
  activeScreen: ScreenId;
  onUpdateSettings: (next: PayrollSettings) => void;
  onSelectScreen: (screen: ScreenId) => void;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  settings,
  activeScreen,
  onUpdateSettings,
  onSelectScreen,
  onClose,
}) => {
  if (!isOpen) return null;

  const allScreens: ScreenId[] = [
    'prehled-v2',
    'kalendar-v2',
    'skener-v2',
    'vykazy-v2',
    'prehled-v1',
    'kalendar-v1',
    'skener-v1',
    'vykazy-v1',
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nastavení sazby a obrazovky"
    >
      <div className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl bg-[#1b1b20] border border-white/[0.08] shadow-2xl max-h-[90dvh] overflow-y-auto p-5 flex flex-col gap-5">
        <div className="flex items-center justify-between">
          <h3 className="text-[17px] font-bold text-[#e4e1e8]">
            Nastavení mzdy a obrazovky
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Zavřít"
            className="w-11 h-11 rounded-xl flex items-center justify-center text-[#908fa0] hover:text-[#e4e1e8] hover:bg-[#2a292f] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
              Hodinová sazba (Kč/h)
            </label>
            <input
              type="number"
              min={100}
              max={2000}
              value={settings.hourlyRate}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  hourlyRate: Math.max(50, Number(e.target.value) || 0),
                })
              }
              className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
              Měsíční fond (hod)
            </label>
            <input
              type="number"
              min={40}
              max={260}
              value={settings.monthlyFundHours}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  monthlyFundHours: Math.max(40, Number(e.target.value) || 160),
                })
              }
              className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
              Příplatek noc (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.nightBonusPct}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  nightBonusPct: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-[#c7c4d7] mb-1.5">
              Příplatek víkend (%)
            </label>
            <input
              type="number"
              min={0}
              max={100}
              value={settings.weekendBonusPct}
              onChange={(e) =>
                onUpdateSettings({
                  ...settings,
                  weekendBonusPct: Math.max(0, Number(e.target.value) || 0),
                })
              }
              className="w-full h-11 px-3 rounded-xl bg-[#2a292f] border border-white/[0.08] text-sm text-[#e4e1e8] font-num focus:outline-none focus:border-[#c0c1ff]"
            />
          </div>
        </div>

        {/* All 8 screens switcher for direct inspection of v1 / v2 variants */}
        <div className="pt-2 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 mb-2.5">
            <Layers className="w-4 h-4 text-[#c0c1ff]" />
            <span className="text-xs font-bold text-[#e4e1e8]">
              Obrazovky prototypu (v2 / v1)
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {allScreens.map((id) => {
              const m = SCREEN_META[id];
              const isCurrent = activeScreen === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    onSelectScreen(id);
                    onClose();
                  }}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-left text-xs font-semibold border transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isCurrent
                      ? 'bg-[#c0c1ff]/15 border-[#c0c1ff]/50 text-[#c0c1ff]'
                      : 'bg-[#2a292f] border-white/[0.06] text-[#c7c4d7] hover:text-[#e4e1e8]'
                  }`}
                >
                  <span className="truncate">{m.title}</span>
                  <span className="font-num text-[10px] text-[#908fa0] shrink-0">
                    {m.version}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="min-h-[48px] w-full rounded-xl bg-[#c0c1ff] text-[#1000a9] text-sm font-bold cursor-pointer"
        >
          Hotovo
        </button>
      </div>
    </div>
  );
};
