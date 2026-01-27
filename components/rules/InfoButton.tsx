"use client";

import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RulesDocumentation, DocumentationSection } from "./RulesDocumentation";
import { useState } from "react";

interface InfoButtonProps {
  section: DocumentationSection;
  tooltip?: string;
  className?: string;
}

export function InfoButton({ section, tooltip = "View documentation", className }: InfoButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className={`h-6 w-6 ${className}`}
              onClick={() => setOpen(true)}
              aria-label={tooltip}
            >
              <Info className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <RulesDocumentation open={open} onOpenChange={setOpen} section={section} />
    </>
  );
}

