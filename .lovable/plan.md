

# 🛡️ Express Prime — Complete Implementation Plan

## Overview
A production-ready autonomous commerce platform with premium branding, AI-driven profit protection, and real-time operations control.

**Brand Identity** (extracted from your logo):
- **Primary Royal Blue**: `#1E40AF` / `#2563EB`
- **Premium Gold**: `#D4A853` / `#F59E0B`
- **Clean White**: `#FFFFFF`
- Icon-first approach with shield/cart motif throughout

---

## Phase 1: Foundation & Shopify Integration

### 1.1 Shopify Connection
- Connect existing Shopify store (once email is updated)
- Configure Storefront API access for product display & cart
- Set up Admin API access via Edge Functions (secure)
- Register webhooks for orders/products/refunds sync

### 1.2 Supabase Database Schema
- **profiles** — User accounts with roles (founder/admin/operator)
- **shopify_installations** — Encrypted tokens & shop data
- **products** — Mirrored catalog with status, cost, margin tracking
- **collections** — Synced collection data
- **orders** — Order history with profit estimates
- **performance_metrics** — Daily stats per product
- **ai_decisions** — Automated decision log
- **sync_runs & sync_items** — Bulk import tracking

### 1.3 Authentication & Security
- Founder-only admin access with proper RLS
- Encrypted API tokens (never in browser)
- Role-based access control

---

## Phase 2: Customer-Facing Storefront

### 2.1 Home Page (Premium + High Trust)
- Hero section: "Autonomous AI Commerce Engine" with shimmer animation
- CTA: "Shop Trending Now" button with hover glow
- Product sections: Trending Now, Best Sellers, New Drops, Smart Tech Finds
- Trust strip: Shipping, Guarantee, Secure Checkout, Fast Support
- Subtle brand animations (12s logo shimmer, button lift effects)

### 2.2 Collection Pages
- Grid layout with product cards (tilt/scale on hover)
- Sort: trending, best selling, price, newest
- Filters: category, price range, ratings
- Mobile-optimized (TikTok traffic ready)

### 2.3 Product Detail Pages
- Benefit-driven layout with sticky add-to-cart
- FAQ accordion
- Shipping & returns blocks
- "AI-Recommended Pairings" cross-sell section
- Skeleton loading with gold accent shimmer

### 2.4 Cart & Checkout
- Slide-in cart drawer with product thumbnails
- Free shipping threshold meter
- Upsell module
- 1-click proceed to Shopify checkout

### 2.5 Support Pages
- Order Tracking (email + order lookup)
- Support page with AI chat widget + escalation form
- Policy pages: Shipping, Refund, Terms, Privacy

---

## Phase 3: Admin Operations Dashboard

### 3.1 Dashboard Overview (/admin)
- Revenue, Profit, Orders, Refund Rate, Conversion KPIs
- Real-time metrics from Supabase
- Protected route (founder/admin only)

### 3.2 Product Management
- Product status board: Active / Paused / Killed / Draft
- Quick actions: pause, reprice, archive
- Inventory alerts

### 3.3 Bulk Import System
- "RUN BULK IMPORT" button with real-time progress
- CSV import (immediate use)
- TXT catalog parser (for ongoing operations)
- Batched API calls (10 at a time)
- Exponential backoff retry
- Success/failed/skipped logging

### 3.4 AI Decisions Log
- View all automated decisions
- Reason + confidence level
- Link to affected products

### 3.5 Global Rules Configuration
- Minimum margin threshold slider
- Refund rate pause threshold
- Kill window (days with no sales)
- Rate-limit safe mode toggle

---

## Phase 4: Automation & Intelligence

### 4.1 Edge Functions
- **shopify_oauth** — Secure token exchange
- **shopify_webhooks** — Receive & process Shopify events
- **bulk_import** — Product creation with retry logic
- **profit_protection_cron** — Scheduled margin analysis

### 4.2 Profit Protection Rules
- Auto-pause products exceeding refund threshold
- Flag products where ad spend > margin
- Reprice test on stale inventory
- Auto-kill after extended no-sale period

### 4.3 Webhook Processing
- orders/create → sync to Supabase
- orders/updated → update status
- refunds/create → update metrics
- products/update → keep catalog in sync

---

## UI/UX Details

### Micro-Animations
- Header logo: Subtle shimmer sweep every ~12 seconds
- Buttons: Hover lift + blue/gold edge glow
- Add-to-cart: Smooth drawer slide-in with product thumbnail motion
- "Trending Now" cards: Slight tilt/scale on hover
- Loading: Skeleton states with gold accent shimmer

### Mobile-First Design
- Full functionality on mobile (no "watered-down" experience)
- Touch-optimized interactions
- Fast loading for TikTok traffic

---

## Technical Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    EXPRESS PRIME                            │
├─────────────────────────────────────────────────────────────┤
│  FRONTEND (Lovable/React)                                   │
│  ├── Storefront (Products, Cart, Checkout)                  │
│  └── Admin Dashboard (Analytics, Operations)                │
├─────────────────────────────────────────────────────────────┤
│  SUPABASE (Brain)                                          │
│  ├── Postgres (Products, Orders, Metrics, Decisions)        │
│  ├── Auth (Founder/Admin roles)                            │
│  ├── Edge Functions (Shopify API, Webhooks, Cron)          │
│  └── Realtime (Live dashboard updates)                      │
├─────────────────────────────────────────────────────────────┤
│  SHOPIFY (Commerce Engine)                                  │
│  ├── Storefront API (Products, Cart, Checkout)              │
│  ├── Admin API (Create/Update products, Orders)             │
│  └── Webhooks (Sync events)                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## Next Steps

1. **Update Shopify email** to match Lovable account
2. **Connect Shopify store** through Lovable
3. **Begin Phase 1** — Database schema + auth + Shopify integration
4. **Build Phase 2 & 3** simultaneously — Storefront + Admin
5. **Implement Phase 4** — Automation & profit protection

