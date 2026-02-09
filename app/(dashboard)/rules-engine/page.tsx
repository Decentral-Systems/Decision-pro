"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Filter,
  RefreshCw,
  Settings,
  Code,
  Workflow,
  Palette,
  TestTube,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  useCustomProductRules,
  useDeleteCustomProductRule,
  useUpdateCustomProductRule,
  useWorkflowRules,
  useDeleteWorkflowRule,
  useUpdateWorkflowRule,
  useRiskAppetiteConfigs,
  useDeleteRiskAppetiteConfig,
  useUpdateRiskAppetiteConfig,
  useApprovalWorkflowRules,
} from "@/lib/api/hooks/useRules";
import { CustomProductRulesTable } from "@/components/rules/CustomProductRulesTable";
import { WorkflowRulesTable } from "@/components/rules/WorkflowRulesTable";
import { RiskAppetiteTable } from "@/components/rules/RiskAppetiteTable";
import { ApprovalWorkflowTable } from "@/components/rules/ApprovalWorkflowTable";
import { CustomProductRuleDialog } from "@/components/rules/CustomProductRuleDialog";
import { WorkflowRuleDialog } from "@/components/rules/WorkflowRuleDialog";
import { RiskAppetiteDialog } from "@/components/rules/RiskAppetiteDialog";
import { ApprovalWorkflowDialog } from "@/components/rules/ApprovalWorkflowDialog";
import { RuleTesterDialog } from "@/components/rules/RuleTesterDialog";
import { EnhancedStatCard } from "@/components/rules/EnhancedStatCard";
import { Package, Shield } from "lucide-react";
import { ViewSwitcher, ViewType } from "@/components/rules/ViewSwitcher";
import { RulesGridView } from "@/components/rules/RulesGridView";
import { RulesCardView } from "@/components/rules/RulesCardView";
import { RulesTimelineView } from "@/components/rules/RulesTimelineView";
import { RulesEmptyState } from "@/components/rules/RulesEmptyState";
import { InfoButton } from "@/components/rules/InfoButton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CustomProductRule,
  WorkflowRule,
  RiskAppetiteConfig,
} from "@/types/rules";
import { cloneRule } from "@/lib/utils/ruleHelpers";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationControls } from "@/components/common/PaginationControls";
import { VisualRuleBuilder } from "@/components/rules/VisualRuleBuilder";
import { EnhancedRuleTester } from "@/components/rules/EnhancedRuleTester";

