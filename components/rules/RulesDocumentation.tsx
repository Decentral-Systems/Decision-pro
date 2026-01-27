"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// ScrollArea will be replaced with a div with overflow-y-auto
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Package,
  Workflow,
  Shield,
  CheckCircle2,
  Table,
  LayoutGrid,
  Rows3,
  History,
  Filter,
  Search,
  FileText,
  Layout,
  AlertCircle,
  Info,
} from "lucide-react";

export type DocumentationSection =
  | "overview"
  | "product-rules"
  | "workflow-rules"
  | "risk-appetite"
  | "approval-workflow"
  | "views"
  | "filters"
  | "visual-builder"
  | "conditions"
  | "actions";

interface RulesDocumentationProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section?: DocumentationSection;
}

const documentationContent = {
  overview: {
    title: "Rules Engine Overview",
    icon: <Info className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The Rules Engine is a powerful system for managing and automating credit decision-making
          processes. It allows you to create, configure, and manage various types of rules that
          control how loan applications are evaluated, approved, and processed.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Key Features:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Product-specific rules for eligibility, limits, and pricing</li>
            <li>Workflow automation for streamlined processes</li>
            <li>Risk appetite configuration for compliance</li>
            <li>Multi-level approval workflows</li>
            <li>Visual rule builder for easy configuration</li>
            <li>Real-time rule testing and validation</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Getting Started:</h4>
          <p className="text-sm text-muted-foreground">
            Start by creating a Product Rule to define eligibility criteria for a specific loan
            product. Use the Visual Builder for a drag-and-drop experience, or the Form View for
            detailed configuration.
          </p>
        </div>
      </div>
    ),
  },
  "product-rules": {
    title: "Product Rules",
    icon: <Package className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Product Rules define eligibility criteria, loan limits, pricing adjustments, and approval
          requirements for specific loan products (e.g., Personal Loan, Auto Loan, Mortgage).
        </p>
        <div>
          <h4 className="font-semibold mb-2">Rule Types:</h4>
          <div className="space-y-2">
            <div>
              <Badge variant="outline" className="mr-2">Eligibility</Badge>
              <span className="text-sm text-muted-foreground">
                Determines if a customer qualifies for the product
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">Limit</Badge>
              <span className="text-sm text-muted-foreground">
                Sets maximum loan amounts based on customer attributes
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">Pricing</Badge>
              <span className="text-sm text-muted-foreground">
                Adjusts interest rates based on risk factors
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">Approval</Badge>
              <span className="text-sm text-muted-foreground">
                Defines automatic approval criteria
              </span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Evaluation Scope:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>All:</strong> Rule applies to all customers regardless of segment
            </li>
            <li>
              <strong>Segment:</strong> Rule applies only to specific customer segments
            </li>
            <li>
              <strong>Product:</strong> Rule applies only to this specific product type
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Best Practices:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Start with eligibility rules before setting limits or pricing</li>
            <li>Use evaluation order to control rule execution sequence</li>
            <li>Test rules before activating them in production</li>
            <li>Mark critical rules as mandatory to prevent accidental deactivation</li>
          </ul>
        </div>
      </div>
    ),
  },
  "workflow-rules": {
    title: "Workflow Automation Rules",
    icon: <Workflow className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Workflow Rules automate business processes and trigger actions based on specific events
          or conditions. They help streamline operations and ensure consistent handling of
          applications.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Trigger Events:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>Application Submitted:</strong> When a new loan application is received
            </li>
            <li>
              <strong>Credit Score Updated:</strong> When a customer's credit score changes
            </li>
            <li>
              <strong>Payment Received:</strong> When a loan payment is processed
            </li>
            <li>
              <strong>Risk Level Changed:</strong> When risk assessment is updated
            </li>
            <li>
              <strong>Manual Trigger:</strong> Activated by user action
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Priority Levels:</h4>
          <p className="text-sm text-muted-foreground mb-2">
            Rules are executed in priority order (1 = highest priority):
          </p>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>High priority rules execute first and can block lower priority rules</li>
            <li>Use priority to control rule execution sequence</li>
            <li>Multiple rules can have the same priority</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Common Use Cases:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Automatic document requests for incomplete applications</li>
            <li>Escalation to senior officers for high-risk cases</li>
            <li>Notification alerts for specific conditions</li>
            <li>Data enrichment from external sources</li>
          </ul>
        </div>
      </div>
    ),
  },
  "risk-appetite": {
    title: "Risk Appetite Configuration",
    icon: <Shield className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Risk Appetite Configurations define your organization's tolerance for risk and automate
          risk-based adjustments to loan terms, interest rates, and approval decisions.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Key Parameters:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>Min Credit Score:</strong> Minimum credit score required for approval
            </li>
            <li>
              <strong>Max DTI Ratio:</strong> Maximum debt-to-income ratio allowed (e.g., 40%)
            </li>
            <li>
              <strong>Max LTV Ratio:</strong> Maximum loan-to-value ratio for secured loans (e.g.,
              80%)
            </li>
            <li>
              <strong>Interest Rate Adjustments:</strong> Risk-based rate modifications
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Compliance:</h4>
          <p className="text-sm text-muted-foreground">
            Risk appetite configurations must comply with National Bank of Ethiopia (NBE)
            regulations. Ensure all limits are within regulatory boundaries and document any
            exceptions.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Best Practices:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Review and update risk parameters quarterly</li>
            <li>Align configurations with business strategy and market conditions</li>
            <li>Document rationale for all risk thresholds</li>
            <li>Monitor performance metrics to validate risk settings</li>
          </ul>
        </div>
      </div>
    ),
  },
  "approval-workflow": {
    title: "Approval Workflow",
    icon: <CheckCircle2 className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Approval Workflows define multi-level approval processes for loan applications. Each
          level has specific criteria (credit score, loan amount) and requires a certain number of
          approvers.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Approval Levels:</h4>
          <div className="space-y-2 text-sm">
            <div className="p-2 border rounded-md">
              <div className="font-semibold">Level 1: Automatic Approval</div>
              <div className="text-muted-foreground">
                High credit scores, small loan amounts - no human review required
              </div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="font-semibold">Level 2: Junior Officer Review</div>
              <div className="text-muted-foreground">
                Medium risk cases - requires 1 approver
              </div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="font-semibold">Level 3: Senior Officer Review</div>
              <div className="text-muted-foreground">
                Higher risk cases - requires 2 approvers, may escalate
              </div>
            </div>
            <div className="p-2 border rounded-md">
              <div className="font-semibold">Level 4: Committee Review</div>
              <div className="text-muted-foreground">
                Highest risk or large amounts - requires 3+ approvers
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Escalation:</h4>
          <p className="text-sm text-muted-foreground">
            Cases can be escalated to higher levels if risk scores exceed thresholds or if
            approvers cannot reach consensus. Escalation thresholds are configurable per level.
          </p>
        </div>
      </div>
    ),
  },
  views: {
    title: "View Options",
    icon: <LayoutGrid className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The Rules Engine supports multiple view modes to help you manage rules efficiently based
          on your workflow and preferences.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Table className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="font-semibold">Table View</div>
              <div className="text-sm text-muted-foreground">
                Traditional spreadsheet-style view with sortable columns. Best for detailed
                analysis, bulk operations, and comparing multiple rules side-by-side. Includes
                column visibility controls and CSV export.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <LayoutGrid className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="font-semibold">Grid View</div>
              <div className="text-sm text-muted-foreground">
                Card-based grid layout showing key information at a glance. Ideal for quick
                scanning and visual rule management. Each card displays rule name, status,
                conditions, and actions.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Rows3 className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="font-semibold">Card View</div>
              <div className="text-sm text-muted-foreground">
                Expanded card layout with detailed information and collapsible sections. Perfect
                for reviewing rule details without opening the edit dialog. Shows full conditions,
                actions, and statistics.
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <History className="h-5 w-5 mt-0.5 text-primary" />
            <div>
              <div className="font-semibold">Timeline View</div>
              <div className="text-sm text-muted-foreground">
                Chronological view of rule changes and updates. Great for tracking rule evolution,
                auditing changes, and understanding rule history. Grouped by date with timestamps.
              </div>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Compact Mode:</h4>
          <p className="text-sm text-muted-foreground">
            When in Table View, you can toggle Compact Mode to reduce row height and font size,
            allowing you to see more rules at once. Perfect for large rule sets.
          </p>
        </div>
      </div>
    ),
  },
  filters: {
    title: "Filters & Search",
    icon: <Filter className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Use filters and search to quickly find specific rules from your collection. Filters can
          be combined for precise results.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Search:</h4>
          <p className="text-sm text-muted-foreground">
            Search across rule names, descriptions, and conditions. The search is case-insensitive
            and supports partial matches. Results update as you type (with a 300ms debounce).
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Product Type Filter:</h4>
          <p className="text-sm text-muted-foreground">
            Filter Product Rules by specific product types (Personal Loan, Auto Loan, Mortgage,
            etc.). Select "All Products" to show rules for all product types.
          </p>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Active Status Filter:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>All:</strong> Shows both active and inactive rules
            </li>
            <li>
              <strong>Active:</strong> Shows only rules currently in use
            </li>
            <li>
              <strong>Inactive:</strong> Shows only disabled rules
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Tips:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Combine multiple filters for precise results</li>
            <li>Clear filters by selecting "All" options</li>
            <li>Search works across all visible rules after filtering</li>
            <li>Filter state is preserved when switching between tabs</li>
          </ul>
        </div>
      </div>
    ),
  },
  "visual-builder": {
    title: "Visual Rule Builder",
    icon: <Layout className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          The Visual Rule Builder provides an intuitive drag-and-drop interface for creating and
          editing rules. It's perfect for users who prefer a visual approach over form-based
          configuration.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Features:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>Drag-and-Drop Conditions:</strong> Reorder conditions by dragging
            </li>
            <li>
              <strong>Visual Flow Diagram:</strong> See rule logic as a flowchart
            </li>
            <li>
              <strong>Live Preview:</strong> Real-time preview of rule definition and JSON
            </li>
            <li>
              <strong>Field Type Detection:</strong> Automatically suggests appropriate operators
            </li>
            <li>
              <strong>Validation:</strong> Instant feedback on rule validity
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">When to Use Visual Builder:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Creating complex rules with multiple conditions</li>
            <li>Learning how rules work (visual representation helps)</li>
            <li>Reviewing rule logic before activation</li>
            <li>Collaborating with non-technical team members</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">When to Use Form View:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Quick edits to simple rules</li>
            <li>Bulk updates to rule properties</li>
            <li>Precise control over all rule fields</li>
            <li>Copy-pasting rule configurations</li>
          </ul>
        </div>
      </div>
    ),
  },
  conditions: {
    title: "Rule Conditions",
    icon: <AlertCircle className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Conditions define when a rule should be evaluated. A rule matches when all (AND) or any
          (OR) of its conditions are met, depending on the logical operator.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Available Operators:</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <strong>Comparison:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>equals, not_equals</li>
                <li>greater_than, less_than</li>
                <li>greater_than_or_equal, less_than_or_equal</li>
              </ul>
            </div>
            <div>
              <strong>Text:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>contains, not_contains</li>
                <li>starts_with, ends_with</li>
                <li>matches_regex</li>
              </ul>
            </div>
            <div>
              <strong>Array:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>in, not_in</li>
                <li>contains_all, contains_any</li>
              </ul>
            </div>
            <div>
              <strong>Boolean:</strong>
              <ul className="list-disc list-inside text-muted-foreground">
                <li>is_true, is_false</li>
              </ul>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Logical Operators:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>
              <strong>AND:</strong> All conditions must be true for the rule to match
            </li>
            <li>
              <strong>OR:</strong> At least one condition must be true for the rule to match
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Examples:</h4>
          <div className="space-y-2 text-sm">
            <div className="p-2 bg-muted rounded-md">
              <code>credit_score &gt;= 650 AND monthly_income &gt;= 10000</code>
              <div className="text-muted-foreground mt-1">
                Matches customers with good credit and sufficient income
              </div>
            </div>
            <div className="p-2 bg-muted rounded-md">
              <code>employment_status IN ['employed', 'self-employed'] OR has_collateral = true</code>
              <div className="text-muted-foreground mt-1">
                Matches employed customers or those with collateral
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  actions: {
    title: "Rule Actions",
    icon: <FileText className="h-5 w-5" />,
    content: (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Actions define what happens when a rule matches. A rule can have multiple actions that
          execute in sequence.
        </p>
        <div>
          <h4 className="font-semibold mb-2">Action Types:</h4>
          <div className="space-y-2 text-sm">
            <div>
              <Badge variant="outline" className="mr-2">set_limit</Badge>
              <span className="text-muted-foreground">
                Sets maximum loan amount (e.g., 50000 ETB)
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">adjust_interest_rate</Badge>
              <span className="text-muted-foreground">
                Modifies interest rate by percentage or fixed amount
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">approve</Badge>
              <span className="text-muted-foreground">
                Automatically approves the application
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">reject</Badge>
              <span className="text-muted-foreground">
                Automatically rejects the application
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">require_review</Badge>
              <span className="text-muted-foreground">
                Flags application for manual review
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">notify</Badge>
              <span className="text-muted-foreground">
                Sends notification to specified users or systems
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">limit_adjustment</Badge>
              <span className="text-muted-foreground">
                Adjusts loan limit based on calculation formula
              </span>
            </div>
            <div>
              <Badge variant="outline" className="mr-2">custom</Badge>
              <span className="text-muted-foreground">
                Custom action defined by validation script
              </span>
            </div>
          </div>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Action Execution:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Actions execute in the order they are defined</li>
            <li>Some actions (like approve/reject) may stop further rule evaluation</li>
            <li>Action values can use calculations and formulas</li>
            <li>All actions are logged for audit purposes</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Best Practices:</h4>
          <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
            <li>Place critical actions (approve/reject) first</li>
            <li>Use limit adjustments before setting final limits</li>
            <li>Add notifications for important rule matches</li>
            <li>Test action sequences before activation</li>
          </ul>
        </div>
      </div>
    ),
  },
};

