/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Order, OrderStatus } from "../types";
import { 
  Clock, 
  MapPin, 
  Coffee, 
  Search, 
  ChevronRight, 
  CheckCircle2, 
  Hourglass, 
  RefreshCcw, 
  Ban, 
  TrendingUp, 
  Smartphone 
} from "lucide-react";
import { motion } from "motion/react";

interface OrderTrackProps {
  orders: Order[];
  clientId?: string; // Option to pre-select client placed order
}

export default function OrderTrack({ orders, clientId }: OrderTrackProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("全部");

  // Filter orders
  const filteredOrders = orders.filter(order => {
    // Filter by text search (name, phone, table, or order id)
    const matchQuery = searchQuery.trim() === "" || 
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerPhone && order.customerPhone.includes(searchQuery)) ||
      order.tableOrNote.toLowerCase().includes(searchQuery.toLowerCase());

    // Filter by state tab
    const matchStatus = filterStatus === "全部" || 
      (filterStatus === "進行中" && (order.status === "Pending" || order.status === "Preparing")) ||
      (filterStatus === "已完成" && order.status === "Completed") ||
      (filterStatus === "已取消" && order.status === "Cancelled");

    return matchQuery && matchStatus;
  });

  const getStatusDisplay = (status: OrderStatus) => {
    switch (status) {
      case "Pending":
        return { label: "排隊待接單", color: "text-amber-600 bg-amber-50 border-amber-200", icon: Hourglass };
      case "Preparing":
        return { label: "茶飲製作中", color: "text-blue-600 bg-blue-50 border-blue-200", icon: RefreshCcw };
      case "Completed":
        return { label: "請至櫃檯取餐", color: "text-green-600 bg-green-50 border-green-200", icon: CheckCircle2 };
      case "Cancelled":
        return { label: "訂單已取消", color: "text-stone-500 bg-stone-105 border-stone-200 bg-stone-50", icon: Ban };
    }
  };

  const getStatusStepClass = (currentStatus: OrderStatus, step: number) => {
    const statusSteps: Record<OrderStatus, number> = {
      "Pending": 1,
      "Preparing": 2,
      "Completed": 3,
      "Cancelled": 0
    };

    const currentStep = statusSteps[currentStatus];
    if (currentStatus === "Cancelled") return step === 0 ? "bg-stone-500 text-white" : "bg-stone-100 text-stone-300";

    if (currentStep >= step) {
      if (step === 3) return "bg-green-600 text-white";
      if (step === 2) return "bg-blue-600 text-white";
      return "bg-amber-600 text-white";
    }
    return "bg-stone-100 text-stone-400 border border-stone-250";
  };

  return (
    <div className="space-y-6">
      {/* Upper Tracker header */}
      <div className="bg-stone-900 text-stone-50 p-6 rounded-2xl border border-stone-850 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <span className="text-[10px] bg-amber-600/90 text-white font-bold py-1 px-3 rounded-full uppercase tracking-wider">
            Realtime Board
          </span>
          <h2 className="text-xl font-bold tracking-tight text-white font-sans">
            🔔 現場即時取餐看板
          </h2>
          <p className="text-xs text-stone-300 leading-relaxed max-w-lg">
            本看板狀態由系統後台與 Firestore 即時連線同步更新。完成製作後會點亮「請取餐」狀態，請留意您的點單編號前往櫃檯取用！
          </p>
        </div>
        <div className="absolute right-4 bottom-4 opacity-5 pointer-events-none">
          <Coffee className="w-40 h-40" />
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -convert-y -translate-y-1/2" />
          <input
            type="text"
            placeholder="請輸入「訂購姓名 / 桌號 / 電話」搜尋您的茶品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-stone-300 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:border-stone-500 bg-white shadow-xs text-stone-900"
          />
        </div>
        
        {/* Status Filters buttons */}
        <div className="flex gap-1.5 overflow-x-auto whitespace-nowrap">
          {["全部", "進行中", "已完成", "已取消"].map(tab => (
            <button
              key={tab}
              onClick={() => setFilterStatus(tab)}
              className={`px-4 py-2.5 rounded-lg text-xs font-semibold border transition ${
                filterStatus === tab
                  ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                  : "bg-white text-stone-600 border-stone-200 hover:bg-stone-50"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Tracking grid list */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white border border-stone-200 rounded-xl p-10 text-center text-stone-400 space-y-2">
          <Clock className="w-10 h-10 text-stone-300 mx-auto stroke-[1.5]" />
          <p className="text-xs">
            {searchQuery ? "找不到符合條件的現場訂單。" : "現場暫無該類別訂單，快去點購第一杯吧！"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredOrders.map(order => {
            const statusDetail = getStatusDisplay(order.status);
            const StatusIcon = statusDetail.icon;
            
            return (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-xl border border-stone-200 p-4 shadow-xs space-y-4 relative flex flex-col justify-between"
              >
                {/* Header status */}
                <div>
                  <div className="flex justify-between items-start gap-4 pb-3 border-b border-stone-100">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-stone-400 block tracking-wider">
                        ORDER ID: {order.id}
                      </span>
                      <h3 className="font-bold text-stone-900 text-base mt-0.5">
                        {order.customerName}
                      </h3>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1 shrink-0 ${statusDetail.color}`}>
                      <StatusIcon className="w-3.5 h-3.5 animate-spin-slow" />
                      {statusDetail.label}
                    </span>
                  </div>

                  {/* Order items summary list */}
                  <div className="py-3 space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-stone-700">
                        <span className="font-medium font-sans flex items-center gap-1.5">
                          <span className="w-4 h-4 bg-stone-100 rounded text-[9px] flex items-center justify-center font-bold text-stone-500 shrink-0">
                            {item.quantity}
                          </span>
                          {item.name} 
                          <span className="text-[10px] text-stone-400 font-normal">
                             ({item.sweetness} / {item.ice})
                          </span>
                        </span>
                        <span className="font-mono text-stone-500 shrink-0">
                          ${item.subtotal}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tracking Progress Steps */}
                <div className="pt-3 border-t border-stone-100 space-y-3">
                  {order.status !== "Cancelled" ? (
                    <div className="flex items-center justify-between px-2">
                      <div className="flex flex-col items-center gap-1 relative flex-1">
                        <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${getStatusStepClass(order.status, 1)}`}>
                          1
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium">排隊待單</span>
                      </div>
                      
                      <div className="h-0.5 bg-stone-100 flex-1 -mt-4" />

                      <div className="flex flex-col items-center gap-1 relative flex-1">
                        <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${getStatusStepClass(order.status, 2)}`}>
                          2
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium">茶飲製作</span>
                      </div>

                      <div className="h-0.5 bg-stone-100 flex-1 -mt-4" />

                      <div className="flex flex-col items-center gap-1 relative flex-1">
                        <div className={`w-6 h-6 rounded-full text-[10px] font-bold flex items-center justify-center transition-colors ${getStatusStepClass(order.status, 3)}`}>
                          3
                        </div>
                        <span className="text-[10px] text-stone-500 font-medium">出餐請取</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-stone-50 rounded-lg p-2.5 border border-stone-200 text-center text-[10px] text-stone-500 leading-relaxed font-medium">
                      此訂單已被點單管理員操作取消，若有疑問請與門市前櫃人員洽詢。
                    </div>
                  )}

                  {/* Table/pickup info footer */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 bg-stone-50 px-3 py-2 rounded-lg border border-stone-150">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400" />
                      {order.deliveryMethod} - <strong>{order.tableOrNote}</strong>
                    </span>
                    <span className="font-mono text-stone-400">
                      {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
