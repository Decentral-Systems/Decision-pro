"use client";

import { useParams, useRouter } from "next/navigation";
import { navigateTo } from "@/lib/utils/navigation";
import { useState } from "react";
import { useCustomer360 } from "@/lib/api/hooks/useCustomers";
import { Customer360View } from "@/components/customer/Customer360View";
import { CustomerReportExport } from "@/components/customer/CustomerReportExport";
import { CustomerEditDialog } from "@/components/customer/CustomerEditDialog";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Edit,
  Download,
  Activity,
  History,
  TrendingUp,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { transformCustomer360Data } from "@/lib/utils/customer360Transform";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { CustomerAlertsBanner } from "@/components/customer/CustomerAlertsBanner";
import { ModelExplanations } from "@/components/customer/ModelExplanations";
import { CustomerTimeline } from "@/components/customer/CustomerTimeline";
import { exportToPDF } from "@/lib/utils/exportHelpers";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { useMemo } from "react";
import { formatCurrency } from "@/lib/utils/format";
import { CustomerTrendsChart } from "@/components/charts/CustomerTrendsChart";

export default function Customer360Page() {
  const params = useParams();
  const router = useRouter();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  // Decode customer ID from URL (in case it contains special characters)
  const rawCustomerId = params.id as string;
  const customerId = rawCustomerId ? decodeURIComponent(rawCustomerId) : null;

  const { data, isLoading, error, refetch, isError } =
    useCustomer360(customerId);

  // Generate alerts from customer data
  const alerts = useMemo(() => {
    if (!data) return [];
    const alertsList = [];

    // Check for overdue payments
    if (data.loans && Array.isArray(data.loans)) {
      data.loans.forEach((loan: any) => {
        if (loan.status === "overdue" || loan.days_past_due > 0) {
          alertsList.push({
            type: "overdue" as const,
            severity: loan.days_past_due > 30 ? "critical" : ("high" as const),
            title: "Overdue Payment",
            description: `Loan ${loan.loan_id} is ${loan.days_past_due} days overdue`,
            amount: loan.outstanding_balance,
            dueDate: loan.next_payment_date,
          });
        }
      });
    }

    // Check for KYC expiry
    if (data.kyc_expiry_date) {
      const expiryDate = new Date(data.kyc_expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      );
      if (daysUntilExpiry < 30) {
        alertsList.push({
          type: "kyc_expiry" as const,
          severity: daysUntilExpiry < 7 ? "critical" : ("high" as const),
          title: "KYC Expiry Warning",
          description: `KYC documents expire in ${daysUntilExpiry} days`,
          dueDate: data.kyc_expiry_date,
        });
      }
    }

    // Check compliance flags
    if (
      data.compliance_flags &&
      Array.isArray(data.compliance_flags) &&
      data.compliance_flags.length > 0
    ) {
      data.compliance_flags.forEach((flag: any) => {
        alertsList.push({
          type: "compliance" as const,
          severity: flag.severity || ("medium" as const),
          title: flag.title || "Compliance Issue",
          description: flag.description || flag.message,
        });
      });
    }

    return alertsList;
  }, [data]);

  // Generate model explanations from credit history
  const modelExplanations = useMemo(() => {
    if (!data?.credit_history || !Array.isArray(data.credit_history)) return [];
    return data.credit_history
      .filter((h: any) => h.explanations || h.feature_contributions)
      .map((h: any) => ({
        model_version: h.model_version || "N/A",
        prediction_id: h.prediction_id || h.id,
        score: h.credit_score || 0,
        features: h.feature_contributions || h.explanations?.features || [],
        timestamp: h.created_at || h.timestamp,
        correlation_id: h.correlation_id,
      }));
  }, [data]);

  // Generate timeline events
  const timelineEvents = useMemo(() => {
    if (!data) return [];
    const events = [];

    // Credit decisions
    if (data.credit_history && Array.isArray(data.credit_history)) {
      data.credit_history.forEach((h: any) => {
        events.push({
          id: `credit_${h.id}`,
          type: "credit_decision" as const,
          title: `Credit Score: ${h.credit_score}`,
          description: `Credit decision made with ${h.model_version || "N/A"} model`,
          timestamp: h.created_at || h.timestamp,
          status:
            h.recommendation === "approve"
              ? "approved"
              : h.recommendation === "reject"
                ? "rejected"
                : "pending",
          correlation_id: h.correlation_id,
        });
      });
    }

    // Loan applications
    if (data.loans && Array.isArray(data.loans)) {
      data.loans.forEach((loan: any) => {
        events.push({
          id: `loan_${loan.loan_id}`,
          type: "loan_application" as const,
          title: `Loan Application: ${loan.loan_id}`,
          description: `${formatCurrency(loan.loan_amount)} loan`,
          timestamp: loan.application_date || loan.created_at,
          status: loan.status,
          amount: loan.loan_amount,
          linked_loan_id: loan.loan_id,
        });
      });
    }

    // Payments
    if (data.payments && Array.isArray(data.payments)) {
      data.payments.forEach((payment: any) => {
        events.push({
          id: `payment_${payment.id}`,
          type: "payment" as const,
          title: `Payment: ${formatCurrency(payment.amount)}`,
          description:
            payment.status === "completed"
              ? "Payment completed"
              : "Payment pending",
          timestamp: payment.payment_date || payment.created_at,
          status: payment.status === "completed" ? "completed" : "pending",
          amount: payment.amount,
        });
      });
    }

    return events.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [data]);

  // Show error if customer ID is missing
  if (!customerId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Customer 360</h1>
            <p className="text-muted-foreground">Invalid customer ID</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with Breadcrumb and Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigateTo("/customers")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Customer 360</h1>
            <p className="text-muted-foreground">
              Comprehensive customer profile and analytics
              {customerId && (
                <span className="ml-2 font-mono text-sm">({customerId})</span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/api/customers" label="Live" />
          {data && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const correlationId = getOrCreateCorrelationId();
                  const htmlContent = `
                    <html>
                      <head><title>Customer 360 Report - ${customerId}</title></head>
                      <body>
                        <h1>Customer 360 Report</h1>
                        <p>Customer ID: ${customerId}</p>
                        <p>Generated: ${new Date().toISOString()}</p>
                        <p>Correlation ID: ${correlationId}</p>
                        <h2>Overview</h2>
                        <p>Credit Score: ${data.credit_score || "N/A"}</p>
                        <p>Risk Level: ${data.risk_level || "N/A"}</p>
                      </body>
                    </html>
                  `;
                  await exportToPDF(htmlContent, `customer_360_${customerId}`, {
                    includeSignature: true,
                    version: "1.0.0",
                  });
                }}
              >
                <Download className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <CustomerReportExport data={transformCustomer360Data(data)} />
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDialogOpen(true)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </div>
      </div>

      {/* Alerts Banner */}
      {alerts.length > 0 && (
        <CustomerAlertsBanner
          alerts={alerts}
          customerId={customerId || undefined}
        />
      )}

      {/* Customer 360 View */}
      <Customer360View
        data={data || undefined}
        isLoading={isLoading}
        error={error}
        onRetry={() => {
          refetch();
        }}
        customerId={customerId || undefined}
        onEditClick={() => setEditDialogOpen(true)}
      />

      {/* Additional Sections */}
      {data && (
        <>
          {/* Timeline */}
          {timelineEvents.length > 0 && (
            <DashboardSection
              title="Customer Timeline"
              description="Complete history of customer interactions, loans, payments, and credit decisions"
              icon={History}
            >
              <CustomerTimeline
                events={timelineEvents}
                customerId={customerId || undefined}
              />
            </DashboardSection>
          )}

          {/* Model Explanations */}
          {modelExplanations.length > 0 && (
            <DashboardSection
              title="Model Explanations"
              description="AI model explanations and feature contributions for credit decisions"
              icon={Activity}
            >
              <ModelExplanations explanations={modelExplanations} />
            </DashboardSection>
          )}

          {/* Customer Trends */}
          {customerId && (
            <DashboardSection
              title="Customer Trends"
              description="Historical trends and patterns in customer behavior and credit performance"
              icon={TrendingUp}
            >
              <CustomerTrendsChart customerId={customerId} />
            </DashboardSection>
          )}
        </>
      )}

      {/* Edit Dialog */}
      {customerId && (
        <CustomerEditDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          customerId={customerId}
          customerData={data}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </div>
  );
}
