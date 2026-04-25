import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import {
  Coffee, CookingPot, Plus, Minus, Trash, ShoppingCart,
  Receipt, MagnifyingGlass, X, Printer, Phone, UserCircle
} from "@phosphor-icons/react";

const TAX_RATE = 0.12;

export default function POSPage() {
  const { api } = useAuth();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [showInvoice, setShowInvoice] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProducts = useCallback(async () => {
    try {
      const params = { limit: 100 };
      if (category !== "all") params.category = category;
      if (search) params.search = search;
      const res = await api().get("/products", { params });
      setProducts(res.data.products.filter(p => p.available));
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  }, [api, category, search]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        return prev.map(i => i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, qty: 1 }];
    });
  };

  const updateQty = (productId, delta) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.product_id === productId) {
          const newQty = i.qty + delta;
          return newQty > 0 ? { ...i, qty: newQty } : null;
        }
        return i;
      }).filter(Boolean);
    });
  };

  const removeItem = (productId) => {
    setCart(prev => prev.filter(i => i.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setCustomerPhone("");
    setCustomerName("");
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
  const total = Math.round((subtotal + tax) * 100) / 100;
  const totalItems = cart.reduce((sum, i) => sum + i.qty, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    try {
      const orderData = {
        items: cart.map(i => ({ ...i })),
        customer_phone: customerPhone,
        customer_name: customerName,
        payment_method: "cash"
      };
      const res = await api().post("/orders", orderData);
      // Set order and show modal first, then clear cart after a tick
      setLastOrder(res.data);
      setShowInvoice(true);
      setTimeout(() => {
        setCart([]);
        setCustomerPhone("");
        setCustomerName("");
      }, 100);
    } catch (err) {
      console.error("Checkout failed", err);
      alert("Checkout failed. Please try again.");
    }
  };

  const fmt = (v) => v.toFixed(2);

  return (
    <div className="flex h-full" data-testid="pos-page">
      {/* Menu Area */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#2C1E16] mb-1" style={{ fontFamily: 'Outfit' }}>Menu</h2>
          <p className="text-sm text-[#8A7969]">Select items to add to cart</p>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
            <input
              data-testid="product-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm"
              placeholder="Search menu..."
            />
          </div>
          <div className="flex gap-2">
            {[
              { key: "all", label: "All", icon: null },
              { key: "coffee", label: "Coffee", icon: Coffee },
              { key: "food", label: "Food", icon: CookingPot },
            ].map(cat => (
              <button
                key={cat.key}
                data-testid={`filter-${cat.key}`}
                onClick={() => setCategory(cat.key)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  category === cat.key
                    ? "bg-[#D97757] text-white shadow-sm"
                    : "bg-[#F4F1EA] text-[#5C4A3D] hover:bg-[#EAE5D9]"
                }`}
              >
                {cat.icon && <cat.icon size={16} weight="duotone" />}
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white border border-[#EAE5D9] rounded-2xl p-4 animate-pulse">
                  <div className="w-14 h-14 rounded-xl bg-[#F4F1EA] mb-3" />
                  <div className="h-4 bg-[#F4F1EA] rounded mb-2 w-3/4" />
                  <div className="h-3 bg-[#F4F1EA] rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 stagger-children">
              {products.map(product => {
                const inCart = cart.find(i => i.product_id === product.id);
                return (
                  <button
                    key={product.id}
                    data-testid={`product-card-${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => addToCart(product)}
                    className={`text-left bg-white border rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md cursor-pointer active:scale-[0.97] animate-fadeIn ${
                      inCart ? "border-[#D97757] shadow-sm" : "border-[#EAE5D9]"
                    }`}
                  >
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-lg mb-3 ${
                      product.category === "coffee"
                        ? "bg-gradient-to-br from-[#D97757] to-[#BF6245]"
                        : "bg-gradient-to-br from-[#7A8A70] to-[#5f7056]"
                    }`}>
                      {product.category === "coffee" ? <Coffee size={28} weight="duotone" /> : <CookingPot size={28} weight="duotone" />}
                    </div>
                    <h3 className="font-semibold text-[#2C1E16] text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-[#8A7969] mb-2 line-clamp-1">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#D97757]" style={{ fontFamily: 'JetBrains Mono' }}>
                        &#8377;{fmt(product.price)}
                      </span>
                      {inCart && (
                        <span className="text-xs bg-[#D97757] text-white px-2 py-0.5 rounded-full font-bold">
                          {inCart.qty}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {!loading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center h-48 text-[#8A7969]">
              <Coffee size={48} weight="duotone" className="mb-3 opacity-30" />
              <p>No products found</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart Sidebar */}
      <div className="w-[380px] bg-white border-l border-[#EAE5D9] flex flex-col h-full shadow-[-4px_0_24px_rgba(0,0,0,0.02)]" data-testid="cart-sidebar">
        <div className="p-5 border-b border-[#EAE5D9]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingCart size={22} weight="duotone" className="text-[#D97757]" />
              <h3 className="font-bold text-[#2C1E16] text-lg" style={{ fontFamily: 'Outfit' }}>Cart</h3>
              {totalItems > 0 && (
                <span className="bg-[#D97757] text-white text-xs font-bold px-2 py-0.5 rounded-full">{totalItems}</span>
              )}
            </div>
            {cart.length > 0 && (
              <button
                data-testid="clear-cart-btn"
                onClick={clearCart}
                className="text-xs text-[#C95A49] hover:text-[#a0443a] font-medium transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="px-5 py-3 border-b border-[#EAE5D9] space-y-2">
          <div className="relative">
            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
            <input
              data-testid="customer-phone-input"
              type="text"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FDFBF7] border border-[#EAE5D9] rounded-lg text-sm text-[#2C1E16] focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none"
              placeholder="Customer phone"
              maxLength={10}
            />
          </div>
          <div className="relative">
            <UserCircle size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
            <input
              data-testid="customer-name-input"
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#FDFBF7] border border-[#EAE5D9] rounded-lg text-sm text-[#2C1E16] focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none"
              placeholder="Customer name"
            />
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[#8A7969]">
              <ShoppingCart size={48} weight="duotone" className="mb-3 opacity-20" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs mt-1">Tap items to add them</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product_id} className="flex items-center gap-3 p-3 rounded-xl bg-[#FDFBF7] border border-[#EAE5D9] animate-scaleIn" data-testid={`cart-item-${item.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[#2C1E16] truncate">{item.name}</p>
                  <p className="text-xs text-[#8A7969]" style={{ fontFamily: 'JetBrains Mono' }}>&#8377;{fmt(item.price)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    data-testid={`cart-decrease-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => updateQty(item.product_id, -1)}
                    className="w-7 h-7 rounded-lg border border-[#EAE5D9] flex items-center justify-center text-[#5C4A3D] hover:bg-[#F4F1EA] transition-colors"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="text-sm font-bold text-[#2C1E16] w-6 text-center" style={{ fontFamily: 'JetBrains Mono' }}>{item.qty}</span>
                  <button
                    data-testid={`cart-increase-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => updateQty(item.product_id, 1)}
                    className="w-7 h-7 rounded-lg border border-[#EAE5D9] flex items-center justify-center text-[#5C4A3D] hover:bg-[#F4F1EA] transition-colors"
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    data-testid={`cart-remove-${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                    onClick={() => removeItem(item.product_id)}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-[#C95A49] hover:bg-[#C95A49]/10 transition-colors ml-1"
                  >
                    <Trash size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="p-5 pb-8 border-t border-[#EAE5D9] bg-[#FDFBF7]">
          <div className="space-y-2 mb-4" style={{ fontFamily: 'JetBrains Mono' }}>
            <div className="flex justify-between text-sm text-[#8A7969]">
              <span>Subtotal</span>
              <span>&#8377;{fmt(subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-[#8A7969]">
              <span>GST (12%)</span>
              <span>&#8377;{fmt(tax)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-[#2C1E16] pt-2 border-t border-[#EAE5D9]">
              <span>Total</span>
              <span>&#8377;{fmt(total)}</span>
            </div>
          </div>
          <button
            data-testid="checkout-btn"
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className="w-full py-3 bg-[#D97757] text-white hover:bg-[#BF6245] transition-all rounded-xl font-semibold text-base disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Receipt size={20} weight="duotone" />
            Checkout &#8377;{fmt(total)}
          </button>
        </div>
      </div>

      {/* Invoice Modal */}
      {showInvoice && lastOrder && (
        <div className="fixed inset-0 bg-[#2C1E16]/40 flex items-center justify-center p-6 z-50" data-testid="invoice-modal">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-[0_8px_32px_rgba(44,30,22,0.12)] animate-scaleIn overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[#EAE5D9]">
              <h3 className="font-bold text-lg text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>Invoice</h3>
              <div className="flex gap-2">
                <button
                  data-testid="print-invoice-btn"
                  onClick={() => window.print()}
                  className="p-2 rounded-lg hover:bg-[#F4F1EA] text-[#5C4A3D] transition-colors"
                >
                  <Printer size={20} />
                </button>
                <button
                  data-testid="close-invoice-btn"
                  onClick={() => setShowInvoice(false)}
                  className="p-2 rounded-lg hover:bg-[#F4F1EA] text-[#5C4A3D] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="p-6 print-area invoice-print">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="text-xl font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>Surya Coffee Shop</h4>
                  <p className="text-xs text-[#8A7969] mt-1">Near Central Market, Chennai</p>
                  <p className="text-xs text-[#8A7969]">Tamil Nadu, India</p>
                  <p className="text-xs text-[#8A7969]">Phone: +91 6282787553</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#8A7969]">Invoice #{lastOrder.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-[#8A7969]">{new Date(lastOrder.created_at).toLocaleString()}</p>
                  <p className="text-xs text-[#8A7969]">Payment: {lastOrder.payment_method}</p>
                  {lastOrder.customer_name && <p className="text-xs text-[#8A7969] mt-1">Customer: {lastOrder.customer_name}</p>}
                  {lastOrder.customer_phone && <p className="text-xs text-[#8A7969]">Phone: {lastOrder.customer_phone}</p>}
                </div>
              </div>
              <table>
                <thead>
                  <tr>
                    <th className="text-left">Item</th>
                    <th className="text-center">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lastOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="text-sm text-[#2C1E16]">{item.name}</td>
                      <td className="text-sm text-center text-[#5C4A3D]">{item.qty}</td>
                      <td className="text-sm text-right text-[#5C4A3D]" style={{ fontFamily: 'JetBrains Mono' }}>&#8377;{fmt(item.price)}</td>
                      <td className="text-sm text-right font-semibold text-[#2C1E16]" style={{ fontFamily: 'JetBrains Mono' }}>&#8377;{fmt(item.price * item.qty)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-4 border-t border-[#EAE5D9] space-y-1" style={{ fontFamily: 'JetBrains Mono' }}>
                <div className="flex justify-between text-sm text-[#8A7969]">
                  <span>Subtotal</span><span>&#8377;{fmt(lastOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm text-[#8A7969]">
                  <span>GST (12%)</span><span>&#8377;{fmt(lastOrder.tax)}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#2C1E16] pt-2 border-t border-[#EAE5D9]">
                  <span>Total</span><span>&#8377;{fmt(lastOrder.total)}</span>
                </div>
              </div>
              <div className="mt-6 pt-4 border-t border-dashed border-[#EAE5D9] text-center">
                <p className="text-xs text-[#8A7969]">Thank you for visiting Surya Coffee Shop!</p>
                <p className="text-[10px] text-[#8A7969] mt-1">www.suryacoffee.in</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
