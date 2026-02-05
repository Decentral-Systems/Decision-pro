/**
 * Auto-Filled Field Wrapper Component
 * Wraps form fields to show they were auto-filled and track manual edits
 */

"use client";

import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { FieldDataSourceBadge, FieldDataSource } from "./FieldDataSourceBadge";
import { Badge } from "@/components/ui/badge";
import { Edit2, CheckCircle2 } from "lucide-react";

interface AutoFilledFieldWrapperProps {
  children: ReactNode;
  fieldName: string;
  isAutoFilled: boolean;
  dataSource?: FieldDataSource;
  onManualEdit?: () => void;
  className?: string;
  showBadge?: boolean;
}

export function AutoFilledFieldWrapper({
  children,
  fieldName,
  isAutoFilled,
  dataSource,
  onManualEdit,
  className,
  showBadge = true,
}: AutoFilledFieldWrapperProps) {
  const [isManuallyEdited, setIsManuallyEdited] = useState(false);
  const [originalValue, setOriginalValue] = useState<any>(null);

  useEffect(() => {
    if (isAutoFilled && !isManuallyEdited) {
      // Track if field value changes (indicating manual edit)
      const fieldElement = document.querySelector(`[name="${fieldName}"], #${fieldName}`);
      if (fieldElement) {
        const handleChange = () => {
          const currentValue = (fieldElement as HTMLInputElement).value;
          if (currentValue !== originalValue && originalValue !== null) {
            setIsManuallyEdited(true);
            onManualEdit?.();
          }
        };

        fieldElement.addEventListener("input", handleChange);
        fieldElement.addEventListener("change", handleChange);

        // Store original value
        setOriginalValue((fieldElement as HTMLInputElement).value);

        return () => {
          fieldElement.removeEventListener("input", handleChange);
          fieldElement.removeEventListener("change", handleChange);
        };
      }
    }
  }, [fieldName, isAutoFilled, isManuallyEdited, originalValue, onManualEdit]);

  if (!isAutoFilled) {
    return <>{children}</>;
  }

  return (
    <div className={cn("relative space-y-1", className)}>
      <div
        className={cn(
          "relative transition-all duration-200",
          isAutoFilled && !isManuallyEdited && "bg-blue-50 dark:bg-blue-950/20 rounded-md p-1",
          isManuallyEdited && "bg-yellow-50 dark:bg-yellow-950/20 rounded-md p-1"
        )}
      >
        {children}
        {isAutoFilled && showBadge && (
          <div className="absolute top-1 right-1 flex items-center gap-1">
            {isManuallyEdited ? (
              <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800 border-yellow-300">
                <Edit2 className="h-3 w-3 mr-1" />
                Edited
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs bg-blue-100 text-blue-800 border-blue-300">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Auto-filled
              </Badge>
            )}
            {dataSource && (
              <FieldDataSourceBadge dataSource={dataSource} showTooltip={true} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
