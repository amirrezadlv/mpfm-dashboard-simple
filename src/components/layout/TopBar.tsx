/**
 * Top bar showing the active section title and live dataset status chip.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React from "react";
import { Radio } from "lucide-react";
import { useAppData } from "../../context/AppDataContext";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  overview: { title: "Overview", subtitle: "Dual-state KPIs and production summary" },
  production: { title: "Production & Venturi", subtitle: "Standard vs actual rates, pressure-quartile analytics, momentum flux" },
  fluid: { title: "Fluid & Impedance", subtitle: "Impedance response, densitometer closure, GVF cross-checks" },
  pvt: { title: "PVT Audit", subtitle: "Black-oil model diagnostics: Bg, Rs, and residual analysis" },
  correlation: { title: "Correlation", subtitle: "Cross-variable Pearson correlation heatmap" },
  setup: { title: "Data & Auxiliary Setup", subtitle: "Ingestion sources and deciphering parameters" },
};

export const TopBar: React.FC<{ tab: string }> = ({ tab }) => {
  const { meta, rows } = useAppData();
  const info = TITLES[tab];
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-navy-700/60 bg-navy-900/60 px-6 py-4 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-white">{info.title}</h1>
        <p className="text-xs text-slate-400">{info.subtitle}</p>
      </div>
      <div className="flex items-center gap-2 rounded-full border border-navy-600 bg-navy-950/60 px-3 py-1.5 text-xs text-slate-300">
        <Radio size={13} className={rows.length > 0 ? "text-emerald-400 animate-pulse-slow" : "text-slate-500"} />
        {rows.length > 0 ? (
          <span>
            <span className="font-semibold text-slate-100">{meta?.label ?? "Dataset"}</span> · {rows.length} rows
          </span>
        ) : (
          <span>No dataset loaded</span>
        )}
      </div>
    </header>
  );
};

export default TopBar;
