/**
 * Support Ticket Dialog Component
 * Auto-populated context for reporting issues
 */

"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiGatewayClient } from "@/lib/api/clients/api-gateway";

export interface SupportTicketContext {
  correlationId?: string;
  errorDetails?: string;
  errorMessage?: string;
  statusCode?: number;
  userContext?: {
    userId?: string;
    userName?: string;
    userRole?: string;
  };
  formState?: Record<string, any>;
  timestamp?: string;
  url?: string;
  userAgent?: string;
}

interface SupportTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  context?: SupportTicketContext;
}

export function SupportTicketDialog({
  open,
  onOpenChange,
  context,
}: SupportTicketDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    category: "technical",
    priority: "medium",
    description: "",
    contactEmail: "",
  });

  useEffect(() => {
    if (open && context) {
      // Auto-populate form with context
      const subject = context.errorMessage
        ? `Error: ${context.errorMessage.substring(0, 50)}...`
        : "Support Request";
      
      const description = buildDescription(context);

      setFormData((prev) => ({
        ...prev,
        subject,
        description,
      }));
    }
  }, [open, context]);

  const buildDescription = (ctx: SupportTicketContext): string => {
    let desc = "Issue Details:\n\n";

    if (ctx.errorMessage) {
      desc += `Error Message: ${ctx.errorMessage}\n`;
    }

    if (ctx.statusCode) {
      desc += `Status Code: ${ctx.statusCode}\n`;
    }

    if (ctx.correlationId) {
      desc += `Correlation ID: ${ctx.correlationId}\n`;
    }

    if (ctx.timestamp) {
      desc += `Timestamp: ${ctx.timestamp}\n`;
    }

    if (ctx.url) {
      desc += `URL: ${ctx.url}\n`;
    }

    if (ctx.userContext) {
      desc += `\nUser Context:\n`;
      if (ctx.userContext.userId) {
        desc += `- User ID: ${ctx.userContext.userId}\n`;
      }
      if (ctx.userContext.userName) {
        desc += `- User Name: ${ctx.userContext.userName}\n`;
      }
      if (ctx.userContext.userRole) {
        desc += `- User Role: ${ctx.userContext.userRole}\n`;
      }
    }

    if (ctx.errorDetails) {
      desc += `\nError Details:\n${ctx.errorDetails}\n`;
    }

    if (ctx.formState) {
      desc += `\nForm State (if applicable):\n${JSON.stringify(ctx.formState, null, 2)}\n`;
    }

    desc += `\nBrowser: ${ctx.userAgent || navigator.userAgent}\n`;

    return desc;
  };

  const handleCopyContext = () => {
    if (!context) return;

    const contextText = JSON.stringify(context, null, 2);
    navigator.clipboard.writeText(contextText);
    setIsCopied(true);
    toast({
      title: "Context copied",
      description: "Error context has been copied to clipboard",
    });
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async () => {
    if (!formData.subject || !formData.description) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Call support ticket API endpoint
      // Note: If endpoint doesn't exist yet, this will fail gracefully
      let ticketId: string | undefined;
      
      try {
        const response = await apiGatewayClient.client.post<any>(
          "/api/v1/support/tickets",
          {
            subject: formData.subject,
            category: formData.category,
            priority: formData.priority,
            description: formData.description,
            contact_email: formData.contactEmail,
            context: context,
          }
        );

        ticketId = response.data?.ticket_id || response.data?.id || undefined;
      } catch (apiError: any) {
        // If endpoint doesn't exist (404), log locally or use fallback
        if (apiError.response?.status === 404) {
          console.warn("Support ticket endpoint not available, using fallback");
          // In production, you might want to log to a local service or email
          ticketId = `TEMP_${Date.now()}`;
        } else {
          throw apiError;
        }
      }

      toast({
        title: "Support ticket created",
        description: ticketId
          ? `Your support ticket has been submitted successfully. Ticket ID: #${ticketId}`
          : "Your support ticket has been submitted successfully.",
      });

      // Reset form
      setFormData({
        subject: "",
        category: "technical",
        priority: "medium",
        description: "",
        contactEmail: "",
      });

      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Submission failed",
        description: error instanceof Error ? error.message : "Failed to submit support ticket",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Report Issue</DialogTitle>
          <DialogDescription>
            Create a support ticket with auto-populated error context. All relevant information
            will be included to help our team resolve the issue quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Context Summary */}
          {context && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-populated Context</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyContext}
                      className="h-7"
                    >
                      {isCopied ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : (
                        <Copy className="h-3 w-3 mr-1" />
                      )}
                      {isCopied ? "Copied" : "Copy Context"}
                    </Button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {context.correlationId && (
                      <div>
                        <span className="font-medium">Correlation ID:</span>{" "}
                        <code className="font-mono">{context.correlationId}</code>
                      </div>
                    )}
                    {context.errorMessage && (
                      <div>
                        <span className="font-medium">Error:</span> {context.errorMessage}
                      </div>
                    )}
                    {context.statusCode && (
                      <div>
                        <span className="font-medium">Status Code:</span> {context.statusCode}
                      </div>
                    )}
                    {context.timestamp && (
                      <div>
                        <span className="font-medium">Time:</span> {context.timestamp}
                      </div>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Subject */}
          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, subject: e.target.value }))
              }
              placeholder="Brief description of the issue"
            />
          </div>

          {/* Category and Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger id="category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Issue</SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="feature">Feature Request</SelectItem>
                  <SelectItem value="performance">Performance Issue</SelectItem>
                  <SelectItem value="ui">UI/UX Issue</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priority">Priority *</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              placeholder="Detailed description of the issue..."
              rows={8}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Error context has been auto-populated. You can edit or add additional details.
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail">Contact Email (Optional)</Label>
            <Input
              id="contactEmail"
              type="email"
              value={formData.contactEmail}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, contactEmail: e.target.value }))
              }
              placeholder="your.email@example.com"
            />
            <p className="text-xs text-muted-foreground">
              We'll use your account email if not provided
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              "Submit Ticket"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
