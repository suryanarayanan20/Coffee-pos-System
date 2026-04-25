import React from "react";
import { useAuth } from "@/App";
import {
  Coffee, ClockCounterClockwise, ChartBar, SignOut, Storefront, Users
} from "@phosphor-icons/react";

export default function Sidebar({ currentPath, onNavigate }) {
  const { user, logout } = useAuth();

  const navItems = [
    { path: "/", label: "POS", icon: Storefront },
    { path: "/orders", label: "Orders", icon: ClockCounterClockwise },
  ];

  if (user?.role === "admin") {
    navItems.push(
      { path: "/admin", label: "Dashboard", icon: ChartBar },
      { path: "/admin/products", label: "Products", icon: Coffee },
      { path: "/admin/customers", label: "Customers", icon: Users },
    );
  }

  const isActive = (path) => {
    if (path === "/") return currentPath === "/";
    return currentPath.startsWith(path);
  };

  return (
    <div className="w-[220px] bg-white border-r border-[#EAE5D9] flex flex-col h-full shrink-0" data-testid="sidebar">
      {/* Brand */}
      <div className="p-5 border-b border-[#EAE5D9]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D97757] flex items-center justify-center shrink-0">
            <Coffee size={22} weight="duotone" className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-[#2C1E16] truncate" style={{ fontFamily: 'Outfit' }}>Surya Coffee</h1>
            <p className="text-[10px] text-[#8A7969] uppercase tracking-wider">POS System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          return (
            <button
              key={item.path}
              data-testid={`nav-${item.label.toLowerCase()}`}
              onClick={() => onNavigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active
                  ? "bg-[#D97757]/10 text-[#D97757]"
                  : "text-[#5C4A3D] hover:bg-[#F4F1EA] hover:text-[#2C1E16]"
              }`}
            >
              <Icon size={20} weight={active ? "duotone" : "regular"} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="p-4 border-t border-[#EAE5D9]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-[#F4F1EA] flex items-center justify-center text-xs font-bold text-[#5C4A3D]">
            {user?.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-[#2C1E16] truncate">{user?.name}</p>
            <p className="text-[10px] text-[#8A7969] uppercase tracking-wider">{user?.role}</p>
          </div>
        </div>
        <button
          data-testid="logout-btn"
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-[#5C4A3D] hover:bg-[#F4F1EA] hover:text-[#C95A49] transition-all"
        >
          <SignOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
