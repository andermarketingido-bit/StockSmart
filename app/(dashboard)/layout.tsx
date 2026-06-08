"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LangContext, type Lang } from "./LangContext";
import { Sidebar } from "./Sidebar";

const pageTitles: Record<string, { pt: string; en: string }> = {
  "/dashboard": { pt: "Dashboard", en: "Dashboard" },
  "/inventory": { pt: "Inventário", en: "Inventory" },
  "/products": { pt: "Produtos", en: "Products" },
  "/suppliers": { pt: "Fornecedores", en: "Suppliers" },
  "/purchase-orders": { pt: "Encomendas", en: "Purchase Orders" },
  "/stocktake": { pt: "Contagem", en: "Stocktake" },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLang] = useState<Lang>("pt");
  const pathname = usePathname();

  function toggleLang() {
    setLang((prev) => (prev === "pt" ? "en" : "pt"));
  }

  const pageTitle = pageTitles[pathname]?.[lang] ?? "";

  return (
    <LangContext.Provider value={{ lang, toggleLang }}>
      <div className="app-shell">
        <Sidebar />
        <div className="main-area">
          <header className="top-bar">
            <span className="top-bar__title">{pageTitle}</span>
            <button
              type="button"
              className="lang-toggle"
              onClick={toggleLang}
              aria-label={lang === "pt" ? "Switch to English" : "Mudar para Português"}
            >
              {lang === "pt" ? "EN" : "PT"}
            </button>
          </header>
          <main className="page-content">{children}</main>
        </div>
      </div>
    </LangContext.Provider>
  );
}
