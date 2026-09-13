/**
 * Fluid-property charts: Impedance response vs WLR, Gamma densitometer closure
 * scatter, and Reported vs Density-implied GVF offset.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ScatterChart,
  Scatter,
  ReferenceLine,
} from "recharts";
import type { DerivedRow } from "../../lib/pvt";
import { CHART } from "../../lib/theme";
import { downsample, formatTimeLabel } from "../../lib/downsample";
import { round } from "../../lib/stats";
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

const numFormatter = (v: unknown): string => (typeof v === "number" ? String(round(v, 3)) : String(v ?? ""));

export const ImpedanceWlrChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(() => {
    const sorted = [...data].sort((a, b) => a.wlr - b.wlr);
    return downsample(sorted).map((d) => ({
      wlr: round(d.wlr, 1),
      permittivity: d.row.permittivity,
      conductivity: d.row.conductivity,
    }));
  }, [data]);
  return (
    <ChartCard
      title="Impedance Response vs Water Liquid Ratio"
      subtitle="Permittivity (insulator regime) & conductivity (conductor regime) — watch for phase-inversion discontinuity"
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="wlr" type="number" domain={[0, 100]} stroke={CHART.axis} fontSize={11} label={{ value: "WLR (%)", fill: CHART.axis, fontSize: 11, position: "insideBottom", offset: -2 }} />
          <YAxis yAxisId="perm" stroke={CHART.accent} fontSize={11} label={{ value: "Permittivity", angle: -90, fill: CHART.accent, fontSize: 11, position: "insideLeft" }} />
          <YAxis yAxisId="cond" orientation="right" stroke={CHART.water} fontSize={11} label={{ value: "Conductivity (S/m)", angle: 90, fill: CHART.water, fontSize: 11, position: "insideRight" }} />
          <Tooltip contentStyle={tooltipStyle} formatter={numFormatter} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <ReferenceLine x={40} stroke={CHART.danger} strokeDasharray="6 3" label={{ value: "Phase inversion zone", fill: CHART.danger, fontSize: 10, position: "top" }} />
          <Line 
            yAxisId="perm" 
            type="monotone" 
            dataKey="permittivity" 
            name="Permittivity (insulator)" 
            stroke={CHART.accent} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.accent, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            yAxisId="cond" 
            type="monotone" 
            dataKey="conductivity" 
            name="Conductivity (conductor)" 
            stroke={CHART.water} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3, fill: CHART.water, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.water, stroke: "#fff", strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const DensitometerScatter: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        measured: d.row.mixtureDensity,
        model: d.rhoMixModel,
      })),
    [data]
  );
  const domain = useMemo(() => {
    const all = chartData.flatMap((d) => [d.measured, d.model]).filter((v) => Number.isFinite(v));
    if (all.length === 0) return [0, 1000];
    return [Math.min(...all) * 0.97, Math.max(...all) * 1.03];
  }, [chartData]);
  return (
    <ChartCard
      title="Gamma Densitometer Closure"
      subtitle="Measured mixture density vs homogeneous model ρmix = α·ρgas + β·ρwater + γ·ρoil"
    >
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} />
          <XAxis
            dataKey="model"
            type="number"
            domain={domain}
            stroke={CHART.axis}
            fontSize={11}
            name="Model density"
            unit=" kg/m³"
            label={{ value: "Homogeneous model ρmix (kg/m³)", fill: CHART.axis, fontSize: 11, position: "insideBottom", offset: -2 }}
          />
          <YAxis
            dataKey="measured"
            type="number"
            domain={domain}
            stroke={CHART.axis}
            fontSize={11}
            name="Measured density"
            unit=" kg/m³"
            label={{ value: "Measured mixture density (kg/m³)", angle: -90, fill: CHART.axis, fontSize: 11, position: "insideLeft" }}
          />
          <Tooltip contentStyle={tooltipStyle} formatter={numFormatter} cursor={{ strokeDasharray: "3 3" }} />
          <ReferenceLine
            segment={[
              { x: domain[0], y: domain[0] },
              { x: domain[1], y: domain[1] },
            ]}
            stroke={CHART.accent}
            strokeDasharray="4 4"
            ifOverflow="extendDomain"
          />
          <Scatter name="Sample" data={chartData} fill={CHART.water} fillOpacity={0.85} shape="circle" />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const GvfOffsetChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        t: formatTimeLabel(d.row.timestamp),
        reported: d.row.actGVF,
        implied: d.gvfDensityImplied,
        offset: d.gvfOffset,
      })),
    [data]
  );
  return (
    <ChartCard
      title="Reported GVF vs Density-Implied GVF"
      subtitle="Offsets highlight potential liquid-density misallocation"
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="t" stroke={CHART.axis} fontSize={11} minTickGap={30} />
          <YAxis stroke={CHART.axis} fontSize={11} domain={[0, 100]} label={{ value: "GVF (%)", angle: -90, fill: CHART.axis, fontSize: 11, position: "insideLeft" }} />
          <Tooltip contentStyle={tooltipStyle} formatter={numFormatter} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <Line 
            type="monotone" 
            dataKey="reported" 
            name="Reported Act. GVF (%)" 
            stroke={CHART.accent} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.accent, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            type="monotone" 
            dataKey="implied" 
            name="Density-Implied GVF (%)" 
            stroke={CHART.water} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.water, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.water, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            type="monotone" 
            dataKey="offset" 
            name="Offset (Reported − Implied)" 
            stroke={CHART.danger} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 2.5, fill: CHART.danger, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: CHART.danger, stroke: "#fff", strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};