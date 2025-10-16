import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"


const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-80",
        secondary:
          "border-transparent bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:opacity-80",
        destructive:
          "border-transparent bg-[var(--destructive)] text-foreground/80 hover:opacity-80",
        outline: "text-foreground border-[var(--border)] bg-transparent",
        success:
          "border-transparent bg-[var(--success)] text-foreground/70 hover:opacity-80",
        warning:
          "border-transparent bg-[var(--warning)] text-foreground/70 hover:opacity-80",
        info:
          "border-transparent bg-[var(--info)] text-foreground/70 hover:opacity-80",
        critical:
          "border-transparent bg-red-600 text-foreground/70 hover:bg-red-600/80",
        high:
          "border-transparent bg-orange-600 text-foreground/70 hover:bg-orange-600/80",
        medium:
          "border-transparent bg-yellow-600 text-foreground/70 hover:bg-yellow-600/80",
        low:
          "border-transparent bg-blue-600 text-foreground/70 hover:bg-blue-600/80",
        orlixis:
          "border-transparent bg-[var(--orlixis-teal)] text-foreground/70 hover:bg-[var(--orlixis-teal-dark)]",
        "orlixis-outline":
          "border-[var(--orlixis-teal)] text-[var(--orlixis-teal)] bg-transparent hover:bg-[var(--orlixis-teal)] hover:text-white",
        "orlixis-subtle":
          "border-transparent bg-[var(--orlixis-teal)]/10 text-[var(--orlixis-teal)] hover:bg-[var(--orlixis-teal)]/20",
        glass:
          "border-transparent bg-white/50 backdrop-blur-sm text-foreground hover:bg-white/60 dark:bg-black/20 dark:hover:bg-black/30",
        "orlixis-glass":
          "border-[var(--orlixis-teal)]/30 bg-[var(--orlixis-teal)]/50 backdrop-blur-sm text-white hover:bg-[var(--orlixis-teal)]/60",
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

function getTranslucentClass(variant?: BadgeProps["variant"]) {
  switch (variant) {
    case "default":
      return "!bg-[var(--primary)]/80 backdrop-blur-sm dark:!bg-[var(--primary)]/30"
    case "secondary":
      return "!bg-[var(--secondary)]/80 backdrop-blur-sm dark:!bg-[var(--secondary)]/30"
    case "destructive":
      return "!bg-[var(--destructive)]/80 backdrop-blur-sm dark:!bg-[var(--destructive)]/30"
    case "success":
      return "!bg-[var(--success)]/80 backdrop-blur-sm dark:!bg-[var(--success)]/30"
    case "warning":
      return "!bg-[var(--warning)]/80 backdrop-blur-sm dark:!bg-[var(--warning)]/30"
    case "info":
      return "!bg-[var(--info)]/80 backdrop-blur-sm dark:!bg-[var(--info)]/30"
    case "orlixis":
      return "!bg-[var(--orlixis-teal)]/80 backdrop-blur-sm dark:!bg-[var(--orlixis-teal)]/30"
    case "orlixis-outline":
      return "!bg-[var(--orlixis-teal)]/20 backdrop-blur-sm"
    case "orlixis-subtle":
      return "!bg-[var(--orlixis-teal)]/20 backdrop-blur-sm"
    case "orlixis-glass":
      return "!bg-[var(--orlixis-teal)]/40 backdrop-blur-md"
    case "glass":
      return "backdrop-blur-md"
    default:
      return "backdrop-blur-sm"
  }
}

function Badge({ className, variant, size, icon, children, blurred, translucent, ...props }: BadgeProps) {
  const extra = cn(
    blurred && "backdrop-blur-sm",
    translucent && getTranslucentClass(variant)
  )

  return (
    <div className={cn(badgeVariants({ variant, size }), extra, className)} {...props}>
      {icon && <span className="mr-1">{icon}</span>}
      {children}
    </div>
  )
}

export { Badge, badgeVariants }