export function RulesDocumentation({
  open,
  onOpenChange,
  section = "overview",
}: RulesDocumentationProps) {
  const selectedSection = documentationContent[section] || documentationContent.overview;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4">
          <DialogTitle className="flex items-center gap-2">
            {selectedSection.icon}
            {selectedSection.title}
          </DialogTitle>
          <DialogDescription>
            Comprehensive documentation and guidance for the Rules Engine
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-6">
          {/* Rule Types Tabs */}
          <div className="w-full">
            <Tabs defaultValue={section} className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="overview" className="text-xs">
                  Overview
                </TabsTrigger>
                <TabsTrigger value="product-rules" className="text-xs">
                  Products
                </TabsTrigger>
                <TabsTrigger value="workflow-rules" className="text-xs">
                  Workflow
                </TabsTrigger>
                <TabsTrigger value="risk-appetite" className="text-xs">
                  Risk
                </TabsTrigger>
                <TabsTrigger value="approval-workflow" className="text-xs">
                  Approval
                </TabsTrigger>
              </TabsList>
              <div className="min-h-[250px]">
                <TabsContent value="overview" className="mt-0">
                  {documentationContent.overview.content}
                </TabsContent>
                <TabsContent value="product-rules" className="mt-0">
                  {documentationContent["product-rules"].content}
                </TabsContent>
                <TabsContent value="workflow-rules" className="mt-0">
                  {documentationContent["workflow-rules"].content}
                </TabsContent>
                <TabsContent value="risk-appetite" className="mt-0">
                  {documentationContent["risk-appetite"].content}
                </TabsContent>
                <TabsContent value="approval-workflow" className="mt-0">
                  {documentationContent["approval-workflow"].content}
                </TabsContent>
              </div>
            </Tabs>
          </div>

          <Separator />

          {/* Feature Documentation Tabs */}
          <div className="w-full">
            <h3 className="text-lg font-semibold mb-3">Feature Documentation</h3>
            <Tabs defaultValue="views" className="w-full">
              <TabsList className="grid w-full grid-cols-5 mb-4">
                <TabsTrigger value="views" className="text-xs">
                  Views
                </TabsTrigger>
                <TabsTrigger value="filters" className="text-xs">
                  Filters
                </TabsTrigger>
                <TabsTrigger value="visual-builder" className="text-xs">
                  Visual Builder
                </TabsTrigger>
                <TabsTrigger value="conditions" className="text-xs">
                  Conditions
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">
                  Actions
                </TabsTrigger>
              </TabsList>
              <div className="min-h-[250px]">
                <TabsContent value="views" className="mt-0">
                  {documentationContent.views.content}
                </TabsContent>
                <TabsContent value="filters" className="mt-0">
                  {documentationContent.filters.content}
                </TabsContent>
                <TabsContent value="visual-builder" className="mt-0">
                  {documentationContent["visual-builder"].content}
                </TabsContent>
                <TabsContent value="conditions" className="mt-0">
                  {documentationContent.conditions.content}
                </TabsContent>
                <TabsContent value="actions" className="mt-0">
                  {documentationContent.actions.content}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

