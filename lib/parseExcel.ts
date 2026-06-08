import * as XLSX from "xlsx";
import type { StockRow } from "./replenishment";

type RequiredStockKey = "product" | "currentStock" | "averageDailySales" | "expiryDate";
type OptionalStockKey = "costPrice" | "salePrice" | "barcode" | "category";

const REQUIRED_COLUMN_ALIASES: Record<RequiredStockKey, string[]> = {
  product: ["product", "product name", "item", "sku", "name"],
  currentStock: ["current stock", "stock", "on hand", "inventory", "qty on hand"],
  averageDailySales: [
    "average daily sales",
    "avg daily sales",
    "daily sales",
    "ads",
    "avg sales",
  ],
  expiryDate: [
    "expiry date",
    "expiry",
    "expiration date",
    "expiration",
    "best before",
    "use by",
    "exp date",
  ],
};

const OPTIONAL_COLUMN_ALIASES: Record<OptionalStockKey, string[]> = {
  costPrice: ["cost price", "custo", "preço de custo", "cost"],
  salePrice: ["sale price", "venda", "preço de venda", "price", "pvp"],
  barcode: ["barcode", "código de barras", "ean", "sku", "código"],
  category: ["category", "categoria"],
};

function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function findColumnIndex(headers: string[], aliases: string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

function parseNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const parsed = Number(String(value ?? "").replace(/,/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function parseDate(value: unknown): Date | null {
  if (!value && value !== 0) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    // Excel serial date number — xlsx with cellDates:true should handle this,
    // but handle raw numbers as a fallback via the XLSX utility
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return new Date(parsed.y, parsed.m - 1, parsed.d);
    }
    return null;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Handle DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY (European format)
    const euroMatch = trimmed.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/);
    if (euroMatch) {
      const dd = parseInt(euroMatch[1], 10);
      const mm = parseInt(euroMatch[2], 10);
      const yyyy = parseInt(euroMatch[3], 10);
      const d = new Date(yyyy, mm - 1, dd);
      return isNaN(d.getTime()) ? null : d;
    }

    // Fallback for ISO and other unambiguous formats
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
}

export function parseStockExcel(file: ArrayBuffer): StockRow[] {
  const workbook = XLSX.read(file, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new Error("The Excel file does not contain any sheets.");
  }

  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
    raw: false,
  });

  if (rawRows.length < 2) {
    throw new Error("The Excel file must include a header row and at least one data row.");
  }

  const headers = (rawRows[0] as unknown[]).map(normalizeHeader);
  const productIndex = findColumnIndex(headers, REQUIRED_COLUMN_ALIASES.product);
  const stockIndex = findColumnIndex(headers, REQUIRED_COLUMN_ALIASES.currentStock);
  const salesIndex = findColumnIndex(headers, REQUIRED_COLUMN_ALIASES.averageDailySales);
  const expiryIndex = findColumnIndex(headers, REQUIRED_COLUMN_ALIASES.expiryDate);

  if (productIndex === -1 || stockIndex === -1 || salesIndex === -1) {
    throw new Error(
      "Missing required columns. Expected: Product, Current Stock, and Average Daily Sales."
    );
  }

  const costPriceIndex = findColumnIndex(headers, OPTIONAL_COLUMN_ALIASES.costPrice);
  const salePriceIndex = findColumnIndex(headers, OPTIONAL_COLUMN_ALIASES.salePrice);
  const barcodeIndex = findColumnIndex(headers, OPTIONAL_COLUMN_ALIASES.barcode);
  const categoryIndex = findColumnIndex(headers, OPTIONAL_COLUMN_ALIASES.category);

  const rows: StockRow[] = [];

  for (let i = 1; i < rawRows.length; i++) {
    const row = rawRows[i] as unknown[];
    const product = String(row[productIndex] ?? "").trim();

    if (!product) {
      continue;
    }

    const currentStock = parseNumber(row[stockIndex]);
    const averageDailySales = parseNumber(row[salesIndex]);

    if (currentStock === null || averageDailySales === null) {
      throw new Error(`Row ${i + 1} has invalid numeric values.`);
    }

    if (currentStock < 0 || averageDailySales < 0) {
      throw new Error(`Row ${i + 1} cannot contain negative values.`);
    }

    const expiryDate = expiryIndex !== -1 ? parseDate(row[expiryIndex]) : null;

    const costPrice = costPriceIndex !== -1 ? parseNumber(row[costPriceIndex]) : null;
    const salePrice = salePriceIndex !== -1 ? parseNumber(row[salePriceIndex]) : null;

    const rawBarcode = barcodeIndex !== -1 ? String(row[barcodeIndex] ?? "").trim() : "";
    const barcode = rawBarcode || null;

    const rawCategory = categoryIndex !== -1 ? String(row[categoryIndex] ?? "").trim() : "";
    const category = rawCategory || null;

    rows.push({
      product,
      currentStock,
      averageDailySales,
      expiryDate,
      costPrice,
      salePrice,
      barcode,
      category,
    });
  }

  if (rows.length === 0) {
    throw new Error("No valid product rows were found in the file.");
  }

  return rows;
}
