/**
 * Black-oil PVT engine & multiphase flow physics for the MPFM dashboard.
 *
 * Conversion factors are modeled as bilinear functions of line temperature T (deg C)
 * and line pressure P (bar(a)):
 *   Bo = A0 + A1*T + (B0 + B1*T) * P
 *   Rs = max(0, D0 + D1*T + (E0 + E1*T) * P)
 *   Z  = F0 + F1*T + (G0 + G1*T) * P
 *
 * Venturi momentum flux consistency check:
 *   dP = (rho_mix / 2) * (Q_total / (Cq * A_throat))^2
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */

import type { AuxParams, MpfmRow } from "../types";

export function computeBo(t: number, p: number, aux: AuxParams): number {
  return aux.boA0 + aux.boA1 * t + (aux.boB0 + aux.boB1 * t) * p;
}

export function computeRs(t: number, p: number, aux: AuxParams): number {
  return Math.max(0, aux.rsD0 + aux.rsD1 * t + (aux.rsE0 + aux.rsE1 * t) * p);
}

export function computeZ(t: number, p: number, aux: AuxParams): number {
  return aux.zF0 + aux.zF1 * t + (aux.zG0 + aux.zG1 * t) * p;
}

/** Gas formation volume factor (real-gas law), dimensionless volume ratio act/std. */
export function computeBg(t: number, p: number, aux: AuxParams): number {
  const z = computeZ(t, p, aux);
  const tK = t + 273.15;
  const tScK = aux.tSc + 273.15;
  if (p <= 0) return 0;
  return (z * tK * aux.pSc) / (p * tScK);
}

/** Homogeneous mixture density from in-situ phase fractions and densities. */
export function homogeneousMixtureDensity(
  gasFraction: number, // alpha
  waterFraction: number, // beta
  oilFraction: number, // gamma
  rhoGas: number,
  rhoWater: number,
  rhoOil: number
): number {
  return gasFraction * rhoGas + waterFraction * rhoWater + oilFraction * rhoOil;
}

export interface DerivedRow {
  row: MpfmRow;
  boModel: number;
  boMeasured: number;
  boResidual: number;
  rsModel: number;
  zModel: number;
  bgModel: number;
  wlr: number; // %
  gasFraction: number; // 0..1
  waterFraction: number; // 0..1
  oilFraction: number; // 0..1
  rhoMixModel: number;
  rhoMixResidual: number; // measured - model
  gvfDensityImplied: number; // %
  gvfOffset: number; // reported - density implied
  ventilDpInferred: number | null; // bar
  mixtureVelocity: number | null; // m/s
  superficialLiquidVelocity: number | null; // m/s
  superficialGasVelocity: number | null; // m/s
  actGasImplied: number; // ft3/d implied from std gas via Bg
  gasRateResidual: number; // measured act gas - implied act gas
}

const BBL_TO_M3 = 0.158987;
const FT3_TO_M3 = 0.0283168;

export function computeDerivedRow(row: MpfmRow, aux: AuxParams): DerivedRow {
  const t = row.temperatureC;
  const p = row.pressureBara;

  const boModel = computeBo(t, p, aux);
  const boMeasured = row.stdOil > 0 ? row.actOil / row.stdOil : boModel;
  const boResidual = boMeasured - boModel;

  const rsModel = computeRs(t, p, aux);
  const zModel = computeZ(t, p, aux);
  const bgModel = computeBg(t, p, aux);

  const liquidTotal = row.actOil + row.actWater;
  const wlr = liquidTotal > 0 ? (row.actWater / liquidTotal) * 100 : 0;

  const gasFraction = Math.min(1, Math.max(0, row.actGVF / 100));
  const liquidFraction = 1 - gasFraction;
  const wcFraction = Math.min(1, Math.max(0, row.stdWatercut / 100));
  const waterFraction = liquidFraction * wcFraction;
  const oilFraction = liquidFraction * (1 - wcFraction);

  const rhoMixModel = homogeneousMixtureDensity(
    gasFraction,
    waterFraction,
    oilFraction,
    row.gasDensity || aux.rhoGasStd,
    row.waterDensity || aux.rhoWaterStd,
    row.oilDensity || aux.rhoOilStd
  );
  const rhoMixResidual = row.mixtureDensity - rhoMixModel;

  const rhoLiquid = row.waterDensity && row.oilDensity ? waterFraction / liquidFraction * row.waterDensity + oilFraction / liquidFraction * row.oilDensity : aux.rhoOilStd;
  const rhoLiquidSafe = Number.isFinite(rhoLiquid) && rhoLiquid > 0 ? rhoLiquid : (row.oilDensity || aux.rhoOilStd);
  const rhoGasSafe = row.gasDensity || aux.rhoGasStd;
  const denomDensity = rhoLiquidSafe - rhoGasSafe;
  const gvfDensityImplied = denomDensity !== 0 ? Math.min(100, Math.max(0, ((rhoLiquidSafe - row.mixtureDensity) / denomDensity) * 100)) : 0;
  const gvfOffset = row.actGVF - gvfDensityImplied;

  // Venturi momentum: total actual volumetric flow (m3/s)
  const qOilM3s = (row.actOil * BBL_TO_M3) / 86400;
  const qWaterM3s = (row.actWater * BBL_TO_M3) / 86400;
  const qGasM3s = (row.actGas * FT3_TO_M3) / 86400;
  const qTotalM3s = qOilM3s + qWaterM3s + qGasM3s;

  const throatAreaM2 = Math.PI * (aux.throatDiameterMm / 1000 / 2) ** 2;
  const pipeAreaM2 = Math.PI * (aux.pipeInternalDiameterMm / 1000 / 2) ** 2;
  const cq = aux.dischargeCoefficient > 0 ? aux.dischargeCoefficient : 0.98;

  let ventilDpInferred: number | null = null;
  let mixtureVelocity: number | null = null;
  let superficialLiquidVelocity: number | null = null;
  let superficialGasVelocity: number | null = null;

  if (throatAreaM2 > 0 && pipeAreaM2 > 0 && row.mixtureDensity > 0) {
    const vThroat = qTotalM3s / (cq * throatAreaM2);
    const dpPa = (row.mixtureDensity / 2) * vThroat ** 2;
    ventilDpInferred = dpPa / 100000; // Pa -> bar
    mixtureVelocity = qTotalM3s / pipeAreaM2;
    superficialLiquidVelocity = (qOilM3s + qWaterM3s) / pipeAreaM2;
    superficialGasVelocity = qGasM3s / pipeAreaM2;
  }

  // 1 scf is numerically equal to 1 ft3 at standard reference conditions, so Bg (act/std
  // volume ratio) can be applied directly to convert standard gas rate to actual gas rate.
  const actGasImplied = bgModel > 0 ? row.stdGas * bgModel : row.actGas;
  const gasRateResidual = row.actGas - actGasImplied;

  return {
    row,
    boModel,
    boMeasured,
    boResidual,
    rsModel,
    zModel,
    bgModel,
    wlr,
    gasFraction,
    waterFraction,
    oilFraction,
    rhoMixModel,
    rhoMixResidual,
    gvfDensityImplied,
    gvfOffset,
    ventilDpInferred,
    mixtureVelocity,
    superficialLiquidVelocity,
    superficialGasVelocity,
    actGasImplied,
    gasRateResidual,
  };
}
