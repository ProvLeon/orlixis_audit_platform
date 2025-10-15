import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

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
        outline: "text-foreground",
        success:
          "border-transparent bg-success text-white hover:bg-success/80",
        warning:
          "border-transparent bg-warning text-white hover:bg-warning/80",
        info:
          "border-transparent bg-info text-white hover:bg-info/80",
        critical:
          "border-transparent bg-red-600 text-white hover:bg-red-600/80",
        high:
          "border-transparent bg-orange-600 text-white hover:bg-orange-600/80",
        medium:
          "border-transparent bg-yellow-600 text-white hover:bg-yellow-600/80",
        low:
          "border-transparent bg-blue-600 text-white hover:bg-blue-600/80",
        orlixis:
          "border-transparent bg-orlixis-teal text-white hover:bg-orlixis-teal-dark",
        "orlixis-outline":
          "border-orlixis-teal text-orlixis-teal bg-transparent hover:bg-orlixis-teal hover:text-white",
        "orlixis-subtle":
          "border-transparent bg-orlixis-teal/10 text-orlixis-teal hover:bg-orlixis-teal/20",
        glass:
          "border-transparent bg-white/50 backdrop-blur-sm text-foreground hover:bg-white/60 dark:bg-slate-400/20 dark:hover:bg-slate-400/25",
        "orlixis-glass":
          "border-orlixis-teal/30 bg-orlixis-teal/50 text-white backdrop-blur-sm hover:bg-orlixis-teal/60",
      },
      size: {
        default: "px-2.5 py-0.5 text-xs",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
        xl: "px-4 py-1.5 text-base",
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
  icon?: React.ReactNode
  blurred?: boolean
  translucent?: boolean
}

function translucentClassForVariant(variant?: BadgeProps["variant"]) {
  switch (variant) {
    case "default":
      return "bg-primary/30"
    case "secondary":
      return "bg-secondary/30"
    case "destructive":
      return "bg-destructive/30"
    case "success":
      return "bg-success/30"
    case "warning":
      return "bg-warning/30"
    case "info":
      return "bg-info/30"
    case "critical":
      return "bg-red-600/30"
    case "high":
      return "bg-orange-600/30"
    case "medium":
      return "bg-yellow-600/30"
    case "low":
      return "bg-blue-600/30"
    case "orlixis":
      return "bg-orlixis-teal/30"
    default:
      return ""
  }
}

function Badge({ className, variant, size, icon, children, blurred, translucent, ...props }: BadgeProps) {
  const extra = cn(
    blurred && "backdrop-blur-sm",
    translucent && translucentClassForVariant(variant)
  )
  return (
    <div className={cn(badgeVariants({ variant, size }), extra, className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
