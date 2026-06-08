"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseStockExcel } from "@/lib/parseExcel";
import {
  calculateReplenishment,
  type ReplenishmentRow,
  type StockRow,
  type StockRisk,
} from "@/lib/replenishment";
import { useLang, type Lang } from "../LangContext";
import { supabase } from "@/lib/supabase";

const translations = {
  pt: {
    dropLabel: "Arraste o seu ficheiro Excel aqui",
    formatsLabel: "Formatos suportados: .xlsx, .xls, .csv",
    uploadHint: "Colunas obrigatórias: Produto, Stock Atual, Vendas Diárias Médias. Opcionais: Data de Validade, Preço de Custo, Preço de Venda, Código de Barras, Categoria",
    chooseFile: "Escolher ficheiro",
    selectedFilePrefix: "Ficheiro selecionado:",
    totalProducts: "Total Produtos",
    totalUnits: "Unidades Totais",
    lowStock: "Stock Baixo",
    toReorder: "A Repor",
    exportCsv: "Exportar CSV",
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
    loading: "A carregar dados...",
    saving: "A guardar...",
    saved: "Guardado ✓",
    dbError: "Erro ao ligar à base de dados",
    saveError: "Erro ao guardar dados",
  },
  en: {
    dropLabel: "Drop your Excel file here",
    formatsLabel: "Supported formats: .xlsx, .xls, .csv",
    uploadHint: "Required columns: Product, Current Stock, Avg Daily Sales. Optional: Expiry Date, Cost Price, Sale Price, Barcode, Category",
    chooseFile: "Choose file",
    selectedFilePrefix: "Selected file:",
    totalProducts: "Total Products",
    totalUnits: "Total Units",
    lowStock: "Low Stock",
    toReorder: "To Reorder",
    exportCsv: "Export CSV",
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
    loading: "Loading data...",
    saving: "Saving...",
    saved: "Saved ✓",
    dbError: "Database connection error",
    saveError: "Failed to save data",
  },
};

type SupabaseProductRow = {
  id: number;
  product: string;
  current_stock: number;
  avg_daily_sales: number;
  expiry_date: string | null;
};

function mapSupabaseRowToStockRow(row: SupabaseProductRow): StockRow {
  let expiryDate: Date | null = null;
  if (row.expiry_date) {
    expiryDate = new Date(row.expiry_date + "T00:00:00");
  }
  return {
    product: row.product,
    currentStock: row.current_stock,
    averageDailySales: row.avg_daily_sales,
    expiryDate,
  };
}

function mapStockRowToSupabase(
  row: StockRow
): Omit<SupabaseProductRow, "id"> {
  return {
    product: row.product,
    current_stock: row.currentStock,
    avg_daily_sales: row.averageDailySales,
    expiry_date: row.expiryDate
      ? row.expiryDate.toISOString().split("T")[0]
      : null,
  };
}

async function syncToCatalog(rows: StockRow[]) {
  try {
    const { error: deleteError } = await supabase
      .from("catalog_products")
      .delete()
      .neq("id", 0);

    if (deleteError) {
      console.error("syncToCatalog delete error:", deleteError);
      return;
    }

    if (rows.length === 0) return;

    const payload = rows.map((row) => ({
      name: row.product,
      stock: row.currentStock,
      cost_price: row.costPrice ?? null,
      sale_price: row.salePrice ?? null,
      barcode: row.barcode ?? null,
      category: row.category ?? null,
    }));

    const { error: insertError } = await supabase
      .from("catalog_products")
      .insert(payload);

    if (insertError) {
      console.error("syncToCatalog insert error:", insertError);
    }
  } catch (err) {
    console.error("syncToCatalog unexpected error:", err);
  }
}

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

