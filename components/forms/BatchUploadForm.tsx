"use client";
import React, { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileText, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { validateCSVFile, CSVValidationResult } from "@/lib/utils/csvValidator";

interface BatchUploadFormProps {
  onUpload: (file: File) => Promise<void>;
  isUploading?: boolean;
  progress?: number;
}

export function BatchUploadForm({
  onUpload,
  isUploading = false,
  progress = 0,
}: BatchUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<CSVValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (selectedFile: File) => {
    setError(null);
    setValidationResult(null);
    setIsValidating(true);
    
    // Validate file type
    if (!selectedFile.name.endsWith(".csv")) {
      setError("Please select a CSV file");
      setIsValidating(false);
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("File size must be less than 10MB");
      setIsValidating(false);
      return;
    }

    try {
      // Validate CSV structure
      const validation = await validateCSVFile(selectedFile);
      setValidationResult(validation);

      if (!validation.valid) {
        setError(validation.errors.join('; '));
        setIsValidating(false);
        return;
      }

      setFile(selectedFile);

      // Format preview with headers and first few rows
      if (validation.preview.length > 0) {
        const formattedPreview = validation.preview
          .map(row => row.join(', '))
          .join('\n');
        setPreview(formattedPreview);
      }
    } catch (err: any) {
      setError(`Validation error: ${err.message}`);
    } finally {
      setIsValidating(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a file");
      return;
    }

    try {
      await onUpload(file);
    } catch (err: any) {
      setError(err.message || "Upload failed");
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload CSV File</CardTitle>
        <CardDescription>
          Upload a CSV file containing customer data for batch credit scoring
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              file
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {!file ? (
              <div className="space-y-4">
                <Upload className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    Drag and drop your CSV file here
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    or click to browse
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0];
                    if (selectedFile) {
                      handleFileSelect(selectedFile);
                    }
                  }}
                  className="hidden"
                  id="csv-upload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <FileText className="h-8 w-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleRemove}
                    disabled={isUploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {preview && (
                  <div className="mt-4 text-left">
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <pre className="text-xs bg-muted p-3 rounded overflow-auto max-h-32">
                      {preview}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {isValidating && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>Validating CSV file...</AlertDescription>
            </Alert>
          )}

          {validationResult && validationResult.valid && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <div className="space-y-1">
                  <p>CSV file validated successfully</p>
                  <p className="text-sm">
                    {validationResult.rowCount} row(s) found with {validationResult.headers.length} column(s)
                  </p>
                  {validationResult.warnings.length > 0 && (
                    <div className="text-sm mt-2">
                      <p className="font-medium">Warnings:</p>
                      <ul className="list-disc list-inside">
                        {validationResult.warnings.map((warning, idx) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1">
                  <p>{error}</p>
                  {validationResult && validationResult.errors.length > 0 && (
                    <ul className="list-disc list-inside text-sm mt-2">
                      {validationResult.errors.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          <Button
            type="submit"
            disabled={!file || isUploading || isValidating || (validationResult ? !validationResult.valid : false)}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload and Process
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

