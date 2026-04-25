import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import {
  Receipt, MagnifyingGlass, X, Printer, CaretLeft, CaretRight, Eye
} from "@phosphor-icons/react";

export default function OrdersPage() {
  const { api } = useAuth();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const loadOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 15 };
      if (search) params.search = search;
      const res = await api().get("/orders", { params });
      setOrders(res.data.orders);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  }, [api, page, search]);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const fmt = (v) => Number(v).toFixed(2);

  return (
    <div className="flex h-full" data-testid="orders-page">
      {/* Orders List */}
      <div className="flex-1 flex flex-col overflow-hidden p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#2C1E16] mb-1" style={{ fontFamily: 'Outfit' }}>Order History</h2>
          <p className="text-sm text-[#8A7969]">View and manage past orders</p>
        </div>

        <div className="relative max-w-sm mb-5">
          <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
          <input
            data-testid="order-search"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm"
            placeholder="Search by customer name, phone, or order ID..."
          />
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white border border-[#EAE5D9] rounded-2xl p-4 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="h-4 bg-[#F4F1EA] rounded w-32" />
                    <div className="h-4 bg-[#F4F1EA] rounded w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-[#8A7969]">
              <Receipt size={48} weight="duotone" className="mb-3 opacity-30" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-3 stagger-children">
              {orders.map(order => (
                <button
                  key={order.id}
                  data-testid={`order-row-${order.id.slice(0, 8)}`}
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left bg-white border border-[#EAE5D9] rounded-2xl p-4 hover:border-[#D97757] hover:shadow-sm transition-all duration-200 cursor-pointer animate-fadeIn"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#D97757]/10 flex items-center justify-center">
                        <Receipt size={20} weight="duotone" className="text-[#D97757]" />
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#2C1E16]">#{order.id.slice(0, 8).toUpperCase()}</p>
                        <p className="text-xs text-[#8A7969]">{new Date(order.created_at).toLocaleString()}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#D97757]" style={{ fontFamily: 'JetBrains Mono' }}>&#8377;{fmt(order.total)}</p>
                      <p className="text-xs text-[#8A7969]">{order.items.length} item(s)</p>
                    </div>
                  </div>
                  {(order.customer_name || order.customer_phone) && (
                    <div className="flex items-center gap-2 text-xs text-[#8A7969] mt-2 pt-2 border-t border-[#EAE5D9]">
                      {order.customer_name && <span>{order.customer_name}</span>}
                      {order.customer_phone && <span>| {order.customer_phone}</span>}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-4 border-t border-[#EAE5D9] mt-4">
            <button
              data-testid="orders-prev-page"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 rounded-lg border border-[#EAE5D9] text-[#5C4A3D] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors"
            >
              <CaretLeft size={18} />
            </button>
            <span className="text-sm text-[#5C4A3D]">Page {page} of {totalPages}</span>
            <button
              data-testid="orders-next-page"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 rounded-lg border border-[#EAE5D9] text-[#5C4A3D] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors"
            >
              <CaretRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Order Detail Sidebar */}
      {selectedOrder && (
        <div className="w-[420px] bg-white border-l border-[#EAE5D9] flex flex-col h-full shadow-[-4px_0_24px_rgba(0,0,0,0.02)]" data-testid="order-detail-panel">
          <div className="flex items-center justify-between p-5 border-b border-[#EAE5D9]">
            <h3 className="font-bold text-lg text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>Order Details</h3>
            <div className="flex gap-2">
              <button
                data-testid="order-detail-print"
                onClick={() => window.print()}
                className="p-2 rounded-lg hover:bg-[#F4F1EA] text-[#5C4A3D] transition-colors"
              >
                <Printer size={18} />
              </button>
              <button
                data-testid="order-detail-close"
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg hover:bg-[#F4F1EA] text-[#5C4A3D] transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-5 print-area invoice-print">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-lg font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>Surya Coffee Shop</h4>
                <p className="text-xs text-[#8A7969] mt-1">Near Central Market, Chennai</p>
                <p className="text-xs text-[#8A7969]">Tamil Nadu, India</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#8A7969]">#{selectedOrder.id.slice(0, 8).toUpperCase()}</p>
                <p className="text-xs text-[#8A7969]">{new Date(selectedOrder.created_at).toLocaleString()}</p>
              </div>
            </div>

            {(selectedOrder.customer_name || selectedOrder.customer_phone) && (
              <div className="mb-4 p-3 rounded-xl bg-[#FDFBF7] border border-[#EAE5D9]">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969] mb-1">Customer</p>
                {selectedOrder.customer_name && <p className="text-sm text-[#2C1E16]">{selectedOrder.customer_name}</p>}
                {selectedOrder.customer_phone && <p className="text-xs text-[#8A7969]">{selectedOrder.customer_phone}</p>}
              </div>
            )}

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
                {selectedOrder.items.map((item, i) => (
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
                <span>Subtotal</span><span>&#8377;{fmt(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-[#8A7969]">
                <span>GST (12%)</span><span>&#8377;{fmt(selectedOrder.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-[#2C1E16] pt-2 border-t border-[#EAE5D9]">
                <span>Total</span><span>&#8377;{fmt(selectedOrder.total)}</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-dashed border-[#EAE5D9]">
              <p className="text-xs text-[#8A7969]">Payment: {selectedOrder.payment_method}</p>
              <p className="text-xs text-[#8A7969]">Status: {selectedOrder.status}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