function StatCard({ label, value, variant }: { label: string; value: number; variant?: string }) {
  return (
    <div className={`stat-card${variant ? ` stat-card--${variant}` : ""}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{formatNumber(value)}</span>
    </div>
  );
}

function exportToCsv(results: ReplenishmentRow[], t: (typeof translations)["pt"]) {
  const escape = (val: string | number) => {
    const s = String(val);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };

  const headers = [
    t.colProduct,
    t.colCurrentStock,
    t.colAvgDailySales,
    t.colExpiryDate,
    t.col7DayTarget,
    t.colRestockDate,
    t.colReorderQty,
    t.colStockRisk,
    t.colNotes,
  ].map(escape);

  const rows = results.map((row) =>
    [
      row.product,
      row.currentStock,
      row.averageDailySales.toFixed(1),
      formatDate(row.expiryDate),
      Math.ceil(row.targetStock),
      formatDate(row.restockDate),
      row.recommendedReorder,
      row.stockRisk,
      row.isSlowMover ? "slow-mover" : "",
    ].map(escape)
  );

  const csv = [headers, ...rows].map((r) => r.join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "inventory.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function InventoryPage() {
  const { lang } = useLang();
  const inputRef = useRef<HTMLInputElement>(null);
  const isSavingRef = useRef<boolean>(false);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ReplenishmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [dbError, setDbError] = useState<string | null>(null);

  const t = translations[lang];

  useEffect(() => {
    async function fetchProducts() {
      setIsLoading(true);
      setDbError(null);

      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*");

      if (fetchError) {
        setDbError(t.dbError);
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const stockRows = (data as SupabaseProductRow[]).map(mapSupabaseRowToStockRow);
        const recommendations = calculateReplenishment(stockRows);
        setResults(recommendations);
      }

      setIsLoading(false);
    }

    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = useMemo(() => {
    const totalUnits = results.reduce((sum, r) => sum + r.currentStock, 0);
    const lowStock = results.filter(
      (r) => r.stockRisk === "low" || r.stockRisk === "critical"
    ).length;
    const toReorder = results.filter((r) => r.recommendedReorder > 0).length;
    const totalReorderUnits = results.reduce((sum, r) => sum + r.recommendedReorder, 0);
    return { totalUnits, lowStock, toReorder, totalReorderUnits };
  }, [results]);

  async function saveToSupabase(stockRows: StockRow[]) {
    if (isSavingRef.current) return;
    isSavingRef.current = true;

    setSaveStatus("saving");

    try {
      const { error: deleteError } = await supabase
        .from("products")
        .delete()
        .neq("id", 0);

      if (deleteError) {
        setSaveStatus("error");
        return;
      }

      const insertRows = stockRows.map(mapStockRowToSupabase);
      const { error: insertError } = await supabase
        .from("products")
        .insert(insertRows);

      if (insertError) {
        setSaveStatus("error");
        return;
      }

      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);

      void syncToCatalog(stockRows);
    } finally {
      isSavingRef.current = false;
    }
  }

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

      void saveToSupabase(stockRows);
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

  if (isLoading) {
    return (
      <div className="loading-state">
        <span className="spinner" aria-hidden="true" />
        {t.loading}
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="loading-state">
        <p className="error" style={{ maxWidth: 400, margin: "3rem auto" }}>
          {dbError}
        </p>
      </div>
    );
  }

  return (
    <>
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
          <p style={{ fontSize: "0.75rem", color: "var(--text-subtle)", maxWidth: "420px", textAlign: "center", lineHeight: 1.5, margin: "0 auto" }}>{t.uploadHint}</p>
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

        {saveStatus === "saving" && (
          <p className="save-status save-status--saving">{t.saving}</p>
        )}
        {saveStatus === "saved" && (
          <p className="save-status save-status--saved">{t.saved}</p>
        )}
        {saveStatus === "error" && (
          <p className="save-status save-status--error">{t.saveError}</p>
        )}
      </section>

      {results.length > 0 && (
        <section className="results">
          <div className="stats-bar">
            <StatCard label={t.totalProducts} value={results.length} variant="blue" />
            <StatCard label={t.totalUnits} value={stats.totalUnits} variant="sky" />
            <StatCard label={t.lowStock} value={stats.lowStock} variant="amber" />
            <StatCard label={t.toReorder} value={stats.toReorder} variant="red" />
          </div>

          <div className="results-header">
            <div>
              <h2>{t.resultsHeading}</h2>
              <p className="summary">
                {t.summary(results.length, stats.totalReorderUnits)}
              </p>
            </div>
            <button
              type="button"
              className="button button--export"
              onClick={() => exportToCsv(results, t)}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                aria-hidden="true"
                style={{ marginRight: "6px", verticalAlign: "middle" }}
              >
                <path d="M7 2v7M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M2 11h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
              </svg>
              {t.exportCsv}
            </button>
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
                {results.map((row, index) => (
                  <tr
                    key={`${row.product}-${index}`}
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
    </>
  );
}
