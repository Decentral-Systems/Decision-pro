import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CreditCard,
  Users,
  Brain,
  Shield,
  BarChart3,
  Settings,
  UserCog,
  FileText,
  TrendingDown,
  DollarSign,
  Zap,
  Server,
  Code,
  FileCheck,
  CheckCircle,
  ArrowRightCircle,
  Receipt,
  AlertTriangle,
} from "lucide-react";

export interface SidebarItem {
  label: string;
  url: string;
  icon: LucideIcon;
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { label: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { label: "Credit Scoring", url: "/credit-scoring", icon: CreditCard },
  {
    label: "Default Prediction",
    url: "/default-prediction",
    icon: TrendingDown,
  },
  { label: "Dynamic Pricing", url: "/dynamic-pricing", icon: DollarSign },
  { label: "Real-Time Scoring", url: "/realtime-scoring", icon: Zap },
  { label: "Customers", url: "/customers", icon: Users },
  { label: "Loan Applications", url: "/loans/applications", icon: FileCheck },
  { label: "Approvals", url: "/loans/approvals", icon: CheckCircle },
  {
    label: "Disbursements",
    url: "/loans/disbursements",
    icon: ArrowRightCircle,
  },
  { label: "Repayments", url: "/loans/repayments", icon: Receipt },
  { label: "Collections", url: "/loans/collections", icon: AlertTriangle },
  { label: "Portfolio Analytics", url: "/loans/portfolio", icon: BarChart3 },
  { label: "Regulatory Reporting", url: "/loans/regulatory", icon: Shield },
  { label: "ML Center", url: "/ml-center", icon: Brain },
  { label: "Compliance", url: "/compliance", icon: Shield },
  { label: "Rules Engine", url: "/rules-engine", icon: Code },
  { label: "Analytics", url: "/analytics", icon: BarChart3 },
  { label: "System Status", url: "/system-status", icon: Server },
  { label: "User Management", url: "/admin/users", icon: UserCog },
  { label: "Audit Logs", url: "/admin/audit-logs", icon: FileText },
  { label: "Settings", url: "/settings", icon: Settings },
];
