# Orderly - Product Requirements Document

## Original Problem Statement
Build a production-ready SaaS web app called "Orderly" for small Instagram and WhatsApp sellers. Helps sellers manage customers, track orders, and set follow-ups.

## Architecture
- Frontend: React 19 + Tailwind CSS + Shadcn/UI
- Backend: FastAPI + MongoDB (Motor async driver)
- Auth: JWT (httpOnly cookies) + bcrypt

## User Personas
- Small Instagram/WhatsApp sellers who lose track of orders in chat messages
- Non-technical users who need simple, fast workflows

## Core Requirements (Static)
1. Email/password authentication (JWT)
2. Customer CRUD (name, phone, notes, tags)
3. Order management (product, amount, status: New/Paid/Shipped)
4. Reminder system (date/time, due today view)
5. Dashboard (stats, recent orders, today reminders)
6. Mobile responsive SaaS UI

## What's Been Implemented (2026-03-31)
- Full backend: Auth, Customers, Orders, Reminders, Dashboard APIs
- Full frontend: Login, Dashboard, Customers, Orders, Reminders pages
- Deep blue sidebar, Outfit/Inter fonts, Shadcn UI components
- Seed data (5 customers, 6 orders, 4 reminders)
- Admin account: admin@orderly.com / admin123
- 100% test pass rate (backend + frontend)

## Prioritized Backlog
### P0 (Critical) - Done
- [x] Authentication flow
- [x] Customer CRUD
- [x] Order CRUD
- [x] Reminder CRUD
- [x] Dashboard stats

### P1 (Important)
- [ ] Search/filter on all pages
- [ ] CSV export of customers/orders
- [ ] Password reset flow

### P2 (Nice to Have)
- [ ] Chrome extension API connector
- [ ] WhatsApp message templates
- [ ] Order notifications
- [ ] Customer purchase history view

## Next Tasks
1. CSV export for customers and orders
2. Password reset flow
3. Chrome extension API integration
4. WhatsApp deep linking for customer contact
