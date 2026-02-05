"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Filter,
  Download,
  BarChart3,
  Clock,
  CheckCircle2,
  FolderOpen,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import {
  useLoanDocuments,
  useUploadLoanDocument,
  useVerifyDocument,
  useDocumentExpiryAlerts,
} from "@/lib/api/hooks/useLoans";
import { format } from "date-fns";
import { exportToCSV } from "@/lib/utils/exportHelpers";

function DocumentsPageContent() {
  const { toast } = useToast();
  const [selectedLoanId, setSelectedLoanId] = useState<number | null>(null);
  const [documentTypeFilter, setDocumentTypeFilter] = useState<string>("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  
  const [uploadFormData, setUploadFormData] = useState({
    file: null as File | null,
    documentType: "id_card",
    documentName: "",
    hasExpiry: false,
    expiryDate: "",
  });
  
  const [verificationNotes, setVerificationNotes] = useState("");

  const { data: documentsData, isLoading: documentsLoading, refetch: refetchDocuments } = useLoanDocuments(
    selectedLoanId,
    documentTypeFilter !== "all" ? documentTypeFilter : undefined
  );

  const { data: expiryAlerts, isLoading: alertsLoading } = useDocumentExpiryAlerts();

  const uploadMutation = useUploadLoanDocument();
  const verifyMutation = useVerifyDocument();

  const documents = documentsData?.data?.documents || [];
  const alerts = expiryAlerts?.data?.alerts || [];

  // Calculate analytics
  const analytics = React.useMemo(() => {
    const total = documents.length;
    const verified = documents.filter((d: any) => d.verification_status === "verified").length;
    const pending = documents.filter((d: any) => !d.verification_status || d.verification_status === "pending").length;
    const rejected = documents.filter((d: any) => d.verification_status === "rejected").length;
    const expired = documents.filter((d: any) => {
      const status = getExpiryStatus(d.expiry_date);
      return status?.status === "expired";
    }).length;
    const expiringSoon = documents.filter((d: any) => {
      const status = getExpiryStatus(d.expiry_date);
      return status?.status === "expiring_soon";
    }).length;

    const byType = documents.reduce((acc: Record<string, number>, doc: any) => {
      const type = doc.document_type || "unknown";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    return {
      total,
      verified,
      pending,
      rejected,
      expired,
      expiringSoon,
      byType,
      verificationRate: total > 0 ? (verified / total) * 100 : 0,
    };
  }, [documents]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFormData({ ...uploadFormData, file });
    }
  };

  const handleUpload = async () => {
    if (!selectedLoanId || !uploadFormData.file || !uploadFormData.documentName) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select a file",
        variant: "destructive",
      });
      return;
    }

    try {
      await uploadMutation.mutateAsync({
        loanApplicationId: selectedLoanId,
        file: uploadFormData.file,
        documentType: uploadFormData.documentType,
        documentName: uploadFormData.documentName,
        hasExpiry: uploadFormData.hasExpiry,
        expiryDate: uploadFormData.hasExpiry ? uploadFormData.expiryDate : undefined,
      });
      
      setUploadDialogOpen(false);
      setUploadFormData({
        file: null,
        documentType: "id_card",
        documentName: "",
        hasExpiry: false,
        expiryDate: "",
      });
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const handleVerify = async () => {
    if (!selectedDocument || !verificationNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide verification notes",
        variant: "destructive",
      });
      return;
    }

    try {
      await verifyMutation.mutateAsync({
        documentId: selectedDocument.document_id,
        verificationNotes: verificationNotes,
      });
      
      setVerifyDialogOpen(false);
      setSelectedDocument(null);
      setVerificationNotes("");
    } catch (error: any) {
      // Error handled by mutation
    }
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      id_card: "ID Card",
      proof_of_income: "Proof of Income",
      bank_statement: "Bank Statement",
      employment_letter: "Employment Letter",
      business_registration: "Business Registration",
      collateral_document: "Collateral Document",
      guarantor_document: "Guarantor Document",
      other: "Other",
    };
    return labels[type] || type;
  };

  const getVerificationStatusBadge = (status: string) => {
    if (status === "verified") {
      return <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Verified</Badge>;
    } else if (status === "rejected") {
      return <Badge className="bg-red-500/10 text-red-700 dark:text-red-400">Rejected</Badge>;
    } else {
      return <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">Pending</Badge>;
    }
  };

  const getExpiryStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { status: "expired", days: Math.abs(daysUntilExpiry), label: "Expired" };
    } else if (daysUntilExpiry <= 30) {
      return { status: "expiring_soon", days: daysUntilExpiry, label: "Expiring Soon" };
    } else {
      return { status: "valid", days: daysUntilExpiry, label: "Valid" };
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Document Management</h1>
          <p className="text-muted-foreground">
            Upload, verify, and manage loan application documents
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedLoanId && documents.length > 0 && (
            <Button variant="outline" onClick={() => {
              const exportData = documents.map((doc: any) => ({
                "Document Name": doc.document_name,
                "Type": getDocumentTypeLabel(doc.document_type),
                "File Name": doc.file_name,
                "Verification Status": doc.verification_status || "pending",
                "Uploaded": doc.uploaded_at ? format(new Date(doc.uploaded_at), "yyyy-MM-dd") : "N/A",
                "Expiry Date": doc.expiry_date ? format(new Date(doc.expiry_date), "yyyy-MM-dd") : "N/A",
              }));
              exportToCSV(exportData, `documents_loan_${selectedLoanId}_${format(new Date(), "yyyy-MM-dd")}`);
              toast({
                title: "Success",
                description: "Documents exported to CSV",
              });
            }}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          )}
          <Button variant="outline" onClick={() => refetchDocuments()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          {selectedLoanId && (
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Document
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Upload Document</DialogTitle>
                  <DialogDescription>
                    Upload a document for loan application {selectedLoanId}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">File</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    />
                    {uploadFormData.file && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Selected: {uploadFormData.file.name}
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="document_type">Document Type</Label>
                    <Select
                      value={uploadFormData.documentType}
                      onValueChange={(value) => setUploadFormData({ ...uploadFormData, documentType: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="id_card">ID Card</SelectItem>
                        <SelectItem value="proof_of_income">Proof of Income</SelectItem>
                        <SelectItem value="bank_statement">Bank Statement</SelectItem>
                        <SelectItem value="employment_letter">Employment Letter</SelectItem>
                        <SelectItem value="business_registration">Business Registration</SelectItem>
                        <SelectItem value="collateral_document">Collateral Document</SelectItem>
                        <SelectItem value="guarantor_document">Guarantor Document</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="document_name">Document Name</Label>
                    <Input
                      id="document_name"
                      value={uploadFormData.documentName}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, documentName: e.target.value })}
                      placeholder="Enter document name"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="has_expiry"
                      checked={uploadFormData.hasExpiry}
                      onChange={(e) => setUploadFormData({ ...uploadFormData, hasExpiry: e.target.checked })}
                      className="rounded"
                    />
                    <Label htmlFor="has_expiry">Document has expiry date</Label>
                  </div>
                  {uploadFormData.hasExpiry && (
                    <div>
                      <Label htmlFor="expiry_date">Expiry Date</Label>
                      <Input
                        id="expiry_date"
                        type="date"
                        value={uploadFormData.expiryDate}
                        onChange={(e) => setUploadFormData({ ...uploadFormData, expiryDate: e.target.value })}
                      />
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? "Uploading..." : "Upload"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Analytics Dashboard */}
      {selectedLoanId && documents.length > 0 && (
        <DashboardSection
          title="Document Analytics"
          description="Document statistics including verification status, expiry alerts, and document type distribution"
          icon={BarChart3}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.total}</div>
              <p className="text-xs text-muted-foreground">
                {Object.keys(analytics.byType).length} document types
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.verified}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.verificationRate.toFixed(1)}% verification rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Verification</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.pending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting verification
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.expiringSoon}</div>
              <p className="text-xs text-muted-foreground">
                {analytics.expired > 0 && `${analytics.expired} expired`}
              </p>
          </CardContent>
        </Card>
        </div>
        </DashboardSection>
      )}

      {/* Loan Selection and Filters */}
      <DashboardSection
        title="Filters"
        description="Filter documents by loan application ID and document type"
        icon={Filter}
      >
        <Card>
          <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Loan Application ID</Label>
              <Input
                type="number"
                placeholder="Enter loan application ID"
                value={selectedLoanId || ""}
                onChange={(e) => setSelectedLoanId(e.target.value ? parseInt(e.target.value) : null)}
              />
            </div>
            <div>
              <Label>Document Type</Label>
              <Select value={documentTypeFilter} onValueChange={setDocumentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="id_card">ID Card</SelectItem>
                  <SelectItem value="proof_of_income">Proof of Income</SelectItem>
                  <SelectItem value="bank_statement">Bank Statement</SelectItem>
                  <SelectItem value="employment_letter">Employment Letter</SelectItem>
                  <SelectItem value="business_registration">Business Registration</SelectItem>
                  <SelectItem value="collateral_document">Collateral Document</SelectItem>
                  <SelectItem value="guarantor_document">Guarantor Document</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          </CardContent>
        </Card>
      </DashboardSection>

      {/* Expiry Alerts */}
      {alerts.length > 0 && (
        <DashboardSection
          title="Document Expiry Alerts"
          description="Documents approaching expiry or expired requiring attention"
          icon={AlertTriangle}
          badge={{ label: `${alerts.length} Alerts`, variant: "warning" }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Expiry Warnings</CardTitle>
              <CardDescription>Documents approaching expiry or expired</CardDescription>
            </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((alert: any, index: number) => (
                <div key={index} className="border rounded-lg p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{alert.document_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Loan Application #{alert.loan_application_id} • {getDocumentTypeLabel(alert.document_type)}
                    </p>
                    {alert.expiry_date && (
                      <p className="text-sm text-muted-foreground">
                        Expires: {format(new Date(alert.expiry_date), "MMM dd, yyyy")}
                      </p>
                    )}
                  </div>
                  <Badge variant="destructive">
                    {getExpiryStatus(alert.expiry_date)?.label || "Expired"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
          </Card>
        </DashboardSection>
      )}

      {/* Documents List */}
      {selectedLoanId && (
        <DashboardSection
          title="Documents"
          description={`Documents for loan application ${selectedLoanId} with verification status and expiry tracking`}
          icon={FolderOpen}
        >
          <Card>
            <CardHeader>
              <CardTitle>Document List</CardTitle>
              <CardDescription>
                Documents for loan application {selectedLoanId}
              </CardDescription>
            </CardHeader>
          <CardContent>
            {documentsLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No documents found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((doc: any) => {
                  const expiryStatus = getExpiryStatus(doc.expiry_date);
                  return (
                    <div key={doc.document_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-medium">{doc.document_name}</h3>
                            {getVerificationStatusBadge(doc.verification_status || "pending")}
                            {expiryStatus && (
                              <Badge
                                className={
                                  expiryStatus.status === "expired"
                                    ? "bg-red-500/10 text-red-700"
                                    : expiryStatus.status === "expiring_soon"
                                    ? "bg-yellow-500/10 text-yellow-700"
                                    : "bg-green-500/10 text-green-700"
                                }
                              >
                                {expiryStatus.label}
                              </Badge>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                            <div>
                              <span className="font-medium">Type:</span> {getDocumentTypeLabel(doc.document_type)}
                            </div>
                            <div>
                              <span className="font-medium">File:</span> {doc.file_name}
                            </div>
                            <div>
                              <span className="font-medium">Uploaded:</span>{" "}
                              {doc.uploaded_at
                                ? format(new Date(doc.uploaded_at), "MMM dd, yyyy")
                                : "N/A"}
                            </div>
                            {doc.expiry_date && (
                              <div>
                                <span className="font-medium">Expires:</span>{" "}
                                {format(new Date(doc.expiry_date), "MMM dd, yyyy")}
                              </div>
                            )}
                          </div>
                          {doc.verification_notes && (
                            <div className="mt-2 text-sm">
                              <span className="font-medium">Verification Notes:</span>{" "}
                              <span className="text-muted-foreground">{doc.verification_notes}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {doc.verification_status !== "verified" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(doc);
                                setVerifyDialogOpen(true);
                              }}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Verify
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
        </DashboardSection>
      )}

      {!selectedLoanId && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Enter a loan application ID to view and manage documents
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verify Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Document</DialogTitle>
            <DialogDescription>
              Verify document: {selectedDocument?.document_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="verification_notes">Verification Notes</Label>
              <Textarea
                id="verification_notes"
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                placeholder="Enter verification notes..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setVerifyDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleVerify}
                disabled={verifyMutation.isPending || !verificationNotes.trim()}
              >
                {verifyMutation.isPending ? "Verifying..." : "Verify Document"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <ErrorBoundary>
      <DocumentsPageContent />
    </ErrorBoundary>
  );
}
