import type { TablerIcon } from "@tabler/icons-react";
import {
  IconLayoutDashboard,
  IconCreditCard,
  IconUsers,
  IconBrain,
  IconShield,
  IconChartBar,
  IconSettings,
  IconUserCog,
  IconFileText,
  IconTrendingDown,
  IconCurrencyDollar,
  IconBolt,
  IconServer,
  IconCode,
  IconFileCheck,
  IconCircleCheck,
  IconArrowRightCircle,
  IconReceipt,
  IconAlertTriangle,
} from "@tabler/icons-react";

export interface SidebarItem {
  label: string;
  url: string;
  icon: TablerIcon;
}

/** A collapsible group in the sidebar with a label and child items */
export interface SidebarGroupConfig {
  label: string;
  icon: TablerIcon;
  items: SidebarItem[];
}

/** Top-level nav entry: either a single link or a collapsible group */
export type SidebarNavEntry =
  | { type: "item"; item: SidebarItem }
  | { type: "group"; group: SidebarGroupConfig };

const SCORING_ITEMS: SidebarItem[] = [
  {
    label: "Credit Scoring",
    url: "/scoring/credit-scoring",
    icon: IconCreditCard,
  },
  {
    label: "Real-Time Scoring",
    url: "/scoring/realtime-scoring",
    icon: IconBolt,
  },
];

const LOAN_ITEMS: SidebarItem[] = [
  {
    label: "Applications",
    url: "/loans/applications",
    icon: IconFileCheck,
  },
  { label: "Approvals", url: "/loans/approvals", icon: IconCircleCheck },
  {
    label: "Disbursements",
    url: "/loans/disbursements",
    icon: IconArrowRightCircle,
  },
  { label: "Repayments", url: "/loans/repayments", icon: IconReceipt },
  { label: "Collections", url: "/loans/collections", icon: IconAlertTriangle },
  { label: "Portfolio Analytics", url: "/loans/portfolio", icon: IconChartBar },
  { label: "Regulatory Reporting", url: "/loans/regulatory", icon: IconShield },
];

const ADMIN_ITEMS: SidebarItem[] = [
  { label: "Users Management", url: "/admin/users", icon: IconUserCog },
  { label: "Audit Logs", url: "/admin/audit-logs", icon: IconFileText },
];

export const SIDEBAR_NAV: SidebarNavEntry[] = [
  {
    type: "item",
    item: { label: "Dashboard", url: "/dashboard", icon: IconLayoutDashboard },
  },
  {
    type: "group",
    group: { label: "Scoring", icon: IconCreditCard, items: SCORING_ITEMS },
  },
  {
    type: "item",
    item: {
      label: "Default Prediction",
      url: "/default-prediction",
      icon: IconTrendingDown,
    },
  },
  {
    type: "item",
    item: {
      label: "Dynamic Pricing",
      url: "/dynamic-pricing",
      icon: IconCurrencyDollar,
    },
  },
  {
    type: "item",
    item: { label: "Customers", url: "/customers", icon: IconUsers },
  },
  {
    type: "group",
    group: { label: "Loans", icon: IconReceipt, items: LOAN_ITEMS },
  },
  {
    type: "item",
    item: { label: "ML Center", url: "/ml-center", icon: IconBrain },
  },
  {
    type: "item",
    item: { label: "Compliance", url: "/compliance", icon: IconShield },
  },
  {
    type: "item",
    item: { label: "Rules Engine", url: "/rules-engine", icon: IconCode },
  },
  {
    type: "item",
    item: { label: "Analytics", url: "/analytics", icon: IconChartBar },
  },
  {
    type: "item",
    item: { label: "System Status", url: "/system-status", icon: IconServer },
  },
  {
    type: "group",
    group: { label: "Admin", icon: IconUserCog, items: ADMIN_ITEMS },
  },
  {
    type: "item",
    item: { label: "Settings", url: "/settings", icon: IconSettings },
  },
];
