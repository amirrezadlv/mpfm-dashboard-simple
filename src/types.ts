/**
 * Multiphase Flow Meter (MPFM) Data Analysis Dashboard
 * Core type definitions.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */

export interface MpfmRow {
  /** Row index in the original dataset (0-based) */
  idx: number;
  /** Parsed timestamp (falls back to index-based synthetic time if unavailable) */
  timestamp: Date;
  /** Minutes elapsed since first sample (used for "last 10 minutes" windows) */
  minutesFromStart: number;

  // --- Process conditions ---
  pressureRaw: number; // as read from source, original unit
  pressureUnit: string; // display unit label, e.g. "psig"
  pressureBara: number; // normalized to bar(a) for PVT engine
  temperatureRaw: number; // as read from source, original unit
  temperatureUnit: string; // display unit label, e.g. "°F"
  temperatureC: number; // normalized to °C for PVT engine

  // --- Standard condition rates ---
  stdOil: number; // bbl/d
  stdGas: number; // scf/d
  stdWater: number; // bbl/d
  stdWatercut: number; // %
  gor: number; // scf/bbl

  // --- Actual (in-situ) condition rates ---
  actOil: number; // bbl/d
  actGas: number; // ft3/d
  actWater: number; // bbl/d
  actGVF: number; // %

  // --- Densities (in-situ / process) ---
  mixtureDensity: number; // kg/m3
  oilDensity: number; // kg/m3
  gasDensity: number; // kg/m3
  waterDensity: number; // kg/m3

  // --- Electrical / sensor response ---
  permittivity: number | null;
  conductivity: number | null;
  differentialPressure: number | null;

  // --- Mass rates (optional) ---
  stdOilMass: number | null;
  stdGasMass: number | null;
  stdWaterMass: number | null;
  actOilMass: number | null;
  actGasMass: number | null;
  actWaterMass: number | null;

  // --- Accumulated volumes (optional) ---
  stdAccumOil: number | null;
  stdAccumGas: number | null;
  stdAccumWater: number | null;
  actAccumOil: number | null;
  actAccumGas: number | null;
  actAccumWater: number | null;
}

export type DataSourceType = "sample" | "excel" | "google-sheet";

export interface DatasetMeta {
  source: DataSourceType;
  label: string;
  loadedAt: Date;
  rowCount: number;
  unmatchedHeaders: string[];
  matchedFieldCount: number;
}

/** Black-oil PVT bilinear coefficients + fluid/lab auxiliary inputs, all user-editable */
export interface AuxParams {
  // Bo = A0 + A1*T + (B0 + B1*T) * P
  boA0: number;
  boA1: number;
  boB0: number;
  boB1: number;
  // Rs = max(0, D0 + D1*T + (E0 + E1*T) * P)
  rsD0: number;
  rsD1: number;
  rsE0: number;
  rsE1: number;
  // Z = F0 + F1*T + (G0 + G1*T) * P
  zF0: number;
  zF1: number;
  zG0: number;
  zG1: number;

  // Standard fluid densities (kg/m3)
  rhoOilStd: number;
  rhoWaterStd: number;
  rhoGasStd: number;

  // Standard conditions reference
  pSc: number; // bar(a)
  tSc: number; // °C

  // Venturi / geometry
  pipeInternalDiameterMm: number;
  throatDiameterMm: number;
  dischargeCoefficient: number; // Cq

  // Laboratory test data (calibration reference)
  labApiGravity: number; // °API
  labWaterSalinityPpm: number;
  labBswPercent: number; // basic sediment & water, %
  labGorScfBbl: number; // reference lab GOR
  labBoRb: number; // reference lab Bo (rb/stb)
  labSampleDate: string;

  // Wet-gas boundary threshold used in GVF chart, %
  wetGasGvfThreshold: number;
}
