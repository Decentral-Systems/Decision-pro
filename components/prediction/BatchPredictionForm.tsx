"use client";
import React, { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Upload, 
  FileText, 
  Download, 
  AlertCircle, 
  CheckCircle2,
  X,
  Plus,
  Trash2,
  Play,
  Edit2
} from "lucide-react";
import { 
  useBatchPrediction, 
  useBatchFileParser,
  BatchPredictionInput 
} from "@/lib/api/hooks/useBatchPrediction";
import { BatchProgressIndicator } from "./BatchProgressIndicator";
import { BatchPredictionResults } from "./BatchPredictionResults";

interface BatchPredictionFormProps {
  onComplete?: (results: any) => void;
  className?: string;
}

/**
 * BatchPredictionForm Component
 * 
 * Allows users to upload files or enter data for batch predictions
 */
export function BatchPredictionForm({
  onComplete,
  className,
}: BatchPredictionFormProps) {
  const [inputMethod, setInputMethod] = useState<"file" | "manual">("file");
  const [manualEntries, setManualEntries] = useState<BatchPredictionInput[]>([]);
  const [chunkSize, setChunkSize] = useState<number>(10);
  const [showResults, setShowResults] = useState(false);

  const { 
    parsedData, 
    parseError, 
    validationErrors, 
    parseFile, 
    reset: resetParser 
  } = useBatchFileParser();

  const {
    isProcessing,
    progress,
    results,
    error: processingError,
    startBatch,
    cancel,
    reset: resetBatch,
  } = useBatchPrediction();

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await parseFile(file);
  }, [parseFile]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await parseFile(file);
  }, [parseFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const addManualEntry = () => {
    setManualEntries(prev => [...prev, {
      customer_id: '',
      loan_amount: 0,
      loan_term_months: 12,
      monthly_income: 0,
      employment_status: 'employed',
    }]);
  };

  const updateManualEntry = (index: number, field: string, value: any) => {
    setManualEntries(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const removeManualEntry = (index: number) => {
    setManualEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handleStartBatch = async () => {
    const inputs = inputMethod === "file" ? parsedData : manualEntries;
    if (!inputs || inputs.length === 0) return;

    const result = await startBatch(inputs, { chunkSize });
    setShowResults(true);
    onComplete?.(result);
  };

  const handleReset = () => {
    resetParser();
    resetBatch();
    setManualEntries([]);
    setShowResults(false);
  };

  const inputData = inputMethod === "file" ? parsedData : manualEntries;
  const canStart = inputData && inputData.length > 0 && !isProcessing;

  if (showResults && results.length > 0) {
    return (
      <div className={cn("space-y-6", className)}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Batch Prediction Results</h2>
          <Button variant="outline" onClick={handleReset}>
            <Plus className="h-4 w-4 mr-2" />
            New Batch
          </Button>
        </div>
        <BatchPredictionResults results={results} progress={progress} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Batch Default Prediction</CardTitle>
          <CardDescription>
            Upload a file or manually enter customer data for batch processing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Input Method Tabs */}
          <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as "file" | "manual")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="file">
                <Upload className="h-4 w-4 mr-2" />
                File Upload
              </TabsTrigger>
              <TabsTrigger value="manual">
                <Edit2 className="h-4 w-4 mr-2" />
                Manual Entry
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file" className="space-y-4">
              {/* File Upload Area */}
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                  "hover:border-primary hover:bg-primary/5",
                  parsedData && "border-green-500 bg-green-50 dark:bg-green-950/20"
                )}
              >
                {parsedData ? (
                  <div className="space-y-2">
                    <CheckCircle2 className="h-12 w-12 mx-auto text-green-500" />
                    <p className="font-medium text-green-700 dark:text-green-300">
                      {parsedData.length} records loaded
                    </p>
                    <Button variant="outline" size="sm" onClick={resetParser}>
                      <X className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                    <div>
                      <p className="font-medium">Drop your file here or click to browse</p>
                      <p className="text-sm text-muted-foreground">
                        Supports CSV and JSON files
                      </p>
                    </div>
                    <Input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileUpload}
                      className="max-w-xs mx-auto"
                    />
                  </div>
                )}
              </div>

              {/* Parse Errors */}
              {parseError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{parseError}</AlertDescription>
                </Alert>
              )}

              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <p className="font-medium mb-2">Validation errors:</p>
                    <ul className="list-disc list-inside text-sm">
                      {validationErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* File Format Help */}
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Required columns:</p>
                <ul className="list-disc list-inside">
                  <li>customer_id - Customer identifier</li>
                  <li>loan_amount - Loan amount in ETB</li>
                  <li>loan_term_months - Loan term in months</li>
                </ul>
                <p className="mt-2">Optional: monthly_income, employment_status</p>
              </div>

              {/* Download Template */}
              <Button variant="outline" size="sm" onClick={() => downloadTemplate()}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4">
              {/* Manual Entry Table */}
              {manualEntries.length > 0 ? (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer ID</TableHead>
                        <TableHead>Loan Amount</TableHead>
                        <TableHead>Term (months)</TableHead>
                        <TableHead>Income</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manualEntries.map((entry, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <Input
                              value={entry.customer_id}
                              onChange={(e) => updateManualEntry(index, 'customer_id', e.target.value)}
                              placeholder="CUST001"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.loan_amount}
                              onChange={(e) => updateManualEntry(index, 'loan_amount', parseFloat(e.target.value))}
                              placeholder="50000"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.loan_term_months}
                              onChange={(e) => updateManualEntry(index, 'loan_term_months', parseInt(e.target.value))}
                              placeholder="12"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={entry.monthly_income || ''}
                              onChange={(e) => updateManualEntry(index, 'monthly_income', parseFloat(e.target.value))}
                              placeholder="25000"
                              className="h-8"
                            />
                          </TableCell>
                          <TableCell>
                            <Select
                              value={entry.employment_status || 'employed'}
                              onValueChange={(v) => updateManualEntry(index, 'employment_status', v)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employed">Employed</SelectItem>
                                <SelectItem value="self_employed">Self-Employed</SelectItem>
                                <SelectItem value="unemployed">Unemployed</SelectItem>
                                <SelectItem value="retired">Retired</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeManualEntry(index)}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8 border rounded-lg">
                  <p className="text-muted-foreground mb-4">No entries yet. Add customers to process.</p>
                </div>
              )}

              <Button variant="outline" onClick={addManualEntry}>
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
            </TabsContent>
          </Tabs>

          {/* Processing Options */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Label htmlFor="chunkSize">Chunk Size:</Label>
              <Select
                value={String(chunkSize)}
                onValueChange={(v) => setChunkSize(parseInt(v))}
              >
                <SelectTrigger id="chunkSize" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inputData && inputData.length > 0 && (
              <Badge variant="secondary">
                {inputData.length} items ready
              </Badge>
            )}
          </div>

          {/* Progress Indicator */}
          {isProcessing && (
            <BatchProgressIndicator
              progress={progress}
              isProcessing={isProcessing}
              onCancel={cancel}
            />
          )}

          {/* Processing Error */}
          {processingError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{processingError}</AlertDescription>
            </Alert>
          )}
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="outline" onClick={handleReset}>
            Clear All
          </Button>
          <Button 
            onClick={handleStartBatch} 
            disabled={!canStart}
          >
            <Play className="h-4 w-4 mr-2" />
            Start Batch Processing
          </Button>
        </CardFooter>
      </Card>

      {/* Data Preview */}
      {inputData && inputData.length > 0 && !isProcessing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Data Preview</CardTitle>
            <CardDescription>
              Showing first 5 of {inputData.length} records
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer ID</TableHead>
                  <TableHead>Loan Amount</TableHead>
                  <TableHead>Term</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inputData.slice(0, 5).map((item, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-mono">{item.customer_id}</TableCell>
                    <TableCell>{item.loan_amount?.toLocaleString()} ETB</TableCell>
                    <TableCell>{item.loan_term_months} months</TableCell>
                    <TableCell>{item.monthly_income?.toLocaleString() || '-'}</TableCell>
                    <TableCell>{item.employment_status || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Helper function to download CSV template
function downloadTemplate() {
  const template = `customer_id,loan_amount,loan_term_months,monthly_income,employment_status
CUST001,50000,12,25000,employed
CUST002,100000,24,40000,self_employed
CUST003,75000,18,30000,employed`;

  const blob = new Blob([template], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'batch_prediction_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default BatchPredictionForm;


