/**
 * Reusable chart card wrapper with corporate deep-blue styling.
 * Created by Amirreza Dalvand | a.rezadalvand@gmail.com | +989375166637
 */
import React from "react";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children, className, actions }) => {
  return (
    <div
      className={`rounded-xl border border-navy-700/60 bg-navy-900/70 p-4 shadow-lg shadow-black/20 backdrop-blur-sm ${
        className ?? ""
      }`}
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-wide text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {children}
    </div>
  );
};

export default ChartCard;
