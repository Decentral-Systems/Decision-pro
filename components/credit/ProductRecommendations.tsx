/**
 * Product Recommendations Component
 * Displays product recommendations from Rules Engine
 */

"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Package,
  TrendingUp,
  CheckCircle2,
  Info,
  ArrowRight,
} from "lucide-react";
import { useProductRecommendations } from "@/lib/api/hooks/useRulesEngine";
import { ProductRecommendation } from "@/lib/api/services/rules-engine";
import { formatCurrency } from "@/lib/utils/format";

interface ProductRecommendationsProps {
  customerId?: string;
  applicationData?: Record<string, any>;
  onProductSelect?: (product: ProductRecommendation) => void;
  className?: string;
}

export function ProductRecommendations({
  customerId,
  applicationData,
  onProductSelect,
  className,
}: ProductRecommendationsProps) {
  const {
    data: recommendations,
    isLoading,
    error,
  } = useProductRecommendations(customerId, !!customerId);

  if (!customerId) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Recommendations
          </CardTitle>
          <CardDescription>Recommended loan products for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Select a customer to see product recommendations
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations || recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Product Recommendations
          </CardTitle>
          <CardDescription>Recommended loan products for this customer</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              No product recommendations available at this time.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Product Recommendations
        </CardTitle>
        <CardDescription>
          {recommendations.length} product{recommendations.length !== 1 ? "s" : ""} recommended
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recommendations.map((product, index) => (
          <div
            key={index}
            className="p-4 border rounded-lg hover:border-primary transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-semibold text-lg">{product.product_name}</h4>
                  <Badge variant="outline">{product.product_type}</Badge>
                  {index === 0 && (
                    <Badge className="bg-green-500">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      Best Match
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mb-3">
                  Eligibility Score: {product.eligibility_score.toFixed(1)}%
                </div>
              </div>
              {onProductSelect && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onProductSelect(product)}
                >
                  Select
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4 mb-3">
              <div>
                <div className="text-xs text-muted-foreground">Loan Amount</div>
                <div className="font-semibold">
                  {formatCurrency(product.recommended_amount)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Interest Rate</div>
                <div className="font-semibold">
                  {(product.interest_rate * 100).toFixed(2)}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Term</div>
                <div className="font-semibold">{product.loan_term_months} months</div>
              </div>
            </div>

            {product.reasons && product.reasons.length > 0 && (
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">
                  Why this product:
                </div>
                <ul className="text-xs space-y-1">
                  {product.reasons.map((reason, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {product.terms_and_conditions &&
              product.terms_and_conditions.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs font-medium text-muted-foreground mb-1">
                    Terms & Conditions:
                  </div>
                  <ul className="text-xs space-y-1 text-muted-foreground">
                    {product.terms_and_conditions.map((term, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-muted-foreground">•</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
