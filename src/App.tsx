/**
 * Multiphase Flow Meter (MPFM) Data Analysis Dashboard — Application Root.
 *
 * A fully client-side, static-hostable (GitHub Pages ready) analytics dashboard
 * for multiphase flow meter datasets. Supports agnostic ingestion (Excel upload,
 * live Google Sheet, or an internal sample dataset), a dual-state KPI engine,
 * an editable Black-Oil PVT / auxiliary deciphering panel, and a full suite of
 * physics-informed analytical visualizations.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { useEffect, useState } from "react";
import { AppDataProvider, useAppData } from "./context/AppDataContext";
import Sidebar, { type TabKey } from "./components/layout/Sidebar";
import TopBar from "./components/layout/TopBar";
import KpiSection from "./components/KpiSection";
import DataSourcePanel from "./components/DataSourcePanel";
import AuxiliaryPanel from "./components/AuxiliaryPanel";
import { ProductionTimelineChart, GvfWatercutChart } from "./components/charts/OverviewCharts";
import { ActualVsStandardOilChart, PressureQuartileChart, VenturiMomentumChart } from "./components/charts/ProductionCharts";
import { ImpedanceWlrChart, DensitometerScatter, GvfOffsetChart } from "./components/charts/FluidCharts";
import { GasExpansionAndRsChart, GasResidualChart, BoResidualHistogram } from "./components/charts/PvtAuditCharts";
import CorrelationHeatmap from "./components/charts/CorrelationHeatmap";
import { Mail, Phone, Gauge } from "lucide-react";

const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-navy-600 bg-navy-900/40 text-sm text-slate-400">
    Load a dataset from the "Data &amp; Auxiliary Setup" tab to view {label}.
  </div>
);

const OverviewTab: React.FC = () => {
  const { derived, rows } = useAppData();
  return (
    <div className="space-y-5">
      <KpiSection />
      {rows.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ProductionTimelineChart data={derived} />
          <GvfWatercutChart data={derived} />
        </div>
      ) : (
        <EmptyState label="production charts" />
      )}
    </div>
  );
};

const ProductionTab: React.FC = () => {
  const { derived, rows } = useAppData();
  if (rows.length === 0) return <EmptyState label="production analytics" />;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ActualVsStandardOilChart data={derived} />
      <PressureQuartileChart data={derived} />
      <div className="xl:col-span-2">
        <VenturiMomentumChart data={derived} />
      </div>
    </div>
  );
};

const FluidTab: React.FC = () => {
  const { derived, rows } = useAppData();
  if (rows.length === 0) return <EmptyState label="fluid & impedance charts" />;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <ImpedanceWlrChart data={derived} />
      <DensitometerScatter data={derived} />
      <div className="xl:col-span-2">
        <GvfOffsetChart data={derived} />
      </div>
    </div>
  );
};

const PvtTab: React.FC = () => {
  const { derived, rows } = useAppData();
  if (rows.length === 0) return <EmptyState label="PVT audit charts" />;
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <GasExpansionAndRsChart data={derived} />
      <GasResidualChart data={derived} />
      <div className="xl:col-span-2">
        <BoResidualHistogram data={derived} />
      </div>
    </div>
  );
};

const CorrelationTab: React.FC = () => {
  const { derived, rows } = useAppData();
  if (rows.length === 0) return <EmptyState label="the correlation matrix" />;
  return <CorrelationHeatmap data={derived} />;
};

const SetupTab: React.FC = () => (
  <div className="space-y-6">
    <DataSourcePanel />
    <AuxiliaryPanel />
  </div>
);

const TAB_CONTENT: Record<TabKey, React.FC> = {
  overview: OverviewTab,
  production: ProductionTab,
  fluid: FluidTab,
  pvt: PvtTab,
  correlation: CorrelationTab,
  setup: SetupTab,
};

const DashboardShell: React.FC = () => {
  const [tab, setTab] = useState<TabKey>("overview");
  const { loadSample, rows } = useAppData();

  useEffect(() => {
    if (rows.length === 0) loadSample();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ActiveTab = TAB_CONTENT[tab];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-navy-950 text-slate-100">
      <Sidebar active={tab} onChange={setTab} />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar tab={tab} />
        <main className="flex-1 overflow-y-auto px-6 py-5">
          <ActiveTab />
        </main>
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-navy-700/60 bg-navy-925 px-6 py-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <Gauge size={13} className="text-brand-orange" />
            <span>MPFM Data Analysis Dashboard — runs entirely client-side, ready for static hosting.</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-medium text-slate-300">Created by Amirreza Dalvand</span>
            <span className="flex items-center gap-1">
              <Mail size={12} /> a.rezadalvand@gmail.com
            </span>
            <span className="flex items-center gap-1">
              <Phone size={12} /> +989375166637
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppDataProvider>
      <DashboardShell />
    </AppDataProvider>
  );
}
