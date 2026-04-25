import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import {
  Users, MagnifyingGlass, CaretLeft, CaretRight, Phone, Envelope, ShoppingCart
} from "@phosphor-icons/react";

export default function CustomersView() {
  const { api } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 20 };
      if (search) params.search = search;
      const res = await api().get("/customers", { params });
      setCustomers(res.data.customers);
      setTotalPages(res.data.pages);
    } catch (err) {
      console.error("Failed to load customers", err);
    } finally {
      setLoading(false);
    }
  }, [api, page, search]);

  useEffect(() => { load(); }, [load]);

  const fmt = (v) => Number(v).toFixed(2);

  return (
    <div className="p-6 h-full overflow-y-auto" data-testid="customers-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#2C1E16] mb-1" style={{ fontFamily: 'Outfit' }}>Customers</h2>
        <p className="text-sm text-[#8A7969]">Customers are automatically created from orders</p>
      </div>

      <div className="relative max-w-sm mb-5">
        <MagnifyingGlass size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A7969]" />
        <input
          data-testid="customers-search"
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-[#EAE5D9] text-[#2C1E16] rounded-xl focus:ring-2 focus:ring-[#D97757]/20 focus:border-[#D97757] transition-all outline-none text-sm"
          placeholder="Search customers..."
        />
      </div>

      <div className="bg-white border border-[#EAE5D9] rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#EAE5D9]">
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Customer</th>
              <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Phone</th>
              <th className="text-center px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Orders</th>
              <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i} className="border-b border-[#EAE5D9]">
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-32 animate-pulse" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-24 animate-pulse" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-12 animate-pulse mx-auto" /></td>
                  <td className="px-5 py-3"><div className="h-4 bg-[#F4F1EA] rounded w-20 animate-pulse ml-auto" /></td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={4} className="text-center py-12 text-[#8A7969]">
                  <Users size={40} weight="duotone" className="mx-auto mb-3 opacity-30" />
                  <p>No customers yet</p>
                  <p className="text-xs mt-1">Customers are created when you add phone numbers to orders</p>
                </td>
              </tr>
            ) : (
              customers.map(customer => (
                <tr key={customer.id} className="border-b border-[#EAE5D9] hover:bg-[#FDFBF7] transition-colors" data-testid={`customer-row-${customer.id.slice(0, 8)}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#F4F1EA] flex items-center justify-center text-xs font-bold text-[#5C4A3D]">
                        {customer.name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-[#2C1E16]">{customer.name}</p>
                        {customer.email && <p className="text-xs text-[#8A7969] flex items-center gap-1"><Envelope size={12} />{customer.email}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-sm text-[#5C4A3D] flex items-center gap-1">
                      <Phone size={14} className="text-[#8A7969]" />
                      {customer.phone}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-center">
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-[#5C4A3D]">
                      <ShoppingCart size={14} className="text-[#8A7969]" />
                      {customer.total_orders}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right font-semibold text-sm text-[#2C1E16]" style={{ fontFamily: 'JetBrains Mono' }}>
                    &#8377;{fmt(customer.total_spent)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="p-2 rounded-lg border border-[#EAE5D9] text-[#5C4A3D] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors">
            <CaretLeft size={18} />
          </button>
          <span className="text-sm text-[#5C4A3D]">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="p-2 rounded-lg border border-[#EAE5D9] text-[#5C4A3D] hover:bg-[#F4F1EA] disabled:opacity-30 transition-colors">
            <CaretRight size={18} />
          </button>
        </div>
      )}
    </div>
  );
}
