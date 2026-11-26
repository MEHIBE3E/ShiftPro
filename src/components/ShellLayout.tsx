import React from 'react';
import { CalendarDays, Home, PieChart, ScanLine, User } from 'lucide-react';
import { SCREEN_META } from '../data/initialShifts';
import { ScreenId, TransitionType } from '../types/shifts';

interface ShellLayoutProps {
  activeScreen: ScreenId;
  onNavigate: (screen: ScreenId, transition?: TransitionType) => void;
  onOpenSettings: () => void;
  children: React.ReactNode;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({
  activeScreen,
  onNavigate,
  onOpenSettings,
  children,
}) => {
  const meta = SCREEN_META[activeScreen];

  const handleNavClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    target: ScreenId
  ) => {
    e.preventDefault();
    onNavigate(target, 'none');
  };

  const navItems: Array<{
    path: 'prehled' | 'kalendar' | 'skener-import' | 'vykazy-a-mzdy';
    targetScreen: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    isScanner?: boolean;
  }> = [
    {
      path: 'prehled',
      targetScreen: 'prehled-v2',
      label: 'Přehled',
      icon: Home,
    },
    {
      path: 'kalendar',
      targetScreen: 'kalendar-v2',
      label: 'Kalendář',
      icon: CalendarDays,
    },
    {
      path: 'skener-import',
      targetScreen: 'skener-v2',
      label: 'Skener',
      icon: ScanLine,
      isScanner: true,
    },
    {
      path: 'vykazy-a-mzdy',
      targetScreen: 'vykazy-v2',
      label: 'Výkazy',
      icon: PieChart,
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-[#131318] text-[#e4e1e8]">
      {/* Compact Sticky Header (56px, respects 15% mobile sticky cap) */}
      <header className="sticky top-0 z-40 h-14 pt-safe bg-[#131318]/90 backdrop-blur-xl border-b border-white/[0.06] no-print">
        <div className="max-w-6xl mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* Custom concentric shift-cycle SVG brand mark */}
            <div className="w-8 h-8 rounded-xl bg-[#1f1f24] border border-white/[0.08] flex items-center justify-center shrink-0">
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="8.5"
                  stroke="#35343a"
                  strokeWidth="2.5"
                />
                <path
                  d="M12 3.5A8.5 8.5 0 0 1 20.5 12"
                  stroke="#10b981"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M20.5 12A8.5 8.5 0 0 1 9 19.95"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <path
                  d="M9 19.95A8.5 8.5 0 0 1 12 3.5"
                  stroke="#d946ef"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx="12" cy="12" r="2.2" fill="#c0c1ff" />
              </svg>
            </div>

            <div className="flex items-baseline gap-2.5 min-w-0">
              <span className="text-[18px] font-bold tracking-tight text-[#e4e1e8] whitespace-nowrap shrink-0">
                Směny
              </span>
              <span className="text-xs text-[#908fa0] font-medium truncate">
                {meta.subtitle}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenSettings}
              aria-label="Nastavení mzdy a přepínač obrazovek"
              className="min-h-[44px] min-w-[44px] px-2.5 rounded-xl flex items-center gap-2 text-[#c7c4d7] hover:text-[#e4e1e8] hover:bg-[#1f1f24] transition-colors cursor-pointer"
            >
              <span className="hidden sm:inline text-xs font-medium whitespace-nowrap">
                Sazba &amp; Obrazovky
              </span>
              <span className="w-8 h-8 rounded-full bg-[#c0c1ff] text-[#1000a9] flex items-center justify-center shrink-0">
                <User className="w-4 h-4" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-4 pb-24">
        {children}
      </main>

      {/* Single Fixed Bottom Navigation Bar (64px) */}
      <nav
        aria-label="Hlavní navigace"
        className="fixed bottom-0 inset-x-0 z-40 pb-safe bg-[#1b1b20]/95 backdrop-blur-xl border-t border-white/[0.06] no-print"
      >
        <div className="max-w-xl mx-auto h-16 px-2 grid grid-cols-4 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = meta.navPath === item.path;
            return (
              <a
                key={item.path}
                data-path={item.path}
                href={`#${item.path}`}
                onClick={(e) => handleNavClick(e, item.targetScreen)}
                className={`flex flex-col items-center justify-center gap-1 min-h-[48px] px-1 transition-colors select-none ${
                  isActive
                    ? 'text-[#c0c1ff]'
                    : 'text-[#908fa0] hover:text-[#e4e1e8]'
                }`}
              >
                {item.isScanner ? (
                  <div
                    className={`w-10 h-10 -mt-3 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 ${
                      isActive
                        ? 'bg-[#8083ff] text-[#0d0096]'
                        : 'bg-[#2a292f] text-[#c0c1ff] border border-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                ) : (
                  <div
                    className={`px-4 py-1 rounded-full flex items-center justify-center transition-colors ${
                      isActive ? 'bg-[#8083ff]/20 text-[#c0c1ff]' : ''
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                )}
                <span className="text-[11px] font-semibold tracking-tight leading-none whitespace-nowrap">
                  {item.label}
                </span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
