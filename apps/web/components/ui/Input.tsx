/**
 * Input Component
 * 
 * A form input component with built-in label, error handling, and helper text.
 * Built on top of shadcn/ui with custom styling and accessibility features.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Input label="Email" type="email" placeholder="you@example.com" />
 * 
 * // With error
 * <Input 
 *   label="Password" 
 *   type="password" 
 *   error="Password must be at least 8 characters"
 * />
 * 
 * // With helper text
 * <Input 
 *   label="Phone" 
 *   helperText="Format: +996XXXXXXXXX"
 * />
 * 
 * // Required field
 * <Input label="Email" type="email" required />
 * ```
 * 
 * @see {@link https://ui.shadcn.com/docs/components/input} shadcn/ui Input documentation
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Input component props
 * 
 * @interface InputProps
 * @extends {React.ComponentProps<"input">}
 * 
 * @property {string} [error] - Error message to display below input. When provided, input border turns red and aria-invalid is set.
 * @property {string} [label] - Label text displayed above input. Automatically associated with input via htmlFor/id.
 * @property {string} [helperText] - Helper text displayed below input (only shown when no error).
 * 
 * @note All standard HTML input props are supported (type, placeholder, value, onChange, etc.)
 * @note When `required` prop is set, label shows asterisk (*) indicator
 * @note Component automatically handles ARIA attributes for accessibility (aria-invalid, aria-describedby)
 */
export interface InputProps extends React.ComponentProps<"input"> {
  /** Error message to display below input */
  error?: string
  /** Label text displayed above input */
  label?: string
  /** Helper text displayed below input (only shown when no error) */
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
