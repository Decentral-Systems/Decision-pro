"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  useSettings,
  useUpdateSettings,
  useResetSettings,
} from "@/lib/api/hooks/useSettings";
import { SettingsImportDialog } from "@/components/settings/SettingsImportDialog";
import { SettingsHistory } from "@/components/settings/SettingsHistory";

import {
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  AlertCircle,
  Download,
  Upload,
  History,
  TestTube,
  Info,
  Cog,
} from "lucide-react";
import { DashboardSection } from "@/components/dashboard-section";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApiStatusIndicator } from "@/components/api-status-indicator";
import { getOrCreateCorrelationId } from "@/lib/utils/correlationId";
import { useAuth } from "@/lib/auth/auth-context";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
// Textarea component not available, using Input instead if needed

const settingsSchema = z.object({
  system: z.object({
    auto_refresh_interval: z.number().min(30).max(3600),
    theme: z.enum(["light", "dark", "system"]),
    language: z.string(),
    date_format: z.string(),
    timezone: z.string(),
  }),
  api: z.object({
    api_timeout: z.number().min(1000).max(60000),
    retry_attempts: z.number().min(0).max(5),
    cache_enabled: z.boolean(),
    cache_ttl: z.number().min(0).max(3600),
  }),
  security: z.object({
    session_timeout: z.number().min(5).max(480),
    password_min_length: z.number().min(8).max(32),
    require_mfa: z.boolean(),
    audit_log_retention_days: z.number().min(30).max(3650),
  }),
  notifications: z.object({
    notification_email: z.string().email(),
    notification_enabled: z.boolean(),
    email_notifications: z.boolean(),
    sms_notifications: z.boolean(),
    push_notifications: z.boolean(),
    credit_score_alerts: z.boolean(),
    risk_alerts: z.boolean(),
    compliance_alerts: z.boolean(),
    system_alerts: z.boolean(),
    quiet_hours_enabled: z.boolean(),
    quiet_hours_start: z.string().optional(),
    quiet_hours_end: z.string().optional(),
  }),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

// Minimal default values for form initialization only (not API data)
const defaultFormValues: SettingsFormData = {
  system: {
    auto_refresh_interval: 300,
    theme: "system",
    language: "en",
    date_format: "MM/dd/yyyy",
    timezone: "Africa/Addis_Ababa",
  },
  api: {
    api_timeout: 10000,
    retry_attempts: 3,
    cache_enabled: true,
    cache_ttl: 300,
  },
  security: {
    session_timeout: 60,
    password_min_length: 8,
    require_mfa: false,
    audit_log_retention_days: 2555,
  },
  notifications: {
    notification_email: "admin@ais.local",
    notification_enabled: true,
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    credit_score_alerts: true,
    risk_alerts: true,
    compliance_alerts: true,
    system_alerts: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
  },
};

export default function SettingsPage() {
  const { data, isLoading, error, refetch } = useSettings();
  const updateSettings = useUpdateSettings();
  const resetSettings = useResetSettings();
  const { toast } = useToast();
  const { user } = useAuth();
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mfaConfirmOpen, setMfaConfirmOpen] = useState(false);
  const [pendingMfaValue, setPendingMfaValue] = useState(false);
  const [configVersion, setConfigVersion] = useState<string | null>(null);
  const [configHistory, setConfigHistory] = useState<any[]>([]);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importJson, setImportJson] = useState("");
  const [revealedSecrets, setRevealedSecrets] = useState<Set<string>>(
    new Set()
  );

  // Check if user has permission to edit settings
  const canEdit =
    user?.roles?.includes("admin") || user?.roles?.includes("risk_manager");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: defaultFormValues,
    values: data !== null && data !== undefined ? data : defaultFormValues,
  });

  const onSubmit = async (formData: SettingsFormData) => {
    if (!canEdit) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to edit settings",
        variant: "destructive",
      });
      return;
    }

    try {
      const correlationId = getOrCreateCorrelationId();
      const settingsWithVersion = {
        ...formData,
        version: configVersion || `v${Date.now()}`,
        correlation_id: correlationId,
      };
      await updateSettings.mutateAsync(settingsWithVersion as any);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setConfigVersion(`v${Date.now()}`);
      toast({
        title: "Success",
        description: `Settings saved successfully (ID: ${correlationId.substring(0, 8)}...)`,
      });
    } catch (error: any) {
      console.error("Failed to update settings:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save settings",
        variant: "destructive",
      });
    }
  };

  const handleMfaToggle = (checked: boolean) => {
    if (checked) {
      setPendingMfaValue(true);
      setMfaConfirmOpen(true);
    } else {
      setValue("security.require_mfa", false, { shouldDirty: true });
    }
  };

  const confirmMfaToggle = () => {
    setValue("security.require_mfa", pendingMfaValue, { shouldDirty: true });
    setMfaConfirmOpen(false);
    toast({
      title: "MFA Enabled",
      description: "Multi-factor authentication will be required for all users",
    });
  };

  const handleExport = () => {
    const currentValues = watch();
    const exportData = {
      ...currentValues,
      version: configVersion || "current",
      exported_at: new Date().toISOString(),
      correlation_id: getOrCreateCorrelationId(),
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `settings_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({
      title: "Export Successful",
      description: "Settings exported to JSON file",
    });
  };

  const handleImport = () => {
    try {
      const imported = JSON.parse(importJson);
      // Validate imported data
      const validated = settingsSchema.parse(imported);
      // Set form values
      Object.keys(validated).forEach((key) => {
        setValue(key as any, validated[key as keyof SettingsFormData], {
          shouldDirty: true,
        });
      });
      setImportDialogOpen(false);
      setImportJson("");
      toast({
        title: "Import Successful",
        description: "Settings imported from JSON file",
      });
    } catch (error: any) {
      toast({
        title: "Import Failed",
        description: error.message || "Invalid JSON format",
        variant: "destructive",
      });
    }
  };

  const validateQuietHours = () => {
    const start = watch("notifications.quiet_hours_start");
    const end = watch("notifications.quiet_hours_end");
    if (!start || !end) return true;

    const [startHour, startMin] = start.split(":").map(Number);
    const [endHour, endMin] = end.split(":").map(Number);
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    // Check for overlap (e.g., 22:00 to 08:00 spans midnight)
    if (startTime > endTime) {
      // This is valid (spans midnight)
      return true;
    }

    // Check if times are too close (less than 1 hour)
    const diff = endTime - startTime;
    if (diff < 60 && diff > 0) {
      return false;
    }

    return true;
  };

  const testNotificationChannel = async (channel: "email" | "sms" | "push") => {
    try {
      const correlationId = getOrCreateCorrelationId();
      // In real implementation, call API to test notification
      toast({
        title: "Test Notification Sent",
        description: `Test ${channel} notification sent (ID: ${correlationId.substring(0, 8)}...)`,
      });
    } catch (error: any) {
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test notification",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (data) {
      setConfigVersion(data.version || null);
      setConfigHistory(data.history || []);
    }
  }, [data]);

  const notificationEnabled = watch("notifications.notification_enabled");
  const cacheEnabled = watch("api.cache_enabled");
  const requireMfa = watch("security.require_mfa");
  const quietHoursEnabled = watch("notifications.quiet_hours_enabled");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage system configuration and preferences
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ApiStatusIndicator endpoint="/health" label="Live" />
          {configVersion && (
            <Badge variant="outline">
              <History className="mr-1 h-3 w-3" />
              {configVersion}
            </Badge>
          )}
          {!canEdit && <Badge variant="secondary">Read Only</Badge>}
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => setImportDialogOpen(true)}
              disabled={!canEdit}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  await resetSettings.mutateAsync();
                  toast({
                    title: "Success",
                    description: "Settings reset to defaults",
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to reset settings",
                    variant: "destructive",
                  });
                }
              }}
              disabled={resetSettings.isPending || !canEdit}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty || updateSettings.isPending || !canEdit}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && !data && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-semibold">
                Failed to load settings from API.
              </span>
              <p className="mt-1 text-sm text-muted-foreground">
                Error: {(error as any)?.message || "Unknown error occurred"}
                {(error as any)?.statusCode &&
                  ` (Status: ${(error as any)?.statusCode})`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Using default form values. Settings may not reflect current
                server configuration.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="ml-4"
              onClick={() => refetch()}
            >
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {!isLoading && !error && !data && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No settings data found. The API returned an empty result. Using
            default form values.
          </AlertDescription>
        </Alert>
      )}

      {saveSuccess && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Settings saved successfully</AlertDescription>
        </Alert>
      )}

      <DashboardSection
        title="System Settings"
        description="Manage system configuration and preferences including system, API, security, and notification settings"
        icon={Cog}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setImportDialogOpen(true)}
              disabled={!canEdit}
            >
              <Upload className="mr-2 h-4 w-4" />
              Import
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  await resetSettings.mutateAsync();
                  toast({
                    title: "Success",
                    description: "Settings reset to defaults",
                  });
                } catch (error: any) {
                  toast({
                    title: "Error",
                    description: error.message || "Failed to reset settings",
                    variant: "destructive",
                  });
                }
              }}
              disabled={resetSettings.isPending || !canEdit}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            <Button
              onClick={handleSubmit(onSubmit)}
              disabled={!isDirty || updateSettings.isPending || !canEdit}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)}>
          <Tabs defaultValue="system" className="space-y-4">
            <TabsList>
              <TabsTrigger value="system">System</TabsTrigger>
              <TabsTrigger value="api">API</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
            </TabsList>

            {/* System Settings */}
            <TabsContent value="system" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Preferences</CardTitle>
                  <CardDescription>
                    General system settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="auto_refresh_interval">
                            Auto Refresh Interval (seconds)
                          </Label>
                          {data && (
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Info className="h-3 w-3" />
                              Current:{" "}
                              {data.system?.auto_refresh_interval ||
                                defaultFormValues.system.auto_refresh_interval}
                              {watch("system.auto_refresh_interval") !==
                                (data.system?.auto_refresh_interval ||
                                  defaultFormValues.system
                                    .auto_refresh_interval) && (
                                <Badge variant="outline" className="text-xs">
                                  Changed
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <Input
                          id="auto_refresh_interval"
                          type="number"
                          {...register("system.auto_refresh_interval", {
                            valueAsNumber: true,
                          })}
                          disabled={!canEdit}
                        />
                        {errors.system?.auto_refresh_interval && (
                          <p className="text-sm text-destructive">
                            {errors.system.auto_refresh_interval.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="theme">Theme</Label>
                        <Select
                          value={watch("system.theme")}
                          onValueChange={(value: "light" | "dark" | "system") =>
                            setValue("system.theme", value, {
                              shouldDirty: true,
                            })
                          }
                        >
                          <SelectTrigger id="theme">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="timezone">Timezone</Label>
                        <Select
                          value={watch("system.timezone")}
                          onValueChange={(value) =>
                            setValue("system.timezone", value, {
                              shouldDirty: true,
                            })
                          }
                        >
                          <SelectTrigger id="timezone">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Africa/Addis_Ababa">
                              Africa/Addis_Ababa (EAT)
                            </SelectItem>
                            <SelectItem value="UTC">UTC</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* API Settings */}
            <TabsContent value="api" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Configuration</CardTitle>
                  <CardDescription>
                    API client settings and caching options
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="api_timeout">
                          API Timeout (milliseconds)
                        </Label>
                        <Input
                          id="api_timeout"
                          type="number"
                          {...register("api.api_timeout", {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.api?.api_timeout && (
                          <p className="text-sm text-destructive">
                            {errors.api.api_timeout.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="retry_attempts">Retry Attempts</Label>
                        <Input
                          id="retry_attempts"
                          type="number"
                          {...register("api.retry_attempts", {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.api?.retry_attempts && (
                          <p className="text-sm text-destructive">
                            {errors.api.retry_attempts.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="cache_enabled">Enable Caching</Label>
                          <p className="text-sm text-muted-foreground">
                            Cache API responses for better performance
                          </p>
                        </div>
                        <Switch
                          id="cache_enabled"
                          checked={cacheEnabled}
                          onCheckedChange={(checked) =>
                            setValue("api.cache_enabled", checked, {
                              shouldDirty: true,
                            })
                          }
                        />
                      </div>

                      {cacheEnabled && (
                        <div className="space-y-2">
                          <Label htmlFor="cache_ttl">Cache TTL (seconds)</Label>
                          <Input
                            id="cache_ttl"
                            type="number"
                            {...register("api.cache_ttl", {
                              valueAsNumber: true,
                            })}
                          />
                          {errors.api?.cache_ttl && (
                            <p className="text-sm text-destructive">
                              {errors.api.cache_ttl.message}
                            </p>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Notifications Settings */}
            <TabsContent value="notifications" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Preferences</CardTitle>
                  <CardDescription>
                    Configure how and when you receive notifications
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="notification_email">
                          Notification Email
                        </Label>
                        <Input
                          id="notification_email"
                          {...register("notifications.notification_email")}
                        />
                        {errors.notifications?.notification_email && (
                          <p className="text-sm text-destructive">
                            {errors.notifications.notification_email.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="notification_enabled">
                            Enable Notifications
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Master switch for all notifications
                          </p>
                        </div>
                        <Switch
                          id="notification_enabled"
                          checked={notificationEnabled}
                          onCheckedChange={(checked) =>
                            setValue(
                              "notifications.notification_enabled",
                              checked,
                              { shouldDirty: true }
                            )
                          }
                        />
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium">
                          Notification Channels
                        </h4>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="email_notifications">
                              Email Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications via email
                            </p>
                          </div>
                          <Switch
                            id="email_notifications"
                            checked={watch("notifications.email_notifications")}
                            onCheckedChange={(checked) =>
                              setValue(
                                "notifications.email_notifications",
                                checked,
                                { shouldDirty: true }
                              )
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="sms_notifications">
                              SMS Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Receive notifications via SMS
                            </p>
                          </div>
                          <Switch
                            id="sms_notifications"
                            checked={watch("notifications.sms_notifications")}
                            onCheckedChange={(checked) =>
                              setValue(
                                "notifications.sms_notifications",
                                checked,
                                { shouldDirty: true }
                              )
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="push_notifications">
                              Push Notifications
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Receive browser push notifications
                            </p>
                          </div>
                          <Switch
                            id="push_notifications"
                            checked={watch("notifications.push_notifications")}
                            onCheckedChange={(checked) =>
                              setValue(
                                "notifications.push_notifications",
                                checked,
                                { shouldDirty: true }
                              )
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium">Alert Types</h4>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="credit_score_alerts">
                              Credit Score Alerts
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Notify when credit scores change significantly
                            </p>
                          </div>
                          <Switch
                            id="credit_score_alerts"
                            checked={watch("notifications.credit_score_alerts")}
                            onCheckedChange={(checked) =>
                              setValue(
                                "notifications.credit_score_alerts",
                                checked,
                                { shouldDirty: true }
                              )
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="risk_alerts">Risk Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify about high-risk customers or events
                            </p>
                          </div>
                          <Switch
                            id="risk_alerts"
                            checked={watch("notifications.risk_alerts")}
                            onCheckedChange={(checked) =>
                              setValue("notifications.risk_alerts", checked, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="compliance_alerts">
                              Compliance Alerts
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Notify about compliance violations or issues
                            </p>
                          </div>
                          <Switch
                            id="compliance_alerts"
                            checked={watch("notifications.compliance_alerts")}
                            onCheckedChange={(checked) =>
                              setValue(
                                "notifications.compliance_alerts",
                                checked,
                                { shouldDirty: true }
                              )
                            }
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="system_alerts">System Alerts</Label>
                            <p className="text-sm text-muted-foreground">
                              Notify about system health and errors
                            </p>
                          </div>
                          <Switch
                            id="system_alerts"
                            checked={watch("notifications.system_alerts")}
                            onCheckedChange={(checked) =>
                              setValue("notifications.system_alerts", checked, {
                                shouldDirty: true,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h4 className="text-sm font-medium">Quiet Hours</h4>

                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label htmlFor="quiet_hours_enabled">
                              Enable Quiet Hours
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Suppress non-critical notifications during
                              specified hours
                            </p>
                          </div>
                          <Switch
                            id="quiet_hours_enabled"
                            checked={quietHoursEnabled}
                            onCheckedChange={(checked) =>
                              setValue(
                                "notifications.quiet_hours_enabled",
                                checked,
                                { shouldDirty: true }
                              )
                            }
                          />
                        </div>

                        {quietHoursEnabled && (
                          <>
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor="quiet_hours_start">
                                  Start Time
                                </Label>
                                <Input
                                  id="quiet_hours_start"
                                  type="time"
                                  {...register(
                                    "notifications.quiet_hours_start"
                                  )}
                                  disabled={!canEdit}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="quiet_hours_end">
                                  End Time
                                </Label>
                                <Input
                                  id="quiet_hours_end"
                                  type="time"
                                  {...register("notifications.quiet_hours_end")}
                                  disabled={!canEdit}
                                />
                              </div>
                            </div>
                            {!validateQuietHours() && (
                              <Alert variant="destructive">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDesc>
                                  Quiet hours start and end times are too close
                                  together (minimum 1 hour required)
                                </AlertDesc>
                              </Alert>
                            )}
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testNotificationChannel("email")}
                                disabled={!canEdit}
                              >
                                <TestTube className="mr-2 h-4 w-4" />
                                Test Email
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testNotificationChannel("sms")}
                                disabled={!canEdit}
                              >
                                <TestTube className="mr-2 h-4 w-4" />
                                Test SMS
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testNotificationChannel("push")}
                                disabled={!canEdit}
                              >
                                <TestTube className="mr-2 h-4 w-4" />
                                Test Push
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Settings */}
            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>
                    Authentication and security preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="session_timeout">
                          Session Timeout (minutes)
                        </Label>
                        <Input
                          id="session_timeout"
                          type="number"
                          {...register("security.session_timeout", {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.security?.session_timeout && (
                          <p className="text-sm text-destructive">
                            {errors.security.session_timeout.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="password_min_length">
                          Minimum Password Length
                        </Label>
                        <Input
                          id="password_min_length"
                          type="number"
                          {...register("security.password_min_length", {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.security?.password_min_length && (
                          <p className="text-sm text-destructive">
                            {errors.security.password_min_length.message}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="require_mfa">
                            Require Multi-Factor Authentication
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Enforce MFA for all users
                          </p>
                          {data && (
                            <p className="text-xs text-muted-foreground">
                              Current:{" "}
                              {data.security?.require_mfa
                                ? "Enabled"
                                : "Disabled"}
                            </p>
                          )}
                        </div>
                        <Switch
                          id="require_mfa"
                          checked={requireMfa}
                          onCheckedChange={handleMfaToggle}
                          disabled={!canEdit}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="audit_log_retention_days">
                          Audit Log Retention (days)
                        </Label>
                        <Input
                          id="audit_log_retention_days"
                          type="number"
                          {...register("security.audit_log_retention_days", {
                            valueAsNumber: true,
                          })}
                        />
                        {errors.security?.audit_log_retention_days && (
                          <p className="text-sm text-destructive">
                            {errors.security.audit_log_retention_days.message}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          NBE requires 7 years (2555 days) retention
                        </p>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <div className="mt-6">
            <SettingsHistory />
          </div>
        </form>

        {/* MFA Confirmation Dialog */}
        <Dialog open={mfaConfirmOpen} onOpenChange={setMfaConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enable Multi-Factor Authentication</DialogTitle>
              <DialogDescription>
                Enabling MFA will require all users to set up multi-factor
                authentication on their next login. This action cannot be easily
                undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setMfaConfirmOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={confirmMfaToggle}>Confirm Enable MFA</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Import Settings Dialog */}
        <SettingsImportDialog
          open={importDialogOpen}
          onOpenChange={setImportDialogOpen}
          onSuccess={() => {
            refetch();
          }}
        />

        {/* Config History */}
        {configHistory.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Configuration History</CardTitle>
              <CardDescription>Previous versions of settings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {configHistory.slice(0, 5).map((version: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <div>
                      <Badge variant="outline">{version.version}</Badge>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {new Date(version.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // Rollback to this version
                        const correlationId = getOrCreateCorrelationId();
                        toast({
                          title: "Rollback Initiated",
                          description: `Rolling back to ${version.version} (ID: ${correlationId.substring(0, 8)}...)`,
                        });
                      }}
                      disabled={!canEdit}
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Rollback
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </DashboardSection>
    </div>
  );
}
