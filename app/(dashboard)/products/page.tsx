"use client";

import { useEffect, useState } from "react";
import { useLang } from "../LangContext";
import { supabase } from "@/lib/supabase";

const translations = {
  pt: {
    pageTitle: "Produtos",
    addButton: "Adicionar Produto",
    searchPlaceholder: "Pesquisar por nome, código de barras ou categoria...",
    colName: "Nome",
    colBarcode: "Código de Barras",
    colCategory: "Categoria",
    colSalePrice: "Preço de Venda",
    colCostPrice: "Preço de Custo",
    colStock: "Stock",
    colActions: "Ações",
    modalAddTitle: "Adicionar Produto",
    modalEditTitle: "Editar Produto",
    labelName: "Nome",
    labelBarcode: "Código de Barras",
    labelCategory: "Categoria",
    labelSalePrice: "Preço de Venda (€)",
    labelCostPrice: "Preço de Custo (€)",
    labelStock: "Stock",
    cancel: "Cancelar",
    save: "Guardar",
    saving: "A guardar...",
    loading: "A carregar produtos...",
    empty: "Nenhum produto encontrado.",
    errorLoad: "Erro ao carregar produtos.",
    errorSave: "Erro ao guardar produto.",
    errorDelete: "Erro ao eliminar produto.",
  },
  en: {
    pageTitle: "Products",
    addButton: "Add Product",
    searchPlaceholder: "Search by name, barcode or category...",
    colName: "Name",
    colBarcode: "Barcode",
    colCategory: "Category",
    colSalePrice: "Sale Price",
    colCostPrice: "Cost Price",
    colStock: "Stock",
    colActions: "Actions",
    modalAddTitle: "Add Product",
    modalEditTitle: "Edit Product",
    labelName: "Name",
    labelBarcode: "Barcode",
    labelCategory: "Category",
    labelSalePrice: "Sale Price (€)",
    labelCostPrice: "Cost Price (€)",
    labelStock: "Stock",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving...",
    loading: "Loading products...",
    empty: "No products found.",
    errorLoad: "Failed to load products.",
    errorSave: "Failed to save product.",
    errorDelete: "Failed to delete product.",
  },
};

type Product = {
  id: number;
  name: string;
  barcode: string | null;
  category: string | null;
  sale_price: number | null;
  cost_price: number | null;
  stock: number | null;
};

type FormState = {
  name: string;
  barcode: string;
  category: string;
  sale_price: string;
  cost_price: string;
  stock: string;
};

function emptyForm(): FormState {
  return { name: "", barcode: "", category: "", sale_price: "", cost_price: "", stock: "" };
}

function productToForm(p: Product): FormState {
  return {
    name: p.name,
    barcode: p.barcode ?? "",
    category: p.category ?? "",
    sale_price: p.sale_price != null ? String(p.sale_price) : "",
    cost_price: p.cost_price != null ? String(p.cost_price) : "",
    stock: p.stock != null ? String(p.stock) : "",
  };
}

function formatPrice(val: number | null): string {
  if (val == null) return "—";
  return `€${val.toFixed(2)}`;
}

function PencilIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M11.5 1.5a1.414 1.414 0 0 1 2 2L4.5 12.5l-3 1 1-3 9-9z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M2.5 4h10M6 4V2.5h3V4M5.5 4v8a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V4"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 15 15"
      fill="none"
      aria-hidden="true"
      style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-subtle)", pointerEvents: "none" }}
    >
      <circle cx="6.5" cy="6.5" r="4" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9.5 9.5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export default function ProductsPage() {
  const { lang } = useLang();
  const t = translations[lang];

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    void fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchProducts() {
    setIsLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from("catalog_products").select("*");
    if (error) {
      setLoadError(t.errorLoad);
      setIsLoading(false);
      return;
    }
    setProducts((data ?? []) as Product[]);
    setIsLoading(false);
  }

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.barcode ?? "").toLowerCase().includes(q) ||
      (p.category ?? "").toLowerCase().includes(q)
    );
  });

  function openAdd() {
    setEditingProduct(null);
    setForm(emptyForm());
    setSaveError(null);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditingProduct(p);
    setForm(productToForm(p));
    setSaveError(null);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingProduct(null);
    setSaveError(null);
  }

  function handleField(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setIsSaving(true);
    setSaveError(null);

    const payload = {
      name: form.name.trim(),
      barcode: form.barcode.trim() || null,
      category: form.category.trim() || null,
      sale_price: form.sale_price !== "" ? parseFloat(form.sale_price) : null,
      cost_price: form.cost_price !== "" ? parseFloat(form.cost_price) : null,
      stock: form.stock !== "" ? parseInt(form.stock, 10) : null,
    };

    if (editingProduct) {
      const { error } = await supabase
        .from("catalog_products")
        .update(payload)
        .eq("id", editingProduct.id);
      if (error) {
        setSaveError(t.errorSave);
        setIsSaving(false);
        return;
      }
      setProducts((prev) =>
        prev.map((p) => (p.id === editingProduct.id ? { ...p, ...payload } : p))
      );
    } else {
      const { data, error } = await supabase
        .from("catalog_products")
        .insert([payload])
        .select();
      if (error || !data) {
        setSaveError(t.errorSave);
        setIsSaving(false);
        return;
      }
      setProducts((prev) => [...prev, data[0] as Product]);
    }

    setIsSaving(false);
    closeModal();
  }

  async function handleDelete(p: Product) {
    if (!window.confirm(lang === "pt" ? `Eliminar "${p.name}"?` : `Delete "${p.name}"?`)) return;
    setDeleteError(null);
    const { error } = await supabase.from("catalog_products").delete().eq("id", p.id);
    if (error) {
      setDeleteError(t.errorDelete);
      return;
    }
    setProducts((prev) => prev.filter((x) => x.id !== p.id));
  }

  return (
    <div className="page-content">
      {/* Top row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
        <h1 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 600, color: "var(--text)", letterSpacing: "-0.01em" }}>
          {t.pageTitle}
        </h1>
        <button type="button" className="button" style={{ marginTop: 0 }} onClick={openAdd}>
          {t.addButton}
        </button>
      </div>

      {/* Search bar */}
      <div style={{ position: "relative", marginBottom: "1rem" }}>
        <SearchIcon />
        <input
          type="text"
          className="form-input"
          placeholder={t.searchPlaceholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: "100%", paddingLeft: "32px" }}
        />
      </div>

      {/* Delete error */}
      {deleteError && <p className="error" style={{ marginBottom: "1rem" }}>{deleteError}</p>}

      {/* Table */}
      {isLoading ? (
        <div className="loading-state">
          <span className="spinner" aria-hidden="true" />
          {t.loading}
        </div>
      ) : loadError ? (
        <p className="error">{loadError}</p>
      ) : (
        <div className="table-wrap">
          <table style={{ minWidth: 700 }}>
            <thead>
              <tr>
                <th>{t.colName}</th>
                <th>{t.colBarcode}</th>
                <th>{t.colCategory}</th>
                <th className="num">{t.colSalePrice}</th>
                <th className="num">{t.colCostPrice}</th>
                <th className="num">{t.colStock}</th>
                <th>{t.colActions}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-muted)", padding: "2rem 1rem" }}>
                    {t.empty}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id}>
                    <td className="cell-product">{p.name}</td>
                    <td style={{ color: "var(--text-muted)" }}>{p.barcode ?? "—"}</td>
                    <td style={{ color: "var(--text-muted)" }}>{p.category ?? "—"}</td>
                    <td className="num">{formatPrice(p.sale_price)}</td>
                    <td className="num">{formatPrice(p.cost_price)}</td>
                    <td className="num">{p.stock ?? "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          type="button"
                          className="icon-btn"
                          title={lang === "pt" ? "Editar" : "Edit"}
                          onClick={() => openEdit(p)}
                        >
                          <PencilIcon />
                        </button>
                        <button
                          type="button"
                          className="icon-btn icon-btn--danger"
                          title={lang === "pt" ? "Eliminar" : "Delete"}
                          onClick={() => void handleDelete(p)}
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">
              {editingProduct ? t.modalEditTitle : t.modalAddTitle}
            </h2>

            <div className="form-field">
              <label className="form-label">{t.labelName} *</label>
              <input
                className="form-input"
                type="text"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">{t.labelBarcode}</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.barcode}
                  onChange={(e) => handleField("barcode", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">{t.labelCategory}</label>
                <input
                  className="form-input"
                  type="text"
                  value={form.category}
                  onChange={(e) => handleField("category", e.target.value)}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-field">
                <label className="form-label">{t.labelSalePrice}</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.sale_price}
                  onChange={(e) => handleField("sale_price", e.target.value)}
                />
              </div>
              <div className="form-field">
                <label className="form-label">{t.labelCostPrice}</label>
                <input
                  className="form-input"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.cost_price}
                  onChange={(e) => handleField("cost_price", e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label className="form-label">{t.labelStock}</label>
              <input
                className="form-input"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={(e) => handleField("stock", e.target.value)}
              />
            </div>

            {saveError && <p className="error" style={{ marginTop: 0, marginBottom: "0.5rem" }}>{saveError}</p>}

            <div className="modal-actions">
              <button type="button" className="button--ghost" onClick={closeModal}>
                {t.cancel}
              </button>
              <button
                type="button"
                className="button"
                style={{ marginTop: 0 }}
                disabled={isSaving || !form.name.trim()}
                onClick={() => void handleSave()}
              >
                {isSaving ? t.saving : t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
