# V BIOCHEM Advanced Software

A premium business-management SaaS frontend for a chemical/pharmaceutical trading
business — clients, products, quotations, follow-ups and bills in one place.

Built with **React + Vite** (JavaScript/JSX), **React Router**, **Recharts**,
**Lucide React** and a hand-rolled CSS design system (no UI kit).

## Getting started

```bash
npm install
npm run dev      # start dev server
npm run build    # production build
npm run lint     # oxlint
npm run preview  # preview production build
```

## Pages

| Route | Description |
| --- | --- |
| `/dashboard` | Welcome heading, Business Overview (pastel KPI cards), sales breakdown donut, sales overview bar chart, recent bills table |
| `/products` | Products master with search, category filter, add/edit/view/delete, pagination |
| `/clients` | CRM-style clients & leads with pipeline stats, filters, detail modal |
| `/follow-ups` | Call status: today / upcoming / overdue / completed tabs, complete, reschedule |
| `/bills` | Billing stats, bill CRUD, payment status filters |
| `/data-management` | Section overview |
| `/data-management/cloud-sync` | Sync status, progress, history |
| `/data-management/import-export` | Import dropzone + CSV export selection |
| `/data-management/csv-import` | 4-step wizard: upload → map → validate → import |

`/` redirects to `/dashboard`; unknown routes show a 404 page.

## Project structure

```text
src/
├── components/
│   ├── layout/       # Sidebar, Topbar, AppLayout, PageHeader
│   ├── dashboard/    # PastelStatCard, MiniTrend, charts, RecentBills
│   ├── common/       # Button, Card, Badge, Modal, Dropdown, ...
│   └── tables/       # DataTable, Pagination
├── pages/            # One folder per feature
├── context/          # AppContext (sidebar, search, user)
├── hooks/            # useLocalStorage
├── data/             # Mock data — swap for API responses later
├── routes/           # Central AppRoutes
└── styles/           # variables, global, layout, components,
                      # dashboard, pages, responsive
```

## Design system

All colors, radii, spacing, shadows and motion live as CSS custom properties in
`src/styles/variables.css`. Components only reference tokens — no scattered hex
values.

## Data & backend note

All data in `src/data/` is **mock data**. Forms and CRUD actions update local
component state only — nothing is persisted to a server. Replace the mock
modules with API (Axios) calls when a backend exists.
