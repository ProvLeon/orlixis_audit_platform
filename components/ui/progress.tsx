import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cn } from "@/lib/utils"

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root> & {
    variant?: "default" | "orlixis" | "success" | "warning" | "error"
    showValue?: boolean
  }
>(({ className, value, variant = "default", showValue = false, ...props }, ref) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "orlixis":
        return "bg-orlixis-teal"
      case "success":
        return "bg-success"
      case "warning":
        return "bg-warning"
      case "error":
        return "bg-destructive"
      case "white":
        return "bg-white"
      default:
        return "bg-primary"
    }
  }

  return (
    <div className="relative">
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          "relative h-2 w-full overflow-hidden rounded-full bg-secondary",
          className
        )}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            "h-full w-full flex-1 transition-all duration-300 ease-in-out",
            getVariantClasses()
          )}
          style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
        />
      </ProgressPrimitive.Root>
      {showValue && (
        <div className="mt-1 text-right text-xs text-muted-foreground">
          {Math.round(value || 0)}%
        </div>
      )}
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

export { Progress }
