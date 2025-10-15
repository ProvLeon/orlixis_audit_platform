"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Eye, EyeOff, X, AlertCircle, CheckCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

const inputVariants = cva(
  [
    "peer w-full outline-none transition-colors",
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
        sm: "h-9 px-3 text-sm",
        md: "h-10 px-3.5 text-sm",
        lg: "h-12 px-4 text-base",
        xl: "h-14 px-5 text-base",
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

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
  VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  hint?: string
  error?: string
  success?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  clearable?: boolean
  onClear?: () => void
  passwordToggle?: boolean
  containerClassName?: string
}

/**
 * Orlixis Input
 * - Variants: default | subtle | ghost | underline | orlixis
 * - Sizes: sm | md | lg | xl
 * - Status: none | error | success | warning | info
 * - Features: label, description, hints, left/right adornments, clearable, password toggle
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      containerClassName,
      variant,
      size,
      status = "none",
      type = "text",
      label,
      description,
      hint,
      error,
      success,
      leftIcon,
      rightIcon,
      clearable = false,
      onClear,
      passwordToggle = true,
      ...props
    },
    ref
  ) => {
    const isPassword = type === "password"
    const [revealed, setRevealed] = React.useState(false)
    const [hasValue, setHasValue] = React.useState(
      typeof props.value === "string"
        ? props.value.length > 0
        : typeof props.defaultValue === "string"
          ? (props.defaultValue as string).length > 0
          : false
    )

    const describedById = React.useId()
    const inputId = React.useId()

    const showStatusIcon = !!error || !!success || status === "warning" || status === "info"
    const resolvedStatus: NonNullable<InputProps["status"]> =
      error ? "error" : success ? "success" : status || "none"

    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      props.onChange?.(e)
      setHasValue(e.target.value.length > 0)
    }

    const renderStatusIcon = () => {
      if (error) return <AlertCircle className="h-4 w-4 text-destructive" aria-hidden />
      if (success) return <CheckCircle className="h-4 w-4 text-success" aria-hidden />
      if (resolvedStatus === "warning") return <AlertCircle className="h-4 w-4 text-warning" aria-hidden />
      if (resolvedStatus === "info") return <Info className="h-4 w-4 text-info" aria-hidden />
      return null
    }

    const adornLeft = leftIcon
      ? <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">{leftIcon}</span>
      : null

    const adornRight = (
      <div className="absolute inset-y-0 right-0 flex items-center pr-2 gap-1">
        {showStatusIcon && <span className="text-muted-foreground">{renderStatusIcon()}</span>}
        {clearable && hasValue && (
          <button
            type="button"
            className="p-1 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-orlixis-teal"
            aria-label="Clear input"
            onClick={(e) => {
              e.preventDefault()
              if (ref && typeof ref !== "function" && ref?.current) {
                ref.current.value = ""
                ref.current.dispatchEvent(new Event("input", { bubbles: true }))
                setHasValue(false)
              }
              onClear?.()
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isPassword && passwordToggle && (
          <button
            type="button"
            className="p-1 rounded-md hover:bg-muted focus-visible:ring-2 focus-visible:ring-orlixis-teal"
            aria-label={revealed ? "Hide password" : "Show password"}
            onClick={() => setRevealed((v) => !v)}
          >
            {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
        {rightIcon && <span className="text-muted-foreground px-1">{rightIcon}</span>}
      </div>
    )

    const withLeftPadding =
      leftIcon ? (size === "sm" ? "pl-9" : size === "lg" || size === "xl" ? "pl-12" : "pl-10") : ""
    const withRightPadding =
      (clearable || isPassword || rightIcon || showStatusIcon)
        ? (size === "sm" ? "pr-9" : size === "lg" || size === "xl" ? "pr-12" : "pr-10")
        : ""

    return (
      <div className={cn("w-full", containerClassName)}>
        {label && (
          <label
            htmlFor={props.id ?? inputId}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
          </label>
        )}

        <div className={cn("relative")}>
          {adornLeft}
          <input
            id={props.id ?? inputId}
            ref={ref}
            type={isPassword && passwordToggle ? (revealed ? "text" : "password") : type}
            className={cn(
              inputVariants({ variant, size, status: resolvedStatus }),
              withLeftPadding,
              withRightPadding,
              // emphasize error state more strongly
              error && "border-destructive focus-visible:ring-destructive",
              success && "border-success focus-visible:ring-success",
              className
            )}
            aria-invalid={!!error || resolvedStatus === "error"}
            aria-describedby={description || error || success || hint ? describedById : undefined}
            onChange={handleChange}
            {...props}
          />
          {adornRight}
        </div>

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
    )
  }
)

Input.displayName = "Input"

export default Input
