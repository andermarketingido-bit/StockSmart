"use client";

import { useLang } from "../LangContext";

function ClipboardIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="9" y="9" width="38" height="44" rx="4" stroke="#3ecf8e" strokeWidth="2.2" fill="rgba(62,207,142,0.08)" />
      <path d="M20 8h16a2 2 0 010 4H20a2 2 0 010-4z" fill="#3ecf8e" opacity="0.7" />
      <line x1="18" y1="23" x2="38" y2="23" stroke="#2db97d" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="31" x2="38" y2="31" stroke="#2db97d" strokeWidth="2" strokeLinecap="round" />
      <line x1="18" y1="39" x2="30" y2="39" stroke="#3ecf8e" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function PurchaseOrdersPage() {
  const { lang } = useLang();
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-icon-wrap">
          <ClipboardIcon />
        </div>
        <h2 className="placeholder-title">Encomendas</h2>
        <p className="placeholder-desc">
          {lang === "pt"
            ? "Criação e acompanhamento de ordens de compra."
            : "Create and track purchase orders."}
        </p>
        <span className="placeholder-badge">Em breve</span>
      </div>
    </div>
  );
}
