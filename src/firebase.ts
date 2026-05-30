/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApp, getApps } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc,
  updateDoc, 
  deleteDoc, 
  onSnapshot,
  query,
  orderBy
} from "firebase/firestore";
import firebaseConfig from "./firebase-applet-config.json";
import { Product, Order, AdminConfig, OrderStatus } from "./types";
import { INITIAL_PRODUCTS } from "./constants";

// Helper: safe SHA-256 password hashing
export async function hashPassword(password: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Check if Firebase config is genuine
const isMockConfig = 
  !firebaseConfig || 
  firebaseConfig.apiKey === "MOCK_API_KEY" || 
  firebaseConfig.projectId === "mock-project";

let isFirebaseConnected = false;
let db: any = null;

if (!isMockConfig) {
  try {
    const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    isFirebaseConnected = true;
    console.log("Firebase initialized successfully on Firestore instance:", firebaseConfig.projectId);
  } catch (error) {
    console.warn("Failed to initialize Firebase app. Switching to LocalStorage fallback mode.", error);
    isFirebaseConnected = false;
  }
} else {
  console.log("Mock Firebase configuration detected. Running in LocalStorage mode.");
}

export { isFirebaseConnected, db };

// -------------------------------------------------------------
// Local Pub/Sub Storage Mock (For flawless testing offline)
// -------------------------------------------------------------
const LS_KEYS = {
  PRODUCTS: "tea_ordering_products_v1",
  ORDERS: "tea_ordering_orders_v1",
  ADMIN: "tea_ordering_admin_v1"
};

// Initialize default products if nothing in storage
const getStoredProducts = (): Product[] => {
  const data = localStorage.getItem(LS_KEYS.PRODUCTS);
  if (!data) {
    localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(INITIAL_PRODUCTS));
    return INITIAL_PRODUCTS;
  }
  try {
    return JSON.parse(data);
  } catch {
    return INITIAL_PRODUCTS;
  }
};

