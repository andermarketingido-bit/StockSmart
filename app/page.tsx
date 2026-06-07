"use client";

import { useMemo, useRef, useState } from "react";
import { parseStockExcel } from "@/lib/parseExcel";
import {
  calculateReplenishment,
  type ReplenishmentRow,
  type StockRisk,
} from "@/lib/replenishment";

type Lang = "pt" | "en";

const translations = {
  pt: {
    title: "Gestão de Stock",
    tagline: "Análise de inventário e reposição",
    dropLabel: "Arraste o seu ficheiro Excel aqui",
    formatsLabel: "Formatos suportados: .xlsx, .xls, .csv",
    chooseFile: "Escolher ficheiro",
    selectedFilePrefix: "Ficheiro selecionado:",
    totalProducts: "Total de Produtos",
    toReorder: "A Repor",
    expiryAlerts: "Alertas de Validade",
    slowMovers: "Movimentação Lenta",
    colProduct: "Produto",
    colCurrentStock: "Stock Atual",
    colAvgDailySales: "Vendas Diárias Médias",
    colExpiryDate: "Data de Validade",
    col7DayTarget: "Objetivo 7 Dias",
    colRestockDate: "Data de Reposição",
    colReorderQty: "Qtd. a Encomendar",
    colStockRisk: "Risco de Stock",
    colNotes: "Notas",
    riskOk: "OK",
    riskLow: "Baixo",
    riskCritical: "Crítico",
    slowMoverLabel: "Mov. lenta",
    slowMoverTitle: "Movimento lento – stock elevado",
    expiringSoon: "Val. próxima",
    resultsHeading: "Recomendações de Reposição",
    summary: (n: number, total: number) =>
      `${n} produtos · ${total} unidades a encomendar`,
    langToggle: "EN",
  },
  en: {
    title: "Stock Manager",
    tagline: "Inventory analysis & replenishment",
    dropLabel: "Drop your Excel file here",
    formatsLabel: "Supported formats: .xlsx, .xls, .csv",
    chooseFile: "Choose file",
    selectedFilePrefix: "Selected file:",
    totalProducts: "Total Products",
    toReorder: "To Reorder",
    expiryAlerts: "Expiry Alerts",
    slowMovers: "Slow Movers",
    colProduct: "Product",
    colCurrentStock: "Current Stock",
    colAvgDailySales: "Avg Daily Sales",
    colExpiryDate: "Expiry Date",
    col7DayTarget: "7-Day Target",
    colRestockDate: "Restock Date",
    colReorderQty: "Reorder Qty",
    colStockRisk: "Stock Risk",
    colNotes: "Notes",
    riskOk: "OK",
    riskLow: "Low",
    riskCritical: "Critical",
    slowMoverLabel: "Slow mover",
    slowMoverTitle: "Slow mover – high stock",
    expiringSoon: "Expiring soon",
    resultsHeading: "Reorder Recommendations",
    summary: (n: number, total: number) =>
      `${n} products · ${total} units to reorder`,
    langToggle: "PT",
  },
};

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function restockDateClass(date: Date | null): string {
  if (!date) return "";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffMs = date.getTime() - today.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  if (diffDays < 0) return "restock-past";
  if (diffDays <= 7) return "restock-soon";
  return "";
}

function StockRiskBadge({ risk, lang }: { risk: StockRisk; lang: Lang }) {
  const t = translations[lang];
  const config: Record<StockRisk, { label: string; className: string }> = {
    ok: { label: t.riskOk, className: "badge badge-ok" },
    low: { label: t.riskLow, className: "badge badge-low" },
    critical: { label: t.riskCritical, className: "badge badge-critical" },
  };
  const { label, className } = config[risk];
  return <span className={className}>{label}</span>;
}

function SlowMoverBadge({ lang }: { lang: Lang }) {
  const t = translations[lang];
  return (
    <span className="badge badge-slow" title={t.slowMoverTitle}>
      <span aria-hidden="true">⚠</span> {t.slowMoverLabel}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat-card">
      <span className="stat-label">{label}</span>
      <span className="stat-value">{formatNumber(value)}</span>
    </div>
  );
}

function WarehouseIcon() {
  return (
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17 3L2 11v2.5h30V11L17 3z" fill="rgba(255,255,255,0.95)" />
      <rect
        x="4"
        y="13.5"
        width="26"
        height="17"
        rx="1"
        fill="rgba(255,255,255,0.12)"
        stroke="rgba(255,255,255,0.45)"
        strokeWidth="1.5"
      />
      <rect x="13" y="20" width="8" height="10.5" rx="1" fill="rgba(255,255,255,0.55)" />
      <rect x="5.5" y="15.5" width="5.5" height="5.5" rx="0.5" fill="rgba(255,255,255,0.45)" />
      <rect x="23" y="15.5" width="5.5" height="5.5" rx="0.5" fill="rgba(255,255,255,0.45)" />
    </svg>
  );
}

