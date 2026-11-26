import React, { useRef, useState } from 'react';
import {
  Camera,
  Check,
  CheckSquare,
  FileText,
  ScanLine,
  Square,
  Upload,
} from 'lucide-react';
import {
  computeHoursFromTimes,
  formatDateCz,
  getDayShortCz,
  parseCustomScheduleText,
  SAMPLE_SCANNED_BATCHES,
  SHIFT_TYPE_CONFIG,
} from '../data/initialShifts';
import {
  ScannedShiftCandidate,
  ScreenId,
  ShiftRecord,
  ShiftType,
  TransitionType,
} from '../types/shifts';

interface ScannerScreenProps {
  variant: 'v1' | 'v2';
  onImportShifts: (newShifts: ShiftRecord[]) => void;
  onNavigate: (screen: ScreenId, transition?: TransitionType) => void;
}

export const ScannerScreen: React.FC<ScannerScreenProps> = ({
  variant,
  onImportShifts,
  onNavigate,
}) => {
  const [sourceMode, setSourceMode] = useState<'paper' | 'pdf' | 'csv'>('paper');
  const [candidates, setCandidates] = useState<ScannedShiftCandidate[]>(
    SAMPLE_SCANNED_BATCHES.paper.candidates
  );
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [customText, setCustomText] = useState(
    '26.5. Ranní 06:00-14:30\n27.5. Ranní 06:00-14:30\n28.5. Odpolední 14:00-22:00'
  );
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const selectedCount = candidates.filter((c) => c.selected).length;
  const selectedHours = candidates
    .filter((c) => c.selected)
    .reduce((acc, c) => acc + c.hours, 0);

  const loadSample = (mode: 'paper' | 'pdf' | 'csv') => {
    setSourceMode(mode);
    setUploadedFileName(null);
    setPreviewUrl(null);
    setIsScanning(true);
    setTimeout(() => {
      setCandidates(
        SAMPLE_SCANNED_BATCHES[mode].candidates.map((c) => ({ ...c }))
      );
      setIsScanning(false);
    }, 280);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(file.name);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
    setIsScanning(true);
    setTimeout(() => {
      if (file.name.toLowerCase().endsWith('.csv') || file.type.startsWith('text/')) {
        file.text().then((txt) => {
          const parsed = parseCustomScheduleText(txt);
          setCandidates(
            parsed.length > 0
              ? parsed
              : SAMPLE_SCANNED_BATCHES.paper.candidates.map((c) => ({ ...c }))
          );
          setIsScanning(false);
        });
      } else {
        setCandidates(
          SAMPLE_SCANNED_BATCHES.paper.candidates.map((c) => ({ ...c }))
        );
        setIsScanning(false);
      }
    }, 350);
  };

  const handleParseCustomText = () => {
    const parsed = parseCustomScheduleText(customText);
    if (parsed.length > 0) {
      setCandidates(parsed);
    }
  };

  const toggleCandidate = (id: string) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, selected: !c.selected } : c))
    );
  };

  const updateCandidateType = (id: string, nextType: ShiftType) => {
    const cfg = SHIFT_TYPE_CONFIG[nextType];
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === id
          ? {
              ...c,
              type: nextType,
              startTime: cfg.defaultStart,
              endTime: cfg.defaultEnd,
              breakMinutes: cfg.defaultBreak,
              hours: computeHoursFromTimes(
                cfg.defaultStart,
                cfg.defaultEnd,
                cfg.defaultBreak,
                nextType
              ),
            }
          : c
      )
    );
  };

  const handleConfirmImport = () => {
    const chosen = candidates.filter((c) => c.selected);
    const records: ShiftRecord[] = chosen.map((c) => ({
      id: `imp-${c.date}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      date: c.date,
      type: c.type,
      startTime: c.startTime,
      endTime: c.endTime,
      breakMinutes: c.breakMinutes,
      hours: c.hours,
      status: c.date <= '2025-05-14' ? 'completed' : 'planned',
      note: 'Importováno ze skeneru rozpisu',
    }));
    onImportShifts(records);
    onNavigate('kalendar-v2', 'push_back');
  };

  if (variant === 'v1') {
    return (
      <div className="flex flex-col gap-5 max-w-3xl mx-auto">
        <div>
          <h1 className="text-xl font-bold text-[#e4e1e8]">
            Skener a import rozpisu
          </h1>
          <p className="text-xs text-[#908fa0] mt-0.5">
            Nahrajte rozpis směn a potvrďte přenos do kalendáře
          </p>
        </div>

        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-4 flex flex-col gap-3">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] px-4 rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-sm font-semibold text-[#e4e1e8] flex items-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-[#c0c1ff]" />
              <span>Vybrat soubor</span>
            </button>
            <button
              type="button"
              onClick={() => loadSample('paper')}
              className="min-h-[44px] px-4 rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-sm font-semibold text-[#c7c4d7] cursor-pointer"
            >
              Načíst ukázku
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.csv"
            onChange={handleFileChange}
            className="hidden"
          />
          {uploadedFileName && (
            <p className="text-xs text-[#4cd7f6]">Soubor: {uploadedFileName}</p>
          )}
        </section>

        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] divide-y divide-white/[0.06]">
          <div className="px-4 py-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[#e4e1e8]">
              Rozpoznané směny ({selectedCount})
            </h2>
            <span className="font-num text-xs text-[#908fa0]">
              {selectedHours.toFixed(1)} h celkem
            </span>
          </div>
          {candidates.map((c) => {
            const cfg = SHIFT_TYPE_CONFIG[c.type];
            return (
              <div
                key={c.id}
                className="px-4 py-3 flex items-center justify-between gap-3"
              >
                <button
                  type="button"
                  onClick={() => toggleCandidate(c.id)}
                  className="flex items-center gap-3 min-w-0 text-left cursor-pointer"
                >
                  {c.selected ? (
                    <CheckSquare className="w-5 h-5 text-[#c0c1ff] shrink-0" />
                  ) : (
                    <Square className="w-5 h-5 text-[#908fa0] shrink-0" />
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#e4e1e8]">
                      {formatDateCz(c.date)} ({getDayShortCz(c.date)}) ·{' '}
                      {cfg.label}
                    </p>
                    <p className="font-num text-xs text-[#908fa0]">
                      {c.type === 'V'
                        ? 'Volno'
                        : `${c.startTime}–${c.endTime} (${c.hours} h)`}
                    </p>
                  </div>
                </button>
                <select
                  value={c.type}
                  onChange={(e) =>
                    updateCandidateType(c.id, e.target.value as ShiftType)
                  }
                  aria-label={`Typ směny ${c.date}`}
                  className="h-10 px-2.5 rounded-lg bg-[#2a292f] border border-white/[0.08] text-xs font-bold text-[#e4e1e8]"
                >
                  <option value="R">Ranní (R)</option>
                  <option value="O">Odpolední (O)</option>
                  <option value="N">Noční (N)</option>
                  <option value="V">Volno (V)</option>
                  <option value="D">Dovolená (D)</option>
                </select>
              </div>
            );
          })}
        </section>

        <button
          id="confirmImportBtn"
          type="button"
          disabled={selectedCount === 0}
          onClick={handleConfirmImport}
          className="min-h-[48px] w-full rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] disabled:opacity-40 text-[#1000a9] text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
        >
          <Check className="w-4 h-4" />
          <span>Potvrdit import ({selectedCount} směn)</span>
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Scanner Input & Source Presets */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div>
          <h1 className="text-[20px] font-bold text-[#e4e1e8] tracking-tight">
            Skener a import rozpisu
          </h1>
          <p className="text-xs text-[#908fa0] mt-0.5">
            Nahrajte fotografii rozpisu, PDF nebo vložte textový přehled
          </p>
        </div>

        {/* Upload / Capture Zone */}
        <section className="rounded-2xl bg-[#1f1f24] border border-dashed border-[#c0c1ff]/35 p-5 flex flex-col items-center text-center gap-3">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Náhled nahraného rozpisu"
              referrerPolicy="no-referrer"
              className="w-full max-h-48 object-cover rounded-xl border border-white/10"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-[#8083ff]/15 border border-[#c0c1ff]/30 flex items-center justify-center text-[#c0c1ff]">
              <Camera className="w-6 h-6" />
            </div>
          )}

          <div>
            <p className="text-sm font-bold text-[#e4e1e8]">
              {uploadedFileName
                ? `Načteno: ${uploadedFileName}`
                : 'Vyfotit nebo nahrát rozpis směn'}
            </p>
            <p className="text-xs text-[#908fa0] mt-1">
              Podporuje JPG, PNG, PDF i CSV export z docházky
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.txt,.csv"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-wrap justify-center gap-2 w-full pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="min-h-[44px] flex-1 px-4 rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <Upload className="w-4 h-4" />
              <span>Nahrát soubor</span>
            </button>
            <button
              type="button"
              onClick={() => loadSample('paper')}
              className="min-h-[44px] px-4 rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-[#e4e1e8] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <ScanLine className="w-4 h-4 text-[#4cd7f6]" />
              <span>Znovu naskenovat</span>
            </button>
          </div>
        </section>

        {/* Quick Sample Switchers */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-4 flex flex-col gap-3">
          <h2 className="text-xs font-bold text-[#c7c4d7]">
            Rychlé šablony zdroje
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ['paper', 'Fotka rozpisu'],
                ['pdf', 'PDF docházka'],
                ['csv', 'Text / CSV'],
              ] as const
            ).map(([mode, label]) => (
              <button
                key={mode}
                type="button"
                onClick={() => loadSample(mode)}
                className={`min-h-[44px] px-2.5 rounded-xl text-xs font-semibold border transition-colors cursor-pointer ${
                  sourceMode === mode
                    ? 'bg-[#c0c1ff]/15 border-[#c0c1ff]/50 text-[#c0c1ff]'
                    : 'bg-[#2a292f] border-white/[0.06] text-[#c7c4d7] hover:text-[#e4e1e8]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {sourceMode === 'csv' && (
            <div className="flex flex-col gap-2 pt-1">
              <textarea
                rows={4}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#1b1b20] border border-white/[0.08] text-xs font-num text-[#e4e1e8] focus:outline-none focus:border-[#c0c1ff]"
              />
              <button
                type="button"
                onClick={handleParseCustomText}
                className="min-h-[44px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-xs font-bold text-[#4cd7f6] cursor-pointer"
              >
                Rozpoznat směny z textu
              </button>
            </div>
          )}
        </section>
      </div>

      {/* Right: Detected Shifts Preview & Confirm Import */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] overflow-hidden">
          <div className="px-4 py-3.5 border-b border-white/[0.06] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#d0bcff]" />
              <h2 className="text-sm font-bold text-[#e4e1e8]">
                Rozpoznané směny ke kontrole
              </h2>
            </div>
            <span className="font-num text-xs font-semibold text-[#4cd7f6]">
              {selectedCount} vybráno · {selectedHours.toFixed(1)} h
            </span>
          </div>

          {isScanning ? (
            <div className="p-8 text-center text-sm text-[#c7c4d7]">
              Analyzuji řádky rozpisu a přiřazuji časy směn...
            </div>
          ) : (
            <div className="divide-y divide-white/[0.06]">
              {candidates.map((c) => {
                const cfg = SHIFT_TYPE_CONFIG[c.type];
                return (
                  <div
                    key={c.id}
                    className={`px-4 py-3.5 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 transition-opacity ${
                      c.selected ? 'opacity-100' : 'opacity-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCandidate(c.id)}
                      className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                    >
                      {c.selected ? (
                        <CheckSquare className="w-5 h-5 text-[#c0c1ff] shrink-0" />
                      ) : (
                        <Square className="w-5 h-5 text-[#908fa0] shrink-0" />
                      )}

                      <span
                        className={`w-8 h-8 rounded-lg border flex items-center justify-center font-num text-xs font-bold shrink-0 ${cfg.bgClass} ${cfg.borderClass} ${cfg.textClass}`}
                      >
                        {cfg.code}
                      </span>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#e4e1e8] truncate">
                          {formatDateCz(c.date)} · {getDayShortCz(c.date)}
                        </p>
                        <p className="font-num text-xs text-[#908fa0] truncate">
                          {c.type === 'V'
                            ? 'Volno'
                            : `${c.startTime} – ${c.endTime} (${c.hours} h)`}{' '}
                          · Shoda {c.confidence} %
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {(['R', 'O', 'N', 'V'] as ShiftType[]).map((t) => {
                        const tCfg = SHIFT_TYPE_CONFIG[t];
                        const isT = c.type === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => updateCandidateType(c.id, t)}
                            aria-label={`Nastavit ${tCfg.shortLabel}`}
                            className={`w-9 h-9 rounded-lg font-num text-xs font-bold border transition-colors cursor-pointer ${
                              isT
                                ? `${tCfg.bgClass} ${tCfg.borderClass} ${tCfg.textClass}`
                                : 'bg-[#2a292f] border-white/[0.06] text-[#908fa0] hover:text-[#e4e1e8]'
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <button
          id="confirmImportBtn"
          type="button"
          disabled={selectedCount === 0 || isScanning}
          onClick={handleConfirmImport}
          className="min-h-[48px] w-full rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] disabled:opacity-40 text-[#1000a9] text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer shadow-md"
        >
          <Check className="w-4 h-4" />
          <span>
            Potvrdit a importovat do kalendáře ({selectedCount} směn)
          </span>
        </button>
      </div>
    </div>
  );
};