const getStoredOrders = (): Order[] => {
  const data = localStorage.getItem(LS_KEYS.ORDERS);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const getStoredAdmin = (): AdminConfig | null => {
  const data = localStorage.getItem(LS_KEYS.ADMIN);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
};

// Listeners registries for real-time pub/sub emulation
type SubCallback<T> = (data: T) => void;
const productListeners = new Set<SubCallback<Product[]>>();
const orderListeners = new Set<SubCallback<Order[]>>();

function notifyProducts() {
  const products = getStoredProducts();
  productListeners.forEach(cb => cb(products));
}

function notifyOrders() {
  const orders = getStoredOrders().sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  orderListeners.forEach(cb => cb(orders));
}

// -------------------------------------------------------------
// Unified Database Access Layer (Abstracts Firestore / LocalStorage)
// -------------------------------------------------------------
export const dbService = {
  // Admin Config setup
  async getAdminStatus(): Promise<{ isSetup: boolean }> {
    if (isFirebaseConnected) {
      try {
        const docRef = doc(db, "admin_settings", "config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          return { isSetup: !!data.isSetup };
        }
        return { isSetup: false };
      } catch (err) {
        console.error("Firebase admin check failed, falling back", err);
      }
    }
    const admin = getStoredAdmin();
    return { isSetup: admin ? admin.isSetup : false };
  },

  async setupAdminPassword(password: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    const adminData: AdminConfig = {
      passwordHash,
      isSetup: true,
      updatedAt: new Date().toISOString()
    };

    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "admin_settings", "config"), adminData);
        return true;
      } catch (err) {
        console.error("Failed to setup administrative password in Firebase", err);
      }
    }

    localStorage.setItem(LS_KEYS.ADMIN, JSON.stringify(adminData));
    return true;
  },

  async verifyAdminPassword(password: string): Promise<boolean> {
    const inputHash = await hashPassword(password);
    
    if (isFirebaseConnected) {
      try {
        const docRef = doc(db, "admin_settings", "config");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return docSnap.data().passwordHash === inputHash;
        }
        return false;
      } catch (err) {
        console.error("Firebase admin password verification failed", err);
      }
    }

    const admin = getStoredAdmin();
    return admin?.passwordHash === inputHash;
  },

  // Products
  subscribeProducts(callback: (products: Product[]) => void): () => void {
    if (isFirebaseConnected) {
      const q = query(collection(db, "tea_items"));
      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          if (snapshot.empty) {
            // Seed database first time if clean Firestore
            const initialProds = INITIAL_PRODUCTS;
            for (const prod of initialProds) {
              await setDoc(doc(db, "tea_items", prod.id), prod);
            }
          } else {
            const products = snapshot.docs.map(d => d.data() as Product);
            callback(products);
          }
        },
        (error) => {
          console.error("Firestore products snapshot subscription error:", error);
          // Fallback to local
          callback(getStoredProducts());
        }
      );
      return unsubscribe;
    } else {
      productListeners.add(callback);
      // initial trigger
      callback(getStoredProducts());
      return () => {
        productListeners.delete(callback);
      };
    }
  },

  async updateProduct(product: Product): Promise<void> {
    if (isFirebaseConnected) {
      try {
        await setDoc(doc(db, "tea_items", product.id), product);
        return;
      } catch (err) {
        console.error("Firestore updateProduct failed", err);
      }
    }
    const products = getStoredProducts();
    const index = products.findIndex(p => p.id === product.id);
    if (index !== -1) {
      products[index] = product;
    } else {
      products.push(product);
    }
    localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(products));
    notifyProducts();
  },

  async deleteProduct(id: string): Promise<void> {
    if (isFirebaseConnected) {
      try {
        await deleteDoc(doc(db, "tea_items", id));
        return;
      } catch (err) {
        console.error("Firestore deleteProduct failed", err);
      }
    }
    const products = getStoredProducts().filter(p => p.id !== id);
    localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(products));
    notifyProducts();
  },

  // Orders
  subscribeOrders(callback: (orders: Order[]) => void): () => void {
    if (isFirebaseConnected) {
      // Order by createdAt descending
      const q = query(collection(db, "orders"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const orders = snapshot.docs.map(d => d.data() as Order);
          // sort locally to avoid composite index requirement in firestore
          const sorted = orders.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          callback(sorted);
        },
        (error) => {
          console.error("Firestore orders snapshot subscription error:", error);
          // Fallback to local
          callback(getStoredOrders().sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          ));
        }
      );
      return unsubscribe;
    } else {
      orderListeners.add(callback);
      callback(getStoredOrders().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      return () => {
        orderListeners.delete(callback);
      };
    }
  },

  async placeOrder(orderData: Omit<Order, "id" | "createdAt" | "updatedAt" | "status">): Promise<Order> {
    const timestamp = new Date().toISOString();
    const id = "ord_" + Math.random().toString(36).substr(2, 9).toUpperCase();
    const order: Order = {
      ...orderData,
      id,
      status: "Pending",
      createdAt: timestamp,
      updatedAt: timestamp
    };

    // Real-time Stock Deduction
    if (isFirebaseConnected) {
      try {
        // Create order
        await setDoc(doc(db, "orders", id), order);
        
        // Deduct products stock level
        for (const item of order.items) {
          const pDocRef = doc(db, "tea_items", item.productId);
          const pDocSnap = await getDoc(pDocRef);
          if (pDocSnap.exists()) {
            const currentObj = pDocSnap.data() as Product;
            if (currentObj.stock !== null && currentObj.stock !== undefined) {
              const newStock = Math.max(0, currentObj.stock - item.quantity);
              await updateDoc(pDocRef, { 
                stock: newStock,
                isAvailable: newStock > 0 ? currentObj.isAvailable : false
              });
            }
          }
        }
        return order;
      } catch (err) {
        console.error("Failed to place sequence in Firestore, falling back to local operations", err);
      }
    }

    // Fallback: LocalStorage state manipulation
    const orders = getStoredOrders();
    orders.push(order);
    localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(orders));
    notifyOrders();

    // Deduct stock locally
    const products = getStoredProducts();
    for (const item of order.items) {
      const index = products.findIndex(p => p.id === item.productId);
      if (index !== -1) {
        const prod = products[index];
        if (prod.stock !== null && prod.stock !== undefined) {
          prod.stock = Math.max(0, prod.stock - item.quantity);
          if (prod.stock === 0) {
            // Out of stock
          }
        }
      }
    }
    localStorage.setItem(LS_KEYS.PRODUCTS, JSON.stringify(products));
    notifyProducts();

    return order;
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
    if (isFirebaseConnected) {
      try {
        await updateDoc(doc(db, "orders", id), { 
          status,
          updatedAt: new Date().toISOString()
        });
        return;
      } catch (err) {
        console.error("Firestore updateOrderStatus failed", err);
      }
    }

    const orders = getStoredOrders();
    const index = orders.findIndex(o => o.id === id);
    if (index !== -1) {
      orders[index].status = status;
      orders[index].updatedAt = new Date().toISOString();
      localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(orders));
      notifyOrders();
    }
  },

  async deleteOrder(id: string): Promise<void> {
    if (isFirebaseConnected) {
      try {
        await deleteDoc(doc(db, "orders", id));
        return;
      } catch (err) {
        console.error("Firestore deleteOrder failed", err);
      }
    }

    const orders = getStoredOrders().filter(o => o.id !== id);
    localStorage.setItem(LS_KEYS.ORDERS, JSON.stringify(orders));
    notifyOrders();
  }
};
