"use client";

import React, { useState } from "react";
import { useOverdueLoans, useInitiateCollectionWorkflow, useRecordCollectionAction, useCollectionEffectiveness, useCollectionWorkload } from "@/lib/api/hooks/useLoans";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Calendar, RefreshCw, Plus, TrendingUp, BarChart3, Users, Activity } from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function CollectionsPageContent() {
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionFormData, setActionFormData] = useState({
    collection_id: "",
    action_type: "phone_call",
    contact_method: "phone",
    customer_response: "",
    promise_to_pay: false,
    promise_date: "",
    promise_amount: "",
    notes: "",
  });
  const [filters, setFilters] = useState({
    days_overdue_min: 1,
    days_overdue_max: undefined as number | undefined,
  });
  
  const { data: overdueLoans, isLoading, refetch } = useOverdueLoans(filters);
  const { data: effectiveness, isLoading: effectivenessLoading } = useCollectionEffectiveness();
  const { data: workload, isLoading: workloadLoading } = useCollectionWorkload();
  const initiateWorkflowMutation = useInitiateCollectionWorkflow();
  const recordActionMutation = useRecordCollectionAction();
  const { toast } = useToast();
  
  const handleInitiateWorkflow = async (loanId: number) => {
    try {
      await initiateWorkflowMutation.mutateAsync(loanId);
      refetch();
    } catch (error: any) {
      // Error handled by mutation
    }
  };
  
  const handleRecordAction = async () => {
    if (!actionFormData.collection_id || !actionFormData.action_type) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await recordActionMutation.mutateAsync({
        collection_id: actionFormData.collection_id,
        action_type: actionFormData.action_type,
        contact_method: actionFormData.contact_method,
        customer_response: actionFormData.customer_response,
        customer_response_notes: actionFormData.notes,
        promise_to_pay: actionFormData.promise_to_pay,
        promise_date: actionFormData.promise_date || null,
        promise_amount: actionFormData.promise_amount ? parseFloat(actionFormData.promise_amount) : null,
      });
      setIsActionDialogOpen(false);
      setActionFormData({
        collection_id: "",
        action_type: "phone_call",
        contact_method: "phone",
        customer_response: "",
        promise_to_pay: false,
        promise_date: "",
        promise_amount: "",
        notes: "",
      });
      refetch();
    } catch (error: any) {
      // Error handled by mutation
    }
  };
  
  const getDaysOverdueBadge = (days: number) => {
    if (days <= 30) {
      return <Badge className="bg-yellow-500">1-30 Days</Badge>;
    } else if (days <= 60) {
      return <Badge className="bg-orange-500">31-60 Days</Badge>;
    } else if (days <= 90) {
      return <Badge className="bg-red-500">61-90 Days</Badge>;
    } else {
      return <Badge className="bg-red-700">90+ Days</Badge>;
    }
  };
  
  const loans = overdueLoans?.data || [];
  const effectivenessData = effectiveness?.data || {};
  const workloadData = workload?.data || {};

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
    }).format(amount || 0);
  };

  const formatPercent = (value: number) => {
    return `${(value * 100).toFixed(2)}%`;
  };
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Collection Management</h1>
          <p className="text-muted-foreground">
            Manage collection workflows for overdue loans
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Record Action
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Record Collection Action</DialogTitle>
                <DialogDescription>
                  Record a collection action (call, visit, etc.)
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="collection_id">Collection ID</Label>
                  <Input
                    id="collection_id"
                    value={actionFormData.collection_id}
                    onChange={(e) => setActionFormData({ ...actionFormData, collection_id: e.target.value })}
                    placeholder="COL-20240101-ABC123"
                  />
                </div>
                <div>
                  <Label htmlFor="action_type">Action Type</Label>
                  <Select
                    value={actionFormData.action_type}
                    onValueChange={(value) => setActionFormData({ ...actionFormData, action_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone_call">Phone Call</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_person_visit">In-Person Visit</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="contact_method">Contact Method</Label>
                  <Select
                    value={actionFormData.contact_method}
                    onValueChange={(value) => setActionFormData({ ...actionFormData, contact_method: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="in_person">In Person</SelectItem>
                      <SelectItem value="letter">Letter</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="customer_response">Customer Response</Label>
                  <Textarea
                    id="customer_response"
                    value={actionFormData.customer_response}
                    onChange={(e) => setActionFormData({ ...actionFormData, customer_response: e.target.value })}
                    placeholder="Enter customer response..."
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="promise_to_pay"
                    checked={actionFormData.promise_to_pay}
                    onChange={(e) => setActionFormData({ ...actionFormData, promise_to_pay: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="promise_to_pay">Promise to Pay</Label>
                </div>
                {actionFormData.promise_to_pay && (
                  <>
                    <div>
                      <Label htmlFor="promise_date">Promise Date</Label>
                      <Input
                        id="promise_date"
                        type="date"
                        value={actionFormData.promise_date}
                        onChange={(e) => setActionFormData({ ...actionFormData, promise_date: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="promise_amount">Promise Amount (ETB)</Label>
                      <Input
                        id="promise_amount"
                        type="number"
                        value={actionFormData.promise_amount}
                        onChange={(e) => setActionFormData({ ...actionFormData, promise_amount: e.target.value })}
                      />
                    </div>
                  </>
                )}
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={actionFormData.notes}
                    onChange={(e) => setActionFormData({ ...actionFormData, notes: e.target.value })}
                    placeholder="Additional notes..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsActionDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleRecordAction}
                    disabled={recordActionMutation.isPending}
                  >
                    {recordActionMutation.isPending ? "Recording..." : "Record Action"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Collection Effectiveness Metrics */}
      <DashboardSection
        title="Collection Metrics"
        description="Key performance indicators for collection effectiveness and workload"
        icon={Activity}
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {effectivenessLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {formatPercent(effectivenessData.collection_rate || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(effectivenessData.total_collected || 0)} collected
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {workloadLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {workloadData.active_cases || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {workloadData.resolved_cases || 0} resolved
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Resolution</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {effectivenessLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {effectivenessData.average_resolution_days || 0} days
                </div>
                <p className="text-xs text-muted-foreground">
                  Average time to resolve
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Officers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {workloadLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {workloadData.total_officers || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {workloadData.average_cases_per_officer || 0} cases per officer
                </p>
              </>
            )}
          </CardContent>
        </Card>
        </div>
      </DashboardSection>
      
      <DashboardSection
        title="Overdue Loans"
        description="Loans requiring collection action with filtering and workflow management"
        icon={AlertCircle}
        actions={
          <div className="flex items-center space-x-2">
            <Input
              type="number"
              placeholder="Min days overdue"
              className="w-32"
              value={filters.days_overdue_min || ""}
              onChange={(e) => setFilters({ ...filters, days_overdue_min: e.target.value ? parseInt(e.target.value) : 1 })}
            />
            <Input
              type="number"
              placeholder="Max days overdue"
              className="w-32"
              value={filters.days_overdue_max || ""}
              onChange={(e) => setFilters({ ...filters, days_overdue_max: e.target.value ? parseInt(e.target.value) : undefined })}
            />
          </div>
        }
      >
        <Card>
          <CardHeader>
            <CardTitle>Overdue Loans List</CardTitle>
            <CardDescription>
              Loans requiring collection action
            </CardDescription>
          </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : loans.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No overdue loans found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Application #</TableHead>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Overdue Amount</TableHead>
                  <TableHead>Outstanding Balance</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan: any) => (
                  <TableRow key={loan.loan_application_id}>
                    <TableCell className="font-medium">
                      {loan.loan_application_id}
                    </TableCell>
                    <TableCell>{loan.application_number || "N/A"}</TableCell>
                    <TableCell>{loan.customer_id}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <span>{loan.days_overdue}</span>
                        {getDaysOverdueBadge(loan.days_overdue)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(loan.total_overdue_amount || 0)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat("en-ET", {
                        style: "currency",
                        currency: "ETB",
                      }).format(loan.outstanding_balance || 0)}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleInitiateWorkflow(loan.loan_application_id)}
                        disabled={initiateWorkflowMutation.isPending}
                      >
                        Initiate Workflow
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        </Card>
      </DashboardSection>
    </div>
  );
}

export default function CollectionsPage() {
  return (
    <ErrorBoundary>
      <CollectionsPageContent />
    </ErrorBoundary>
  );
}