export default function RulesEnginePage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("product");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [productRuleDialogOpen, setProductRuleDialogOpen] = useState(false);
  const [workflowRuleDialogOpen, setWorkflowRuleDialogOpen] = useState(false);
  const [riskAppetiteDialogOpen, setRiskAppetiteDialogOpen] = useState(false);
  const [approvalWorkflowDialogOpen, setApprovalWorkflowDialogOpen] =
    useState(false);
  const [ruleTesterDialogOpen, setRuleTesterDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any>(null);
  const [testRuleType, setTestRuleType] = useState<"product" | "workflow">(
    "product"
  );
  const [viewMode, setViewMode] = useState<ViewType>("table");
  const [compactView, setCompactView] = useState(false);
  const [visualRuleBuilderOpen, setVisualRuleBuilderOpen] = useState(false);
  const [enhancedRuleTesterOpen, setEnhancedRuleTesterOpen] = useState(false);

  // Filters
  const [productTypeFilter, setProductTypeFilter] = useState<string>("all");
  const [isActiveFilter, setIsActiveFilter] = useState<string>("all");

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Load view mode and compact preference from localStorage
  useEffect(() => {
    const savedView = localStorage.getItem("rules-view-mode") as ViewType;
    if (
      savedView &&
      ["table", "grid", "card", "timeline"].includes(savedView)
    ) {
      setViewMode(savedView);
    }
    const savedCompact = localStorage.getItem("rules-compact-view");
    if (savedCompact === "true") {
      setCompactView(true);
    }
  }, []);

  // Pagination state
  const [productPage, setProductPage] = useState(1);
  const [workflowPage, setWorkflowPage] = useState(1);
  const [riskPage, setRiskPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Data hooks with pagination
  const {
    data: productRulesData,
    isLoading: productRulesLoading,
    refetch: refetchProductRules,
  } = useCustomProductRules({
    product_type: productTypeFilter === "all" ? undefined : productTypeFilter,
    is_active:
      isActiveFilter === "all" ? undefined : isActiveFilter === "active",
    limit: pageSize,
    offset: (productPage - 1) * pageSize,
  });
  const {
    data: workflowRulesData,
    isLoading: workflowRulesLoading,
    refetch: refetchWorkflowRules,
  } = useWorkflowRules({
    is_active:
      isActiveFilter === "all" ? undefined : isActiveFilter === "active",
    limit: pageSize,
    offset: (workflowPage - 1) * pageSize,
  });
  const {
    data: riskAppetiteData,
    isLoading: riskAppetiteLoading,
    refetch: refetchRiskAppetite,
  } = useRiskAppetiteConfigs({
    is_active:
      isActiveFilter === "all" ? undefined : isActiveFilter === "active",
    limit: pageSize,
    offset: (riskPage - 1) * pageSize,
  });
  const { data: approvalWorkflowData, isLoading: approvalWorkflowLoading } =
    useApprovalWorkflowRules();

  const deleteProductRule = useDeleteCustomProductRule();
  const deleteWorkflowRule = useDeleteWorkflowRule();
  const deleteRiskAppetite = useDeleteRiskAppetiteConfig();
  const updateProductRule = useUpdateCustomProductRule();
  const updateWorkflowRule = useUpdateWorkflowRule();
  const updateRiskAppetite = useUpdateRiskAppetiteConfig();

  const handleCreateRule = (type: string) => {
    setEditingRule(null);
    if (type === "product") {
      setProductRuleDialogOpen(true);
    } else if (type === "workflow") {
      setWorkflowRuleDialogOpen(true);
    } else if (type === "risk") {
      setRiskAppetiteDialogOpen(true);
    }
  };

  const handleEditRule = (rule: any, type: string) => {
    setEditingRule(rule);
    if (type === "product") {
      setProductRuleDialogOpen(true);
    } else if (type === "workflow") {
      setWorkflowRuleDialogOpen(true);
    } else if (type === "risk") {
      setRiskAppetiteDialogOpen(true);
    }
  };

  const handleDeleteRule = async (ruleId: number, type: string) => {
    if (!confirm("Are you sure you want to delete this rule?")) return;

    try {
      if (type === "product") {
        await deleteProductRule.mutateAsync(ruleId);
      } else if (type === "workflow") {
        await deleteWorkflowRule.mutateAsync(ruleId);
      } else if (type === "risk") {
        await deleteRiskAppetite.mutateAsync(ruleId);
      }
      toast({
        title: "Success",
        description: "Rule deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete rule",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateRule = (rule: any, type: string) => {
    const cloned = cloneRule(rule);
    setEditingRule(cloned);
    if (type === "product") {
      setProductRuleDialogOpen(true);
    } else if (type === "workflow") {
      setWorkflowRuleDialogOpen(true);
    } else if (type === "risk") {
      setRiskAppetiteDialogOpen(true);
    }
  };

  const handleToggleActive = async (
    ruleId: number,
    isActive: boolean,
    type: string
  ) => {
    try {
      if (type === "product") {
        const rule = productRulesData?.rules?.find(
          (r: CustomProductRule) => r.id === ruleId
        );
        if (!rule) {
          toast({
            title: "Error",
            description: "Rule not found",
            variant: "destructive",
          });
          return;
        }
        await updateProductRule.mutateAsync({
          ruleId,
          rule: {
            rule_name: rule.rule_name,
            product_type: rule.product_type,
            rule_description: rule.rule_description,
            rule_definition: rule.rule_definition,
            rule_actions: rule.rule_actions,
            evaluation_order: rule.evaluation_order,
            evaluation_scope: rule.evaluation_scope,
            is_active: !isActive,
            is_mandatory: rule.is_mandatory,
            validation_script: rule.validation_script,
            error_message: rule.error_message,
          },
        });
        toast({
          title: "Success",
          description: `Rule ${!isActive ? "activated" : "deactivated"} successfully`,
        });
        await refetchProductRules();
      } else if (type === "workflow") {
        const rule = workflowRulesData?.rules?.find(
          (r: WorkflowRule) => r.id === ruleId
        );
        if (!rule) {
          toast({
            title: "Error",
            description: "Rule not found",
            variant: "destructive",
          });
          return;
        }
        await updateWorkflowRule.mutateAsync({
          ruleId,
          rule: {
            rule_name: rule.rule_name,
            rule_description: rule.rule_description,
            rule_conditions: rule.rule_conditions,
            rule_actions: rule.rule_actions,
            rule_type: rule.rule_type,
            product_type: rule.product_type,
            customer_segment: rule.customer_segment,
            priority: rule.priority,
            is_active: !isActive,
            execution_order: rule.execution_order,
            validation_script: rule.validation_script,
            error_handling: rule.error_handling,
          },
        });
        toast({
          title: "Success",
          description: `Rule ${!isActive ? "activated" : "deactivated"} successfully`,
        });
        await refetchWorkflowRules();
      } else if (type === "risk") {
        const config = riskAppetiteData?.configs?.find(
          (c: RiskAppetiteConfig) => c.id === ruleId
        );
        if (!config) {
          toast({
            title: "Error",
            description: "Configuration not found",
            variant: "destructive",
          });
          return;
        }
        await updateRiskAppetite.mutateAsync({
          configId: ruleId,
          config: {
            config_name: config.config_name,
            config_type: config.config_type,
            product_type: config.product_type,
            customer_segment: config.customer_segment,
            risk_parameters: config.risk_parameters,
            limit_adjustments: config.limit_adjustments,
            interest_rate_adjustments: config.interest_rate_adjustments,
            approval_rules: config.approval_rules,
            is_active: !isActive,
            priority: config.priority,
            description: config.description,
          },
        });
        toast({
          title: "Success",
          description: `Configuration ${!isActive ? "activated" : "deactivated"} successfully`,
        });
        await refetchRiskAppetite();
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail?.message ||
        error?.message ||
        "Failed to toggle active status";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleTestRule = (rule: any, type: string) => {
    setTestRuleType(type === "product" ? "product" : "workflow");
    setRuleTesterDialogOpen(true);
  };

  // Reset pagination when filters change
  const handleProductTypeFilterChange = (value: string) => {
    setProductTypeFilter(value);
    setProductPage(1);
  };

  const handleActiveFilterChange = (value: string) => {
    setIsActiveFilter(value);
    setProductPage(1);
    setWorkflowPage(1);
    setRiskPage(1);
  };

  // Get unique product types for filter
  const productTypes = useMemo(() => {
    const types = new Set<string>();
    productRulesData?.rules?.forEach((rule: CustomProductRule) => {
      if (rule.product_type) types.add(rule.product_type);
    });
    return Array.from(types).sort();
  }, [productRulesData]);

  // Filter rules by search query (client-side filtering for displayed results)
  const filteredProductRules =
    productRulesData?.rules?.filter((rule: CustomProductRule) => {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        return (
          rule.rule_name.toLowerCase().includes(query) ||
          rule.product_type?.toLowerCase().includes(query) ||
          rule.rule_description?.toLowerCase().includes(query)
        );
      }
      return true;
    }) || [];

  const filteredWorkflowRules =
    workflowRulesData?.rules?.filter((rule: WorkflowRule) => {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        return (
          rule.rule_name.toLowerCase().includes(query) ||
          rule.rule_description?.toLowerCase().includes(query) ||
          rule.rule_type?.toLowerCase().includes(query)
        );
      }
      return true;
    }) || [];

  const filteredRiskAppetite =
    riskAppetiteData?.configs?.filter((config: RiskAppetiteConfig) => {
      if (debouncedSearchQuery) {
        const query = debouncedSearchQuery.toLowerCase();
        return (
          config.config_name.toLowerCase().includes(query) ||
          config.config_type?.toLowerCase().includes(query) ||
          config.description?.toLowerCase().includes(query)
        );
      }
      return true;
    }) || [];

  // Calculate pagination totals
  const productTotalPages = productRulesData?.total
    ? Math.ceil(productRulesData.total / pageSize)
    : 1;
  const workflowTotalPages = workflowRulesData?.total
    ? Math.ceil(workflowRulesData.total / pageSize)
    : 1;
  const riskTotalPages = riskAppetiteData?.total
    ? Math.ceil(riskAppetiteData.total / pageSize)
    : 1;

  // Calculate statistics
  const stats = useMemo(() => {
    const productRules = productRulesData?.rules || filteredProductRules || [];
    const workflowRules =
      workflowRulesData?.rules || filteredWorkflowRules || [];
    const riskConfigs = riskAppetiteData?.configs || filteredRiskAppetite || [];

    return {
      totalProductRules: productRulesData?.total ?? productRules.length,
      activeProductRules: productRules.filter(
        (r: CustomProductRule) => r.is_active
      ).length,
      totalWorkflowRules: workflowRulesData?.total ?? workflowRules.length,
      activeWorkflowRules: workflowRules.filter(
        (r: WorkflowRule) => r.is_active
      ).length,
      totalRiskConfigs: riskAppetiteData?.total ?? riskConfigs.length,
      activeRiskConfigs: riskConfigs.filter(
        (c: RiskAppetiteConfig) => c.is_active
      ).length,
    };
  }, [
    productRulesData,
    filteredProductRules,
    workflowRulesData,
    filteredWorkflowRules,
    riskAppetiteData,
    filteredRiskAppetite,
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Rules Engine</h1>
          <p className="text-muted-foreground">
            Configure and manage decision rules for credit scoring and loan
            approval
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog
            open={visualRuleBuilderOpen}
            onOpenChange={setVisualRuleBuilderOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Palette className="mr-2 h-4 w-4" />
                Visual Builder
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-7xl overflow-hidden">
              <DialogHeader>
                <DialogTitle>Visual Rule Builder</DialogTitle>
                <DialogDescription>
                  Create and edit rules using a visual drag-and-drop interface
                </DialogDescription>
              </DialogHeader>
              <div className="h-[70vh] overflow-hidden">
                <VisualRuleBuilder
                  onSave={(rule) => {
                    // Handle saving the visual rule
                    console.log("Visual rule saved:", rule);
                    setVisualRuleBuilderOpen(false);
                  }}
                  onCancel={() => setVisualRuleBuilderOpen(false)}
                  initialRule={editingRule}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Dialog
            open={enhancedRuleTesterOpen}
            onOpenChange={setEnhancedRuleTesterOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <TestTube className="mr-2 h-4 w-4" />
                Enhanced Testing
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-hidden">
              <DialogHeader>
                <DialogTitle>Enhanced Rule Testing Sandbox</DialogTitle>
                <DialogDescription>
                  Advanced rule testing with batch processing, historical data,
                  and impact analysis
                </DialogDescription>
              </DialogHeader>
              <div className="h-[70vh] overflow-auto">
                <EnhancedRuleTester
                  onClose={() => setEnhancedRuleTesterOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>

          <Button
            onClick={() => setRuleTesterDialogOpen(true)}
            variant="outline"
            size="sm"
          >
            <Filter className="mr-2 h-4 w-4" />
            Test Rules
          </Button>
        </div>
      </div>

      {/* Enhanced Statistics Cards */}
      <DashboardSection
        title="Rules Overview"
        description="Overview of all rule types and their active status"
        icon={Settings}
      >
        <div className="grid gap-4 md:grid-cols-3">
          <EnhancedStatCard
            title="Product Rules"
            total={stats.totalProductRules}
            active={stats.activeProductRules}
            icon={Package}
            onClick={() => {
              setActiveTab("product");
              setIsActiveFilter("all");
              setProductTypeFilter("all");
            }}
          />
          <EnhancedStatCard
            title="Workflow Rules"
            total={stats.totalWorkflowRules}
            active={stats.activeWorkflowRules}
            icon={Workflow}
            onClick={() => {
              setActiveTab("workflow");
              setIsActiveFilter("all");
            }}
          />
          <EnhancedStatCard
            title="Risk Configurations"
            total={stats.totalRiskConfigs}
            active={stats.activeRiskConfigs}
            icon={Shield}
            onClick={() => {
              setActiveTab("risk");
              setIsActiveFilter("all");
            }}
          />
        </div>
      </DashboardSection>

      <DashboardSection
        title="Rule Management"
        description="Create, edit, and manage rules for automated decision-making across product rules, workflow rules, risk appetite, and approval workflows"
        icon={Code}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchProductRules();
              refetchWorkflowRules();
              refetchRiskAppetite();
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        }
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Rules Configuration</CardTitle>
                <CardDescription>
                  Manage rules by type and category
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    refetchProductRules();
                    refetchWorkflowRules();
                    refetchRiskAppetite();
                  }}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(value) => {
                setActiveTab(value);
                // Reset pagination when switching tabs
                setProductPage(1);
                setWorkflowPage(1);
                setRiskPage(1);
              }}
              className="w-full"
            >
              {/* First Row: Controls and Filters */}
              <div className="mb-4 flex flex-wrap items-center gap-2 border-b pb-4">
                {/* View Switcher - only show for product and workflow tabs */}
                {(activeTab === "product" || activeTab === "workflow") && (
                  <>
                    <div className="flex items-center gap-1">
                      <ViewSwitcher
                        currentView={viewMode}
                        onViewChange={(view) => {
                          setViewMode(view);
                          // Save to localStorage
                          localStorage.setItem("rules-view-mode", view);
                        }}
                        availableViews={
                          activeTab === "approval"
                            ? ["table"]
                            : ["table", "grid", "card", "timeline"]
                        }
                      />
                      <InfoButton
                        section="views"
                        tooltip="Learn about view options"
                      />
                    </div>
                    {viewMode === "table" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCompactView(!compactView);
                          localStorage.setItem(
                            "rules-compact-view",
                            String(!compactView)
                          );
                        }}
                        title={
                          compactView
                            ? "Switch to detailed view"
                            : "Switch to compact view"
                        }
                      >
                        {compactView ? "Detailed" : "Compact"}
                      </Button>
                    )}
                  </>
                )}
                <div className="relative flex items-center gap-1">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search rules..."
                      className="w-64 pl-8"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <InfoButton
                    section="filters"
                    tooltip="Learn about filters and search"
                  />
                </div>
                {activeTab === "product" && (
                  <Select
                    value={productTypeFilter}
                    onValueChange={handleProductTypeFilterChange}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Product Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Products</SelectItem>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select
                  value={isActiveFilter}
                  onValueChange={handleActiveFilterChange}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    if (activeTab === "product") handleCreateRule("product");
                    else if (activeTab === "workflow")
                      handleCreateRule("workflow");
                    else if (activeTab === "risk") handleCreateRule("risk");
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create{" "}
                  {activeTab === "product"
                    ? "Product"
                    : activeTab === "workflow"
                      ? "Workflow"
                      : "Risk"}{" "}
                  Rule
                </Button>
              </div>

              {/* Second Row: Tabs */}
              <div className="mb-4 flex items-center gap-2">
                <TabsList>
                  <TabsTrigger value="product">Product Rules</TabsTrigger>
                  <TabsTrigger value="workflow">Workflow Rules</TabsTrigger>
                  <TabsTrigger value="risk">Risk Appetite</TabsTrigger>
                  <TabsTrigger value="approval">Approval Workflow</TabsTrigger>
                </TabsList>
                <div className="flex items-center gap-1">
                  {activeTab === "product" && (
                    <InfoButton
                      section="product-rules"
                      tooltip="Learn about Product Rules"
                    />
                  )}
                  {activeTab === "workflow" && (
                    <InfoButton
                      section="workflow-rules"
                      tooltip="Learn about Workflow Rules"
                    />
                  )}
                  {activeTab === "risk" && (
                    <InfoButton
                      section="risk-appetite"
                      tooltip="Learn about Risk Appetite"
                    />
                  )}
                  {activeTab === "approval" && (
                    <InfoButton
                      section="approval-workflow"
                      tooltip="Learn about Approval Workflow"
                    />
                  )}
                  <InfoButton
                    section="overview"
                    tooltip="View complete documentation"
                  />
                </div>
              </div>

              <TabsContent value="product" className="space-y-4">
                {productRulesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredProductRules.length === 0 ? (
                  <RulesEmptyState
                    ruleType="product"
                    hasFilters={
                      !!debouncedSearchQuery ||
                      productTypeFilter !== "all" ||
                      isActiveFilter !== "all"
                    }
                    onCreateClick={() => handleCreateRule("product")}
                    onClearFilters={() => {
                      setSearchQuery("");
                      setProductTypeFilter("all");
                      setIsActiveFilter("all");
                    }}
                  />
                ) : (
                  <>
                    {viewMode === "table" && (
                      <CustomProductRulesTable
                        rules={filteredProductRules}
                        isLoading={productRulesLoading}
                        onEdit={(rule) => handleEditRule(rule, "product")}
                        onDelete={(id) => handleDeleteRule(id, "product")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "product")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "product")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "product")
                        }
                      />
                    )}
                    {viewMode === "grid" && (
                      <RulesGridView
                        rules={filteredProductRules}
                        ruleType="product"
                        onEdit={(rule) => handleEditRule(rule, "product")}
                        onDelete={(id) => handleDeleteRule(id, "product")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "product")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "product")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "product")
                        }
                      />
                    )}
                    {viewMode === "card" && (
                      <RulesCardView
                        rules={filteredProductRules}
                        ruleType="product"
                        onEdit={(rule) => handleEditRule(rule, "product")}
                        onDelete={(id) => handleDeleteRule(id, "product")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "product")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "product")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "product")
                        }
                      />
                    )}
                    {viewMode === "timeline" && (
                      <RulesTimelineView
                        rules={filteredProductRules}
                        ruleType="product"
                        onEdit={(rule) => handleEditRule(rule, "product")}
                        onDelete={(id) => handleDeleteRule(id, "product")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "product")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "product")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "product")
                        }
                      />
                    )}
                    {productRulesData &&
                      (productRulesData.total || 0) > pageSize && (
                        <div className="mt-4">
                          <PaginationControls
                            currentPage={productPage}
                            totalPages={productTotalPages}
                            pageSize={pageSize}
                            totalItems={
                              productRulesData.total ||
                              filteredProductRules.length
                            }
                            onPageChange={(page) => {
                              setProductPage(page);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            onPageSizeChange={(newSize) => {
                              setPageSize(newSize);
                              setProductPage(1);
                            }}
                          />
                        </div>
                      )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="workflow" className="space-y-4">
                {workflowRulesLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredWorkflowRules.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-lg text-muted-foreground">
                      {debouncedSearchQuery || isActiveFilter !== "all"
                        ? "No rules match your filters"
                        : "No workflow rules found"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {debouncedSearchQuery || isActiveFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Create your first workflow rule to get started"}
                    </p>
                  </div>
                ) : (
                  <>
                    {viewMode === "table" && (
                      <WorkflowRulesTable
                        rules={filteredWorkflowRules}
                        isLoading={workflowRulesLoading}
                        onEdit={(rule) => handleEditRule(rule, "workflow")}
                        onDelete={(id) => handleDeleteRule(id, "workflow")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "workflow")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "workflow")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "workflow")
                        }
                        compact={compactView}
                      />
                    )}
                    {viewMode === "grid" && (
                      <RulesGridView
                        rules={filteredWorkflowRules}
                        ruleType="workflow"
                        onEdit={(rule) => handleEditRule(rule, "workflow")}
                        onDelete={(id) => handleDeleteRule(id, "workflow")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "workflow")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "workflow")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "workflow")
                        }
                      />
                    )}
                    {viewMode === "card" && (
                      <RulesCardView
                        rules={filteredWorkflowRules}
                        ruleType="workflow"
                        onEdit={(rule) => handleEditRule(rule, "workflow")}
                        onDelete={(id) => handleDeleteRule(id, "workflow")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "workflow")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "workflow")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "workflow")
                        }
                      />
                    )}
                    {viewMode === "timeline" && (
                      <RulesTimelineView
                        rules={filteredWorkflowRules}
                        ruleType="workflow"
                        onEdit={(rule) => handleEditRule(rule, "workflow")}
                        onDelete={(id) => handleDeleteRule(id, "workflow")}
                        onDuplicate={(rule) =>
                          handleDuplicateRule(rule, "workflow")
                        }
                        onEvaluate={(rule) => handleTestRule(rule, "workflow")}
                        onToggleActive={(id, isActive) =>
                          handleToggleActive(id, isActive, "workflow")
                        }
                      />
                    )}
                    {workflowRulesData &&
                      (workflowRulesData.total || 0) > pageSize && (
                        <div className="mt-4">
                          <PaginationControls
                            currentPage={workflowPage}
                            totalPages={workflowTotalPages}
                            pageSize={pageSize}
                            totalItems={
                              workflowRulesData.total ||
                              filteredWorkflowRules.length
                            }
                            onPageChange={(page) => {
                              setWorkflowPage(page);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            onPageSizeChange={(newSize) => {
                              setPageSize(newSize);
                              setWorkflowPage(1);
                            }}
                          />
                        </div>
                      )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="risk" className="space-y-4">
                {riskAppetiteLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : filteredRiskAppetite.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-lg text-muted-foreground">
                      {debouncedSearchQuery || isActiveFilter !== "all"
                        ? "No configurations match your filters"
                        : "No risk appetite configurations found"}
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {debouncedSearchQuery || isActiveFilter !== "all"
                        ? "Try adjusting your search or filters"
                        : "Create your first risk appetite configuration to get started"}
                    </p>
                  </div>
                ) : (
                  <>
                    <RiskAppetiteTable
                      configs={filteredRiskAppetite}
                      isLoading={riskAppetiteLoading}
                      onEdit={(config) => handleEditRule(config, "risk")}
                      onDelete={(id) => handleDeleteRule(id, "risk")}
                      onDuplicate={(config) =>
                        handleDuplicateRule(config, "risk")
                      }
                      onToggleActive={(id, isActive) =>
                        handleToggleActive(id, isActive, "risk")
                      }
                    />
                    {riskAppetiteData &&
                      (riskAppetiteData.total || 0) > pageSize && (
                        <div className="mt-4">
                          <PaginationControls
                            currentPage={riskPage}
                            totalPages={riskTotalPages}
                            pageSize={pageSize}
                            totalItems={
                              riskAppetiteData.total ||
                              filteredRiskAppetite.length
                            }
                            onPageChange={(page) => {
                              setRiskPage(page);
                              window.scrollTo({ top: 0, behavior: "smooth" });
                            }}
                            onPageSizeChange={(newSize) => {
                              setPageSize(newSize);
                              setRiskPage(1);
                            }}
                          />
                        </div>
                      )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="approval" className="space-y-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Approval Workflow Levels
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Configure approval levels and required approvers
                    </p>
                  </div>
                  <Button onClick={() => setApprovalWorkflowDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Edit Approval Levels
                  </Button>
                </div>
                {approvalWorkflowLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : approvalWorkflowData &&
                  Array.isArray(approvalWorkflowData) &&
                  approvalWorkflowData.length > 0 ? (
                  <ApprovalWorkflowTable
                    levels={approvalWorkflowData}
                    isLoading={approvalWorkflowLoading}
                  />
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-lg text-muted-foreground">
                      No approval workflow levels found
                    </p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Click "Edit Approval Levels" to configure approval
                      workflow
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Dialogs */}
      <CustomProductRuleDialog
        open={productRuleDialogOpen}
        onOpenChange={(open) => {
          setProductRuleDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        rule={editingRule}
        onSuccess={() => {
          refetchProductRules();
          setProductPage(1); // Reset to first page after creating new rule
        }}
      />

      <WorkflowRuleDialog
        open={workflowRuleDialogOpen}
        onOpenChange={(open) => {
          setWorkflowRuleDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        rule={editingRule}
        onSuccess={() => {
          refetchWorkflowRules();
          setWorkflowPage(1);
        }}
      />

      <RiskAppetiteDialog
        open={riskAppetiteDialogOpen}
        onOpenChange={(open) => {
          setRiskAppetiteDialogOpen(open);
          if (!open) setEditingRule(null);
        }}
        config={editingRule}
        onSuccess={() => {
          refetchRiskAppetite();
          setRiskPage(1);
        }}
      />

      <ApprovalWorkflowDialog
        open={approvalWorkflowDialogOpen}
        onOpenChange={setApprovalWorkflowDialogOpen}
        onSuccess={() => {
          // Refetch approval workflow data
        }}
      />

      <RuleTesterDialog
        open={ruleTesterDialogOpen}
        onOpenChange={setRuleTesterDialogOpen}
        ruleType={testRuleType}
      />
    </div>
  );
}
