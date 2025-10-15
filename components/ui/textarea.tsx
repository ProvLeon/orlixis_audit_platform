"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { X, AlertCircle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const textareaVariants = cva(
  [
    "peer w-full outline-none transition-colors resize-y",
    "disabled:cursor-not-allowed disabled:opacity-60",
    "placeholder:text-muted-foreground",
    "bg-background text-foreground",
    "border focus-visible:outline-none",
    "focus-visible:ring-2 focus-visible:ring-offset-2",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "rounded-md border-input focus-visible:ring-orlixis-teal",
        subtle:
          "rounded-md border-transparent bg-secondary/50 hover:bg-secondary focus-visible:ring-orlixis-teal",
        ghost:
          "rounded-md border-transparent bg-transparent hover:bg-muted focus-visible:ring-orlixis-teal",
        underline:
          "rounded-none border-0 border-b border-input focus-visible:ring-0 focus-visible:border-orlixis-teal",
        orlixis:
          "rounded-md border-orlixis-teal/30 focus-visible:ring-orlixis-teal bg-background",
      },
      size: {
        sm: "min-h-[80px] px-3 py-2 text-sm",
        md: "min-h-[100px] px-3.5 py-2.5 text-sm",
        lg: "min-h-[120px] px-4 py-3 text-base",
        xl: "min-h-[150px] px-5 py-4 text-base",
      },
      status: {
        none: "",
        error:
          "border-destructive focus-visible:ring-destructive focus-visible:ring-offset-2",
        success:
          "border-success focus-visible:ring-success focus-visible:ring-offset-2",
        warning:
          "border-warning focus-visible:ring-warning focus-visible:ring-offset-2",
        info: "border-info focus-visible:ring-info focus-visible:ring-offset-2",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
      status: "none",
    },
  }
)

export interface TextareaProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "size">,
  VariantProps<typeof textareaVariants> {
  label?: string
  description?: string
  hint?: string
  error?: string
  success?: string
  clearable?: boolean
  onClear?: () => void
  containerClassName?: string
  showCharCount?: boolean
  maxLength?: number
}

/**
 * Orlixis Textarea
 * - Variants: default | subtle | ghost | underline | orlixis
 * - Sizes: sm | md | lg | xl
 * - Status: none | error | success | warning | info
 * - Features: label, description, hints, clearable, character count
 */
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      containerClassName,
      variant,
      size,
      status = "none",
      label,
      description,
      hint,
      error,
      success,
      clearable = false,
      onClear,
      showCharCount = false,
      maxLength,
      ...props
    },
    ref
  ) => {
    const [hasValue, setHasValue] = React.useState(
      typeof props.value === "string"
        ? props.value.length > 0
        : typeof props.defaultValue === "string"
          ? (props.defaultValue as string).length > 0
          : false
    )

    const [charCount, setCharCount] = React.useState(
      typeof props.value === "string"
        ? props.value.length
        : typeof props.defaultValue === "string"
          ? (props.defaultValue as string).length
          : 0
    )

    const describedById = React.useId()
    const textareaId = React.useId()

    const showStatusIcon = !!error || !!success || status === "warning" || status === "info"
    const resolvedStatus: NonNullable<TextareaProps["status"]> =
      error ? "error" : success ? "success" : status || "none"

    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
      props.onChange?.(e)
      setHasValue(e.target.value.length > 0)
      setCharCount(e.target.value.length)
    }

    const renderStatusIcon = () => {
      if (error) return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
      if (success) return <CheckCircle className="h-4 w-4 text-success" aria-hidden />
      if (resolvedStatus === "warning") return <AlertCircle className="h-4 w-4 text-warning" aria-hidden />
      if (resolvedStatus === "info") return <Info className="h-4 w-4 text-info" aria-hidden />
      return null
    }

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={props.id ?? textareaId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className={cn("relative")}>
          <textarea
            id={props.id ?? textareaId}
            ref={ref}
            className={cn(
              textareaVariants({ variant, size, status: resolvedStatus }),
              clearable && "pr-10",
              error && "border-destructive focus-visible:ring-destructive",
              success && "border-success focus-visible:ring-success",
              className
            )}
            aria-invalid={!!error || resolvedStatus === "error"}
            aria-describedby={description || error || success || hint ? describedById : undefined}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />

          {/* Top right corner icons */}
          {(showStatusIcon || clearable) && (
            <div className="absolute top-2 right-2 flex items-center gap-1">
              {showStatusIcon && <span className="text-muted-foreground">{renderStatusIcon()}</span>}
              {clearable && hasValue && (
                <button
                  type="button"
                  className="p-1 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-orlixis-teal"
                  aria-label="Clear textarea"
                  onClick={(e) => {
                    e.preventDefault()
                    if (ref && typeof ref !== "function" && ref?.current) {
                      ref.current.value = ""
                      ref.current.dispatchEvent(new Event("input", { bubbles: true }))
                      setHasValue(false)
                      setCharCount(0)
                    }
                    onClear?.()
                  }}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Bottom info section */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            {(description || error || success || hint) && (
              <div id={describedById} className="mt-1.5 space-y-1">
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
                {error && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> {error}
                  </p>
                )}
                {!error && success && (
                  <p className="text-xs text-success flex items-center gap-1">
                    <CheckCircle className="h-3.5 w-3.5" /> {success}
                  </p>
                )}
                {hint && !error && !success && (
                  <p className="text-xs text-muted-foreground">{hint}</p>
                )}
              </div>
            )}
          </div>

          {/* Character count */}
          {(showCharCount || maxLength) && (
            <div className="mt-1.5 text-xs text-muted-foreground">
              {charCount}{maxLength && `/${maxLength}`}
            </div>
          )}
        </div>
      </div>
    )
  }
)

Textarea.displayName = "Textarea"

export default Textarea
