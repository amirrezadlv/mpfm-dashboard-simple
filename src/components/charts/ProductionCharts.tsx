/**
 * Production analytics charts: Actual vs Standard oil rate, rates-by-pressure-
 * quartile, and Venturi differential pressure / velocity profiles.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { DerivedRow } from "../../lib/pvt";
import { CHART } from "../../lib/theme";
import { downsample, formatTimeLabel } from "../../lib/downsample";
import { quartileEdges, mean, round } from "../../lib/stats";
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

const numFormatter = (v: unknown): string => (typeof v === "number" ? String(round(v, 2)) : String(v ?? ""));
const numFormatter3 = (v: unknown): string => (typeof v === "number" ? String(round(v, 3)) : String(v ?? ""));

export const ActualVsStandardOilChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        t: formatTimeLabel(d.row.timestamp),
        actual: d.row.actOil,
        standard: d.row.stdOil,
      })),
    [data]
  );
  return (
    <ChartCard title="Actual vs Standard Oil Rate" subtitle="Reflects PVT shrinkage factor (Bo) between in-situ and standard volumes">
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="t" stroke={CHART.axis} fontSize={11} minTickGap={30} />
          <YAxis stroke={CHART.axis} fontSize={11} label={{ value: "bbl/d", angle: -90, fill: CHART.axis, fontSize: 11, position: "insideLeft" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <Line 
            type="monotone" 
            dataKey="actual" 
            name="Act. Oil Rate (bbl/d)" 
            stroke={CHART.navyLine} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.navyLine, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.navyLine, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            type="monotone" 
            dataKey="standard" 
            name="Std. Oil Rate (bbl/d)" 
            stroke={CHART.oil} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.oil, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.oil, stroke: "#fff", strokeWidth: 1.5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const PressureQuartileChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const pressures = data.map((d) => d.row.pressureBara);
    const edges = quartileEdges(pressures);
    const labels = ["Q1 (lowest P)", "Q2", "Q3", "Q4 (highest P)"];
    return labels.map((label, i) => {
      const lo = edges[i];
      const hi = edges[i + 1];
      const bucket = data.filter((d) => (i === 3 ? d.row.pressureBara >= lo && d.row.pressureBara <= hi : d.row.pressureBara >= lo && d.row.pressureBara < hi));
      return {
        label,
        range: `${round(lo, 1)}–${round(hi, 1)} bar(a)`,
        oil: mean(bucket.map((d) => d.row.stdOil)),
        water: mean(bucket.map((d) => d.row.stdWater)),
        wc: mean(bucket.map((d) => d.row.stdWatercut)),
        gvf: mean(bucket.map((d) => d.row.actGVF)),
      };
    });
  }, [data]);

  return (
    <ChartCard title="Rates by Meter-Pressure Quartile" subtitle="Average standard rates & fractions binned by pressure quartile edges">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="label" stroke={CHART.axis} fontSize={11} />
          <YAxis yAxisId="rate" stroke={CHART.axis} fontSize={11} label={{ value: "bbl/d", angle: -90, fill: CHART.axis, fontSize: 11, position: "insideLeft" }} />
          <YAxis yAxisId="pct" orientation="right" stroke={CHART.accent} fontSize={11} domain={[0, 100]} label={{ value: "%", angle: 90, fill: CHART.accent, fontSize: 11, position: "insideRight" }} />
          <Tooltip contentStyle={tooltipStyle} formatter={numFormatter} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <Bar yAxisId="rate" dataKey="oil" name="Avg Std. Oil (bbl/d)" fill={CHART.oil} radius={[3, 3, 0, 0]} />
          <Bar yAxisId="rate" dataKey="water" name="Avg Std. Water (bbl/d)" fill={CHART.water} radius={[3, 3, 0, 0]} />
          <Bar yAxisId="pct" dataKey="wc" name="Avg Watercut (%)" fill={CHART.purple} radius={[3, 3, 0, 0]} />
          <Bar yAxisId="pct" dataKey="gvf" name="Avg GVF (%)" fill={CHART.teal} radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const VenturiMomentumChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        t: formatTimeLabel(d.row.timestamp),
        dpInferred: d.ventilDpInferred !== null ? d.ventilDpInferred * 1000 : null, // bar -> mbar
        dpMeasured: d.row.differentialPressure,
        vMix: d.mixtureVelocity,
        vSl: d.superficialLiquidVelocity,
        vSg: d.superficialGasVelocity,
      })),
    [data]
  );
  return (
    <ChartCard
      title="Venturi Differential Pressure & Momentum"
      subtitle="Inferred Venturi ΔP (homogeneous model) with mixture & superficial velocities"
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="t" stroke={CHART.axis} fontSize={11} minTickGap={30} />
          <YAxis yAxisId="dp" stroke={CHART.accent} fontSize={11} label={{ value: "ΔP (mbar)", angle: -90, fill: CHART.accent, fontSize: 11, position: "insideLeft" }} />
          <YAxis yAxisId="v" orientation="right" stroke={CHART.gas} fontSize={11} label={{ value: "m/s", angle: 90, fill: CHART.gas, fontSize: 11, position: "insideRight" }} />
          <Tooltip contentStyle={tooltipStyle} formatter={numFormatter3} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <Line 
            yAxisId="dp" 
            type="monotone" 
            dataKey="dpInferred" 
            name="Inferred Venturi ΔP (mbar)" 
            stroke={CHART.accent} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.accent, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            yAxisId="v" 
            type="monotone" 
            dataKey="vMix" 
            name="Mixture Velocity (m/s)" 
            stroke={CHART.navyLine} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3, fill: CHART.navyLine, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.navyLine, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            yAxisId="v" 
            type="monotone" 
            dataKey="vSl" 
            name="Superficial Liquid Vel. (m/s)" 
            stroke={CHART.water} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3, fill: CHART.water, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.water, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            yAxisId="v" 
            type="monotone" 
            dataKey="vSg" 
            name="Superficial Gas Vel. (m/s)" 
            stroke={CHART.gas} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3, fill: CHART.gas, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.gas, stroke: "#fff", strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};