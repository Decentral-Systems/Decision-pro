import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils/index"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        success:
          "border-transparent bg-success text-white hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-white hover:bg-warning/80",
        info:
          "border-transparent bg-info text-white hover:bg-info/80",
        outline: "text-foreground border-border",
        // Status-specific variants
        approved:
          "border-transparent bg-approved text-white hover:bg-approved/80",
        rejected:
          "border-transparent bg-rejected text-white hover:bg-rejected/80",
        pending:
          "border-transparent bg-pending text-white hover:bg-pending/80",
        "high-risk":
          "border-transparent bg-high-risk text-white hover:bg-high-risk/80",
        "medium-risk":
          "border-transparent bg-medium-risk text-white hover:bg-medium-risk/80",
        "low-risk":
          "border-transparent bg-low-risk text-white hover:bg-low-risk/80",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0 text-[10px]",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  pulse?: boolean
}

function Badge({ className, variant, size, pulse, ...props }: BadgeProps) {
  return (
    <div 
      className={cn(
        badgeVariants({ variant, size }), 
        pulse && "animate-pulse-slow",
        className
      )} 
      {...props} 
    />
  )
}

export { Badge, badgeVariants }
