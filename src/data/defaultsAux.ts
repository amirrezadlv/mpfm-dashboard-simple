/**
 * Default auxiliary / deciphering parameters for the black-oil PVT engine,
 * fluid densities, venturi geometry, and laboratory reference data.
 * All values are editable at runtime from the Auxiliary Input panel.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import type { AuxParams } from "../types";

export const defaultAuxParams: AuxParams = {
  // Bo = A0 + A1*T + (B0 + B1*T) * P  (T in degC, P in bar(a))
  boA0: 1.02,
  boA1: 0.0006,
  boB0: 0.00035,
  boB1: 0.0000015,

  // Rs = max(0, D0 + D1*T + (E0 + E1*T) * P)
  rsD0: -5,
  rsD1: 0.15,
  rsE0: 0.11,
  rsE1: 0.0004,

  // Z = F0 + F1*T + (G0 + G1*T) * P
  zF0: 0.99,
  zF1: -0.00015,
  zG0: -0.00045,
  zG1: 0.0000025,

  rhoOilStd: 890,
  rhoWaterStd: 1090,
  rhoGasStd: 0.85,

  pSc: 1.01325,
  tSc: 15,

  pipeInternalDiameterMm: 102,
  throatDiameterMm: 51,
  dischargeCoefficient: 0.98,

  labApiGravity: 27.5,
  labWaterSalinityPpm: 65000,
  labBswPercent: 0.3,
  labGorScfBbl: 24,
  labBoRb: 1.05,
  labSampleDate: new Date().toISOString().slice(0, 10),

  wetGasGvfThreshold: 95,
};
