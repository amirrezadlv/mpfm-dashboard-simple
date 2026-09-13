/**
 * Multi-source ingestion: internal sample dataset, uploaded Excel workbook,
 * and a live Google Sheet link. Every source funnels through the same
 * header-agnostic classifier so no naming convention is ever assumed.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import * as XLSX from "xlsx";
import Papa from "papaparse";
import { SAMPLE_HEADERS, SAMPLE_RAW_TEXT } from "../data/sampleRaw";
import { classifyAndBuild, type RawTable } from "./classify";
import type { DatasetMeta, MpfmRow } from "../types";

export interface IngestResult {
  rows: MpfmRow[];
  meta: DatasetMeta;
}

function buildTableFromAoA(aoa: unknown[][]): RawTable {
  if (aoa.length === 0) return { headers: [], rows: [] };
  const headers = aoa[0].map((h) => String(h ?? "").trim());
  const rows = aoa.slice(1).filter((r) => r.some((c) => c !== null && c !== undefined && c !== "")) as (
    | string
    | number
    | null
    | undefined
  )[][];
  return { headers, rows };
}

export function loadSampleDataset(): IngestResult {
  const lines = SAMPLE_RAW_TEXT.split("\n").filter((l) => l.trim().length > 0);
  const rows: (string | number)[][] = lines.map((line) => {
    const tokens = line.trim().split(/\s+/);
    const dateTime = `${tokens[0]} ${tokens[1]}`;
    const rest = tokens.slice(2).map((t) => parseFloat(t));
    return [dateTime, ...rest];
  });
  const table: RawTable = { headers: SAMPLE_HEADERS, rows };
  const { data, unmatchedHeaders, matchedFieldCount } = classifyAndBuild(table);
  return {
    rows: data,
    meta: {
      source: "sample",
      label: "Internal Sample Dataset (minute-by-minute field log)",
      loadedAt: new Date(),
      rowCount: data.length,
      unmatchedHeaders,
      matchedFieldCount,
    },
  };
}

export async function loadExcelFile(file: File): Promise<IngestResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }) as unknown[][];
  const table = buildTableFromAoA(aoa);
  if (table.headers.length === 0) {
    throw new Error("The uploaded workbook appears to be empty.");
  }
  const { data, unmatchedHeaders, matchedFieldCount } = classifyAndBuild(table);
  if (data.length === 0) {
    throw new Error("No usable data rows were found in the uploaded workbook.");
  }
  return {
    rows: data,
    meta: {
      source: "excel",
      label: `${file.name} (sheet: ${sheetName})`,
      loadedAt: new Date(),
      rowCount: data.length,
      unmatchedHeaders,
      matchedFieldCount,
    },
  };
}

/** Converts a typical Google Sheets share URL into a CSV export URL. */
export function toGoogleSheetCsvUrl(url: string): string {
  const trimmed = url.trim();
  const idMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!idMatch) {
    throw new Error("Could not find a Google Sheet ID in the provided link.");
  }
  const sheetId = idMatch[1];
  const gidMatch = trimmed.match(/[?#&]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv&gid=${gid}`;
}

export async function loadGoogleSheet(url: string): Promise<IngestResult> {
  const csvUrl = toGoogleSheetCsvUrl(url);
  let text: string;
  try {
    const res = await fetch(csvUrl, { credentials: "omit" });
    if (!res.ok) {
      throw new Error(`Google Sheets responded with HTTP ${res.status}. Ensure sharing is set to "Anyone with the link".`);
    }
    text = await res.text();
  } catch (err) {
    throw new Error(
      `Unable to fetch the Google Sheet. Make sure it is published/shared as "Anyone with the link can view". (${
        err instanceof Error ? err.message : String(err)
      })`
    );
  }
  const parsed = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const aoa = parsed.data as unknown[][];
  const table = buildTableFromAoA(aoa);
  if (table.headers.length === 0) {
    throw new Error("The Google Sheet appears to be empty.");
  }
  const { data, unmatchedHeaders, matchedFieldCount } = classifyAndBuild(table);
  if (data.length === 0) {
    throw new Error("No usable numeric data rows were found in the Google Sheet.");
  }
  return {
    rows: data,
    meta: {
      source: "google-sheet",
      label: url,
      loadedAt: new Date(),
      rowCount: data.length,
      unmatchedHeaders,
      matchedFieldCount,
    },
  };
}