export default function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [lang, setLang] = useState<Lang>("pt");
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ReplenishmentRow[]>([]);

  const t = translations[lang];

  const stats = useMemo(() => {
    const itemsToReorder = results.filter((r) => r.recommendedReorder > 0).length;
    const expiryAlerts = results.filter((r) => r.isExpiringWithin7Days).length;
    const slowMovers = results.filter((r) => r.isSlowMover).length;
    const totalReorderUnits = results.reduce((sum, r) => sum + r.recommendedReorder, 0);
    return { itemsToReorder, expiryAlerts, slowMovers, totalReorderUnits };
  }, [results]);

  async function processFile(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      setError("Please upload an Excel file (.xlsx, .xls) or CSV.");
      setResults([]);
      setFileName(null);
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const stockRows = parseStockExcel(buffer);
      const recommendations = calculateReplenishment(stockRows);

      setFileName(file.name);
      setError(null);
      setResults(recommendations);
    } catch (err) {
      setFileName(file.name);
      setResults([]);
      setError(err instanceof Error ? err.message : "Failed to process the file.");
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void processFile(file);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void processFile(file);
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <div className="site-header__brand">
            <div className="site-header__logo">
              <WarehouseIcon />
            </div>
            <div className="site-header__text">
              <span className="site-header__title">{t.title}</span>
              <span className="site-header__tagline">{t.tagline}</span>
            </div>
          </div>
          <button
            type="button"
            className="lang-toggle"
            onClick={() => setLang(lang === "pt" ? "en" : "pt")}
          >
            {t.langToggle}
          </button>
        </div>
      </header>

      <main>
        <section className="card upload-card">
          <div
            className={`upload-area${isDragging ? " dragging" : ""}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="upload-icon" aria-hidden="true">
              <svg
                width="36"
                height="36"
                viewBox="0 0 36 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M18 7L10 15h5v10h6V15h5L18 7z" fill="currentColor" />
                <path
                  d="M6 26v4h24v-4"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </div>
            <p className="upload-label">{t.dropLabel}</p>
            <p className="upload-hint">{t.formatsLabel}</p>
            <button
              type="button"
              className="button"
              onClick={() => inputRef.current?.click()}
            >
              {t.chooseFile}
            </button>
            <input
              ref={inputRef}
              className="file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
            />
          </div>

          {fileName && !error && (
            <p className="selected-file selected-file--success">
              <span className="selected-file__icon" aria-hidden="true">✓</span>
              {t.selectedFilePrefix} {fileName}
            </p>
          )}
          {fileName && error && (
            <p className="selected-file">
              <span className="selected-file__icon" aria-hidden="true">📄</span>
              {t.selectedFilePrefix} {fileName}
            </p>
          )}
          {error && <p className="error">{error}</p>}
        </section>

        {results.length > 0 && (
          <section className="results">
            <div className="stats-bar">
              <StatCard label={t.totalProducts} value={results.length} />
              <StatCard label={t.toReorder} value={stats.itemsToReorder} />
              <StatCard label={t.expiryAlerts} value={stats.expiryAlerts} />
              <StatCard label={t.slowMovers} value={stats.slowMovers} />
            </div>

            <div className="results-header">
              <h2>{t.resultsHeading}</h2>
              <p className="summary">
                {t.summary(results.length, stats.totalReorderUnits)}
              </p>
            </div>

            <div className="table-wrap">
              <table>
                <colgroup>
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "10%" }} />
                  <col style={{ width: "12%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th>{t.colProduct}</th>
                    <th className="num">{t.colCurrentStock}</th>
                    <th className="num">{t.colAvgDailySales}</th>
                    <th>{t.colExpiryDate}</th>
                    <th className="num">{t.col7DayTarget}</th>
                    <th>{t.colRestockDate}</th>
                    <th className="num">{t.colReorderQty}</th>
                    <th>{t.colStockRisk}</th>
                    <th>{t.colNotes}</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((row) => (
                    <tr
                      key={row.product}
                      className={row.isExpiringWithin7Days ? "row-expiry" : undefined}
                    >
                      <td className="cell-product">{row.product}</td>
                      <td className="num">{formatNumber(row.currentStock)}</td>
                      <td className="num">{row.averageDailySales.toFixed(1)}</td>
                      <td className={row.isExpiringWithin7Days ? "cell-expiry-alert" : undefined}>
                        {formatDate(row.expiryDate)}
                        {row.isExpiringWithin7Days && (
                          <span className="expiry-warning-chip">{t.expiringSoon}</span>
                        )}
                      </td>
                      <td className="num">{formatNumber(Math.ceil(row.targetStock))}</td>
                      <td className={restockDateClass(row.restockDate)}>
                        {formatDate(row.restockDate)}
                      </td>
                      <td className={`num reorder${row.recommendedReorder === 0 ? " zero" : ""}`}>
                        {formatNumber(row.recommendedReorder)}
                      </td>
                      <td>
                        <StockRiskBadge risk={row.stockRisk} lang={lang} />
                      </td>
                      <td>{row.isSlowMover && <SlowMoverBadge lang={lang} />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
