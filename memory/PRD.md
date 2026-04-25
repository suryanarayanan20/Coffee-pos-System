# Surya Coffee POS System - PRD

## Original Problem Statement
Build a production-ready Coffee Shop POS System backend for an existing HTML/CSS/JS frontend (https://github.com/suryanarayanan20/coffee-pos-system). The original frontend is a simple POS for "Surya Coffee Shop" in Chennai, Tamil Nadu with coffee/food menus, cart, checkout, invoice generation, and order history. Recreate as a full-stack application with JWT auth, role-based authorization, CRUD operations, and proper architecture.

## Architecture
- **Frontend**: React 19 + Tailwind CSS + Radix UI + Phosphor Icons
- **Backend**: FastAPI (Python) with Motor (async MongoDB driver)
- **Database**: MongoDB
- **Auth**: JWT + BCrypt password hashing
- **Design**: Organic & Earthy theme (Outfit/Manrope fonts, Terracotta/Espresso palette)

## User Personas
1. **Admin** - Full access: POS, orders, dashboard, product management, customer management
2. **Staff** - POS access: create orders, view order history

## Core Requirements
- JWT-based authentication with BCrypt password hashing
- Role-based authorization (Admin/Staff)
- Product management (CRUD) with categories (coffee/food)
- Order creation with line items, GST 12% tax
- Customer auto-creation from order phone numbers
- Dashboard with real-time stats
- Invoice generation with print support
- Pagination, filtering, sorting on all lists

## What's Been Implemented (March 26, 2026)
### Backend (FastAPI)
- [x] JWT authentication (login/register)
- [x] Role-based authorization (admin/staff)
- [x] Products CRUD with pagination, filtering, sorting
- [x] Orders CRUD with tax calculation (12% GST)
- [x] Customers auto-creation and management
- [x] Dashboard stats (today's revenue, orders, top products)
- [x] Seed data (18 products, 2 default users)
- [x] MongoDB indexes for performance
- [x] Input validation with Pydantic

### Frontend (React)
- [x] Login/Register page with hero image
- [x] POS page with product grid + cart sidebar
- [x] Category filters (All/Coffee/Food) and search
- [x] Cart with qty management (+/-/remove/clear)
- [x] Checkout with invoice modal
- [x] Order history with detail sidebar
- [x] Admin dashboard with stat cards
- [x] Admin products management (add/edit/delete)
- [x] Admin customers list
- [x] Sidebar navigation
- [x] Responsive design with warm earthy palette

### Default Accounts
- Admin: admin@surya.coffee / admin123
- Staff: staff@surya.coffee / staff123

## Testing Results
- Backend: 100% (35/35 tests passed)
- Frontend: 95% (minor overlay issue with platform badge, not a code bug)

## Prioritized Backlog
### P0 (Critical) - All Done
- All core features implemented

### P1 (High)
- [ ] Order status management (pending/completed/cancelled)
- [ ] Payment method selection (cash/card/UPI)
- [ ] Product images upload
- [ ] Export orders as CSV/PDF

### P2 (Medium)
- [ ] Real-time order notifications
- [ ] Daily/weekly/monthly sales reports with charts
- [ ] Inventory management
- [ ] Discount/coupon system
- [ ] Multi-branch support

### P3 (Low)
- [ ] Customer loyalty program
- [ ] Kitchen display system
- [ ] Barcode/QR code scanning
- [ ] Email receipts to customers

## Next Tasks
1. Add payment method selection (Cash/Card/UPI)
2. Add order status management
3. Add sales reports with charts (using Recharts)
4. Add product image support
