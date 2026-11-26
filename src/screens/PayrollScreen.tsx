import React, { useMemo, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Printer,
  SlidersHorizontal,
} from 'lucide-react';
import {
  calculateMonthPayroll,
  calculateShiftPay,
  formatCzk,
  formatDateCz,
  formatMonthYearCz,
  getDayShortCz,
  SHIFT_TYPE_CONFIG,
} from '../data/initialShifts';
import { PayrollSettings, ShiftRecord } from '../types/shifts';

interface PayrollScreenProps {
  variant: 'v1' | 'v2';
  shifts: ShiftRecord[];
  settings: PayrollSettings;
  onUpdateSettings: (next: PayrollSettings) => void;
}

const MONTHS = ['2025-04', '2025-05', '2025-06'];

export const PayrollScreen: React.FC<PayrollScreenProps> = ({
  variant,
  shifts,
  settings,
  onUpdateSettings,
}) => {
  const [monthIdx, setMonthIdx] = useState(1);
  const [copied, setCopied] = useState(false);

  const activeMonth = MONTHS[monthIdx];
  const payroll = useMemo(
    () => calculateMonthPayroll(shifts, activeMonth, settings),
    [shifts, activeMonth, settings]
  );

  const workedShiftRows = useMemo(
    () =>
      payroll.monthShifts
        .filter((s) => s.type !== 'V')
        .sort((a, b) => a.date.localeCompare(b.date)),
    [payroll.monthShifts]
  );

  const handleDownloadCsv = () => {
    const header = [
      'Datum',
      'Den',
      'Typ směny',
      'Začátek',
      'Konec',
      'Pauza (min)',
      'Čisté hodiny',
      'Základ (Kč)',
      'Příplatky (Kč)',
      'Hrubá mzda (Kč)',
    ].join(';');

    const rows = workedShiftRows.map((s) => {
      const pay = calculateShiftPay(s, settings);
      return [
        formatDateCz(s.date),
        getDayShortCz(s.date),
        SHIFT_TYPE_CONFIG[s.type].label,
        s.startTime,
        s.endTime,
        s.breakMinutes,
        s.hours.toFixed(1).replace('.', ','),
        pay.basePay,
        pay.totalBonus,
        pay.gross,
      ].join(';');
    });

    const footer = [
      '',
      '',
      'CELKEM',
      '',
      '',
      '',
      payroll.workedHours.toFixed(1).replace('.', ','),
      payroll.basePay,
      payroll.totalBonuses,
      payroll.grossPay,
    ].join(';');

    const csvContent = '\uFEFF' + [header, ...rows, footer].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vykaz-smen-${activeMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopySummary = async () => {
    const text = [
      `Mzdový výkaz Směny — ${formatMonthYearCz(activeMonth)}`,
      `Odpracováno: ${payroll.workedHours} h (${payroll.workedShiftsCount} směn)`,
      `Základní mzda (${settings.hourlyRate} Kč/h): ${formatCzk(payroll.basePay)} Kč`,
      `Příplatky celkem: +${formatCzk(payroll.totalBonuses)} Kč`,
      `Hrubá mzda: ${formatCzk(payroll.grossPay)} Kč`,
      `Orientační čistá mzda: ${formatCzk(payroll.netPay)} Kč`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (variant === 'v1') {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold text-[#e4e1e8]">
              Mzdový výkaz a export
            </h1>
            <p className="text-xs text-[#908fa0] mt-0.5">
              {formatMonthYearCz(activeMonth)} · Sazba {settings.hourlyRate} Kč/h
            </p>
          </div>
          <button
            type="button"
            onClick={handleDownloadCsv}
            className="min-h-[44px] px-4 rounded-xl bg-[#c0c1ff] text-[#1000a9] text-sm font-bold flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>

        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div>
            <p className="text-xs text-[#908fa0]">Odpracováno</p>
            <p className="font-num text-lg font-bold text-[#e4e1e8]">
              {payroll.workedHours} h
            </p>
          </div>
          <div>
            <p className="text-xs text-[#908fa0]">Příplatky</p>
            <p className="font-num text-lg font-bold text-[#4cd7f6]">
              +{formatCzk(payroll.totalBonuses)} Kč
            </p>
          </div>
          <div>
            <p className="text-xs text-[#908fa0]">Hrubá mzda</p>
            <p className="font-num text-lg font-bold text-[#e4e1e8]">
              {formatCzk(payroll.grossPay)} Kč
            </p>
          </div>
          <div>
            <p className="text-xs text-[#908fa0]">Čistá mzda</p>
            <p className="font-num text-lg font-bold text-[#d0bcff]">
              {formatCzk(payroll.netPay)} Kč
            </p>
          </div>
        </section>

        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/[0.06] text-[#908fa0]">
              <tr>
                <th className="px-4 py-3 font-semibold">Datum</th>
                <th className="px-4 py-3 font-semibold">Směna</th>
                <th className="px-4 py-3 font-semibold text-right">Hodiny</th>
                <th className="px-4 py-3 font-semibold text-right">Hrubá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.05]">
              {workedShiftRows.map((s) => {
                const pay = calculateShiftPay(s, settings);
                return (
                  <tr key={s.id}>
                    <td className="px-4 py-2.5 font-num text-[#e4e1e8]">
                      {formatDateCz(s.date)}
                    </td>
                    <td className="px-4 py-2.5 text-[#c7c4d7]">
                      {SHIFT_TYPE_CONFIG[s.type].shortLabel}
                    </td>
                    <td className="px-4 py-2.5 font-num text-right text-[#e4e1e8]">
                      {s.hours.toFixed(1)} h
                    </td>
                    <td className="px-4 py-2.5 font-num text-right font-semibold text-[#d0bcff]">
                      {formatCzk(pay.gross)} Kč
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      {/* Left: Payroll Summary & Breakdown */}
      <div className="lg:col-span-7 flex flex-col gap-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-[#e4e1e8] tracking-tight">
              Mzdový výkaz · {formatMonthYearCz(activeMonth)}
            </h1>
            <p className="text-xs text-[#908fa0] mt-0.5 font-num">
              {payroll.workedShiftsCount} odpracovaných směn ·{' '}
              {payroll.workedHours} h celkem
            </p>
          </div>

          <div className="flex items-center gap-1 bg-[#1f1f24] p-1 rounded-xl border border-white/[0.06]">
            <button
              type="button"
              disabled={monthIdx === 0}
              onClick={() => setMonthIdx((i) => Math.max(0, i - 1))}
              aria-label="Předchozí měsíc"
              className="w-10 h-10 rounded-lg disabled:opacity-35 flex items-center justify-center text-[#e4e1e8] hover:bg-[#2a292f] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={monthIdx === MONTHS.length - 1}
              onClick={() =>
                setMonthIdx((i) => Math.min(MONTHS.length - 1, i + 1))
              }
              aria-label="Následující měsíc"
              className="w-10 h-10 rounded-lg disabled:opacity-35 flex items-center justify-center text-[#e4e1e8] hover:bg-[#2a292f] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Hero Net Pay Card */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-[#908fa0]">
                Orientační čistá mzda k výplatě
              </p>
              <div className="flex items-baseline gap-1.5 font-num mt-1">
                <span className="text-[34px] font-extrabold text-[#d0bcff] tracking-tight leading-none">
                  {formatCzk(payroll.netPay)}
                </span>
                <span className="text-sm font-bold text-[#d0bcff]">Kč</span>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs text-[#908fa0]">Hrubá mzda</p>
              <p className="font-num text-lg font-bold text-[#e4e1e8] mt-0.5">
                {formatCzk(payroll.grossPay)} Kč
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5 pt-3 border-t border-white/[0.06]">
            <div>
              <p className="text-[11px] text-[#908fa0]">Základ</p>
              <p className="font-num text-sm font-bold text-[#e4e1e8] mt-0.5">
                {formatCzk(payroll.basePay)} Kč
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#908fa0]">Noční ({payroll.nightHours}h)</p>
              <p className="font-num text-sm font-bold text-[#f0abfc] mt-0.5">
                +{formatCzk(payroll.nightBonus)} Kč
              </p>
            </div>
            <div>
              <p className="text-[11px] text-[#908fa0]">Víkendy ({payroll.weekendHours}h)</p>
              <p className="font-num text-sm font-bold text-[#4cd7f6] mt-0.5">
                +{formatCzk(payroll.weekendBonus)} Kč
              </p>
            </div>
          </div>
        </section>

        {/* Detailed Breakdown */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] divide-y divide-white/[0.06]">
          <div className="px-4 py-3">
            <h2 className="text-sm font-bold text-[#e4e1e8]">
              Podrobný rozpis složek mzdy
            </h2>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-[#c7c4d7]">
              Základní mzda ({payroll.workedHours} h × {settings.hourlyRate} Kč)
            </span>
            <span className="font-num font-semibold text-[#e4e1e8]">
              {formatCzk(payroll.basePay)} Kč
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-[#c7c4d7]">
              Příplatek za noční směny (+{settings.nightBonusPct} %)
            </span>
            <span className="font-num font-semibold text-[#f0abfc]">
              +{formatCzk(payroll.nightBonus)} Kč
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-[#c7c4d7]">
              Příplatek za soboty a neděle (+{settings.weekendBonusPct} %)
            </span>
            <span className="font-num font-semibold text-[#4cd7f6]">
              +{formatCzk(payroll.weekendBonus)} Kč
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-[#908fa0]">Sociální pojištění (7,1 %)</span>
            <span className="font-num text-[#ffb4ab]">
              −{formatCzk(payroll.socialInsurance)} Kč
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-[#908fa0]">Zdravotní pojištění (4,5 %)</span>
            <span className="font-num text-[#ffb4ab]">
              −{formatCzk(payroll.healthInsurance)} Kč
            </span>
          </div>
          <div className="px-4 py-3 flex justify-between text-sm">
            <span className="text-[#908fa0]">
              Záloha na daň (po slevě 2 570 Kč)
            </span>
            <span className="font-num text-[#ffb4ab]">
              −{formatCzk(payroll.incomeTax)} Kč
            </span>
          </div>
        </section>
      </div>

      {/* Right: Export Actions & Interactive Rate Calculator */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-5 flex flex-col gap-3">
          <h2 className="text-sm font-bold text-[#e4e1e8]">
            Export a sdílení výkazu
          </h2>
          <p className="text-xs text-[#908fa0]">
            Stáhněte přehled pro účetní nebo pro vlastní archivaci.
          </p>

          <button
            type="button"
            onClick={handleDownloadCsv}
            className="min-h-[48px] w-full rounded-xl bg-[#c0c1ff] hover:bg-[#d2d3ff] text-[#1000a9] text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Stáhnout CSV výkaz</span>
          </button>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => window.print()}
              className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-[#e4e1e8] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-[#c0c1ff]" />
              <span>Tisk / PDF</span>
            </button>
            <button
              type="button"
              onClick={handleCopySummary}
              className="min-h-[48px] rounded-xl bg-[#2a292f] hover:bg-[#35343a] text-[#e4e1e8] text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-[#34d399]" />
                  <span className="text-[#34d399]">Zkopírováno</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-[#d0bcff]" />
                  <span>Kopírovat souhrn</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Live Calculator Controls */}
        <section className="rounded-2xl bg-[#1f1f24] border border-white/[0.07] p-5 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#c0c1ff]" />
            <h2 className="text-sm font-bold text-[#e4e1e8]">
              Rychlá simulace sazby
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#c7c4d7]">Hodinová sazba</span>
                <span className="font-num font-bold text-[#e4e1e8]">
                  {settings.hourlyRate} Kč/h
                </span>
              </div>
              <input
                type="range"
                min={140}
                max={450}
                step={5}
                value={settings.hourlyRate}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    hourlyRate: Number(e.target.value),
                  })
                }
                className="w-full accent-[#c0c1ff] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#c7c4d7]">Noční příplatek</span>
                <span className="font-num font-bold text-[#f0abfc]">
                  +{settings.nightBonusPct} %
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={settings.nightBonusPct}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    nightBonusPct: Number(e.target.value),
                  })
                }
                className="w-full accent-[#d946ef] cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-[#c7c4d7]">Víkendový příplatek</span>
                <span className="font-num font-bold text-[#4cd7f6]">
                  +{settings.weekendBonusPct} %
                </span>
              </div>
              <input
                type="range"
                min={10}
                max={50}
                step={5}
                value={settings.weekendBonusPct}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    weekendBonusPct: Number(e.target.value),
                  })
                }
                className="w-full accent-[#4cd7f6] cursor-pointer"
              />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
