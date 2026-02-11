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
      const fieldElement = document.querySelector(
        `[name="${fieldName}"], #${fieldName}`
      );
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
          isAutoFilled &&
            !isManuallyEdited &&
            "rounded-md bg-blue-50 p-1 dark:bg-blue-950/20",
          isManuallyEdited &&
            "rounded-md bg-yellow-50 p-1 dark:bg-yellow-950/20"
        )}
      >
        {children}
        {isAutoFilled && showBadge && (
          <div className="absolute right-1 top-1 flex items-center gap-1">
            {isManuallyEdited ? (
              <Badge
                variant="outline"
                className="border-yellow-300 bg-yellow-100 text-xs text-yellow-800"
              >
                <Edit2 className="mr-1 h-3 w-3" />
                Edited
              </Badge>
            ) : (
              <Badge
                variant="outline"
                className="border-blue-300 bg-blue-100 text-xs text-blue-800"
              >
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Auto-filled
              </Badge>
            )}
            {dataSource && (
              <FieldDataSourceBadge
                dataSource={dataSource}
                showTooltip={true}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
