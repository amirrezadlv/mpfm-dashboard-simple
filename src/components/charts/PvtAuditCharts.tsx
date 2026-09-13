/**
 * PVT audit charts: Gas Expansion Factor (Bg), Solution Gas (Rs), Gas Actual-Rate
 * Residuals, and Bo Residual Distribution.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import type { DerivedRow } from "../../lib/pvt";
import { CHART } from "../../lib/theme";
import { downsample, formatTimeLabel } from "../../lib/downsample";
import { histogram, round, mean, stdDev } from "../../lib/stats";
import ChartCard from "../ChartCard";

const tooltipStyle = {
  backgroundColor: "rgba(10, 23, 48, 0.85)",
  backdropFilter: "blur(6px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "6px",
  fontSize: "11px",
  color: "#e2e8f0",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
  padding: "8px 12px",
};

const numFormatter = (v: unknown): string => (typeof v === "number" ? String(round(v, 4)) : String(v ?? ""));

export const GasExpansionAndRsChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        t: formatTimeLabel(d.row.timestamp),
        bg: d.bgModel,
        rs: d.rsModel,
        gorMeasured: d.row.gor,
      })),
    [data]
  );
  return (
    <ChartCard title="Gas Expansion Factor (Bg) & Solution Gas (Rs)" subtitle="Model outputs from the Black-Oil PVT engine vs measured GOR">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="t" stroke={CHART.axis} fontSize={11} minTickGap={30} />
          <YAxis yAxisId="bg" stroke={CHART.accent} fontSize={11} label={{ value: "Bg (act/std)", angle: -90, fill: CHART.accent, fontSize: 11, position: "insideLeft" }} />
          <YAxis yAxisId="rs" orientation="right" stroke={CHART.water} fontSize={11} label={{ value: "Rs / GOR (scf/bbl)", angle: 90, fill: CHART.water, fontSize: 11, position: "insideRight" }} />
          <Tooltip contentStyle={tooltipStyle} formatter={numFormatter} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <Line 
            yAxisId="bg" 
            type="monotone" 
            dataKey="bg" 
            name="Gas Expansion Factor Bg" 
            stroke={CHART.accent} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.accent, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            yAxisId="rs" 
            type="monotone" 
            dataKey="rs" 
            name="Model Rs (scf/bbl)" 
            stroke={CHART.teal} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.teal, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.teal, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            yAxisId="rs" 
            type="monotone" 
            dataKey="gorMeasured" 
            name="Measured GOR (scf/bbl)" 
            stroke={CHART.water} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.water, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.water, stroke: "#fff", strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const GasResidualChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        t: formatTimeLabel(d.row.timestamp),
        residual: d.gasRateResidual,
      })),
    [data]
  );
  return (
    <ChartCard title="Gas Actual-Rate Residuals" subtitle="Act. Gas Flowrate (measured) − Std. Gas Flowrate × Bg (implied by PVT model)">
      <ResponsiveContainer width="100%" height={280}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="t" stroke={CHART.axis} fontSize={11} minTickGap={30} />
          <YAxis stroke={CHART.axis} fontSize={11} label={{ value: "ft³/d", angle: -90, fill: CHART.axis, fontSize: 11, position: "insideLeft" }} />
          <Tooltip contentStyle={tooltipStyle} formatter={numFormatter} />
          <ReferenceLine y={0} stroke={CHART.axis} />
          <Line 
            type="monotone" 
            dataKey="residual" 
            name="Gas rate residual" 
            stroke={CHART.danger} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.danger, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.danger, stroke: "#fff", strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const BoResidualHistogram: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const residuals = useMemo(() => data.map((d) => d.boResidual).filter((v) => Number.isFinite(v)), [data]);
  const bins = useMemo(() => histogram(residuals, 14).map((b) => ({ label: round(b.center, 3), count: b.count })), [residuals]);
  const m = round(mean(residuals), 4);
  const sd = round(stdDev(residuals), 4);
  return (
    <ChartCard title="Bo Residual Distribution" subtitle={`Measured Bo (Act./Std. oil) − Model Bo · mean = ${m}, σ = ${sd}`}>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={bins} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="label" stroke={CHART.axis} fontSize={10} />
          <YAxis stroke={CHART.axis} fontSize={11} label={{ value: "Frequency", angle: -90, fill: CHART.axis, fontSize: 11, position: "insideLeft" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Bar dataKey="count" name="Sample count" fill={CHART.accent} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};