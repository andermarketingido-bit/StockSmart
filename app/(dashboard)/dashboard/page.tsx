"use client";

import { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { calculateReplenishment, type ReplenishmentRow, type StockRisk } from "@/lib/replenishment";
import { supabase } from "@/lib/supabase";
import { useLang, type Lang } from "../LangContext";

const translations = {
  pt: {
    subtitle: "Visão geral do inventário",
    totalStockValue: "Valor Total em Stock",
    totalUnits: "Total de Unidades",
    lowStock: "Stock Baixo",
    outOfStock: "Sem Stock",
    attentionTitle: "Itens que Precisam de Atenção",
    chartTitle: "Top Produtos por Unidades em Stock",
    colProduct: "Produto",
    colStock: "Stock",
    colRisk: "Risco",
    colExpiry: "Validade",
    noAttention: "Sem dados. Carregue um ficheiro Excel no Inventário.",
    noChart: "Sem dados disponíveis.",
    loading: "A carregar...",
    error: "Erro ao carregar dados.",
    riskOk: "OK",
    riskLow: "Baixo",
    riskCritical: "Crítico",
    noExpiry: "—",
  },
  en: {
    subtitle: "Inventory overview",
    totalStockValue: "Total Stock Value",
    totalUnits: "Total Units",
    lowStock: "Low Stock",
    outOfStock: "Out of Stock",
    attentionTitle: "Items Needing Attention",
    chartTitle: "Top Products by Units in Stock",
    colProduct: "Product",
    colStock: "Stock",
    colRisk: "Risk",
    colExpiry: "Expiry",
    noAttention: "No data. Upload an Excel file in Inventory.",
    noChart: "No data available.",
    loading: "Loading...",
    error: "Failed to load data.",
    riskOk: "OK",
    riskLow: "Low",
    riskCritical: "Critical",
    noExpiry: "—",
  },
};

type CatalogProduct = {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  sale_price: number | null;
  cost_price: number | null;
  stock: number | null;
};

type SupabaseProductRow = {
  id: number;
  product: string;
  current_stock: number;
  avg_daily_sales: number;
  expiry_date: string | null;
};

interface DashboardData {
  totalStockValue: number;
  totalUnits: number;
  outOfStock: number;
  lowStockCount: number;
  attentionItems: ReplenishmentRow[];
  topCatalogProducts: { name: string; stock: number }[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-PT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatInteger(value: number): string {
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

function StatCard({
  label,
  value,
  variant,
  isCurrency,
}: {
  label: string;
  value: number;
  variant: string;
  isCurrency?: boolean;
}) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">
        {isCurrency ? formatCurrency(value) : formatInteger(value)}
      </span>
    </div>
  );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { name: string } }[];
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const item = payload[0];
    return (
      <div
        style={{
          background: "white",
          border: "1px solid var(--border)",
          borderRadius: 6,
          padding: "8px 12px",
          fontSize: "0.8rem",
          color: "var(--text)",
        }}
      >
        <p style={{ margin: 0, fontWeight: 500 }}>{item.payload.name}</p>
        <p style={{ margin: "2px 0 0", color: "var(--text-muted)" }}>
          {formatInteger(item.value)}
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { lang } = useLang();
  const t = translations[lang];

  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchDashboardData() {
      setIsLoading(true);
      setError(false);

      try {
        const [catalogResult, productsResult] = await Promise.all([
          supabase.from("catalog_products").select("*"),
          supabase.from("products").select("*"),
        ]);

        if (catalogResult.error || productsResult.error) {
          setError(true);
          setIsLoading(false);
          return;
        }

        const catalogRows = (catalogResult.data ?? []) as CatalogProduct[];
        const productRows = (productsResult.data ?? []) as SupabaseProductRow[];

        // catalog_products stats
        const totalStockValue = catalogRows.reduce((sum, r) => {
          if (r.stock != null && r.cost_price != null) {
            return sum + r.stock * r.cost_price;
          }
          return sum;
        }, 0);

        const totalUnits = catalogRows.reduce((sum, r) => sum + (r.stock ?? 0), 0);
        const outOfStock = catalogRows.filter(
          (r) => r.stock == null || r.stock === 0
        ).length;

        // top 10 by stock for bar chart
        const topCatalogProducts = [...catalogRows]
          .filter((r) => (r.stock ?? 0) > 0)
          .sort((a, b) => (b.stock ?? 0) - (a.stock ?? 0))
          .slice(0, 10)
          .map((r) => ({
            name: r.name.length > 12 ? r.name.slice(0, 12) + "…" : r.name,
            stock: r.stock ?? 0,
          }));

        // products replenishment
        const stockRows = productRows.map((row) => ({
          product: row.product,
          currentStock: row.current_stock,
          averageDailySales: row.avg_daily_sales,
          expiryDate: row.expiry_date ? new Date(row.expiry_date + "T00:00:00") : null,
        }));

        const replenishment = calculateReplenishment(stockRows);

        const lowStockCount = replenishment.filter(
          (r) => r.stockRisk === "low" || r.stockRisk === "critical"
        ).length;

        // attention items: critical first, then low, then expiring soon, top 8
        const riskOrder: Record<StockRisk, number> = { critical: 0, low: 1, ok: 2 };
        const attentionItems = [...replenishment]
          .filter(
            (r) =>
              r.stockRisk === "critical" ||
              r.stockRisk === "low" ||
              r.isExpiringWithin7Days
          )
          .sort((a, b) => {
            const aRisk = riskOrder[a.stockRisk];
            const bRisk = riskOrder[b.stockRisk];
            if (aRisk !== bRisk) return aRisk - bRisk;
            return 0;
          })
          .slice(0, 8);

        setData({
          totalStockValue,
          totalUnits,
          outOfStock,
          lowStockCount,
          attentionItems,
          topCatalogProducts,
        });
      } catch {
        setError(true);
      } finally {
        setIsLoading(false);
      }
    }

    void fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="loading-state">
        <span className="spinner" aria-hidden="true" />
        {t.loading}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="loading-state">
        <p className="error" style={{ maxWidth: 400, margin: "3rem auto" }}>
          {t.error}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="subtitle">{t.subtitle}</p>
      </div>

      <div className="stat-grid">
        <StatCard
          label={t.totalStockValue}
          value={data.totalStockValue}
          variant="green"
          isCurrency
        />
        <StatCard
          label={t.totalUnits}
          value={data.totalUnits}
          variant="blue"
        />
        <StatCard
          label={t.lowStock}
          value={data.lowStockCount}
          variant="amber"
        />
        <StatCard
          label={t.outOfStock}
          value={data.outOfStock}
          variant="red"
        />
      </div>

      <div className="dashboard-grid">
        {/* Attention items panel */}
        <div className="dashboard-panel">
          <p className="dashboard-panel-title">{t.attentionTitle}</p>
          {data.attentionItems.length === 0 ? (
            <div className="empty-state">{t.noAttention}</div>
          ) : (
            <div className="table-wrap" style={{ border: "none", borderRadius: 0 }}>
              <table style={{ minWidth: 0 }}>
                <thead>
                  <tr>
                    <th>{t.colProduct}</th>
                    <th className="num">{t.colStock}</th>
                    <th>{t.colRisk}</th>
                    <th>{t.colExpiry}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.attentionItems.map((item, idx) => (
                    <tr
                      key={`${item.product}-${idx}`}
                      className={item.isExpiringWithin7Days ? "row-expiry" : undefined}
                    >
                      <td className="cell-product">{item.product}</td>
                      <td className="num">{formatInteger(item.currentStock)}</td>
                      <td>
                        <StockRiskBadge risk={item.stockRisk} lang={lang} />
                      </td>
                      <td
                        className={
                          item.isExpiringWithin7Days ? "cell-expiry-alert" : undefined
                        }
                      >
                        {item.expiryDate ? formatDate(item.expiryDate) : t.noExpiry}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bar chart panel */}
        <div className="dashboard-panel">
          <p className="dashboard-panel-title">{t.chartTitle}</p>
          {data.topCatalogProducts.length === 0 ? (
            <div className="empty-state">{t.noChart}</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart
                data={data.topCatalogProducts}
                margin={{ top: 4, right: 8, left: 0, bottom: 40 }}
              >
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  angle={-35}
                  textAnchor="end"
                  interval={0}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--text-muted)" }}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="stock" fill="#3ECF8E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </>
  );
}
