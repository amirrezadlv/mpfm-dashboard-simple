/**
 * Dual-state KPI engine: "Current Operating State" (rolling smoothing window)
 * vs "Total Average State" (whole-dataset mean).
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import type { MpfmRow } from "../types";
import { mean } from "./stats";

export interface KpiValue {
  key: string;
  label: string;
  unit: string;
  current: number;
  total: number;
  deltaPct: number; // (current - total) / total * 100
}

const FIELD_DEFS: { key: string; label: string; unit: string; getter: (r: MpfmRow) => number }[] = [
  { key: "oil", label: "Oil Flow (Std.)", unit: "bbl/d", getter: (r) => r.stdOil },
  { key: "gas", label: "Gas Flow (Std.)", unit: "scf/d", getter: (r) => r.stdGas },
  { key: "water", label: "Water Flow (Std.)", unit: "bbl/d", getter: (r) => r.stdWater },
  { key: "watercut", label: "Water Cut", unit: "%", getter: (r) => r.stdWatercut },
  { key: "gvf", label: "Gas Volume Fraction", unit: "%", getter: (r) => r.actGVF },
  { key: "gor", label: "GOR", unit: "scf/bbl", getter: (r) => r.gor },
  { key: "pressure", label: "Line Pressure", unit: "bar(a)", getter: (r) => r.pressureBara },
  { key: "temperature", label: "Line Temperature", unit: "°C", getter: (r) => r.temperatureC },
];

/**
 * Returns the "current operating state" subset: rows within the last 10 minutes
 * of data, falling back to the last 10 data points when the timeline is too
 * sparse (e.g. wide sampling intervals) to yield a meaningful 10-minute window.
 */
export function getCurrentStateWindow(rows: MpfmRow[]): MpfmRow[] {
  if (rows.length === 0) return [];
  const lastTime = rows[rows.length - 1].minutesFromStart;
  const byTime = rows.filter((r) => lastTime - r.minutesFromStart <= 10);
  if (byTime.length >= 3) return byTime;
  return rows.slice(Math.max(0, rows.length - 10));
}

export function computeKpis(rows: MpfmRow[]): KpiValue[] {
  if (rows.length === 0) {
    return FIELD_DEFS.map((f) => ({ key: f.key, label: f.label, unit: f.unit, current: 0, total: 0, deltaPct: 0 }));
  }
  const currentWindow = getCurrentStateWindow(rows);
  return FIELD_DEFS.map((f) => {
    const current = mean(currentWindow.map(f.getter));
    const total = mean(rows.map(f.getter));
    const deltaPct = total !== 0 ? ((current - total) / total) * 100 : 0;
    return { key: f.key, label: f.label, unit: f.unit, current, total, deltaPct };
  });
}
