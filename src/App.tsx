/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import { ShellLayout } from './components/ShellLayout';
import {
  FixYesterdayModal,
  ProfileSettingsModal,
  ShiftEditorModal,
} from './components/ShiftModals';
import {
  CALIBRATED_INITIAL_SHIFTS,
  computeHoursFromTimes,
  DEFAULT_PAYROLL_SETTINGS,
  TODAY_ISO,
} from './data/initialShifts';
import { CalendarScreen } from './screens/CalendarScreen';
import { OverviewScreen } from './screens/OverviewScreen';
import { PayrollScreen } from './screens/PayrollScreen';
import { ScannerScreen } from './screens/ScannerScreen';
import {
  PayrollSettings,
  ScreenId,
  ShiftRecord,
  TransitionType,
} from './types/shifts';

const STORAGE_KEY_SHIFTS = 'smeny_shifts_v2';
const STORAGE_KEY_SETTINGS = 'smeny_settings_v2';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('prehled-v2');
  const [transitionType, setTransitionType] = useState<TransitionType>('none');

  const [shifts, setShifts] = useState<ShiftRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SHIFTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return CALIBRATED_INITIAL_SHIFTS;
  });

  const [settings, setSettings] = useState<PayrollSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) return { ...DEFAULT_PAYROLL_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // ignore storage errors
    }
    return DEFAULT_PAYROLL_SETTINGS;
  });

  // Live active shift timer state (starts at 05:42:21)
  const [elapsedSeconds, setElapsedSeconds] = useState(5 * 3600 + 42 * 60 + 21);
  const [isShiftRunning, setIsShiftRunning] = useState(true);
  const [todayBreakAdded, setTodayBreakAdded] = useState(0);
  const [alertSnoozed, setAlertSnoozed] = useState(false);

  // Modals
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftRecord | null>(null);
  const [editorDefaultDate, setEditorDefaultDate] = useState<string>('2025-05-18');
  const [fixYesterdayShift, setFixYesterdayShift] =
    useState<ShiftRecord | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
  };

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SHIFTS, JSON.stringify(shifts));
    } catch {
      // ignore
    }
  }, [shifts]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  useEffect(() => {
    if (!isShiftRunning) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isShiftRunning]);

  const handleNavigate = (
    screen: ScreenId,
    transition: TransitionType = 'none'
  ) => {
    setTransitionType(transition);
    setActiveScreen(screen);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  const handleSaveShift = (shift: ShiftRecord) => {
    setShifts((prev) => {
      const existsIdx = prev.findIndex(
        (s) => s.id === shift.id || s.date === shift.date
      );
      if (existsIdx >= 0) {
        const copy = [...prev];
        copy[existsIdx] = shift;
        return copy;
      }
      return [...prev, shift];
    });
    showToast('Směna byla uložena do kalendáře');
  };

  const handleDeleteShift = (id: string) => {
    setShifts((prev) => prev.filter((s) => s.id !== id));
    showToast('Směna byla odstraněna');
  };

  const handleFixYesterdayConfirm = (endTime: string, breakMinutes: number) => {
    if (!fixYesterdayShift) return;
    const hours = computeHoursFromTimes(
      fixYesterdayShift.startTime,
      endTime,
      breakMinutes,
      fixYesterdayShift.type
    );
    setShifts((prev) =>
      prev.map((s) =>
        s.id === fixYesterdayShift.id
          ? {
              ...s,
              endTime,
              breakMinutes,
              hours,
              status: 'completed',
              note: 'Konec směny doplněn',
            }
          : s
      )
    );
    showToast(`Včerejší směna uzavřena (${hours.toFixed(1)} h)`);
  };

  const handleAddBreak30 = () => {
    setTodayBreakAdded((b) => b + 30);
    setShifts((prev) =>
      prev.map((s) =>
        s.date === TODAY_ISO
          ? { ...s, breakMinutes: s.breakMinutes + 30 }
          : s
      )
    );
    showToast('Přidána pauza +30 min');
  };

  const handleEndActiveShift = () => {
    setIsShiftRunning(false);
    const workedTodayHours = Math.max(
      0.5,
      Math.round((elapsedSeconds / 3600 - todayBreakAdded / 60) * 10) / 10
    );
    setShifts((prev) =>
      prev.map((s) =>
        s.date === TODAY_ISO
          ? {
              ...s,
              status: 'completed',
              hours: workedTodayHours,
              note: 'Dnešní směna ukončena',
            }
          : s
      )
    );
    showToast(`Dnešní směna ukončena (${workedTodayHours.toFixed(1)} h)`);
  };

  const handleToggleShiftRunning = () => {
    setIsShiftRunning(true);
    setShifts((prev) =>
      prev.map((s) =>
        s.date === TODAY_ISO ? { ...s, status: 'active' } : s
      )
    );
    showToast('Časovač směny pokračuje');
  };

  const handleImportShifts = (imported: ShiftRecord[]) => {
    setShifts((prev) => {
      const map = new Map<string, ShiftRecord>();
      for (const s of prev) map.set(s.date, s);
      for (const s of imported) map.set(s.date, s);
      return Array.from(map.values()).sort((a, b) =>
        a.date.localeCompare(b.date)
      );
    });
    showToast(`Importováno ${imported.length} směn do kalendáře`);
  };

  const getMotionProps = () => {
    if (transitionType === 'none') {
      return {
        initial: { opacity: 1, x: 0 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 1, x: 0 },
        transition: { duration: 0 },
      };
    }
    if (transitionType === 'push') {
      return {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -16 },
        transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
      };
    }
    return {
      initial: { opacity: 0, x: -24 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: 16 },
      transition: { duration: 0.18, ease: [0.16, 1, 0.3, 1] as const },
    };
  };

  const renderScreen = () => {
    switch (activeScreen) {
      case 'prehled-v2':
      case 'prehled-v1':
        return (
          <OverviewScreen
            variant={activeScreen === 'prehled-v2' ? 'v2' : 'v1'}
            shifts={shifts}
            settings={settings}
            elapsedSeconds={elapsedSeconds}
            isShiftRunning={isShiftRunning}
            todayBreakAdded={todayBreakAdded}
            alertSnoozed={alertSnoozed}
            onSnoozeAlert={() => {
              setAlertSnoozed(true);
              showToast('Upozornění odloženo');
            }}
            onOpenFixYesterday={(s) => setFixYesterdayShift(s)}
            onOpenAddShift={() => {
              setEditingShift(null);
              setEditorDefaultDate('2025-05-18');
              setEditorOpen(true);
            }}
            onEditShift={(s) => {
              setEditingShift(s);
              setEditorOpen(true);
            }}
            onAddBreak30={handleAddBreak30}
            onToggleShiftRunning={handleToggleShiftRunning}
            onEndActiveShift={handleEndActiveShift}
            onNavigate={handleNavigate}
          />
        );
      case 'kalendar-v2':
      case 'kalendar-v1':
        return (
          <CalendarScreen
            variant={activeScreen === 'kalendar-v2' ? 'v2' : 'v1'}
            shifts={shifts}
            settings={settings}
            onAddShiftForDate={(date) => {
              setEditingShift(null);
              setEditorDefaultDate(date);
              setEditorOpen(true);
            }}
            onEditShift={(s) => {
              setEditingShift(s);
              setEditorOpen(true);
            }}
            onDeleteShift={handleDeleteShift}
            onNavigate={handleNavigate}
          />
        );
      case 'skener-v2':
      case 'skener-v1':
        return (
          <ScannerScreen
            variant={activeScreen === 'skener-v2' ? 'v2' : 'v1'}
            onImportShifts={handleImportShifts}
            onNavigate={handleNavigate}
          />
        );
      case 'vykazy-v2':
      case 'vykazy-v1':
        return (
          <PayrollScreen
            variant={activeScreen === 'vykazy-v2' ? 'v2' : 'v1'}
            shifts={shifts}
            settings={settings}
            onUpdateSettings={setSettings}
          />
        );
    }
  };

  const motionProps = getMotionProps();

  return (
    <MotionConfig reducedMotion="user">
      <ShellLayout
        activeScreen={activeScreen}
        onNavigate={handleNavigate}
        onOpenSettings={() => setSettingsOpen(true)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={activeScreen} {...motionProps}>
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </ShellLayout>

      <ShiftEditorModal
        isOpen={editorOpen}
        initialShift={editingShift}
        defaultDate={editorDefaultDate}
        onClose={() => setEditorOpen(false)}
        onSave={handleSaveShift}
        onDelete={handleDeleteShift}
      />

      <FixYesterdayModal
        isOpen={Boolean(fixYesterdayShift)}
        shift={fixYesterdayShift}
        onClose={() => setFixYesterdayShift(null)}
        onConfirm={handleFixYesterdayConfirm}
      />

      <ProfileSettingsModal
        isOpen={settingsOpen}
        settings={settings}
        activeScreen={activeScreen}
        onUpdateSettings={setSettings}
        onSelectScreen={(s) => handleNavigate(s, 'none')}
        onClose={() => setSettingsOpen(false)}
      />

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2a292f] border border-[#c0c1ff]/35 text-xs font-semibold text-[#e4e1e8] shadow-xl whitespace-nowrap"
        >
          {toastMessage}
        </div>
      )}
    </MotionConfig>
  );
}
