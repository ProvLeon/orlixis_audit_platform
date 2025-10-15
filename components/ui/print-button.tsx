"use client"

import { Button } from "@/components/ui/button"
import { Printer } from "lucide-react"
import type { ButtonProps } from "@/components/ui/button"

interface PrintButtonProps extends Omit<ButtonProps, "onClick"> {
  children?: React.ReactNode
}

export function PrintButton({ children, ...props }: PrintButtonProps) {
  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print()
    }
  }

  return (
    <Button onClick={handlePrint} {...props}>
      {children || (
        <>
          <Printer className="h-4 w-4" />
          Print
        </>
      )}
    </Button>
  )
}
