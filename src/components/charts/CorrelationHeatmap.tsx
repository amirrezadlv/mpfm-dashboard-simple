/**
 * Correlation matrix heatmap: Pearson correlation coefficients across
 * process & phase variables.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { useMemo } from "react";
import type { DerivedRow } from "../../lib/pvt";
import { pearsonCorrelation, round } from "../../lib/stats";
import { CORRELATION_SCALE } from "../../lib/theme";
import ChartCard from "../ChartCard";

const VARS: { key: string; label: string; get: (d: DerivedRow) => number }[] = [
  { key: "P", label: "Pressure", get: (d) => d.row.pressureBara },
  { key: "T", label: "Temperature", get: (d) => d.row.temperatureC },
  { key: "Qo", label: "Oil Rate", get: (d) => d.row.stdOil },
  { key: "Qg", label: "Gas Rate", get: (d) => d.row.stdGas },
  { key: "Qw", label: "Water Rate", get: (d) => d.row.stdWater },
  { key: "WC", label: "Watercut", get: (d) => d.row.stdWatercut },
  { key: "GVF", label: "GVF", get: (d) => d.row.actGVF },
  { key: "ρmix", label: "Mix Density", get: (d) => d.row.mixtureDensity },
  { key: "GOR", label: "GOR", get: (d) => d.row.gor },
];

export const CorrelationHeatmap: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const matrix = useMemo(() => {
    const series = VARS.map((v) => data.map(v.get));
    return VARS.map((_, i) => VARS.map((_, j) => pearsonCorrelation(series[i], series[j])));
  }, [data]);

  return (
    <ChartCard title="Correlation Matrix" subtitle="Pearson correlation coefficients across process & phase variables">
      <div className="overflow-x-auto">
        <table className="w-full border-separate" style={{ borderSpacing: 3 }}>
          <thead>
            <tr>
              <th className="w-20" />
              {VARS.map((v) => (
                <th key={v.key} className="px-1 pb-1 text-center text-[10px] font-medium text-slate-400">
                  {v.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VARS.map((rowVar, i) => (
              <tr key={rowVar.key}>
                <td className="pr-2 text-right text-[10px] font-medium text-slate-400 whitespace-nowrap">{rowVar.label}</td>
                {VARS.map((colVar, j) => {
                  const v = matrix[i][j];
                  return (
                    <td key={colVar.key} className="p-0">
                      <div
                        title={`${rowVar.label} vs ${colVar.label}: ${round(v, 2)}`}
                        className="flex h-9 w-full min-w-[38px] items-center justify-center rounded text-[10px] font-semibold text-white"
                        style={{ backgroundColor: CORRELATION_SCALE(v) }}
                      >
                        {round(v, 2)}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center justify-center gap-2 text-[10px] text-slate-400">
        <span>-1.0</span>
        <div className="h-2 w-40 rounded-full" style={{ background: "linear-gradient(90deg, rgb(10,30,60), #ffffff10, #f5820b)" }} />
        <span>+1.0</span>
      </div>
    </ChartCard>
  );
};

export default CorrelationHeatmap;
