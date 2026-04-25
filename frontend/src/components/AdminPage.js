import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardView from "@/components/admin/DashboardView";
import ProductsView from "@/components/admin/ProductsView";
import CustomersView from "@/components/admin/CustomersView";

export default function AdminPage() {
  return (
    <div className="h-full overflow-hidden" data-testid="admin-page">
      <Routes>
        <Route index element={<DashboardView />} />
        <Route path="products" element={<ProductsView />} />
        <Route path="customers" element={<CustomersView />} />
        <Route path="*" element={<Navigate to="/admin" />} />
      </Routes>
    </div>
  );
}
