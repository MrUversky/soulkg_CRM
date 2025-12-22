import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps extends React.ComponentProps<"input"> {
  error?: string
  label?: string
  helperText?: string
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, helperText, ...props }, ref) => {
    const errorId = error ? `${props.id}-error` : undefined
    const helperId = helperText && !error ? `${props.id}-helper` : undefined
    const describedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined
    
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={props.id} className="block text-sm font-semibold leading-normal text-text-primary">
            {label}
            {props.required && <span className="text-error-600 ml-1.5">*</span>}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-12 w-full rounded-xl border border-input/50 bg-background/50 backdrop-blur-sm px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:border-primary-500 focus-visible:bg-background focus-visible:shadow-[0_0_0_3px_rgba(59,130,246,0.1)] disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 ease-spring hover:border-primary/30 hover:bg-background/80",
            error && "border-error-500 focus-visible:ring-error-500 focus-visible:shadow-[0_0_0_3px_rgba(239,68,68,0.1)]",
            className
          )}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-sm text-error-600" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    )
  }
)
Input.displayName = "Input"

export { Input }
export default Input
