/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Product, Order } from "./types";
import { dbService } from "./firebase";
import ClientMenu from "./components/ClientMenu";
import OrderTrack from "./components/OrderTrack";
import AdminPanel from "./components/AdminPanel";
import { 
  TrendingUp, 
  ShoppingBag, 
  Settings, 
  MapPin, 
  Info, 
  Coffee, 
  Sparkles, 
  BellRing,
  ClipboardCheck
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [activeTab, setActiveTab] = useState<"client" | "tracking" | "admin">("client");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Track recently placed order by this client session
  const [latestPlacedOrder, setLatestPlacedOrder] = useState<Order | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Subscribe to real-time sync database streams
  useEffect(() => {
    const unsubProds = dbService.subscribeProducts((syncedProds) => {
      setProducts(syncedProds);
    });

    const unsubOrders = dbService.subscribeOrders((syncedOrders) => {
      setOrders(syncedOrders);
    });

    return () => {
      unsubProds();
      unsubOrders();
    };
  }, []);

  const handleOrderPlacedSuccess = (newOrder: Order) => {
    setLatestPlacedOrder(newOrder);
    setShowNotification(true);
    // Automatically transition to tracking tab
    setTimeout(() => {
      setActiveTab("tracking");
    }, 2000);
  };

  const handleRefreshProducts = () => {
    // Already in real-time snapshot subscription, but we can double trigger manually if needed
    dbService.subscribeProducts((prods) => {
      setProducts(prods);
    });
  };

  // Get count of client's orders that are active (Pending or Preparing)
  const activeOrdersCount = orders.filter(
    o => o.status === "Pending" || o.status === "Preparing"
  ).length;

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900 font-sans flex flex-col justify-between">
      <div>
        {/* Main Brand Header Navigation */}
        <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Logo area */}
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-stone-900 rounded-xl flex items-center justify-center text-white font-mono font-bold tracking-tight shadow-md">
                八曜
              </div>
              <div>
                <h1 className="text-base font-extrabold text-stone-950 font-sans tracking-tight flex items-center gap-1.5">
                  八曜極上和風和茶點單系統
                  <span className="text-[9px] bg-amber-50 border border-amber-200 text-amber-850 font-bold px-1.5 py-0.5 rounded">
                    和風穀麥專營
                  </span>
                </h1>
                <p className="text-[10px] text-stone-400 font-medium">現場智慧雲端接單與即時製作看板</p>
              </div>
            </div>

            {/* Custom Tab Panel Navigation Switches */}
            <nav className="flex bg-stone-105 bg-stone-100 p-1.5 rounded-xl border border-stone-200 shrink-0">
              <button
                onClick={() => setActiveTab("client")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === "client"
                    ? "bg-white text-stone-950 font-extrabold shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-stone-600" />
                茶飲點購
              </button>
              <button
                onClick={() => setActiveTab("tracking")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 relative ${
                  activeTab === "tracking"
                    ? "bg-white text-stone-950 font-extrabold shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <BellRing className="w-3.5 h-3.5 text-stone-600" />
                排隊看板
                {activeOrdersCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full animate-ping" />
                )}
              </button>
              <button
                onClick={() => setActiveTab("admin")}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                  activeTab === "admin"
                    ? "bg-white text-stone-950 font-extrabold shadow-sm"
                    : "text-stone-600 hover:text-stone-900"
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-stone-600" />
                後台接單維護
              </button>
            </nav>
          </div>
        </header>

        {/* Global Alert / Toast on placed order */}
        <AnimatePresence>
          {showNotification && latestPlacedOrder && (
            <div className="max-w-7xl mx-auto px-4 pt-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 flex gap-3.5 items-start shadow-sm"
              >
                <div className="p-2 bg-emerald-600 text-white rounded-lg">
                  <ClipboardCheck className="w-5 h-5 animate-bounce" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-emerald-950 text-sm font-sans">🎉 點單成功發出！連線已同步</h4>
                  <p className="text-xs text-emerald-850 leading-relaxed">
                    親愛的顧客 <strong>{latestPlacedOrder.customerName}</strong>，您的茶品已送出至後台。點單編號為：<strong>{latestPlacedOrder.id}</strong>，請準備好 <strong>${latestPlacedOrder.totalAmount}</strong> 元至櫃檯取餐。目前已為您自動導航至即時排隊看板！
                  </p>
                </div>
                <button 
                  onClick={() => setShowNotification(false)}
                  className="text-emerald-500 hover:text-emerald-700 text-xs font-bold px-2 shrink-0"
                >
                  關閉
                </button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Main Content Layout Panels */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "client" && (
                <ClientMenu 
                  products={products}
                  onOrderPlaced={handleOrderPlacedSuccess}
                  activeOrdersCount={orders.filter(o => o.status === "Pending" || o.status === "Preparing").length}
                  onNavigateToTracking={() => setActiveTab("tracking")}
                />
              )}

              {activeTab === "tracking" && (
                <OrderTrack 
                  orders={orders}
                  clientId={latestPlacedOrder?.customerName}
                />
              )}

              {activeTab === "admin" && (
                <AdminPanel 
                  products={products}
                  orders={orders}
                  onRefreshProducts={handleRefreshProducts}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Aesthetic Footer and Credits info */}
      <footer className="bg-white border-t border-stone-200 py-6 mt-12 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-stone-400 font-medium">
          <span className="font-sans leading-relaxed">
            &copy; {new Date().getFullYear()} 八曜極上和風茶飲. 遵循穀麥養生與日式茶藝美學. 實時連線.
          </span>
          <div className="flex gap-4">
            <span>健康糖量安全標章</span>
            <span>免排隊預約點單系統</span>
            <span>無咖啡因友善空間</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
