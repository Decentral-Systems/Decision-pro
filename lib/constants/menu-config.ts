/**
 * Decision PRO Menu Configuration
 * Centralized navigation menu structure
 */

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
  type LucideIcon,
} from "lucide-react";
import { UserRole } from "@/types/user";

export interface MenuItem {
  title: string;
  icon: LucideIcon;
  href: string;
  roles: UserRole[];
  badge?: string | number;
  children?: MenuItem[];
  description?: string;
}

export const menuItems: MenuItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    roles: [UserRole.ADMIN, UserRole.CREDIT_ANALYST, UserRole.RISK_MANAGER],
    description: "Overview and key metrics",
  },
  {
    title: "Credit Scoring",
    icon: CreditCard,
    href: "/credit-scoring",
    roles: [UserRole.ADMIN, UserRole.CREDIT_ANALYST],
    description: "Credit assessment and scoring",
  },
  {
    title: "Default Prediction",
    icon: TrendingDown,
    href: "/default-prediction",
    roles: [UserRole.ADMIN, UserRole.CREDIT_ANALYST, UserRole.RISK_MANAGER],
    description: "Risk and default analytics",
  },
  {
    title: "Dynamic Pricing",
    icon: DollarSign,
    href: "/dynamic-pricing",
    roles: [UserRole.ADMIN, UserRole.CREDIT_ANALYST, UserRole.RISK_MANAGER],
    description: "Intelligent pricing strategies",
  },
  {
    title: "Real-Time Scoring",
    icon: Zap,
    href: "/realtime-scoring",
    roles: [UserRole.ADMIN, UserRole.CREDIT_ANALYST, UserRole.RISK_MANAGER],
    description: "Live credit scoring",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
    roles: [
      UserRole.ADMIN,
      UserRole.CREDIT_ANALYST,
      UserRole.CUSTOMER_SERVICE,
    ],
    description: "Customer management",
  },
  {
    title: "Loan Applications",
    icon: FileCheck,
    href: "/loans/applications",
    roles: [
      UserRole.ADMIN,
      UserRole.CREDIT_ANALYST,
      UserRole.CUSTOMER_SERVICE,
    ],
    description: "Loan application management",
  },
  {
    title: "Approvals",
    icon: CheckCircle,
    href: "/loans/approvals",
    roles: [
      UserRole.ADMIN,
      UserRole.CREDIT_ANALYST,
      UserRole.RISK_MANAGER,
    ],
    description: "Loan approval workflows",
  },
  {
    title: "Disbursements",
    icon: ArrowRightCircle,
    href: "/loans/disbursements",
    roles: [
      UserRole.ADMIN,
      UserRole.CREDIT_ANALYST,
    ],
    description: "Loan fund disbursement",
  },
  {
    title: "Repayments",
    icon: Receipt,
    href: "/loans/repayments",
    roles: [
      UserRole.ADMIN,
      UserRole.CREDIT_ANALYST,
      UserRole.CUSTOMER_SERVICE,
    ],
    description: "Payment processing and tracking",
  },
  {
    title: "Collections",
    icon: AlertTriangle,
    href: "/loans/collections",
    roles: [
      UserRole.ADMIN,
      UserRole.CREDIT_ANALYST,
      UserRole.CUSTOMER_SERVICE,
    ],
    description: "Overdue loan collection",
  },
  {
    title: "Portfolio Analytics",
    icon: BarChart3,
    href: "/loans/portfolio",
    roles: [
      UserRole.ADMIN,
      UserRole.RISK_MANAGER,
      UserRole.COMPLIANCE_OFFICER,
    ],
    description: "Portfolio performance analytics",
  },
  {
    title: "Regulatory Reporting",
    icon: Shield,
    href: "/loans/regulatory",
    roles: [
      UserRole.ADMIN,
      UserRole.COMPLIANCE_OFFICER,
      UserRole.RISK_MANAGER,
    ],
    description: "NBE compliance and regulatory reporting",
  },
  {
    title: "ML Center",
    icon: Brain,
    href: "/ml-center",
    roles: [UserRole.ADMIN, UserRole.RISK_MANAGER],
    description: "Machine learning models",
  },
  {
    title: "Compliance",
    icon: Shield,
    href: "/compliance",
    roles: [UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER, UserRole.RISK_MANAGER],
    description: "Regulatory compliance",
  },
  {
    title: "Rules Engine",
    icon: Code,
    href: "/rules-engine",
    roles: [UserRole.ADMIN, UserRole.RISK_MANAGER],
    description: "Business rules configuration",
  },
  {
    title: "Analytics",
    icon: BarChart3,
    href: "/analytics",
    roles: [UserRole.ADMIN, UserRole.RISK_MANAGER],
    description: "Advanced analytics and insights",
  },
  {
    title: "System Status",
    icon: Server,
    href: "/system-status",
    roles: [UserRole.ADMIN],
    description: "System health monitoring",
  },
  {
    title: "User Management",
    icon: UserCog,
    href: "/admin/users",
    roles: [UserRole.ADMIN],
    description: "User administration",
  },
  {
    title: "Audit Logs",
    icon: FileText,
    href: "/admin/audit-logs",
    roles: [UserRole.ADMIN, UserRole.COMPLIANCE_OFFICER],
    description: "System audit trail",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
    roles: [UserRole.ADMIN],
    description: "System configuration",
  },
];
