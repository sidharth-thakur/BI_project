/* Mock dashboard data — replace with API responses later. */

import {
  FileText,
  ClipboardList,
  ReceiptText,
  Users,
} from "lucide-react";

export const businessKpis = [
  {
    key: "quotation",
    label: "Quotation Value",
    value: "₹48.5L",
    growth: "+12.5%",
    note: "This Month",
    tone: "green",
    icon: FileText,
    trend: [32, 38, 34, 44, 40, 52, 58],
  },
  {
    key: "purchase-orders",
    label: "Purchase Orders",
    value: "₹32.1L",
    growth: "+8.2%",
    note: "This Month",
    tone: "cyan",
    icon: ClipboardList,
    trend: [40, 36, 44, 42, 50, 46, 54],
  },
  {
    key: "bills",
    label: "Total Bills",
    value: "₹18.4L",
    growth: "+15.0%",
    note: "This Month",
    tone: "pink",
    icon: ReceiptText,
    trend: [22, 26, 24, 30, 34, 32, 40],
  },
  {
    key: "clients",
    label: "Active Clients",
    value: "48",
    growth: "+6.0%",
    note: "This Month",
    tone: "purple",
    icon: Users,
    trend: [30, 32, 34, 33, 38, 42, 46],
  },
];

export const overviewPeriods = ["This Month", "Last Month", "This Quarter", "This Year"];

/* Donut: Sales Breakdown (₹ lakh) */
export const salesBreakdown = [
  { name: "Quotations", value: 41.0, color: "#a9ded8" },
  { name: "Purchase Orders", value: 32.1, color: "#d9f5b0" },
  { name: "Bills", value: 18.4, color: "#f3b2b7" },
  { name: "Other", value: 7.0, color: "#b7bce8" },
];

export const salesBreakdownTotal = salesBreakdown.reduce(
  (sum, item) => sum + item.value,
  0
);

/* Bar chart: Sales Overview (₹ lakh per month) */
export const salesOverview = [
  { month: "Jan", value: 12.4 },
  { month: "Feb", value: 14.1 },
  { month: "Mar", value: 11.8 },
  { month: "Apr", value: 16.5 },
  { month: "May", value: 15.2 },
  { month: "Jun", value: 18.6 },
];

export const salesBarColors = [
  "#a9ded8",
  "#d9f5b0",
  "#f3b2b7",
  "#b7bce8",
  "#f8e6a8",
  "#0f6e6c",
];
