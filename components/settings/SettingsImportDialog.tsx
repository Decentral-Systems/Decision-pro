"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useImportSettings } from "@/lib/api/hooks/useSettings";
import { useToast } from "@/hooks/use-toast";

interface SettingsImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SettingsImportDialog({ open, onOpenChange, onSuccess }: SettingsImportDialogProps) {
  const [importJson, setImportJson] = React.useState("");
  const [validateOnly, setValidateOnly] = React.useState(false);
  const [overwrite, setOverwrite] = React.useState(false);
  const [validationResult, setValidationResult] = React.useState<any>(null);
  const importMutation = useImportSettings();
  const { toast } = useToast();

  const handleValidate = async () => {
    try {
      const settings = JSON.parse(importJson);
      const result = await importMutation.mutateAsync({
        settings,
        options: { validateOnly: true, overwrite },
      });
      setValidationResult(result);
      
      if (result.valid) {
        toast({
          title: "Validation Successful",
          description: "Settings are valid and ready to import",
        });
      } else {
        toast({
          title: "Validation Failed",
          description: "Please fix the errors before importing",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Validation Error",
        description: error.message || "Invalid JSON format",
        variant: "destructive",
      });
      setValidationResult({
        valid: false,
        errors: [error.message || "Invalid JSON format"],
      });
    }
  };

  const handleImport = async () => {
    try {
      const settings = JSON.parse(importJson);
      const result = await importMutation.mutateAsync({
        settings,
        options: { validateOnly: false, overwrite },
      });

      toast({
        title: "Settings Imported",
        description: "Settings have been successfully imported",
      });

      setImportJson("");
      setValidationResult(null);
      onOpenChange(false);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Failed to import settings",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setImportJson("");
    setValidationResult(null);
    onOpenChange(false);
  };

  const isJsonValid = React.useMemo(() => {
    if (!importJson.trim()) return false;
    try {
      JSON.parse(importJson);
      return true;
    } catch {
      return false;
    }
  }, [importJson]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Settings</DialogTitle>
          <DialogDescription>
            Import settings from JSON. You can validate first before importing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="validate-only"
                checked={validateOnly}
                onCheckedChange={(checked) => setValidateOnly(checked as boolean)}
              />
              <Label htmlFor="validate-only" className="text-sm font-normal">
                Validate only (don't import)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="overwrite"
                checked={overwrite}
                onCheckedChange={(checked) => setOverwrite(checked as boolean)}
              />
              <Label htmlFor="overwrite" className="text-sm font-normal">
                Overwrite existing settings
              </Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="import-json">Settings JSON</Label>
            <Textarea
              id="import-json"
              placeholder='{"system": {"auto_refresh_interval": 30, ...}, ...}'
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              className="font-mono text-sm min-h-[300px]"
            />
            {!isJsonValid && importJson.trim() && (
              <p className="text-sm text-destructive">Invalid JSON format</p>
            )}
          </div>

          {validationResult && (
            <Alert
              variant={validationResult.valid ? "default" : "destructive"}
              className={validationResult.valid ? "border-green-500" : ""}
            >
              {validationResult.valid ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {validationResult.valid ? "Validation Successful" : "Validation Failed"}
              </AlertTitle>
              <AlertDescription>
                {validationResult.valid ? (
                  <div>
                    <p>Settings are valid and ready to import.</p>
                    {validationResult.warnings && validationResult.warnings.length > 0 && (
                      <div className="mt-2">
                        <p className="font-medium">Warnings:</p>
                        <ul className="list-disc list-inside mt-1">
                          {validationResult.warnings.map((warning: string, idx: number) => (
                            <li key={idx} className="text-sm">{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {validationResult.errors && validationResult.errors.length > 0 && (
                      <ul className="list-disc list-inside mt-1">
                        {validationResult.errors.map((error: string, idx: number) => (
                          <li key={idx} className="text-sm">{error}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={importMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleValidate}
            disabled={!isJsonValid || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              "Validate"
            )}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!isJsonValid || !validationResult?.valid || importMutation.isPending}
          >
            {importMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              "Import"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
