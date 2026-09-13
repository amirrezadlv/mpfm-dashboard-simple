/**
 * Unit detection & normalization helpers.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */

const ATM_BAR = 1.01325;
const ATM_PSI = 14.6959;

/** Detects pressure unit hints from a header string and normalizes a raw value to bar(a). */
export function normalizePressureToBara(value: number, header: string): { bara: number; unitLabel: string } {
  const h = header.toLowerCase();
  if (h.includes("psi")) {
    const gauge = h.includes("psig") || !h.includes("psia");
    const psia = gauge ? value + ATM_PSI : value;
    return { bara: psia * 0.0689476, unitLabel: gauge ? "psig" : "psia" };
  }
  if (h.includes("kpa")) {
    const gauge = h.includes("g)") || h.includes(" g") || !h.toLowerCase().includes("a)");
    const kpaa = gauge ? value + 101.325 : value;
    return { bara: kpaa / 100, unitLabel: gauge ? "kPag" : "kPaa" };
  }
  if (h.includes("mpa")) {
    return { bara: value * 10, unitLabel: "MPa" };
  }
  if (h.includes("bar")) {
    const gauge = h.includes("barg") || !h.includes("bara");
    const bara = gauge ? value + ATM_BAR : value;
    return { bara, unitLabel: gauge ? "barg" : "bara" };
  }
  // Fallback: assume psig, the most common oilfield convention
  return { bara: (value + ATM_PSI) * 0.0689476, unitLabel: "psig (assumed)" };
}

/** Detects temperature unit hints from a header string and normalizes a raw value to °C. */
export function normalizeTemperatureToC(value: number, header: string): { celsius: number; unitLabel: string } {
  const h = header.toLowerCase();
  if (h.includes("deg f") || h.includes("°f") || h.includes("(f)") || /\bf\b/.test(h)) {
    return { celsius: ((value - 32) * 5) / 9, unitLabel: "°F" };
  }
  if (h.includes("deg c") || h.includes("°c") || h.includes("(c)") || /\bc\b/.test(h)) {
    return { celsius: value, unitLabel: "°C" };
  }
  if (h.includes("k") && h.includes("deg")) {
    return { celsius: value - 273.15, unitLabel: "K" };
  }
  // Fallback: assume Fahrenheit, common for US oilfield instrumentation
  return { celsius: ((value - 32) * 5) / 9, unitLabel: "°F (assumed)" };
}

export function celsiusToF(c: number): number {
  return (c * 9) / 5 + 32;
}

export function baraToPsig(bara: number): number {
  return bara / 0.0689476 - ATM_PSI;
}
