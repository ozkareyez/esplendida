export interface InventoryVariantProduct {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  brand: { name: string };
  category: { name: string };
}

export interface InventoryVariant {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
  minStock: number;
  product: InventoryVariantProduct;
}

export interface StockAlertItem {
  id: string;
  product: string;
  variant: string;
  barcode: string | null;
  stock: number;
  minStock: number;
}

export interface DashboardStats {
  sales: { today: number; month: number };
  orders: { total: number; byStatus: Record<string, number>; open: number };
  inventory: {
    products: number;
    variants: number;
    units: number;
    lowStock: number;
    outOfStock: number;
  };
  alerts: { lowStock: StockAlertItem[]; outOfStock: StockAlertItem[] };
  topProducts: { id: string; name: string; quantity: number; revenue: number }[];
}
