"use client";

import { useLang } from "../LangContext";

function BarChartIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="8" y="30" width="10" height="18" rx="2" fill="#3ecf8e" opacity="0.5" />
      <rect x="23" y="18" width="10" height="30" rx="2" fill="#3ecf8e" opacity="0.75" />
      <rect x="38" y="10" width="10" height="38" rx="2" fill="#3ecf8e" />
      <line x1="6" y1="48" x2="50" y2="48" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DashboardPage() {
  const { lang } = useLang();
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-icon-wrap">
          <BarChartIcon />
        </div>
        <h2 className="placeholder-title">Dashboard</h2>
        <p className="placeholder-desc">
          {lang === "pt"
            ? "Visão geral do desempenho e métricas do inventário."
            : "Overview of performance and inventory metrics."}
        </p>
        <span className="placeholder-badge">Em breve</span>
      </div>
    </div>
  );
}
