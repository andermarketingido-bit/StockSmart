"use client";

import { useLang } from "../LangContext";

function TruckIcon() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" aria-hidden="true">
      <rect x="2" y="16" width="33" height="24" rx="3" stroke="#3ecf8e" strokeWidth="2.2" fill="rgba(62,207,142,0.1)" />
      <path
        d="M35 22h12l7 10v10H35V22z"
        stroke="#2db97d"
        strokeWidth="2.2"
        fill="rgba(45,185,125,0.08)"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="43" r="5.5" stroke="#3ecf8e" strokeWidth="2.2" fill="white" />
      <circle cx="45" cy="43" r="5.5" stroke="#2db97d" strokeWidth="2.2" fill="white" />
    </svg>
  );
}

export default function SuppliersPage() {
  const { lang } = useLang();
  return (
    <div className="placeholder-page">
      <div className="placeholder-card">
        <div className="placeholder-icon-wrap">
          <TruckIcon />
        </div>
        <h2 className="placeholder-title">Fornecedores</h2>
        <p className="placeholder-desc">
          {lang === "pt"
            ? "Gestão de fornecedores, contactos e condições comerciais."
            : "Manage suppliers, contacts and commercial terms."}
        </p>
        <span className="placeholder-badge">Em breve</span>
      </div>
    </div>
  );
}
