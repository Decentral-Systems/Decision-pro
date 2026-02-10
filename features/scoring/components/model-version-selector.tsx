"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useGetModelVersions } from "@/features/ml/hooks/query/use-get-model-versions";
import { useAuditLogger } from "@/lib/utils/audit-logger";
import { AlertTriangle, GitBranch, Info } from "lucide-react";
import { startTransition, useEffect, useState } from "react";
import { getVersionStatus } from "../utils/scoring.utils";

interface ModelVersionSelectorProps {
  modelId?: string;
  selectedVersion?: string;
  onVersionChange?: (versionId: string, reason?: string) => void;
  showABTesting?: boolean;
  className?: string;
}

export function ModelVersionSelector({
  modelId = "credit_scoring_ensemble",
  selectedVersion,
  onVersionChange,
  showABTesting = false,
  className,
}: ModelVersionSelectorProps) {
  const [localSelectedVersion, setLocalSelectedVersion] = useState<
    string | undefined
  >(selectedVersion);
  const [showChangeDialog, setShowChangeDialog] = useState(false);
  const [changeReason, setChangeReason] = useState("");
  const [abTestEnabled, setAbTestEnabled] = useState(false);
  const { logModelVersionChange } = useAuditLogger();
  const { versions, isLoading, error } = useGetModelVersions({ modelId });

  useEffect(() => {
    if (selectedVersion) {
      startTransition(() => setLocalSelectedVersion(selectedVersion));
      return;
    }
    if (versions?.length) {
      const activeVersion = versions.find((v) => v.is_active || v.is_deployed);
      if (activeVersion) {
        startTransition(() =>
          setLocalSelectedVersion(activeVersion.version_id)
        );
      }
    }
  }, [selectedVersion, versions]);

  const selectedVersionData = versions?.find(
    (v) => v.version_id === localSelectedVersion
  );

  const handleVersionChange = async (newVersionId: string) => {
    if (newVersionId === localSelectedVersion) return;

    // If version is different, show dialog for reason
    setShowChangeDialog(true);
    setLocalSelectedVersion(newVersionId);
  };

  const confirmVersionChange = async () => {
    if (!localSelectedVersion) return;

    const oldVersion = selectedVersionData?.version || "unknown";
    const newVersion =
      versions?.find((v) => v.version_id === localSelectedVersion)?.version ||
      "unknown";

    // Log version change to audit trail
    await logModelVersionChange(
      oldVersion,
      newVersion,
      changeReason || "User selected new version"
    );

    // Call parent callback
    onVersionChange?.(localSelectedVersion, changeReason || undefined);

    setShowChangeDialog(false);
    setChangeReason("");
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Model Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Loading model versions...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !versions || versions.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Model Version
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {error
                ? "Failed to load model versions"
                : "No model versions available"}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Model Version
              </CardTitle>
              <CardDescription>
                Select model version for credit scoring predictions
              </CardDescription>
            </div>
            {showABTesting && (
              <Button
                variant={abTestEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => setAbTestEnabled(!abTestEnabled)}
              >
                A/B Test
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Select Model Version</Label>
            <Select
              value={localSelectedVersion}
              onValueChange={handleVersionChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select version" />
              </SelectTrigger>
              <SelectContent>
                {versions.map((version) => {
                  const status = getVersionStatus(version);
                  const StatusIcon = status.icon;
                  return (
                    <SelectItem
                      key={version.version_id}
                      value={version.version_id}
                    >
                      <div className="flex items-center gap-2">
                        <StatusIcon className="h-4 w-4" />
                        <span className="font-medium">{version.version}</span>
                        {version.is_beta && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            Beta
                          </Badge>
                        )}
                        <span className="ml-2 text-xs text-muted-foreground">
                          (Acc: {(version.accuracy * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Selected Version Details */}
          {selectedVersionData && (
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Version Details</span>
                {selectedVersionData.is_beta && (
                  <Badge
                    variant="outline"
                    className="border-yellow-200 bg-yellow-50 text-yellow-800"
                  >
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Beta
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Accuracy</div>
                  <div className="font-semibold">
                    {(selectedVersionData.accuracy * 100).toFixed(2)}%
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">AUC ROC</div>
                  <div className="font-semibold">
                    {selectedVersionData.auc_roc.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">F1 Score</div>
                  <div className="font-semibold">
                    {selectedVersionData.f1_score.toFixed(3)}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Status</div>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const status = getVersionStatus(selectedVersionData);
                      const StatusIcon = status.icon;
                      return StatusIcon ? (
                        <StatusIcon className="h-3 w-3" />
                      ) : null;
                    })()}
                    <span className="text-xs">
                      {getVersionStatus(selectedVersionData).label}
                    </span>
                  </div>
                </div>
              </div>

              {selectedVersionData.stability_metrics && (
                <div className="space-y-2 border-t pt-2">
                  <div className="text-xs font-medium text-muted-foreground">
                    Stability Metrics
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div className="font-semibold">
                        {selectedVersionData.stability_metrics.uptime_percentage.toFixed(
                          1
                        )}
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Error Rate</div>
                      <div className="font-semibold">
                        {selectedVersionData.stability_metrics.error_rate.toFixed(
                          2
                        )}
                        %
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Latency</div>
                      <div className="font-semibold">
                        {selectedVersionData.stability_metrics.avg_latency_ms.toFixed(
                          0
                        )}
                        ms
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedVersionData.deployment_date && (
                <div className="text-xs text-muted-foreground">
                  Deployed:{" "}
                  {new Date(
                    selectedVersionData.deployment_date
                  ).toLocaleDateString()}
                </div>
              )}

              {selectedVersionData.is_beta && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="text-xs">
                    This is a beta version. Use with caution and monitor
                    performance closely.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* A/B Testing Info */}
          {showABTesting && abTestEnabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                A/B testing is enabled. Requests will be randomly assigned to
                different model versions.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Version Change Confirmation Dialog */}
      <Dialog open={showChangeDialog} onOpenChange={setShowChangeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Model Version</DialogTitle>
            <DialogDescription>
              Please provide a reason for changing the model version. This will
              be logged to the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Reason for Change</Label>
              <Textarea
                placeholder="e.g., Testing new model performance, addressing specific issue, A/B testing..."
                value={changeReason}
                onChange={(e) => setChangeReason(e.target.value)}
                rows={3}
              />
            </div>
            {selectedVersionData && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  Changing from{" "}
                  {versions?.find((v) => v.version_id === selectedVersion)
                    ?.version || "current"}
                  to {selectedVersionData.version}
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowChangeDialog(false);
                setLocalSelectedVersion(selectedVersion); // Revert
              }}
            >
              Cancel
            </Button>
            <Button onClick={confirmVersionChange}>Confirm Change</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
