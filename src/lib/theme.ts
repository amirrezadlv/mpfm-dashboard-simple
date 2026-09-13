/**
 * Shared chart color palette — corporate deep-blue & orange theme.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
export const CHART = {
  oil: "#f5820b", // brand orange - oil
  gas: "#38bdf8", // sky - gas
  water: "#60a5fa", // blue - water
  water2: "#3b82f6",
  accent: "#f5820b",
  accentSoft: "#ffb066",
  navyLine: "#8fa6d1",
  grid: "#1a3868",
  axis: "#7d93bf",
  danger: "#ef4444",
  ok: "#22c55e",
  purple: "#a78bfa",
  teal: "#2dd4bf",
  bg: "#0a1730",
  panel: "#0e1f3f",
};

export const CORRELATION_SCALE = (v: number): string => {
  // Diverging scale: deep blue (negative) -> white/grey (0) -> orange (positive)
  const clamped = Math.max(-1, Math.min(1, v));
  if (clamped >= 0) {
    const t = clamped;
    const r = Math.round(30 + t * (245 - 30));
    const g = Math.round(58 + t * (130 - 58));
    const b = Math.round(104 + t * (11 - 104));
    return `rgb(${r},${g},${b})`;
  }
  const t = -clamped;
  const r = Math.round(30 + t * (10 - 30));
  const g = Math.round(58 + t * (30 - 58));
  const b = Math.round(104 + t * (60 - 104));
  return `rgb(${r},${g},${b})`;
};
