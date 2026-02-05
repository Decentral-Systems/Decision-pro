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

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", url: "/dashboard", icon: IconLayoutDashboard },
  { label: "Credit Scoring", url: "/credit-scoring", icon: IconCreditCard },
  {
    label: "Default Prediction",
    url: "/default-prediction",
    icon: IconTrendingDown,
  },
  { label: "Dynamic Pricing", url: "/dynamic-pricing", icon: IconCurrencyDollar },
  { label: "Real-Time Scoring", url: "/realtime-scoring", icon: IconBolt },
  { label: "Customers", url: "/customers", icon: IconUsers },
  { label: "Loan Applications", url: "/loans/applications", icon: IconFileCheck },
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
  { label: "ML Center", url: "/ml-center", icon: IconBrain },
  { label: "Compliance", url: "/compliance", icon: IconShield },
  { label: "Rules Engine", url: "/rules-engine", icon: IconCode },
  { label: "Analytics", url: "/analytics", icon: IconChartBar },
  { label: "System Status", url: "/system-status", icon: IconServer },
  { label: "User Management", url: "/admin/users", icon: IconUserCog },
  { label: "Audit Logs", url: "/admin/audit-logs", icon: IconFileText },
  { label: "Settings", url: "/settings", icon: IconSettings },
];
