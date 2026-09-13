/**
 * Primary navigation sidebar with corporate deep-blue theme and mandatory
 * authorship attribution footer.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React from "react";
import {
  LayoutDashboard,
  Activity,
  Droplets,
  FlaskConical,
  Grid3x3,
  Settings2,
  Mail,
  Phone,
  Gauge,
} from "lucide-react";

export type TabKey = "overview" | "production" | "fluid" | "pvt" | "correlation" | "setup";

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { key: "overview", label: "Overview", icon: <LayoutDashboard size={17} /> },
  { key: "production", label: "Production & Venturi", icon: <Activity size={17} /> },
  { key: "fluid", label: "Fluid & Impedance", icon: <Droplets size={17} /> },
  { key: "pvt", label: "PVT Audit", icon: <FlaskConical size={17} /> },
  { key: "correlation", label: "Correlation", icon: <Grid3x3 size={17} /> },
  { key: "setup", label: "Data & Auxiliary Setup", icon: <Settings2 size={17} /> },
];

export const Sidebar: React.FC<{ active: TabKey; onChange: (t: TabKey) => void }> = ({ active, onChange }) => {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-navy-700/60 bg-navy-925">
      <div className="flex items-center gap-2.5 border-b border-navy-700/60 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-orange shadow-lg shadow-brand-orange/30">
          <Gauge size={20} className="text-navy-950" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight text-white">MPFM Analytics</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">Multiphase Dashboard</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.key;
          return (
            <button
              key={item.key}
              onClick={() => onChange(item.key)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                isActive
                  ? "bg-brand-orange/15 text-brand-orange-light shadow-inner"
                  : "text-slate-300 hover:bg-navy-800 hover:text-white"
              }`}
            >
              <span className={isActive ? "text-brand-orange" : "text-slate-400"}>{item.icon}</span>
              {item.label}
              {isActive && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-orange" />}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-navy-700/60 px-4 py-4 text-[11px] leading-relaxed text-slate-400">
        <p className="mb-1.5 font-semibold text-slate-300">Created by Amirreza Dalvand</p>
        <p className="flex items-center gap-1.5">
          <Mail size={11} /> a.rezadalvand@gmail.com
        </p>
        <p className="mt-1 flex items-center gap-1.5">
          <Phone size={11} /> +98 937 516 6637
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
