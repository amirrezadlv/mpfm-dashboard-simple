/**
 * Statistical helper functions used throughout the MPFM dashboard.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */

export function mean(values: number[]): number {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return 0;
  return clean.reduce((a, b) => a + b, 0) / clean.length;
}

export function stdDev(values: number[]): number {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length < 2) return 0;
  const m = mean(clean);
  const variance = clean.reduce((a, b) => a + (b - m) ** 2, 0) / (clean.length - 1);
  return Math.sqrt(variance);
}

/** Rolling average of the last `window` values ending at (and including) `endIndex`. */
export function rollingAverage(values: number[], endIndex: number, window: number): number {
  const start = Math.max(0, endIndex - window + 1);
  return mean(values.slice(start, endIndex + 1));
}

export function pearsonCorrelation(x: number[], y: number[]): number {
  const n = Math.min(x.length, y.length);
  if (n < 2) return 0;
  const mx = mean(x.slice(0, n));
  const my = mean(y.slice(0, n));
  let num = 0;
  let dx2 = 0;
  let dy2 = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx;
    const dy = y[i] - my;
    num += dx * dy;
    dx2 += dx * dx;
    dy2 += dy * dy;
  }
  const denom = Math.sqrt(dx2 * dy2);
  if (denom === 0) return 0;
  return num / denom;
}

export function quantile(sortedValues: number[], q: number): number {
  if (sortedValues.length === 0) return 0;
  const pos = (sortedValues.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sortedValues[base + 1] !== undefined) {
    return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
  }
  return sortedValues[base];
}

export function quartileEdges(values: number[]): number[] {
  const sorted = [...values].filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
  if (sorted.length === 0) return [0, 0, 0, 0, 0];
  return [
    sorted[0],
    quantile(sorted, 0.25),
    quantile(sorted, 0.5),
    quantile(sorted, 0.75),
    sorted[sorted.length - 1],
  ];
}

/** Builds a histogram with `binCount` equal-width bins. Returns bin centers and counts. */
export function histogram(values: number[], binCount = 12): { center: number; count: number; x0: number; x1: number }[] {
  const clean = values.filter((v) => Number.isFinite(v));
  if (clean.length === 0) return [];
  const min = Math.min(...clean);
  const max = Math.max(...clean);
  if (min === max) return [{ center: min, count: clean.length, x0: min, x1: max }];
  const width = (max - min) / binCount;
  const bins = Array.from({ length: binCount }, (_, i) => ({
    x0: min + i * width,
    x1: min + (i + 1) * width,
    center: min + (i + 0.5) * width,
    count: 0,
  }));
  for (const v of clean) {
    let bIdx = Math.floor((v - min) / width);
    if (bIdx >= binCount) bIdx = binCount - 1;
    if (bIdx < 0) bIdx = 0;
    bins[bIdx].count++;
  }
  return bins;
}

export function round(value: number, decimals = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}
