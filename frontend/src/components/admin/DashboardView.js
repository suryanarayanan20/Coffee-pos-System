import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/App";
import {
  ChartBar, ShoppingCart, Coffee, Users, CurrencyInr, TrendUp, Receipt
} from "@phosphor-icons/react";

export default function DashboardView() {
  const { api } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await api().get("/dashboard/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => { load(); }, [load]);

  const fmt = (v) => Number(v).toFixed(2);

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white border border-[#EAE5D9] rounded-2xl p-5 animate-pulse">
              <div className="h-4 bg-[#F4F1EA] rounded w-24 mb-3" />
              <div className="h-8 bg-[#F4F1EA] rounded w-32" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Revenue", value: `₹${fmt(stats?.today_revenue || 0)}`, icon: CurrencyInr, color: "#D97757", bg: "#D97757" },
    { label: "Today's Orders", value: stats?.today_orders || 0, icon: ShoppingCart, color: "#7A8A70", bg: "#7A8A70" },
    { label: "Total Products", value: stats?.total_products || 0, icon: Coffee, color: "#6B8EAD", bg: "#6B8EAD" },
    { label: "Total Customers", value: stats?.total_customers || 0, icon: Users, color: "#E6A23C", bg: "#E6A23C" },
  ];

  return (
    <div className="p-6 h-full overflow-y-auto" data-testid="dashboard-view">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#2C1E16] mb-1" style={{ fontFamily: 'Outfit' }}>Dashboard</h2>
        <p className="text-sm text-[#8A7969]">Overview of your coffee shop</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8 stagger-children">
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white border border-[#EAE5D9] rounded-2xl p-5 animate-fadeIn" data-testid={`stat-card-${i}`}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8A7969]">{card.label}</p>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${card.bg}15` }}>
                  <Icon size={20} weight="duotone" style={{ color: card.color }} />
                </div>
              </div>
              <p className="text-2xl font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white border border-[#EAE5D9] rounded-2xl p-5" data-testid="top-products-card">
          <div className="flex items-center gap-2 mb-4">
            <TrendUp size={20} weight="duotone" className="text-[#D97757]" />
            <h3 className="font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>Top Products</h3>
          </div>
          {stats?.top_products?.length > 0 ? (
            <div className="space-y-3">
              {stats.top_products.map((p, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#FDFBF7]">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-full bg-[#D97757]/10 flex items-center justify-center text-xs font-bold text-[#D97757]">{i + 1}</span>
                    <span className="text-sm font-medium text-[#2C1E16]">{p.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#2C1E16]" style={{ fontFamily: 'JetBrains Mono' }}>&#8377;{fmt(p.revenue)}</p>
                    <p className="text-xs text-[#8A7969]">{p.qty} sold</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8A7969] text-center py-6">No sales data yet</p>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-white border border-[#EAE5D9] rounded-2xl p-5" data-testid="recent-orders-card">
          <div className="flex items-center gap-2 mb-4">
            <Receipt size={20} weight="duotone" className="text-[#D97757]" />
            <h3 className="font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>Recent Orders</h3>
          </div>
          {stats?.recent_orders?.length > 0 ? (
            <div className="space-y-3">
              {stats.recent_orders.map((order, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#FDFBF7]">
                  <div>
                    <p className="text-sm font-medium text-[#2C1E16]">#{order.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-[#8A7969]">{new Date(order.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#D97757]" style={{ fontFamily: 'JetBrains Mono' }}>&#8377;{fmt(order.total)}</p>
                    <p className="text-xs text-[#8A7969]">{order.items.length} items</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#8A7969] text-center py-6">No orders yet</p>
          )}
        </div>
      </div>

      {/* Lifetime Stats */}
      <div className="mt-6 bg-white border border-[#EAE5D9] rounded-2xl p-5" data-testid="lifetime-stats">
        <h3 className="font-bold text-[#2C1E16] mb-4" style={{ fontFamily: 'Outfit' }}>Lifetime Statistics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-[#FDFBF7]">
            <p className="text-xs text-[#8A7969] mb-1">Total Revenue</p>
            <p className="text-lg font-bold text-[#2C1E16]" style={{ fontFamily: 'JetBrains Mono' }}>&#8377;{fmt(stats?.total_revenue || 0)}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FDFBF7]">
            <p className="text-xs text-[#8A7969] mb-1">Total Orders</p>
            <p className="text-lg font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>{stats?.total_orders || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FDFBF7]">
            <p className="text-xs text-[#8A7969] mb-1">Total Products</p>
            <p className="text-lg font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>{stats?.total_products || 0}</p>
          </div>
          <div className="p-3 rounded-xl bg-[#FDFBF7]">
            <p className="text-xs text-[#8A7969] mb-1">Total Customers</p>
            <p className="text-lg font-bold text-[#2C1E16]" style={{ fontFamily: 'Outfit' }}>{stats?.total_customers || 0}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
