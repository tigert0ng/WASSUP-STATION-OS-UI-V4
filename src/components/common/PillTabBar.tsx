import React from "react";
import type { LucideIcon } from "lucide-react";

export interface PillTab {
  id: string;
  label: string;
  icon: LucideIcon;
}

interface PillTabBarProps {
  tabs: readonly PillTab[];
  activeId: string;
  onSelect: (id: string) => void;
}

// Sub-tab navigation per DESIGN.md §5.6 — first shared implementation of
// this pattern in the codebase (previously hand-rolled per module).
export default function PillTabBar({ tabs, activeId, onSelect }: PillTabBarProps) {
  return (
    <div role="tablist" className="flex border border-stone-200/90 bg-white rounded-2xl p-1.5 shadow-xs gap-2 overflow-x-auto scrollbar-none">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(tab.id)}
            className={`flex flex-1 justify-center items-center gap-1.5 px-3.5 py-2 rounded-xl font-display font-black text-xs tracking-wider uppercase transition duration-150 cursor-pointer border-0 whitespace-nowrap ${isActive ? "bg-[#18181b] text-white shadow-xs" : "bg-[#f4f4f6] text-[#64748b] hover:text-slate-900 hover:bg-stone-200/70"
              }`}
          >
            <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#a2c62c]" : ""}`} />
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
