/**
 * Header-agnostic ingestion engine.
 *
 * This module inspects raw column headers (whatever names/order they arrive in)
 * and, failing that, the shape of the raw row data, to classify each column into
 * a canonical MPFM field. No reliance on file naming conventions is made anywhere.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */

import type { MpfmRow } from "../types";
import { normalizePressureToBara, normalizeTemperatureToC } from "./units";

export type CanonicalField =
  | "timestamp"
  | "pressure"
  | "differentialPressure"
  | "temperature"
  | "stdOil"
  | "actOil"
  | "stdGas"
  | "actGas"
  | "stdWater"
  | "actWater"
  | "stdWatercut"
  | "gor"
  | "actGVF"
  | "mixtureDensity"
  | "oilDensity"
  | "gasDensity"
  | "waterDensity"
  | "permittivity"
  | "conductivity"
  | "stdOilMass"
  | "stdGasMass"
  | "stdWaterMass"
  | "actOilMass"
  | "actGasMass"
  | "actWaterMass"
  | "stdAccumOil"
  | "stdAccumGas"
  | "stdAccumWater"
  | "actAccumOil"
  | "actAccumGas"
  | "actAccumWater"
  | "ignore";

function hasAny(h: string, ...tokens: string[]): boolean {
  return tokens.some((t) => h.includes(t));
}

/**
 * Classifies a single header string into a canonical field. Order of checks matters:
 * more specific patterns (accumulation, mass rate) are evaluated before generic
 * rate/flow patterns to avoid misclassification.
 */
export function classifyHeader(rawHeader: string): CanonicalField {
  const h = (rawHeader || "").toLowerCase().trim();
  if (!h) return "ignore";

  if (hasAny(h, "date", "time", "timestamp")) return "timestamp";

  // Cumulative / accumulated volumes
  if (hasAny(h, "accum", "cumul", "totalizer", "total vol")) {
    const isStd = hasAny(h, "std", "standard", "sc") && !hasAny(h, "actual", "act.");
    if (h.includes("oil")) return isStd ? "stdAccumOil" : "actAccumOil";
    if (h.includes("gas")) return isStd ? "stdAccumGas" : "actAccumGas";
    if (h.includes("water")) return isStd ? "stdAccumWater" : "actAccumWater";
    return "ignore";
  }

  // Mass rates
  if (h.includes("mass")) {
    const isStd = hasAny(h, "std", "standard") && !hasAny(h, "actual", "act.");
    if (h.includes("oil")) return isStd ? "stdOilMass" : "actOilMass";
    if (h.includes("gas")) return isStd ? "stdGasMass" : "actGasMass";
    if (h.includes("water")) return isStd ? "stdWaterMass" : "actWaterMass";
    return "ignore";
  }

  // Differential pressure (must be checked before generic pressure)
  if (hasAny(h, "differential", "delta p", "dp)", " dp", "d/p") || (h.includes("pressure") && h.includes("diff"))) {
    return "differentialPressure";
  }

  // Line / static pressure
  if (h.includes("pressure")) return "pressure";

  if (h.includes("temp")) return "temperature";

  if (hasAny(h, "watercut", "water cut", "wc (", "wc(%") || (h.includes("wc") && h.includes("%"))) return "stdWatercut";

  if (h.includes("gor")) return "gor";

  if (h.includes("gvf")) return "actGVF";

  if (h.includes("permitt")) return "permittivity";
  if (h.includes("conduct")) return "conductivity";

  if (h.includes("density") || h.includes("kg/m3") || h.includes("kg/m^3")) {
    if (h.includes("mix")) return "mixtureDensity";
    if (h.includes("oil")) return "oilDensity";
    if (h.includes("gas")) return "gasDensity";
    if (h.includes("water")) return "waterDensity";
    return "ignore";
  }

  // Generic flow / rate columns
  if (hasAny(h, "flow", "rate", "bpd", "scfd", "cfd", "bbl/d", "scf/d")) {
    const isStd = hasAny(h, "std", "standard", "sc.", "sc ") && !hasAny(h, "actual", "act.", " act");
    const isAct = hasAny(h, "act", "actual") && !isStd;
    if (h.includes("oil")) return isAct ? "actOil" : "stdOil";
    if (h.includes("gas")) return isAct ? "actGas" : "stdGas";
    if (h.includes("water")) return isAct ? "actWater" : "stdWater";
    return "ignore";
  }

  return "ignore";
}

export interface RawTable {
  headers: string[];
  rows: (string | number | null | undefined)[][];
}

export interface ClassifiedResult {
  data: MpfmRow[];
  unmatchedHeaders: string[];
  matchedFieldCount: number;
}

function toNum(v: unknown): number {
  if (typeof v === "number") return v;
  if (v === null || v === undefined || v === "") return NaN;
  const cleaned = String(v).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : NaN;
}

function parseTimestamp(v: unknown, fallbackIdx: number, baseTime: Date): Date {
  if (v instanceof Date && !Number.isNaN(v.getTime())) return v;
  if (typeof v === "number") {
    // Could be an Excel serial date
    if (v > 20000 && v < 80000) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));
      return new Date(excelEpoch.getTime() + v * 86400000);
    }
  }
  if (typeof v === "string" && v.trim() !== "") {
    const d = new Date(v.replace(/(\d{4}-\d{2}-\d{2}) /, "$1T"));
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date(baseTime.getTime() + fallbackIdx * 60000);
}

