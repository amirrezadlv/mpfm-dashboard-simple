/**
 * Dual-state KPI grid: "Current Operating State" (last 10 pts / 10 min rolling
 * average) vs "Total Average State" (full-dataset mean).
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import { computeKpis } from "../lib/kpi";
import { round } from "../lib/stats";

function formatValue(v: number): string {
  if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
  return round(v, 2).toString();
}

export const KpiSection: React.FC = () => {
  const { rows } = useAppData();
  const kpis = computeKpis(rows);

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-navy-600 bg-navy-900/50 p-8 text-center text-sm text-slate-400">
        No dataset loaded yet. Use the Setup tab to load the internal sample, upload an Excel file, or connect a
        Google Sheet.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {kpis.map((k) => {
        const isUp = k.deltaPct > 0.5;
        const isDown = k.deltaPct < -0.5;
        return (
          <div
            key={k.key}
            className="relative overflow-hidden rounded-xl border border-navy-700/60 bg-gradient-to-br from-navy-900 to-navy-850 p-4 shadow-lg shadow-black/30"
          >
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-orange/10 blur-2xl" />
            <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">{k.label}</p>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tabular-nums text-white">{formatValue(k.current)}</span>
              <span className="text-xs text-slate-400">{k.unit}</span>
            </div>
            <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-brand-orange-light">
              Current operating state
            </p>
            <div className="mt-3 flex items-center justify-between border-t border-navy-700/60 pt-2">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-slate-500">Total average</p>
                <p className="text-sm font-semibold tabular-nums text-slate-200">
                  {formatValue(k.total)} <span className="text-[10px] font-normal text-slate-500">{k.unit}</span>
                </p>
              </div>
              <div
                className={`flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-semibold ${
                  isUp
                    ? "bg-emerald-500/10 text-emerald-400"
                    : isDown
                    ? "bg-red-500/10 text-red-400"
                    : "bg-slate-500/10 text-slate-400"
                }`}
              >
                {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : <Minus size={12} />}
                {round(Math.abs(k.deltaPct), 1)}%
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KpiSection;
