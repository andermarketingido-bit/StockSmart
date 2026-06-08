export const REPLENISHMENT_DAYS = 7;
export const SLOW_MOVER_MAX_ADS = 1;
export const SLOW_MOVER_MIN_STOCK = 30;
export const EXPIRY_ALERT_DAYS = 7;
export const LOW_STOCK_DAYS = 3;

export type StockRisk = "ok" | "low" | "critical";

export type StockRow = {
  product: string;
  currentStock: number;
  averageDailySales: number;
  expiryDate: Date | null;
  costPrice?: number | null;
  salePrice?: number | null;
  barcode?: string | null;
  category?: string | null;
};

export type ReplenishmentRow = StockRow & {
  targetStock: number;
  recommendedReorder: number;
  stockRisk: StockRisk;
  isSlowMover: boolean;
  isExpiringWithin7Days: boolean;
  restockDate: Date | null;
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function calculateReplenishment(rows: StockRow[]): ReplenishmentRow[] {
  const today = startOfDay(new Date());

  return rows.map((row) => {
    const targetStock = row.averageDailySales * REPLENISHMENT_DAYS;
    const recommendedReorder = Math.max(0, Math.ceil(targetStock - row.currentStock));

    let stockRisk: StockRisk;
    if (row.currentStock >= targetStock) {
      stockRisk = "ok";
    } else if (row.currentStock >= row.averageDailySales * LOW_STOCK_DAYS) {
      stockRisk = "low";
    } else {
      stockRisk = "critical";
    }

    const isSlowMover =
      row.averageDailySales < SLOW_MOVER_MAX_ADS && row.currentStock > SLOW_MOVER_MIN_STOCK;

    let isExpiringWithin7Days = false;
    if (row.expiryDate) {
      const expiryDay = startOfDay(row.expiryDate);
      const diffMs = expiryDay.getTime() - today.getTime();
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      isExpiringWithin7Days = diffDays <= EXPIRY_ALERT_DAYS && diffDays >= 0;
    }

    const restockDate =
      row.averageDailySales === 0
        ? null
        : new Date(
            today.getTime() +
              Math.floor(row.currentStock / row.averageDailySales) * 24 * 60 * 60 * 1000
          );

    return {
      ...row,
      targetStock,
      recommendedReorder,
      stockRisk,
      isSlowMover,
      isExpiringWithin7Days,
      restockDate,
    };
  });
}
