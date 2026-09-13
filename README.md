# MPFM Analytics — Multiphase Flow Meter Dashboard

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg?style=for-the-badge)](https://amirrezadlv.github.io/mpfm-dashboard-simple/)

A professional, client-side analytics dashboard for **Multiphase Flow Meter (MPFM)** data. Built for petroleum engineers, production technologists, and flow assurance specialists who need to monitor, validate, and diagnose well performance from high-frequency meter logs — without sending sensitive field data to any server.

**Created by Amirreza Dalvand**  
📧 a.rezadalvand@gmail.com · 📱 +989375166637

---

## What It Is

This application is a **static web dashboard** that ingests raw MPFM time-series data (from an embedded sample, an Excel workbook, or a live Google Sheet) and turns it into a complete production surveillance view. It combines:

- **Production monitoring** — phase flow rates, water cut, GOR, and line conditions
- **Meter diagnostics** — cross-checking the meter's reported values against first-principles physics
- **PVT audit** — validating the meter's gas/liquid behavior against a black-oil model
- **Fluid characterization** — impedance, densitometer, and GVF consistency checks

Because all computation happens in the browser, the app runs entirely **client-side** and is ready for **static hosting** (e.g., GitHub Pages). No backend, database, or API server is required.

---

## Key Features

### 1. Multi-Source Data Ingestion

| Source | Description |
| --- | --- |
| **Internal sample dataset** | A built-in, realistic minute-by-minute field log (~100+ rows) that loads on first launch |
| **Excel upload** | Any `.xlsx` / `.xls` workbook; the first sheet is read and parsed automatically |
| **Google Sheet (live)** | A published sheet URL is converted to CSV and fetched at runtime |

All sources pass through the same **header-agnostic classifier** — column names and ordering do not need to match a fixed template. The classifier recognizes common oilfield naming patterns (e.g., `Std. Oil Flowrate`, `Act. GVF`, `Mixture Density (kg/m3)`) and maps them to a canonical internal schema.

### 2. Automatic Unit Normalization

Raw pressure and temperature values are converted to a consistent internal basis before any calculation:

- **Pressure** → `bar(a)` (absolute), with detection of `psig`/`psia`, `kPag`/`kPaa`, `barg`/`bara`, `MPa`
- **Temperature** → `°C`, with detection of `°F`, `°C`, and `K`
- Gauge readings are converted to absolute by adding atmospheric pressure

### 3. Dual-State KPI Engine

The Overview tab computes a **dual-state comparison** for eight core parameters:

- Oil flow (std., bbl/d)
- Gas flow (std., scf/d)
- Water flow (std., bbl/d)
- Water cut (%)
- Gas Volume Fraction — GVF (%)
- GOR (scf/bbl)
- Line pressure (bar(a))
- Line temperature (°C)

Each KPI shows the **current operating state** (rolling average of the last 10 minutes, with a fallback for sparse data) against the **total average state** (whole-dataset mean), plus the percentage deviation.

### 4. Physics-Informed Derived Quantities

The dashboard does not just plot raw data — it computes derived engineering metrics:

- **Black-oil PVT model** — bilinear correlations for oil formation volume factor (`Bo`), solution gas-oil ratio (`Rs`), and gas compressibility factor (`Z`) as functions of line temperature and pressure
- **Gas formation volume factor (`Bg`)** — real-gas law conversion from standard to actual conditions
- **Homogeneous mixture density** — weighted average from in-situ phase fractions and component densities
- **GVF by density inference** — an independent estimate of gas fraction from mixture density, compared against the meter-reported GVF (`gvfOffset`)
- **Venturi momentum consistency check** — inferred differential pressure from total volumetric flow, mixture density, throat/pipe geometry, and discharge coefficient
- **Superficial phase velocities** — liquid and gas superficial velocities in the pipe
- **Gas rate residual** — measured actual gas vs. gas implied from standard gas through `Bg`

### 5. Four Analytical Views

| Tab | Contents |
| --- | --- |
| **Overview** | KPI cards + production timeline + GVF vs. water cut |
| **Production** | Actual vs. standard oil, pressure quartiles, venturi momentum |
| **Fluid** | Impedance vs. WLR, densitometer scatter, GVF offset |
| **PVT Audit** | Gas expansion & `Rs`, gas residual, `Bo` residual histogram |
| **Correlation** | Full Pearson correlation heatmap across all derived parameters |
| **Data & Auxiliary Setup** | Data source loading + editable PVT / geometry / lab inputs |

### 6. Editable Auxiliary Inputs

All model coefficients and reference values are **user-editable at runtime** from the *Data & Auxiliary Setup* tab, and every chart recomputes instantly:

- Black-oil bilinear coefficients (`Bo`, `Rs`, `Z`)
- Standard-condition reference (`pSc`, `tSc`)
- Fluid densities (oil, water, gas)
- Venturi geometry (pipe ID, throat diameter, discharge coefficient `Cq`)
- Laboratory reference data (°API gravity, water salinity, BS&W, lab GOR, lab `Bo`, sample date)
- Wet-gas GVF threshold used in the GVF chart

---

## Engineering Background

### Multiphase Flow Metering

An MPFM measures the individual phase flow rates of oil, gas, and water in a producing well **without physical separation**. Typical MPFM technologies combine:

- A **venturi** (differential pressure → total flow / density)
- **Gamma densitometry** (mixture density → phase fractions)
- **Electrical impedance / capacitance** (water-liquid ratio, flow regime)

This dashboard mirrors that measurement chain and adds independent cross-checks so engineers can spot sensor drift, calibration issues, or changing fluid properties.

### Black-Oil PVT Model

The PVT engine uses simple bilinear correlations of the form:

```
Bo = A0 + A1·T + (B0 + B1·T) · P
Rs = max(0, D0 + D1·T + (E0 + E1·T) · P)
Z  = F0 + F1·T + (G0 + G1·T) · P
```

where `T` is line temperature (°C) and `P` is line pressure (bar(a)). These coefficients are placeholders for field-specific PVT reports and can be replaced with your own lab-fitted values.

### Venturi Momentum Check

The inferred venturi differential pressure follows:

```
ΔP = (ρ_mix / 2) · (Q_total / (Cq · A_throat))²
```

Comparing this physics-based estimate with the meter's reported differential pressure is a fast way to flag density or discharge-coefficient problems.

---

## Technology Stack

| Layer | Technology |
| --- | --- |
| Framework | React 19 (with TypeScript) |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 4 (via `@tailwindcss/vite`) |
| Charts | Recharts 3 |
| Excel parsing | `xlsx` (SheetJS) |
| CSV parsing | `papaparse` |
| Icons | `lucide-react` |
| Utility | `clsx`, `tailwind-merge` |

---

## Project Structure

```
mpfm-simple-dashboard/
├── index.html                 # HTML entry point (GitHub Pages ready)
├── package.json               # Dependencies & scripts
├── tsconfig.json              # TypeScript configuration
├── vite.config.ts             # Vite + Tailwind + single-file build config
├── src/
│   ├── App.tsx                # Application shell, tab routing, empty states
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles
│   ├── types.ts               # Core data models (MpfmRow, AuxParams, DatasetMeta)
│   ├── context/
│   │   └── AppDataContext.tsx # Global state: dataset, aux params, derived rows
│   ├── components/
│   │   ├── KpiSection.tsx     # Dual-state KPI cards
│   │   ├── DataSourcePanel.tsx# Sample / Excel / Google Sheet loading
│   │   ├── AuxiliaryPanel.tsx # Editable PVT & lab inputs
│   │   ├── ChartCard.tsx      # Shared chart container
│   │   ├── charts/            # Overview, Production, Fluid, PVT, Correlation charts
│   │   └── layout/            # Sidebar and top bar
│   ├── data/
│   │   ├── defaultsAux.ts     # Default PVT / geometry / lab coefficients
│   │   └── sampleRaw.ts       # Built-in minute-by-minute field log
│   ├── lib/
│   │   ├── classify.ts        # Header-agnostic column classifier
│   │   ├── ingest.ts          # Sample / Excel / Google Sheet ingestion
│   │   ├── pvt.ts             # Black-oil PVT + venturi physics engine
│   │   ├── units.ts           # Pressure & temperature normalization
│   │   ├── kpi.ts             # Dual-state KPI engine
│   │   ├── stats.ts           # mean, stdDev, rolling avg, Pearson, quantiles
│   │   ├── downsample.ts      # Chart performance (max 400 points)
│   │   └── theme.ts           # Chart color palette
│   └── utils/
│       └── cn.ts              # Class-name helper
└── README.md
```

---

## Getting Started

### Prerequisites

- Node.js 20+ (Vite 7 requires Node 20.19+ or 22.12+)
- npm (comes with Node.js)

### Install & Run

```powershell
# Install dependencies
npm install

# Start the development server
npm run dev
```

Then open the URL printed by Vite (typically `http://localhost:5173`).

### Build for Production

```powershell
npm run build
```

The output is written to `dist/`. Because the build is configured as a **single self-contained HTML file** (`vite-plugin-singlefile`), you can deploy `dist/index.html` anywhere — including GitHub Pages — with no server-side requirements.

### Preview the Production Build

```powershell
npm run preview
```

---

## Data Format

The ingestion pipeline accepts any tabular layout. Recommended columns (names are flexible — the classifier matches on keywords):

| Category | Example headers |
| --- | --- |
| Timestamp | `Date Time`, `Timestamp`, `DateTime` |
| Pressure | `Pressure (psig)`, `Line Pressure (bara)` |
| Temperature | `Temperature (deg F)`, `Temp (°C)` |
| Standard rates | `Std. Oil Flowrate (SBPD)`, `Std. Gas Flowrate (SCFD)`, `Std. Water Flowrate (SBPD)` |
| Actual rates | `Act. Oil Flowrate (BPD)`, `Act. Gas Flowrate (CFD)`, `Act. Water Flowrate (BPD)` |
| Fractions | `Std. Watercut (%)`, `Act. GVF (%)`, `GOR (SCFD/SBPD)` |
| Densities | `Mixture Density (kg/m3)`, `Oil Density (kg/m3)`, `Gas Density (kg/m3)`, `Water Density (kg/m3)` |
| Electrical | `Permittivity`, `Conductivity (S/m)`, `Differential Pressure (dP)` |
| Mass rates (optional) | `Std. Oil Mass Rate (kg/d)`, `Act. Gas Mass Rate (kg/d)`, … |
| Accumulated volumes (optional) | `Std. Accum. Oil Vol. (SBBL)`, `Act. Accum. Gas Vol. (CFT)`, … |

If a column cannot be matched it is reported as **unmatched** in the dataset metadata and simply ignored — it never breaks the load.

---

## Notes & Limitations

- **PVT coefficients are illustrative.** The default bilinear coefficients in `defaultsAux.ts` are placeholders. Replace them with coefficients fitted to your own PVT report before using results for decision-making.
- **Client-side only.** All data stays in the browser; nothing is uploaded to a server. Google Sheet loading requires the sheet to be shared as *"Anyone with the link can view"*.
- **No backend persistence.** Reloading the page resets the dataset and auxiliary inputs to defaults.
- **Downsampling.** Charts are capped at 400 points per series (index-stride sampling) to keep large datasets responsive.
- **Single-sheet Excel import.** Only the first worksheet of an uploaded workbook is processed.

---

## License

This project is provided as-is for engineering analysis and educational use.

---

## Contact

**Amirreza Dalvand**  
📧 a.rezadalvand@gmail.com  
📱 +989375166637
