/**
 * Overview page charts: Production Timeline (Std. conditions) and GVF vs Watercut.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
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
import { useAppData } from "../../context/AppDataContext";
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

export const ProductionTimelineChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        t: formatTimeLabel(d.row.timestamp),
        oil: d.row.stdOil,
        water: d.row.stdWater,
        gas: d.row.stdGas,
      })),
    [data]
  );
  return (
    <ChartCard
      title="Production Timeline (Standard Conditions)"
      subtitle="Std. Oil & Water rates (bars) with Std. Gas rate (points)"
    >
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="t" stroke={CHART.axis} fontSize={11} minTickGap={30} />
          <YAxis yAxisId="liq" stroke={CHART.axis} fontSize={11} label={{ value: "bbl/d", angle: -90, fill: CHART.axis, fontSize: 11, position: "insideLeft" }} />
          <YAxis yAxisId="gas" orientation="right" stroke={CHART.gas} fontSize={11} label={{ value: "scf/d", angle: 90, fill: CHART.gas, fontSize: 11, position: "insideRight" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <Bar yAxisId="liq" dataKey="oil" name="Std. Oil (bbl/d)" fill={CHART.oil} radius={[2, 2, 0, 0]} />
          <Bar yAxisId="liq" dataKey="water" name="Std. Water (bbl/d)" fill={CHART.water} radius={[2, 2, 0, 0]} />
          <Line 
            yAxisId="gas" 
            type="monotone" 
            dataKey="gas" 
            name="Std. Gas (scf/d)" 
            stroke={CHART.gas} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.gas, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.gas, stroke: "#fff", strokeWidth: 1.5 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

export const GvfWatercutChart: React.FC<{ data: DerivedRow[] }> = ({ data }) => {
  const { aux } = useAppData();
  const chartData = useMemo(
    () =>
      downsample(data).map((d) => ({
        t: formatTimeLabel(d.row.timestamp),
        gvf: d.row.actGVF,
        wc: d.row.stdWatercut,
      })),
    [data]
  );
  return (
    <ChartCard title="Actual GVF vs Standard Watercut" subtitle="Dual-axis comparison with wet-gas boundary threshold">
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid stroke={CHART.grid} strokeDasharray="4 4" strokeOpacity={0.6} vertical={false} />
          <XAxis dataKey="t" stroke={CHART.axis} fontSize={11} minTickGap={30} />
          <YAxis yAxisId="gvf" stroke={CHART.accent} fontSize={11} domain={[0, 100]} label={{ value: "GVF %", angle: -90, fill: CHART.accent, fontSize: 11, position: "insideLeft" }} />
          <YAxis yAxisId="wc" orientation="right" stroke={CHART.water} fontSize={11} domain={[0, 100]} label={{ value: "WC %", angle: 90, fill: CHART.water, fontSize: 11, position: "insideRight" }} />
          <Tooltip contentStyle={tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: "10px" }} />
          <ReferenceLine
            yAxisId="gvf"
            y={aux.wetGasGvfThreshold}
            stroke={CHART.danger}
            strokeDasharray="6 3"
            label={{ value: "Wet-gas boundary", fill: CHART.danger, fontSize: 10, position: "insideTopLeft" }}
          />
          <Line 
            yAxisId="gvf" 
            type="monotone" 
            dataKey="gvf" 
            name="Act. GVF (%)" 
            stroke={CHART.accent} 
            strokeWidth={0} 
            legendType="circle"
            dot={{ r: 3.5, fill: CHART.accent, strokeWidth: 0 }}
            activeDot={{ r: 5, fill: CHART.accent, stroke: "#fff", strokeWidth: 1.5 }}
          />
          <Line 
            yAxisId="wc" 
            type="monotone" 
            dataKey="wc" 
            name="Std. Watercut (%)" 
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