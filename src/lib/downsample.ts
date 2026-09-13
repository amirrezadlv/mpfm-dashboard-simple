/**
 * Simple index-stride downsampling to keep chart rendering fast on large datasets.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
export function downsample<T>(arr: T[], maxPoints = 400): T[] {
  if (arr.length <= maxPoints) return arr;
  const stride = Math.ceil(arr.length / maxPoints);
  const out: T[] = [];
  for (let i = 0; i < arr.length; i += stride) out.push(arr[i]);
  return out;
}

export function formatTimeLabel(d: Date): string {
  return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export function formatTimeLabelFull(d: Date): string {
  return d.toLocaleString(undefined, { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}
