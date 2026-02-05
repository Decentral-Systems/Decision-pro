"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Package,
  Workflow,
  Shield,
  FileQuestion,
  BookOpen,
  Lightbulb,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface RulesEmptyStateProps {
  ruleType: "product" | "workflow" | "risk" | "approval" | "all";
  hasFilters?: boolean;
  onCreateClick?: () => void;
  onClearFilters?: () => void;
  className?: string;
}

const ruleTypeConfig = {
  product: {
    icon: Package,
    title: "No Product Rules",
    description: "Product rules define eligibility, limits, pricing, and approval criteria for specific loan products.",
    getStartedSteps: [
      "Understand rule types: Eligibility, Limit Calculation, Pricing, or Approval",
      "Click 'Create Product Rule' to start building",
      "Define conditions using fields like monthly income, credit score, etc.",
      "Set actions like setting limits or adjusting interest rates",
      "Test your rule before activating",
    ],
  },
  workflow: {
    icon: Workflow,
    title: "No Workflow Rules",
    description: "Workflow rules automate processes like auto-approval, notifications, and limit adjustments.",
    getStartedSteps: [
      "Identify the workflow you want to automate",
      "Click 'Create Workflow Rule' to begin",
      "Define trigger conditions",
      "Configure automation actions",
      "Test and activate the workflow",
    ],
  },
  risk: {
    icon: Shield,
    title: "No Risk Configurations",
    description: "Risk appetite configurations define risk parameters, limits, and approval rules for different customer segments.",
    getStartedSteps: [
      "Identify the customer segment or product type",
      "Click 'Create Risk Configuration'",
      "Set risk parameters and thresholds",
      "Configure limit and interest rate adjustments",
      "Define approval rules for the segment",
    ],
  },
  approval: {
    icon: FileQuestion,
    title: "No Approval Workflow Levels",
    description: "Approval workflow levels define the approval hierarchy and requirements based on loan amount and risk.",
    getStartedSteps: [
      "Click 'Edit Approval Levels' to configure",
      "Define approval levels (e.g., Automatic, Junior Officer, Senior Officer, Committee)",
      "Set credit score and loan amount thresholds",
      "Configure required approvers for each level",
      "Set auto-approve or auto-reject rules",
    ],
  },
  all: {
    icon: FileQuestion,
    title: "No Rules Found",
    description: "No rules match your current filters. Try adjusting your search or filters.",
    getStartedSteps: [],
  },
};

export function RulesEmptyState({
  ruleType,
  hasFilters = false,
  onCreateClick,
  onClearFilters,
  className,
}: RulesEmptyStateProps) {
  const config = ruleTypeConfig[ruleType];
  const Icon = config.icon;

  if (hasFilters) {
    return (
      <Card className={cn("border-dashed", className)}>
        <CardContent className="flex flex-col items-center justify-center py-12 px-4">
          <div className="mb-4">
            <Icon className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No rules match your filters</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm mb-4">
            Try adjusting your search query or filter criteria to find rules.
          </p>
          {onClearFilters && (
            <Button variant="outline" size="sm" onClick={onClearFilters}>
              Clear Filters
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("border-dashed", className)}>
      <CardContent className="flex flex-col items-center justify-center py-12 px-4">
        <div className="mb-4">
          <Icon className="h-16 w-16 text-muted-foreground" />
        </div>
        <h3 className="text-xl font-semibold mb-2">{config.title}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md mb-6">
          {config.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {onCreateClick && (
            <Button onClick={onCreateClick} size="lg">
              <Icon className="h-4 w-4 mr-2" />
              Create Your First Rule
            </Button>
          )}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="lg">
                <BookOpen className="h-4 w-4 mr-2" />
                Get Started Guide
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Get Started with Rules</DialogTitle>
                <DialogDescription>
                  Follow these steps to create and manage your first rule
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-3">
                  {config.getStartedSteps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                        {index + 1}
                      </div>
                      <p className="text-sm text-foreground pt-1.5">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Pro Tip</p>
                      <p className="text-xs text-muted-foreground">
                        Start with simple rules and gradually add complexity. Test each rule
                        thoroughly before activating it in production.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="text-xs text-muted-foreground text-center">
          Need help? Check out our{" "}
          <a href="#" className="text-primary hover:underline">
            documentation
          </a>{" "}
          or contact support.
        </div>
      </CardContent>
    </Card>
  );
}

