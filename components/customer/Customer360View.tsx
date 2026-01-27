"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, RefreshCw } from "lucide-react";
import { transformCustomer360Data } from "@/lib/utils/customer360Transform";
import type { Customer360Data } from "@/lib/utils/customer360Transform";
import { CustomerOverview } from "./CustomerOverview";
import { CustomerProfile } from "./CustomerProfile";
import { CustomerCreditHistory } from "./CustomerCreditHistory";
import { CustomerFeaturesView } from "./CustomerFeaturesView";
import { CustomerLoansPortfolio } from "./CustomerLoansPortfolio";
import { CustomerRiskAssessment } from "./CustomerRiskAssessment";
import { CustomerPayments } from "./CustomerPayments";
import { CustomerJourney } from "./CustomerJourney";
import { CustomerJourneyTimeline } from "./CustomerJourneyTimeline";
import { CustomerIntelligence } from "./CustomerIntelligence";
import { CustomerNotes } from "./CustomerNotes";
import { CustomerActivityTimeline } from "./CustomerActivityTimeline";

interface Customer360ViewProps {
  data: Customer360Data | null | undefined;
  isLoading: boolean;
  error: Error | null;
  onRetry?: () => void;
  customerId?: string;
  onEditClick?: () => void;
}

export function Customer360View({
  data,
  isLoading,
  error,
  onRetry,
  customerId,
  onEditClick,
}: Customer360ViewProps) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Error loading customer data: {error.message || "Unknown error occurred"}
            </span>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // Show "no data" message only if we're not loading and have no error
  // This means the API returned null/empty (404 handled gracefully)
  if (!data && !isLoading && !error) {
    return (
      <Card>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div className="flex-1">
              <p className="font-medium mb-1">Customer Not Found</p>
              <p className="text-sm text-muted-foreground">
                The customer may not exist in the system or you may not have permission to view it.
                Please verify the customer ID is correct.
              </p>
            </div>
            {onRetry && (
              <Button variant="outline" size="sm" onClick={onRetry} className="ml-4">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </Card>
    );
  }

  // Transform data to ensure consistent structure
  const transformedData = transformCustomer360Data(data);

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="credit">Credit</TabsTrigger>
          <TabsTrigger value="features">Features</TabsTrigger>
          <TabsTrigger value="loans">Loans</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="journey">Journey</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-6">
          <CustomerOverview data={transformedData} />
        </TabsContent>

        <TabsContent value="profile" className="space-y-4 mt-6">
          <CustomerProfile data={transformedData} onEditClick={onEditClick} />
        </TabsContent>

        <TabsContent value="credit" className="space-y-4 mt-6">
          <CustomerCreditHistory data={transformedData} />
        </TabsContent>

        <TabsContent value="features" className="space-y-4 mt-6">
          <CustomerFeaturesView data={transformedData} />
        </TabsContent>

        <TabsContent value="loans" className="space-y-4 mt-6">
          <CustomerLoansPortfolio data={transformedData} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4 mt-6">
          <CustomerRiskAssessment data={transformedData} />
        </TabsContent>

        <TabsContent value="payments" className="space-y-4 mt-6">
          <CustomerPayments data={transformedData} />
        </TabsContent>

        <TabsContent value="journey" className="space-y-4 mt-6">
          {customerId ? (
            <CustomerJourneyTimeline customerId={customerId} />
          ) : (
            <CustomerJourney data={transformedData} />
          )}
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4 mt-6">
          <CustomerIntelligence data={transformedData} customerId={customerId} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-6">
          {customerId ? (
            <CustomerNotes customerId={customerId} />
          ) : (
            <Card>
              <Card className="p-6 text-center text-muted-foreground">
                Customer ID is required to view notes
              </Card>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

