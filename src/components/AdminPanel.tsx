/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, FormEvent } from "react";
import { Product, Order, OrderStatus } from "../types";
import { INITIAL_PRODUCTS } from "../constants";
import { dbService, isFirebaseConnected } from "../firebase";
import { 
  KeyRound, 
  Settings, 
  Plus, 
  Power, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  Archive, 
  Inbox, 
  RotateCcw, 
  Database, 
  AlertTriangle, 
  Eye, 
  EyeOff, 
  Sparkles,
  ClipboardList
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AdminPanelProps {
  products: Product[];
  orders: Order[];
  onRefreshProducts: () => void;
}

export default function AdminPanel({ products, orders, onRefreshProducts }: AdminPanelProps) {
  // Authentication states
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Panel settings
  const [activeTab, setActiveTab] = useState<"orders" | "menu" | "settings">("orders");
  const [orderFilter, setOrderFilter] = useState<OrderStatus | "All">("Pending");

  // Product Editing / Creation state
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [beverageForm, setBeverageForm] = useState<Partial<Product>>({
    name: "",
    description: "",
    price: 35,
    category: "和風茶",
    stock: 50,
    isAvailable: true,
    sugar: "40g",
    caffeine: "無",
    calories: 180,
    tempOption: "冰/熱",
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80"
  });

  // Load setup status on mount
  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const status = await dbService.getAdminStatus();
      setIsSetup(status.isSetup);
    } catch (err) {
      console.error(err);
      setIsSetup(false);
    } finally {
      setIsLoadingStatus(false);
    }
  };

  // Setup admin password (first time)
  const handleSetupPassword = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!password.trim()) {
      setAuthError("密碼不可為空！");
      return;
    }
    if (password.length < 6) {
      setAuthError("為了系統安全，管理者密碼需至少包含 6 個字元。");
      return;
    }
    if (password !== confirmPassword) {
      setAuthError("兩次輸入密碼不一致！二維校對失敗。");
      return;
    }

    try {
      await dbService.setupAdminPassword(password.trim());
      setIsSetup(true);
      setIsAuthenticated(true);
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      setAuthError("設定失敗，請確認與資料庫連線無阻。");
    }
  };

  // Verify password login (subsequent runs)
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!password.trim()) {
      setAuthError("請輸入密碼！");
      return;
    }

    try {
      const isValid = await dbService.verifyAdminPassword(password.trim());
      if (isValid) {
        setIsAuthenticated(true);
        setPassword("");
      } else {
        setAuthError("密碼錯誤！請重新核對。");
      }
    } catch (err) {
      setAuthError("驗證失敗，請再試一次。");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword("");
  };

  // Handlers for orders processing
  const handleOrderAction = async (orderId: string, currentStatus: OrderStatus, action: "progress" | "cancel") => {
    let nextStatus: OrderStatus = currentStatus;
    if (action === "cancel") {
      nextStatus = "Cancelled";
    } else {
      if (currentStatus === "Pending") nextStatus = "Preparing";
      else if (currentStatus === "Preparing") nextStatus = "Completed";
    }

    try {
      await dbService.updateOrderStatus(orderId, nextStatus);
    } catch (err) {
      console.error("Failed to update status in server", err);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm("確定要徹底刪除此筆訂單紀錄嗎？此動作將無法還原！")) return;
    try {
      await dbService.deleteOrder(orderId);
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers for inventory items maintenance
  const handleFastStockUpdate = async (product: Product, delta: number) => {
    const currentStock = product.stock !== null ? product.stock : 0;
    const newStock = Math.max(0, currentStock + delta);
    const updated: Product = {
      ...product,
      stock: newStock,
      isAvailable: newStock > 0 ? product.isAvailable : false
    };
    try {
      await dbService.updateProduct(updated);
      onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleProductLive = async (product: Product) => {
    const updated: Product = {
      ...product,
      isAvailable: !product.isAvailable
    };
    try {
      await dbService.updateProduct(updated);
      onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveBeverageForm = async (e: FormEvent) => {
    e.preventDefault();
    if (!beverageForm.name?.trim()) return;

    const id = editingProduct 
      ? editingProduct.id 
      : "prod_" + Math.random().toString(36).substr(2, 9).toUpperCase();

    const finalProduct: Product = {
      id,
      name: beverageForm.name.trim(),
      description: beverageForm.description?.trim() || "",
      price: Number(beverageForm.price) || 0,
      category: (beverageForm.category as any) || "和風茶",
      stock: beverageForm.stock !== undefined && beverageForm.stock !== null ? Number(beverageForm.stock) : null,
      isAvailable: beverageForm.isAvailable !== undefined ? beverageForm.isAvailable : true,
      sugar: beverageForm.sugar || "無",
      caffeine: beverageForm.caffeine || "無",
      calories: Number(beverageForm.calories) || 0,
      tempOption: (beverageForm.tempOption as any) || "冰/熱",
      imageUrl: beverageForm.imageUrl || "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80"
    };

    try {
      await dbService.updateProduct(finalProduct);
      setIsAddingNew(false);
      setEditingProduct(null);
      onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm("確定要向資料庫刪除此項產品嗎？前台菜單將無法看到該品項！")) return;
    try {
      await dbService.deleteProduct(id);
      onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSeedReset = async () => {
    if (!confirm("警告：本操作會將資料庫中「所有茶飲數據」還原成初始範例品項（會保留已產生的訂單）。您確定要還原預設菜單嗎？")) return;
    try {
      for (const prod of INITIAL_PRODUCTS) {
        await dbService.updateProduct(prod);
      }
      alert("已重設品項至官方品牌數據！");
      onRefreshProducts();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter orders by local category
  const activeOrdersFiltered = orders.filter(o => {
    if (orderFilter === "All") return true;
    return o.status === orderFilter;
  });

  // Total income stats
  const totalCompletedSales = orders
    .filter(o => o.status === "Completed")
    .reduce((sum, o) => sum + o.totalAmount, 0);

  // Loading lock check
  if (isLoadingStatus) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-stone-500 space-y-2">
        <div className="w-8 h-8 rounded-full border-4 border-stone-300 border-t-stone-900 animate-spin" />
        <p className="text-xs">載入現場看板設定中...</p>
      </div>
    );
  }

  // FIRST TIME SETUP PIN SCREEN
  if (isSetup === false && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-stone-200 p-6 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto text-amber-800">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 font-sans">🔑 初始管理密碼設定</h2>
          <p className="text-xs text-stone-500">
            這是您第一次嘗試啟用系統後台。為了保護您的選單設定與敏感訂單，請設定一組管理密碼。之後每次進入都需要輸入本組密碼。
          </p>
        </div>

        <form onSubmit={handleSetupPassword} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">設定後台密碼：</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="請輸入管理密碼 (最少6位)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded-lg p-2.5 pr-10 focus:outline-none focus:border-stone-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">再次確認密碼：</label>
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="請再次輸入密碼二度核對"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:outline-none focus:border-stone-500 bg-white"
            />
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs flex gap-1.5 leading-snug">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-stone-50 font-bold py-2.5 rounded-xl text-xs transition shadow-md"
          >
            鎖定並開啟管理者平台
          </button>
        </form>
      </div>
    );
  }

  // SUBSEQUENT LOGIN PASSWORD SCREEN
  if (isSetup === true && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-2xl border border-stone-200 p-6 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-800">
            <KeyRound className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 font-sans">🛡️ 管理權限安全驗證</h2>
          <p className="text-xs text-stone-500">
            請输入您先前建立的管理者驗證密碼，以開啟實時看板管理系統。
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-stone-700">管理者安全密碼：</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                placeholder="請輸入密碼以解鎖"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full text-xs border border-stone-300 rounded-lg p-2.5 pr-10 focus:outline-none focus:border-stone-500 bg-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {authError && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs flex gap-1.5 leading-snug">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-stone-900 hover:bg-stone-800 text-stone-50 font-bold py-2.5 rounded-xl text-xs transition shadow-md"
          >
            確認並進入後台
          </button>
        </form>
      </div>
    );
  }

  // MAIN RUNNING PANEL PLATFORM
  return (
    <div className="space-y-6">
      {/* Upper Status Panel Block */}
      <div className="bg-stone-100 p-4 rounded-xl border border-stone-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-stone-900 text-stone-50 rounded-lg">
            <Settings className="w-4.5 h-4.5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-stone-900 leading-tight flex items-center gap-1.5">
              八曜極上點單後台控制台
              <span className="text-[10px] bg-stone-250 font-mono text-stone-600 font-bold rounded py-0.5 px-2 bg-stone-200">
                ACTIVE
              </span>
            </h2>
            <div className="flex items-center gap-1.5 text-[10px] text-stone-500 mt-1">
              <Database className="w-3.5 h-3.5 text-stone-400" />
              <span>
                資料庫狀態：
                {isFirebaseConnected ? (
                  <span className="text-emerald-700 font-bold">🟢 Google Cloud Firestore 流式同步</span>
                ) : (
                  <span className="text-amber-700 font-bold">🟠 沙盒離線模擬 (LocalStorage)</span>
                )}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-stone-500 font-medium ml-1 flex-1 sm:flex-initial hidden md:inline">
            現場總營業額: <strong className="text-stone-900">${totalCompletedSales}</strong>
          </span>
          <button
            onClick={handleLogout}
            className="text-xs bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold px-3 py-2 rounded-lg transition inline-flex items-center gap-1.5 w-full sm:w-auto justify-center"
          >
            <Power className="w-3.5 h-3.5 text-red-500" />
            鎖定面板
          </button>
        </div>
      </div>

      {/* Primary tab bar panel selectors */}
      <div className="flex gap-2 border-b border-stone-200">
        <button
          onClick={() => { setActiveTab("orders"); setIsAddingNew(false); setEditingProduct(null); }}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === "orders"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          訂單接單管理 ({orders.filter(o => o.status === "Pending" || o.status === "Preparing").length})
        </button>
        <button
          onClick={() => { setActiveTab("menu"); }}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === "menu"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <Inbox className="w-4 h-4" />
          品項庫存與菜單維護 ({products.length})
        </button>
        <button
          onClick={() => { setActiveTab("settings"); setIsAddingNew(false); setEditingProduct(null); }}
          className={`flex items-center gap-1.5 px-4 py-3 text-xs font-bold border-b-2 transition ${
            activeTab === "settings"
              ? "border-stone-900 text-stone-900"
              : "border-transparent text-stone-500 hover:text-stone-700"
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          系統重設與除錯
        </button>
      </div>

      {/* TAB 1: Real-time Live Order Processing */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {/* Order sub filter category tabs */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "Pending", label: "待處理掛單", count: orders.filter(o => o.status === "Pending").length },
              { id: "Preparing", label: "製作處理中", count: orders.filter(o => o.status === "Preparing").length },
              { id: "Completed", label: "已完成取餐", count: orders.filter(o => o.status === "Completed").length },
              { id: "Cancelled", label: "已取消紀錄", count: orders.filter(o => o.status === "Cancelled").length },
              { id: "All", label: "歷史所有紀錄", count: orders.length }
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setOrderFilter(filter.id as any)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition shrink-0 ${
                  orderFilter === filter.id
                    ? "bg-stone-905 bg-stone-900 text-white font-bold"
                    : "bg-stone-50 hover:bg-stone-150 text-stone-600 text-stone-500 border border-stone-200"
                }`}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>

          {/* Listing orders in active list queue */}
          {activeOrdersFiltered.length === 0 ? (
            <div className="bg-white border border-stone-200 rounded-xl p-12 text-center text-stone-400">
              <Archive className="w-10 h-10 text-stone-300 mx-auto mb-2 stroke-[1.5]" />
              <p className="text-xs">這裡暫時沒有此狀態的訂購單。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              <AnimatePresence mode="popLayout">
                {activeOrdersFiltered.map(order => (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`bg-white rounded-xl border border-stone-200 p-4 flex flex-col justify-between shadow-xs ${
                      order.status === "Pending" ? "border-l-4 border-l-amber-500" :
                      order.status === "Preparing" ? "border-l-4 border-l-blue-500" :
                      order.status === "Completed" ? "border-l-4 border-l-green-500" : "border-l-4 border-l-stone-400"
                    }`}
                  >
                    <div>
                      {/* Name, phone table timing */}
                      <div className="flex justify-between items-start gap-2 border-b border-stone-100 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-stone-900 text-sm">{order.customerName}</span>
                            <span className="text-[10px] bg-stone-110 bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded font-mono">
                              {order.id}
                            </span>
                          </div>
                          {order.customerPhone && (
                            <span className="text-[10px] text-stone-500 block">📞 {order.customerPhone}</span>
                          )}
                        </div>
                        <span className="text-[10px] text-stone-400 font-mono">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </span>
                      </div>

                      {/* Items Ordered list */}
                      <div className="py-3 space-y-2">
                        {order.items.map((item, id) => (
                          <div key={id} className="text-xs">
                            <div className="flex justify-between font-medium text-stone-850">
                              <span>
                                {item.name} <strong className="text-stone-900">x{item.quantity}</strong>
                              </span>
                              <span className="font-mono text-stone-500">${item.subtotal}</span>
                            </div>
                            <div className="text-[10px] text-stone-400 ml-1 mt-0.5">
                              調配: {item.sweetness} / {item.ice}
                            </div>
                          </div>
                        ))}
                        {order.notes && (
                          <div className="mt-2 text-[10px] bg-amber-50 border border-amber-200 text-amber-900 p-2 rounded leading-snug">
                            <strong>顧客備註：</strong>{order.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions buttons and pricing info */}
                    <div className="pt-3 border-t border-stone-100 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-stone-500">
                          {order.deliveryMethod} &bull; <strong>{order.tableOrNote}</strong>
                        </span>
                        <span className="font-bold font-mono text-stone-900 text-sm">
                          總金額: ${order.totalAmount}
                        </span>
                      </div>

                      <div className="flex gap-1.5 pt-0.5">
                        {order.status === "Pending" && (
                          <>
                            <button
                              onClick={() => handleOrderAction(order.id, "Pending", "progress")}
                              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-1.5 rounded text-[11px] transition shadow-xs"
                            >
                              接單並開始製作
                            </button>
                            <button
                              onClick={() => handleOrderAction(order.id, "Pending", "cancel")}
                              className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 py-1.5 px-2.5 rounded text-[11px] transition text-center"
                            >
                              取消
                            </button>
                          </>
                        )}

                        {order.status === "Preparing" && (
                          <>
                            <button
                              onClick={() => handleOrderAction(order.id, "Preparing", "progress")}
                              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded text-[11px] transition shadow-xs"
                            >
                              製作完成通知取餐
                            </button>
                            <button
                              onClick={() => handleOrderAction(order.id, "Preparing", "cancel")}
                              className="bg-white border border-stone-200 hover:bg-stone-50 text-stone-700 py-1.5 px-2.5 rounded text-[11px] transition text-center"
                            >
                              取消
                            </button>
                          </>
                        )}

                        {(order.status === "Completed" || order.status === "Cancelled") && (
                          <button
                            onClick={() => handleDeleteOrder(order.id)}
                            className="w-full bg-stone-50 hover:bg-red-50 hover:text-red-600 hover:border-red-200 border border-stone-200 text-stone-500 py-1.5 rounded text-[11px] transition flex items-center justify-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            刪除此筆點單紀錄
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Beverage Items List & Available Inventory Configs */}
      {activeTab === "menu" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-stone-50 p-3 rounded-lg border border-stone-200">
            <span className="text-xs text-stone-500 font-medium">說明：本處可同步控管當日販售品項的即時庫存，庫存至 0 時前台會自動限制點單。</span>
            <button
              onClick={() => {
                setEditingProduct(null);
                setBeverageForm({
                  name: "",
                  description: "",
                  price: 35,
                  category: "和風茶",
                  stock: 50,
                  isAvailable: true,
                  sugar: "40g",
                  caffeine: "無",
                  calories: 180,
                  tempOption: "冰/熱",
                  imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80"
                });
                setIsAddingNew(true);
              }}
              className="bg-stone-900 hover:bg-stone-800 text-white font-bold px-3 py-1.5 rounded text-xs transition flex items-center gap-1 shrink-0 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              新增點單茶品
            </button>
          </div>

          {/* Beverage Item Form Drawer (Add/Edit) */}
          {(isAddingNew || editingProduct) && (
            <form onSubmit={handleSaveBeverageForm} className="bg-stone-50 rounded-xl border border-stone-200 p-5 space-y-4 shadow-inner relative">
              <h3 className="font-bold text-stone-900 text-sm border-b border-stone-200 pb-2 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-700" />
                {editingProduct ? `修改茶品資訊：${editingProduct.name}` : "新增極上品項菜單"}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">茶品名稱：</label>
                  <input
                    type="text"
                    required
                    placeholder="如：極上和風蕎麥茶"
                    value={beverageForm.name}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">分類：</label>
                  <select
                    value={beverageForm.category}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, category: e.target.value as any }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white h-9"
                  >
                    <option value="和風茶">和風茶</option>
                    <option value="和風日式複方茶">和風日式複方茶</option>
                    <option value="厚奶茶">厚奶茶</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">價格：</label>
                  <input
                    type="number"
                    min="1"
                    required
                    placeholder="如：40"
                    value={beverageForm.price}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, price: Number(e.target.value) || 0 }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">初始庫存量（留空代表無限供應）：</label>
                  <input
                    type="number"
                    placeholder="如：50"
                    value={beverageForm.stock === null ? "" : beverageForm.stock}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, stock: e.target.value === "" ? null : Number(e.target.value) }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">糖量極值（克量規格）：</label>
                  <input
                    type="text"
                    placeholder="如：40g"
                    value={beverageForm.sugar}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, sugar: e.target.value }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">咖啡因含量等級：</label>
                  <select
                    value={beverageForm.caffeine}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, caffeine: e.target.value }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white h-9"
                  >
                    <option value="無">無</option>
                    <option value="低">低</option>
                    <option value="中">中</option>
                    <option value="高">高</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">一杯總熱量 (Cal)：</label>
                  <input
                    type="number"
                    placeholder="如：177"
                    value={beverageForm.calories}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, calories: Number(e.target.value) || 0 }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">可選冷熱溫度選項：</label>
                  <select
                    value={beverageForm.tempOption}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, tempOption: e.target.value as any }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-500 bg-white h-9"
                  >
                    <option value="冰/熱">冰/熱皆可 (Ice/Hot)</option>
                    <option value="固定冰">僅限冷飲 (Ice Only)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-stone-700 block">圖片連結 URL：</label>
                  <input
                    type="text"
                    required
                    placeholder="Image link / CDN url..."
                    value={beverageForm.imageUrl}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                    className="w-full text-xs border border-stone-300 rounded-lg p-2 focus:outline-none focus:border-stone-550 focus:border-stone-500 bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-stone-700 block">口味與麥方詳細介绍：</label>
                <textarea
                  required
                  placeholder="詳細介紹該品項的茶感調配與穀麥配比（限內建說明顯示）"
                  value={beverageForm.description}
                  onChange={(e) => setBeverageForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full text-xs border border-stone-300 rounded-lg p-2.5 h-16 resize-none focus:outline-none focus:border-stone-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-stone-700 select-none">
                  <input
                    type="checkbox"
                    checked={beverageForm.isAvailable}
                    onChange={(e) => setBeverageForm(prev => ({ ...prev, isAvailable: e.target.checked }))}
                    className="rounded border-stone-300 bg-white text-stone-900 focus:ring-0"
                  />
                  前台立即可見並開放訂購 (is Available)
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="bg-stone-900 hover:bg-stone-800 text-white font-bold py-2 px-5 rounded text-xs transition shadow-md"
                >
                  儲存並上傳至資料庫
                </button>
                <button
                  type="button"
                  onClick={() => { setIsAddingNew(false); setEditingProduct(null); }}
                  className="bg-white border border-stone-250 hover:bg-stone-105 text-stone-700 py-2 px-5 rounded text-xs transition"
                >
                  取消
                </button>
              </div>
            </form>
          )}

          {/* Table display list of products */}
          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold text-stone-500 uppercase font-sans">
                    <th className="p-3">茶飲品項資訊</th>
                    <th className="p-3">類別</th>
                    <th className="p-3">價格</th>
                    <th className="p-3">當前庫存</th>
                    <th className="p-3">狀態</th>
                    <th className="p-3 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-xs">
                  {products.map(product => {
                    const isSoldOut = product.stock !== null && product.stock <= 0;
                    const isLowStock = product.stock !== null && product.stock > 0 && product.stock <= 5;
                    
                    return (
                      <tr key={product.id} className="hover:bg-stone-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img 
                              src={product.imageUrl} 
                              alt={product.name}
                              referrerPolicy="no-referrer"
                              className="w-10 h-10 object-cover rounded-lg bg-stone-100"
                            />
                            <div>
                              <strong className="text-stone-950 font-bold block">{product.name}</strong>
                              <span className="text-[10px] text-stone-400 font-mono">ID: {product.id}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="bg-stone-100 border border-stone-200 py-0.5 px-2 rounded-md font-sans text-stone-605 text-[10px]">
                            {product.category}
                          </span>
                        </td>
                        <td className="p-3 font-bold text-stone-900">${product.price}</td>
                        <td className="p-3">
                          {product.stock === null ? (
                            <span className="text-emerald-700 font-semibold font-sans">無限供應</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className={`font-mono font-bold ${
                                isSoldOut ? "text-red-600" : isLowStock ? "text-amber-600" : "text-stone-850"
                              }`}>
                                {product.stock} 杯
                              </span>
                              
                              {/* Quick stock tweak controls */}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleFastStockUpdate(product, 5)}
                                  className="py-0.5 px-1.5 bg-stone-100 border border-stone-250 hover:bg-stone-200 text-stone-600 rounded text-[10px]"
                                  title="加5杯庫存"
                                >
                                  +5
                                </button>
                                <button
                                  onClick={() => handleFastStockUpdate(product, -1)}
                                  disabled={product.stock <= 0}
                                  className="py-0.5 px-1.5 bg-stone-100 border border-stone-250 hover:bg-stone-200 text-stone-400 disabled:opacity-50 text-stone-600 rounded text-[10px]"
                                  title="扣1杯庫存"
                                >
                                  -1
                                </button>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={() => handleToggleProductLive(product)}
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              product.isAvailable
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : "bg-red-50 text-red-700 border border-red-200"
                            }`}
                          >
                            {product.isAvailable ? "上架銷售" : "暫停點單"}
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              onClick={() => {
                                setEditingProduct(product);
                                setBeverageForm({ ...product });
                                setIsAddingNew(false);
                              }}
                              className="text-stone-500 hover:text-stone-900 transition"
                              title="編輯茶品"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-stone-400 hover:text-red-650 hover:text-red-600 transition"
                              title="刪除茶品"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Advanced Options/Settings */}
      {activeTab === "settings" && (
        <div className="bg-white border border-stone-200 rounded-xl p-5 space-y-6">
          <div>
            <h3 className="font-bold text-stone-900 text-sm font-sans mb-1">💡 系統功能配置</h3>
            <p className="text-xs text-stone-500">本節提供開發除錯、官方原廠茶品數據重設與離線沙盒設定。</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-stone-900 text-xs">官方茶品原始庫存重設 (Menu Seeding)</h4>
              <p className="text-[11px] text-stone-500 leading-relaxed">
                如果您的資料庫有遺漏或測試時需要清空重新開始，按下此會從包含「八曜和茶」、「和風308」、「雪匠奶茶」、「究極308」等在內的原廠菜單資料完整重設，並給予各飲品一組隨機初始可用庫存！
              </p>
              <button
                onClick={handleSeedReset}
                className="bg-stone-900 hover:bg-stone-850 text-white font-bold py-2 px-4 rounded text-xs transition shadow-sm inline-flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                還原官方原廠菜單品項
              </button>
            </div>

            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 space-y-3">
              <h4 className="font-bold text-stone-900 text-xs">管理者安全與連線調錯資訊</h4>
              <div className="text-[11px] text-stone-500 space-y-2 leading-relaxed">
                <p>
                  &bull; <strong>安全雜湊模式：</strong>密碼驗證已採用 SHA-256 加上 Client-Side Cryptography 單向遮罩機制，無法被反向破譯。
                </p>
                <p>
                  &bull; <strong>即時安全規則：</strong>Firestore 已鎖定寫入 Schema。
                </p>
                <p>
                  &bull; <strong>離線模擬持久化：</strong>沙盒會存於 `localStorage` 中不遺失。
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
