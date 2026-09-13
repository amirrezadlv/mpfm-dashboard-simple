/**
 * Auxiliary Input & Deciphering Panel — editable Black-Oil PVT coefficients,
 * standard fluid densities, venturi geometry, and laboratory reference data.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React from "react";
import { RotateCcw, FlaskConical, Droplets, Gauge, Beaker } from "lucide-react";
import { useAppData } from "../context/AppDataContext";
import type { AuxParams } from "../types";

interface FieldDef {
  key: keyof AuxParams;
  label: string;
  step?: number;
}

const NumberField: React.FC<{
  def: FieldDef;
  value: number | string;
  onChange: (v: string) => void;
}> = ({ def, value, onChange }) => (
  <label className="block">
    <span className="mb-1 block text-[11px] font-medium text-slate-400">{def.label}</span>
    <input
      type={typeof value === "string" && def.key === "labSampleDate" ? "date" : "number"}
      step={def.step ?? "any"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-md border border-navy-600 bg-navy-950 px-2.5 py-1.5 text-xs text-slate-100 tabular-nums focus:border-brand-orange focus:outline-none"
    />
  </label>
);

const Section: React.FC<{ icon: React.ReactNode; title: string; description: string; children: React.ReactNode }> = ({
  icon,
  title,
  description,
  children,
}) => (
  <div className="rounded-xl border border-navy-700/60 bg-navy-900/70 p-4">
    <div className="mb-3 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-orange/15 text-brand-orange">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
        <p className="text-[11px] text-slate-400">{description}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{children}</div>
  </div>
);

export const AuxiliaryPanel: React.FC = () => {
  const { aux, setAux, resetAux } = useAppData();

  const bind = (key: keyof AuxParams) => ({
    def: { key, label: key },
    value: aux[key] as number,
    onChange: (v: string) =>
      setAux((prev) => ({ ...prev, [key]: key === "labSampleDate" ? v : parseFloat(v) || 0 })),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-100">Auxiliary Input &amp; Deciphering Panel</h2>
          <p className="text-xs text-slate-400">
            Override the Black-Oil PVT coefficients, fluid densities, venturi geometry, and lab calibration data used
            throughout every chart and KPI in this dashboard.
          </p>
        </div>
        <button
          onClick={resetAux}
          className="flex items-center gap-1.5 rounded-lg border border-navy-600 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-brand-orange hover:text-brand-orange"
        >
          <RotateCcw size={13} /> Reset to defaults
        </button>
      </div>

      <Section
        icon={<FlaskConical size={16} />}
        title="Shrinkage Factor — Bo(T, P)"
        description="Bo = A0 + A1·T + (B0 + B1·T)·P"
      >
        <NumberField {...bind("boA0")} def={{ key: "boA0", label: "A0" }} />
        <NumberField {...bind("boA1")} def={{ key: "boA1", label: "A1 (per °C)" }} />
        <NumberField {...bind("boB0")} def={{ key: "boB0", label: "B0 (per bar)" }} />
        <NumberField {...bind("boB1")} def={{ key: "boB1", label: "B1 (per °C·bar)" }} />
      </Section>

      <Section
        icon={<FlaskConical size={16} />}
        title="Solution Gas — Rs(T, P)"
        description="Rs = max(0, D0 + D1·T + (E0 + E1·T)·P)"
      >
        <NumberField {...bind("rsD0")} def={{ key: "rsD0", label: "D0 (scf/bbl)" }} />
        <NumberField {...bind("rsD1")} def={{ key: "rsD1", label: "D1 (per °C)" }} />
        <NumberField {...bind("rsE0")} def={{ key: "rsE0", label: "E0 (per bar)" }} />
        <NumberField {...bind("rsE1")} def={{ key: "rsE1", label: "E1 (per °C·bar)" }} />
      </Section>

      <Section
        icon={<FlaskConical size={16} />}
        title="Gas Compressibility — Z(T, P)"
        description="Z = F0 + F1·T + (G0 + G1·T)·P"
      >
        <NumberField {...bind("zF0")} def={{ key: "zF0", label: "F0" }} />
        <NumberField {...bind("zF1")} def={{ key: "zF1", label: "F1 (per °C)" }} />
        <NumberField {...bind("zG0")} def={{ key: "zG0", label: "G0 (per bar)" }} />
        <NumberField {...bind("zG1")} def={{ key: "zG1", label: "G1 (per °C·bar)" }} />
      </Section>

      <Section
        icon={<Droplets size={16} />}
        title="Standard Fluid Densities &amp; Reference Conditions"
        description="Used for homogeneous mixture density modelling and Bg conversion"
      >
        <NumberField {...bind("rhoOilStd")} def={{ key: "rhoOilStd", label: "Oil density (kg/m³)" }} />
        <NumberField {...bind("rhoWaterStd")} def={{ key: "rhoWaterStd", label: "Water density (kg/m³)" }} />
        <NumberField {...bind("rhoGasStd")} def={{ key: "rhoGasStd", label: "Gas density (kg/m³)" }} />
        <NumberField {...bind("wetGasGvfThreshold")} def={{ key: "wetGasGvfThreshold", label: "Wet-gas GVF threshold (%)" }} />
        <NumberField {...bind("pSc")} def={{ key: "pSc", label: "Standard pressure (bar a)" }} />
        <NumberField {...bind("tSc")} def={{ key: "tSc", label: "Standard temperature (°C)" }} />
      </Section>

      <Section
        icon={<Gauge size={16} />}
        title="Venturi &amp; Pipe Geometry"
        description="Δp = (ρ_mix / 2) · (Q_total / (Cq · A_throat))²"
      >
        <NumberField {...bind("pipeInternalDiameterMm")} def={{ key: "pipeInternalDiameterMm", label: "Pipe ID (mm)" }} />
        <NumberField {...bind("throatDiameterMm")} def={{ key: "throatDiameterMm", label: "Throat diameter (mm)" }} />
        <NumberField {...bind("dischargeCoefficient")} def={{ key: "dischargeCoefficient", label: "Discharge coeff. Cq" }} />
      </Section>

      <Section
        icon={<Beaker size={16} />}
        title="Laboratory Test Data (Calibration Reference)"
        description="Reference values from PVT / fluid lab reports"
      >
        <NumberField {...bind("labApiGravity")} def={{ key: "labApiGravity", label: "API gravity (°API)" }} />
        <NumberField {...bind("labWaterSalinityPpm")} def={{ key: "labWaterSalinityPpm", label: "Water salinity (ppm)" }} />
        <NumberField {...bind("labBswPercent")} def={{ key: "labBswPercent", label: "Lab BS&W (%)" }} />
        <NumberField {...bind("labGorScfBbl")} def={{ key: "labGorScfBbl", label: "Lab GOR (scf/bbl)" }} />
        <NumberField {...bind("labBoRb")} def={{ key: "labBoRb", label: "Lab Bo (rb/stb)" }} />
        <NumberField {...bind("labSampleDate")} def={{ key: "labSampleDate", label: "Sample date" }} />
      </Section>
    </div>
  );
};

export default AuxiliaryPanel;
