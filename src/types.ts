/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "和風茶" | "和風日式複方茶" | "厚奶茶";
  stock: number | null; // null represents unlimited, otherwise numeric quantities
  isAvailable: boolean;
  sugar: string;          // E.g., "40g", "無"
  caffeine: string;       // E.g., "無", "低", "中"
  calories: number;       // E.g., 177
  tempOption: "冰/熱" | "固定冰";
  imageUrl: string;
}

export interface CartItem {
  id: string; // unique cart item composite key
  product: Product;
  quantity: number;
  sweetness: string; // "正常糖" | "少糖" | "半糖" | "微糖" | "二分糖" | "無糖"
  ice: string;       // "正常冰" | "少冰" | "微冰" | "去冰" | "常溫" | "熱"
}

export type OrderStatus = "Pending" | "Preparing" | "Completed" | "Cancelled";

export interface Order {
  id: string;
  customerName: string;
  customerPhone?: string;
  deliveryMethod: "內用" | "外帶";
  tableOrNote: string; // E.g., "桌號 5" or "15分鐘後取餐"
  items: {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    sweetness: string;
    ice: string;
    subtotal: number;
  }[];
  totalAmount: number;
  status: OrderStatus;
  notes?: string;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

export interface AdminConfig {
  passwordHash: string;
  isSetup: boolean;
  updatedAt: string;
}
