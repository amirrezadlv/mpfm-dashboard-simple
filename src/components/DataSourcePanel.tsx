/**
 * Agnostic data ingestion panel: internal sample, Excel upload, live Google Sheet.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { useRef, useState } from "react";
import { Database, FileSpreadsheet, Link2, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAppData } from "../context/AppDataContext";

export const DataSourcePanel: React.FC = () => {
  const { meta, isLoading, error, loadSample, loadExcel, loadGoogleSheetUrl } = useAppData();
  const [sheetUrl, setSheetUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Sample dataset */}
      <div className="flex flex-col justify-between rounded-xl border border-navy-700/60 bg-navy-900/70 p-5">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/15 text-brand-orange">
            <Database size={20} />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Internal Sample Dataset</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Load a built-in minute-by-minute multiphase flow meter log to explore the dashboard immediately, no file
            required.
          </p>
        </div>
        <button
          onClick={loadSample}
          className="mt-4 rounded-lg bg-brand-orange px-4 py-2 text-sm font-semibold text-navy-950 transition hover:bg-brand-orange-light disabled:opacity-50"
          disabled={isLoading}
        >
          Load Sample Data
        </button>
      </div>

      {/* Excel upload */}
      <div className="flex flex-col justify-between rounded-xl border border-navy-700/60 bg-navy-900/70 p-5">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-500/15 text-sky-400">
            <FileSpreadsheet size={20} />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Upload Excel File</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Import any .xlsx/.xls/.csv export. Columns are matched by header content and raw values only — no fixed
            naming convention required.
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) loadExcel(f);
            e.target.value = "";
          }}
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 rounded-lg border border-sky-500/40 bg-sky-500/10 px-4 py-2 text-sm font-semibold text-sky-300 transition hover:bg-sky-500/20 disabled:opacity-50"
          disabled={isLoading}
        >
          Choose File…
        </button>
      </div>

      {/* Google Sheet */}
      <div className="flex flex-col justify-between rounded-xl border border-navy-700/60 bg-navy-900/70 p-5">
        <div>
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
            <Link2 size={20} />
          </div>
          <h3 className="text-sm font-semibold text-slate-100">Live Google Sheet</h3>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Paste a shareable Google Sheet link ("Anyone with the link can view"). Data is fetched live as CSV.
          </p>
        </div>
        <div className="mt-4 flex gap-2">
          <input
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
            placeholder="https://docs.google.com/spreadsheets/d/…"
            className="w-full min-w-0 rounded-lg border border-navy-600 bg-navy-950 px-3 py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-brand-orange focus:outline-none"
          />
          <button
            onClick={() => sheetUrl && loadGoogleSheetUrl(sheetUrl)}
            disabled={isLoading || !sheetUrl}
            className="shrink-0 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-500/20 disabled:opacity-50"
          >
            Fetch
          </button>
        </div>
      </div>

      {/* Status bar */}
      <div className="lg:col-span-3">
        {isLoading && (
          <div className="flex items-center gap-2 rounded-lg border border-navy-700 bg-navy-900/70 px-4 py-3 text-sm text-slate-300">
            <Loader2 className="animate-spin text-brand-orange" size={16} /> Loading dataset…
          </div>
        )}
        {!isLoading && error && (
          <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {error}
          </div>
        )}
        {!isLoading && !error && meta && (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-4 py-3 text-sm text-emerald-300">
            <span className="flex items-center gap-2 font-medium">
              <CheckCircle2 size={16} /> Dataset loaded
            </span>
            <span className="text-slate-300">
              Source: <span className="text-slate-100">{meta.label}</span>
            </span>
            <span className="text-slate-300">
              Rows: <span className="text-slate-100">{meta.rowCount}</span>
            </span>
            <span className="text-slate-300">
              Fields matched: <span className="text-slate-100">{meta.matchedFieldCount}</span>
            </span>
            {meta.unmatchedHeaders.length > 0 && (
              <span className="text-amber-300">Unrecognized columns ignored: {meta.unmatchedHeaders.join(", ")}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DataSourcePanel;
