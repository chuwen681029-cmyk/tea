/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, FormEvent } from "react";
import { Product, CartItem, Order } from "../types";
import { SWEETNESS_OPTIONS, ICE_OPTIONS, DELIVERY_METHODS } from "../constants";
import { dbService } from "../firebase";
import { 
  ShoppingBag, 
  X, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  Coffee, 
  TrendingUp, 
  SlidersHorizontal 
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ClientMenuProps {
  products: Product[];
  onOrderPlaced: (order: Order) => void;
  activeOrdersCount: number;
  onNavigateToTracking: () => void;
}

export default function ClientMenu({ 
  products, 
  onOrderPlaced, 
  activeOrdersCount,
  onNavigateToTracking 
}: ClientMenuProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("全部");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Customize Item States
  const [selectedSweetness, setSelectedSweetness] = useState("微糖");
  const [selectedIce, setSelectedIce] = useState("微冰");
  const [customQuantity, setCustomQuantity] = useState(1);

  // Checkout States
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"內用" | "外帶">("內用");
  const [tableOrNote, setTableOrNote] = useState("");
  const [checkoutNotes, setCheckoutNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationError, setValidationError] = useState("");

  const categories = ["全部", "和風茶", "和風日式複方茶", "厚奶茶"];

  const filteredProducts = products.filter(p => {
    if (selectedCategory === "全部") return p.isAvailable;
    return p.category === selectedCategory && p.isAvailable;
  });

  // Open popup for product configuration
  const handleOpenConfigure = (product: Product) => {
    if (!product.isAvailable || (product.stock !== null && product.stock <= 0)) return;
    setConfiguringProduct(product);
    setSelectedSweetness(product.sugar === "無" ? "無糖" : "微糖");
    setSelectedIce(product.tempOption === "固定冰" ? "正常冰" : "微冰");
    setCustomQuantity(1);
    setValidationError("");
  };

  // Add to cart with choices
  const handleAddToCart = () => {
    if (!configuringProduct) return;
    
    // Validate stock
    const itemStock = configuringProduct.stock;
    if (itemStock !== null) {
      const alreadyInCartQty = cart
        .filter(item => item.product.id === configuringProduct.id)
        .reduce((sum, item) => sum + item.quantity, 0);

      if (alreadyInCartQty + customQuantity > itemStock) {
        setValidationError(`抱歉，本品項庫存僅餘 ${itemStock} 杯，您購物車中已有 ${alreadyInCartQty} 杯。`);
        return;
      }
    }

    const cartItemId = `${configuringProduct.id}-${selectedSweetness}-${selectedIce}`;
    
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.id === cartItemId);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex].quantity += customQuantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            id: cartItemId,
            product: configuringProduct,
            quantity: customQuantity,
            sweetness: selectedSweetness,
            ice: selectedIce
          }
        ];
      }
    });

    setConfiguringProduct(null);
    setIsCartOpen(true);
  };

  const handleUpdateCartQty = (id: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          const maxStock = item.product.stock;
          if (maxStock !== null && newQty > maxStock) {
            return item; // Block going above stock
          }
          return { ...item, quantity: Math.max(1, newQty) };
        }
        return item;
      });
    });
  };

  const handleRemoveFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const totalCartAmount = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Place order checkout submission
  const handleCheckout = async (e: FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      setValidationError("請輸入訂購人姓名！");
      return;
    }
    if (deliveryMethod === "內用" && !tableOrNote.trim()) {
      setValidationError("內用請填寫桌號！");
      return;
    }
    if (deliveryMethod === "外帶" && !tableOrNote.trim()) {
      setValidationError("外帶請填寫取餐時間（例如：15分鐘後）！");
      return;
    }

    setValidationError("");
    setIsSubmitting(true);

    try {
      const orderedItems = cart.map(item => ({
        productId: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: item.quantity,
        sweetness: item.sweetness,
        ice: item.ice,
        subtotal: item.product.price * item.quantity
      }));

      const finalOrder = await dbService.placeOrder({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || undefined,
        deliveryMethod,
        tableOrNote: tableOrNote.trim(),
        items: orderedItems,
        totalAmount: totalCartAmount,
        notes: checkoutNotes.trim() || undefined
      });

      // Clear states
      setCart([]);
      setCustomerName("");
      setCustomerPhone("");
      setTableOrNote("");
      setCheckoutNotes("");
      setIsCartOpen(false);
      onOrderPlaced(finalOrder);
    } catch (err) {
      console.error(err);
      setValidationError("下單失敗，請稍後再試！");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper Navigation & Info Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-stone-100 p-4 rounded-xl border border-stone-200">
        <div>
          <h2 className="text-xl font-bold text-stone-900 tracking-tight font-sans">
            🍵 和風極上茶飲點單
          </h2>
          <p className="text-xs text-stone-500 mt-1">選用天然穀麥成分，追求純粹健康的完美配比</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {activeOrdersCount > 0 && (
            <button 
              onClick={onNavigateToTracking}
              className="flex-1 sm:flex-initial text-xs bg-amber-100 hover:bg-amber-200 text-amber-950 font-medium px-4 py-2.5 rounded-lg border border-amber-300 transition flex items-center justify-center gap-1.5"
            >
              <TrendingUp className="w-3.5 h-3.5 text-amber-800" />
              查看我的訂單 ({activeOrdersCount})
            </button>
          )}
          <button 
            onClick={() => setIsCartOpen(true)}
            className="flex-1 sm:flex-initial text-xs bg-stone-900 hover:bg-stone-800 text-stone-50 font-semibold px-4 py-2.5 rounded-lg transition flex items-center justify-center gap-2 relative shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            購物車 ({cart.reduce((sum, i) => sum + i.quantity, 0)})
            {cart.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-600 text-white font-bold w-5 h-5 rounded-full text-[10px] flex items-center justify-center animate-bounce">
                {cart.reduce((sum, i) => sum + i.quantity, 0)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Category List Tabs */}
      <div className="flex gap-1.5 border-b border-stone-200 pb-1 overflow-x-auto whitespace-nowrap scrollbar-none">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg transition-all duration-200 ${
              selectedCategory === cat
                ? "bg-stone-900 text-white font-bold shadow-sm"
                : "text-stone-600 hover:text-stone-900 hover:bg-stone-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Products Beverage Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredProducts.map(prod => {
            const isSoldOut = prod.stock !== null && prod.stock <= 0;
            const isLowStock = prod.stock !== null && prod.stock > 0 && prod.stock <= 5;
            
            return (
              <motion.div
                key={prod.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className={`bg-white rounded-xl overflow-hidden border border-stone-200 flex flex-col justify-between group transition-shadow hover:shadow-md ${
                  isSoldOut ? "opacity-75" : ""
                }`}
                id={`tea-item-${prod.id}`}
              >
                <div>
                  {/* Image container & overlay specs */}
                  <div className="relative h-44 overflow-hidden bg-stone-50">
                    <img 
                      src={prod.imageUrl} 
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {/* Dark gradient for specs text readable */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-stone-900/80 via-stone-900/30 to-transparent p-3 pt-6 flex justify-between items-end">
                      <span className="text-[10px] font-mono text-stone-200 bg-stone-900/60 backdrop-blur-xs py-0.5 px-2 rounded-full">
                        🔥 {prod.calories} kcal
                      </span>
                      <span className={`text-[10px] font-semibold py-0.5 px-2 rounded-full text-white ${
                        prod.caffeine === "無" ? "bg-green-600/80" : 
                        prod.caffeine === "低" ? "bg-amber-600/80" : "bg-red-600/80"
                      }`}>
                        ☕ 咖啡因: {prod.caffeine}
                      </span>
                    </div>
                    {/* Available temp options */}
                    <span className="absolute top-2 left-2 bg-stone-900/80 text-white backdrop-blur-xs text-[9px] font-bold px-2 py-0.5 rounded-md">
                      {prod.tempOption}
                    </span>
                    {/* Sold out overlay */}
                    {isSoldOut && (
                      <div className="absolute inset-0 bg-stone-900/65 backdrop-blur-xs flex items-center justify-center">
                        <div className="bg-red-600 text-white font-bold text-xs px-3.5 py-1.5 rounded-full shadow-lg tracking-wider">
                          已售完 (SOLD OUT)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-bold text-stone-900 text-base leading-snug group-hover:text-amber-800 transition">
                        {prod.name}
                      </h3>
                      <span className="font-bold text-stone-900 text-lg">
                        ${prod.price}
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed font-sans line-clamp-2">
                      {prod.description}
                    </p>
                    <div className="text-[10px] text-stone-400 flex items-center gap-1.5 pt-1">
                      <span>糖量安全規格: {prod.sugar}</span>
                    </div>
                  </div>
                </div>

                {/* Footer section (Interactive Buy Buttons) */}
                <div className="px-4 pb-4 pt-1">
                  {prod.stock !== null && (
                    <div className="mb-2.5 flex items-center justify-between text-xs">
                      <span className="text-stone-500">當日剩餘庫存:</span>
                      {isSoldOut ? (
                        <span className="text-red-600 font-bold">缺貨下架</span>
                      ) : isLowStock ? (
                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> 緊張! 僅餘 {prod.stock} 杯
                        </span>
                      ) : (
                        <span className="text-stone-600 font-medium">補給充足 ({prod.stock} 杯)</span>
                      )}
                    </div>
                  )}
                  {prod.stock === null && (
                    <div className="mb-2.5 flex items-center justify-between text-xs">
                      <span className="text-stone-500 font-sans">當日剩餘庫存:</span>
                      <span className="text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded">無限量供應</span>
                    </div>
                  )}

                  <button
                    onClick={() => handleOpenConfigure(prod)}
                    disabled={isSoldOut}
                    className={`w-full py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-2 ${
                      isSoldOut
                        ? "bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200"
                        : "bg-stone-900 hover:bg-stone-800 text-stone-50 shadow-xs"
                    }`}
                  >
                    {isSoldOut ? "今日完售" : "立刻點單"}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Configure Product Item Dialog Popup */}
      <AnimatePresence>
        {configuringProduct && (
          <div className="fixed inset-0 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl border border-stone-200 w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="p-4 bg-stone-100 border-b border-stone-200 flex justify-between items-center">
                <span className="text-xs bg-stone-900 text-white font-mono px-2 py-0.5 rounded-md">
                  {configuringProduct.category}
                </span>
                <button 
                  onClick={() => setConfiguringProduct(null)}
                  className="p-1 rounded-full text-stone-400 hover:text-stone-600 hover:bg-stone-200 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5 overflow-y-auto">
                <div>
                  <h3 className="text-lg font-bold text-stone-900 leading-tight">
                    {configuringProduct.name}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1">{configuringProduct.description}</p>
                </div>

                {/* Sweetness Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block flex justify-between items-center">
                    <span>甜度調整 (Sweetness)：</span>
                    {configuringProduct.sugar === "無" && (
                      <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        本茶品項推薦或預設無糖
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {SWEETNESS_OPTIONS.map(opt => {
                      const disabled = configuringProduct.sugar === "無" && opt !== "無糖";
                      return (
                        <button
                          key={opt}
                          onClick={() => !disabled && setSelectedSweetness(opt)}
                          disabled={disabled}
                          className={`py-2 text-xs rounded-lg border font-medium transition ${
                            disabled 
                              ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed line-through" 
                              : selectedSweetness === opt
                              ? "bg-stone-905 bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ice Selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-stone-700 block flex justify-between items-center">
                    <span>冰量調整 (Ice Level)：</span>
                    {configuringProduct.tempOption === "固定冰" && (
                      <span className="text-[10px] text-red-600 bg-red-50 px-2 py-0.5 rounded">
                        本品項為固定冰，不可去冰或熱
                      </span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {ICE_OPTIONS.map(opt => {
                      const disabled = configuringProduct.tempOption === "固定冰" && opt !== "正常冰" && opt !== "少冰";
                      return (
                        <button
                          key={opt}
                          onClick={() => !disabled && setSelectedIce(opt)}
                          disabled={disabled}
                          className={`py-2 text-xs rounded-lg border font-medium transition ${
                            disabled
                              ? "bg-stone-50 text-stone-300 border-stone-100 cursor-not-allowed line-through"
                              : selectedIce === opt
                              ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                              : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity Control Selector */}
                <div className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-150">
                  <span className="text-xs font-bold text-stone-700">選擇杯數：</span>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setCustomQuantity(prev => Math.max(1, prev - 1))}
                      className="p-1 rounded-full bg-stone-200 text-stone-700 hover:bg-stone-300 transition"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="font-bold text-stone-900 text-base w-6 text-center">{customQuantity}</span>
                    <button
                      onClick={() => {
                        const maxS = configuringProduct.stock;
                        if (maxS !== null && customQuantity >= maxS) return;
                        setCustomQuantity(prev => prev + 1);
                      }}
                      className="p-1 rounded-full bg-stone-200 text-stone-700 hover:bg-stone-300 transition"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {validationError && (
                  <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-start gap-1.5 leading-snug">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{validationError}</span>
                  </div>
                )}
              </div>

              {/* Pricing & submission button */}
              <div className="p-4 bg-stone-50 border-t border-stone-200 flex gap-3">
                <div className="text-left shrink-0">
                  <span className="text-[10px] text-stone-500 block">總計：</span>
                  <span className="text-xl font-bold text-stone-900">${configuringProduct.price * customQuantity}</span>
                </div>
                <button
                  onClick={handleAddToCart}
                  className="flex-1 bg-stone-900 hover:bg-stone-800 text-stone-50 font-bold py-2.5 rounded-xl text-xs transition shadow-sm"
                >
                  加入購物車
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Shopping Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-stone-950/40 backdrop-blur-xs" onClick={() => setIsCartOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-full flex">
              <motion.div 
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "tween", duration: 0.3 }}
                className="w-screen max-w-md bg-white border-l border-stone-200 flex flex-col shadow-2xl h-full"
              >
                {/* Header */}
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4.5 h-4.5 text-stone-900" />
                    <span className="font-bold text-stone-950 font-sans">我的點單購物車</span>
                  </div>
                  <button 
                    onClick={() => setIsCartOpen(false)}
                    className="p-1.5 rounded-full text-stone-500 hover:bg-stone-200 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Cart Drink List Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {cart.length === 0 ? (
                    <div className="h-44 flex flex-col items-center justify-center text-center text-stone-400 space-y-2 py-10">
                      <ShoppingBag className="w-10 h-10 text-stone-300 stroke-[1.5]" />
                      <p className="text-xs">尚無選擇品項。回去選幾杯好茶吧！</p>
                    </div>
                  ) : (
                    cart.map(item => (
                      <div 
                        key={item.id}
                        className="bg-stone-50 p-3 rounded-xl border border-stone-250 flex justify-between gap-3 relative overflow-hidden"
                      >
                        <div className="space-y-1.5">
                          <h4 className="font-semibold text-stone-900 text-sm leading-tight leading-snug">
                            {item.product.name}
                          </h4>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] bg-white text-stone-600 px-1.5 py-0.5 rounded border border-stone-150">
                              {item.sweetness}
                            </span>
                            <span className="text-[10px] bg-white text-stone-600 px-1.5 py-0.5 rounded border border-stone-150">
                              {item.ice}
                            </span>
                            <span className="text-[10px] bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded font-mono">
                              單價: ${item.product.price}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col justify-between items-end shrink-0">
                          <button 
                            onClick={() => handleRemoveFromCart(item.id)}
                            className="p-1 text-stone-400 hover:text-red-600 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          
                          <div className="flex items-center gap-2.5 bg-white px-2 py-1 rounded-lg border border-stone-200 mt-2">
                            <button
                              onClick={() => handleUpdateCartQty(item.id, -1)}
                              className="text-stone-500 hover:text-stone-900 transition"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="font-bold text-stone-900 text-xs w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateCartQty(item.id, 1)}
                              className="text-stone-500 hover:text-stone-900 transition"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Checkout Form (only if items exist) */}
                  {cart.length > 0 && (
                    <form onSubmit={handleCheckout} className="border-t border-stone-200 pt-5 space-y-4">
                      <h4 className="font-bold text-stone-900 text-sm font-sans">📋 顧客資訊確認</h4>
                      
                      <div className="grid grid-cols-2 gap-3">
                        {DELIVERY_METHODS.map(method => (
                          <button
                            key={method}
                            type="button"
                            onClick={() => {
                              setDeliveryMethod(method);
                              setTableOrNote("");
                            }}
                            className={`py-2 text-xs rounded-lg border font-semibold transition ${
                              deliveryMethod === method
                                ? "bg-stone-900 text-white border-stone-900 shadow-sm"
                                : "bg-white text-stone-600 border-stone-200 hover:border-stone-400"
                            }`}
                          >
                            {method}
                          </button>
                        ))}
                      </div>

                      <div className="space-y-3.5">
                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">訂購姓名：</label>
                          <input 
                            type="text" 
                            required
                            placeholder="請輸入姓名 如：王先生"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:outline-none focus:border-stone-500 bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">聯絡電話（選填）：</label>
                          <input 
                            type="tel" 
                            placeholder="請輸入電話 如：0912-345678"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:outline-none focus:border-stone-500 bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">
                            {deliveryMethod === "內用" ? "桌號：" : "預計外帶取餐時間："}
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder={deliveryMethod === "內用" ? "請填寫桌號 如：桌號 3" : "請填寫取餐細節 如：15分鐘後取、18:30抵達"}
                            value={tableOrNote}
                            onChange={(e) => setTableOrNote(e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:outline-none focus:border-stone-500 bg-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-xs font-bold text-stone-700 block">額外備註（選填）：</label>
                          <textarea 
                            placeholder="如需少冰、袋子等請在此說明..."
                            value={checkoutNotes}
                            onChange={(e) => setCheckoutNotes(e.target.value)}
                            className="w-full text-xs border border-stone-300 rounded-lg p-2.5 focus:outline-none focus:border-stone-500 bg-white h-16 resize-none"
                          />
                        </div>
                      </div>

                      {validationError && (
                        <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg flex items-start gap-1.5 leading-snug">
                          <AlertTriangle className="w-4 h-4 shrink-0" />
                          <span>{validationError}</span>
                        </div>
                      )}
                    </form>
                  )}
                </div>

                {/* Footer Checkouts info */}
                {cart.length > 0 && (
                  <div className="p-4 bg-stone-50 border-t border-stone-200">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs text-stone-600 font-sans">結帳總金額：</span>
                      <span className="text-2xl font-bold font-mono text-stone-900">${totalCartAmount}</span>
                    </div>
                    
                    <button
                      onClick={handleCheckout}
                      disabled={isSubmitting}
                      className="w-full bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-stone-50 font-bold py-3 rounded-xl text-xs transition shadow-sm flex items-center justify-center gap-1.5"
                    >
                      {isSubmitting ? (
                        <>正在發出訂單...</>
                      ) : (
                        <>
                          <Check className="w-4 h-4" /> 確認送出點單
                        </>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
