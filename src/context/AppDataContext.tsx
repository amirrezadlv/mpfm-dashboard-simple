/**
 * Global application state: dataset, auxiliary deciphering parameters, ingestion
 * status, and derived-row memoization.
 *
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AuxParams, DatasetMeta, MpfmRow } from "../types";
import { defaultAuxParams } from "../data/defaultsAux";
import { loadExcelFile, loadGoogleSheet, loadSampleDataset } from "../lib/ingest";
import { computeDerivedRow, type DerivedRow } from "../lib/pvt";

interface AppDataContextValue {
  rows: MpfmRow[];
  derived: DerivedRow[];
  meta: DatasetMeta | null;
  aux: AuxParams;
  setAux: (updater: (prev: AuxParams) => AuxParams) => void;
  resetAux: () => void;
  isLoading: boolean;
  error: string | null;
  loadSample: () => void;
  loadExcel: (file: File) => Promise<void>;
  loadGoogleSheetUrl: (url: string) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextValue | null>(null);

export const AppDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rows, setRows] = useState<MpfmRow[]>([]);
  const [meta, setMeta] = useState<DatasetMeta | null>(null);
  const [aux, setAuxState] = useState<AuxParams>(defaultAuxParams);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ref lock prevents multiple background fetches from overlapping on slow networks
  const isPollingRef = useRef(false);

  const setAux = useCallback((updater: (prev: AuxParams) => AuxParams) => {
    setAuxState((prev) => updater(prev));
  }, []);

  const resetAux = useCallback(() => setAuxState(defaultAuxParams), []);

  const loadSample = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const result = loadSampleDataset();
      setRows(result.rows);
      setMeta(result.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadExcel = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadExcelFile(file);
      setRows(result.rows);
      setMeta(result.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadGoogleSheetUrl = useCallback(async (url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await loadGoogleSheet(url);
      setRows(result.rows);
      setMeta(result.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Background auto-refresh for Google Sheets
  useEffect(() => {
    if (meta?.source !== "google-sheet" || !meta?.label) return;

    const url = meta.label;
    const intervalMs = 30000;

    const intervalId = setInterval(async () => {
      if (isPollingRef.current) return;

      try {
        isPollingRef.current = true;
        
        // Fetch completely in the background without modifying the isLoading state
        const result = await loadGoogleSheet(url);
        
        // Overwrite state silently; Recharts will smoothly transition data points
        setRows(result.rows);
        setMeta(result.meta);
      } catch (e) {
        // Log errors to console without interrupting the UI or throwing user-facing modals
        console.warn("Background data refresh failed:", e);
      } finally {
        isPollingRef.current = false;
      }
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [meta?.source, meta?.label]);

  const derived = useMemo(() => rows.map((r) => computeDerivedRow(r, aux)), [rows, aux]);

  const value: AppDataContextValue = {
    rows,
    derived,
    meta,
    aux,
    setAux,
    resetAux,
    isLoading,
    error,
    loadSample,
    loadExcel,
    loadGoogleSheetUrl,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
};

export function useAppData(): AppDataContextValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}