/** Transforms a generic raw header/row table into the canonical MpfmRow[] structure. */
export function classifyAndBuild(table: RawTable): ClassifiedResult {
  const fieldMap: CanonicalField[] = table.headers.map(classifyHeader);
  const unmatchedHeaders = table.headers.filter((_, i) => fieldMap[i] === "ignore");
  const matchedFieldCount = fieldMap.filter((f) => f !== "ignore").length;

  const colIndex = (field: CanonicalField): number => fieldMap.findIndex((f) => f === field);
  const tsCol = colIndex("timestamp");
  const pCol = colIndex("pressure");
  const tCol = colIndex("temperature");

  const pHeader = pCol >= 0 ? table.headers[pCol] : "psig";
  const tHeader = tCol >= 0 ? table.headers[tCol] : "deg F";

  const baseTime = new Date();
  const data: MpfmRow[] = table.rows.map((row, idx) => {
    const get = (field: CanonicalField): number => {
      const c = colIndex(field);
      return c >= 0 ? toNum(row[c]) : NaN;
    };
    const getOrNull = (field: CanonicalField): number | null => {
      const v = get(field);
      return Number.isFinite(v) ? v : null;
    };

    const pressureRaw = get("pressure");
    const temperatureRaw = get("temperature");
    const pNorm = normalizePressureToBara(Number.isFinite(pressureRaw) ? pressureRaw : 0, pHeader);
    const tNorm = normalizeTemperatureToC(Number.isFinite(temperatureRaw) ? temperatureRaw : 0, tHeader);

    let stdOil = get("stdOil");
    let stdGas = get("stdGas");
    let stdWater = get("stdWater");
    const actOil = get("actOil");
    const actGas = get("actGas");
    const actWater = get("actWater");
    let stdWatercut = get("stdWatercut");
    let gor = get("gor");

    // Derive missing standard fields where physically reasonable
    if (!Number.isFinite(stdWater) && Number.isFinite(actWater)) stdWater = actWater;
    if (!Number.isFinite(stdWatercut) && Number.isFinite(stdOil) && Number.isFinite(stdWater)) {
      const total = stdOil + stdWater;
      stdWatercut = total > 0 ? (stdWater / total) * 100 : 0;
    }
    if (!Number.isFinite(gor) && Number.isFinite(stdGas) && Number.isFinite(stdOil) && stdOil > 0) {
      gor = stdGas / stdOil;
    }
    if (!Number.isFinite(stdOil)) stdOil = 0;
    if (!Number.isFinite(stdGas)) stdGas = 0;
    if (!Number.isFinite(stdWater)) stdWater = 0;
    if (!Number.isFinite(stdWatercut)) stdWatercut = 0;
    if (!Number.isFinite(gor)) gor = 0;

    const timestamp = tsCol >= 0 ? parseTimestamp(row[tsCol], idx, baseTime) : new Date(baseTime.getTime() + idx * 60000);

    return {
      idx,
      timestamp,
      minutesFromStart: 0, // filled in after full array is built
      pressureRaw: Number.isFinite(pressureRaw) ? pressureRaw : 0,
      pressureUnit: pNorm.unitLabel,
      pressureBara: pNorm.bara,
      temperatureRaw: Number.isFinite(temperatureRaw) ? temperatureRaw : 0,
      temperatureUnit: tNorm.unitLabel,
      temperatureC: tNorm.celsius,
      stdOil,
      stdGas,
      stdWater,
      stdWatercut,
      gor,
      actOil: Number.isFinite(actOil) ? actOil : stdOil,
      actGas: Number.isFinite(actGas) ? actGas : stdGas,
      actWater: Number.isFinite(actWater) ? actWater : stdWater,
      actGVF: get("actGVF") || 0,
      mixtureDensity: get("mixtureDensity") || 0,
      oilDensity: get("oilDensity") || 0,
      gasDensity: get("gasDensity") || 0,
      waterDensity: get("waterDensity") || 0,
      permittivity: getOrNull("permittivity"),
      conductivity: getOrNull("conductivity"),
      differentialPressure: getOrNull("differentialPressure"),
      stdOilMass: getOrNull("stdOilMass"),
      stdGasMass: getOrNull("stdGasMass"),
      stdWaterMass: getOrNull("stdWaterMass"),
      actOilMass: getOrNull("actOilMass"),
      actGasMass: getOrNull("actGasMass"),
      actWaterMass: getOrNull("actWaterMass"),
      stdAccumOil: getOrNull("stdAccumOil"),
      stdAccumGas: getOrNull("stdAccumGas"),
      stdAccumWater: getOrNull("stdAccumWater"),
      actAccumOil: getOrNull("actAccumOil"),
      actAccumGas: getOrNull("actAccumGas"),
      actAccumWater: getOrNull("actAccumWater"),
    };
  });

  data.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  const t0 = data.length > 0 ? data[0].timestamp.getTime() : 0;
  data.forEach((d, i) => {
    d.idx = i;
    d.minutesFromStart = (d.timestamp.getTime() - t0) / 60000;
  });

  return { data, unmatchedHeaders, matchedFieldCount };
}
