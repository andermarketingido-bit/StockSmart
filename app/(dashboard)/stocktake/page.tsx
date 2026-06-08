"use client";

import { useLang } from "../LangContext";

function ClipboardCheckIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="38" height="44" rx="4" stroke="#3ecf8e" strokeWidth="2.2" fill="rgba(62,207,142,0.08)" />
      <path d="M20 8h16a2 2 0 010 4H20a2 2 0 010-4z" fill="#3ecf8e" opacity="0.7" />
      <path
        d="M18 32l7 7 13-14"
        stroke="#2db97d"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function StocktakePage() {
  const { lang } = useLang();
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-icon-wrap">
          <ClipboardCheckIcon />
        </div>
        <h2 className="placeholder-title">Contagem de Stock</h2>
        <p className="placeholder-desc">
          {lang === "pt"
            ? "Contagens periódicas e reconciliação de inventário."
            : "Periodic stock counts and inventory reconciliation."}
        </p>
        <span className="placeholder-badge">Em breve</span>
      </div>
    </div>
  );
}
