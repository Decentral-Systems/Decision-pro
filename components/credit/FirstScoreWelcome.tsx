/**
 * First Score Welcome Component
 * Enhanced welcome message for new customers with first-time user guidance
 */

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Info, BookOpen, TrendingUp } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface FirstScoreWelcomeProps {
  customerId?: string;
  customerName?: string;
  onShowGuidance?: () => void;
  className?: string;
}

export function FirstScoreWelcome({
  customerId,
  customerName,
  onShowGuidance,
  className,
}: FirstScoreWelcomeProps) {
  return (
    <Alert className={className}>
      <Sparkles className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="default" className="bg-blue-500">
                  <Sparkles className="h-3 w-3 mr-1" />
                  First Credit Score
                </Badge>
              </div>
              <div className="font-semibold text-sm">
                Welcome! This is the first credit score calculation
                {customerName ? ` for ${customerName}` : " for this customer"}.
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                This score establishes a baseline for future credit assessments. Historical
                comparisons will be available after subsequent score calculations.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  View Guidance
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    First-Time Credit Score Guidance
                  </DialogTitle>
                  <DialogDescription>
                    Understanding your first credit score calculation
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      What This Means
                    </h4>
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                      <li>This is the baseline credit score for this customer</li>
                      <li>Future scores will be compared against this initial assessment</li>
                      <li>Score trends will become visible after 2-3 additional calculations</li>
                      <li>Historical analysis features will unlock with more data</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Next Steps</h4>
                    <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                      <li>Review the credit score and risk category</li>
                      <li>Check SHAP explanations to understand key factors</li>
                      <li>Review loan terms recommendations from the Rules Engine</li>
                      <li>Save this score for future comparisons</li>
                    </ul>
                  </div>
                  {customerId && (
                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      Customer ID: {customerId}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>

            {onShowGuidance && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onShowGuidance}
                className="flex items-center gap-2"
              >
                <Info className="h-4 w-4" />
                Learn More
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
