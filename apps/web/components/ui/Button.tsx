/**
 * Button Component
 * 
 * A versatile button component built on top of shadcn/ui with custom styling.
 * Supports multiple variants, sizes, loading states, and full-width mode.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <Button variant="primary">Click me</Button>
 * 
 * // With loading state
 * <Button isLoading={isSubmitting}>Submit</Button>
 * 
 * // Full width
 * <Button fullWidth>Full Width Button</Button>
 * 
 * // As child (for Next.js Link)
 * <Button asChild>
 *   <Link href="/dashboard">Dashboard</Link>
 * </Button>
 * ```
 * 
 * @see {@link https://ui.shadcn.com/docs/components/button} shadcn/ui Button documentation
 */

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-base font-semibold ring-offset-background transition-all duration-300 ease-spring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 text-white hover:from-primary-700 hover:via-primary-600 hover:to-secondary-700 shadow-[0_4px_14px_0_rgba(59,130,246,0.15),0_2px_4px_0_rgba(0,0,0,0.1)] hover:shadow-[0_8px_20px_0_rgba(59,130,246,0.25),0_4px_8px_0_rgba(0,0,0,0.15)] active:scale-[0.98] before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        destructive:
          "bg-gradient-to-br from-error-600 to-error-500 text-white hover:from-error-700 hover:to-error-600 shadow-[0_4px_14px_0_rgba(239,68,68,0.15)] hover:shadow-[0_8px_20px_0_rgba(239,68,68,0.25)] active:scale-[0.98]",
        outline:
          "border-2 border-gradient-to-r from-primary-200 to-secondary-200 bg-background/50 backdrop-blur-sm hover:bg-gradient-to-br hover:from-primary-50 hover:to-secondary-50 hover:border-primary-300 hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-gradient-to-br from-secondary-500 to-secondary-400 text-white hover:from-secondary-600 hover:to-secondary-500 shadow-[0_4px_14px_0_rgba(168,85,247,0.15)] hover:shadow-[0_8px_20px_0_rgba(168,85,247,0.25)] active:scale-[0.98]",
        ghost: "hover:bg-accent/50 hover:backdrop-blur-sm hover:shadow-sm active:scale-[0.98]",
        link: "text-primary hover:text-primary-700 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 rounded-xl px-4 text-sm",
        lg: "h-14 rounded-xl px-10 text-lg",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

/**
 * Button component props
 * 
 * @interface ButtonProps
 * @extends {Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'variant'>}
 * 
 * @property {boolean} [asChild] - Render as child component (useful for Next.js Link). When true, uses Radix Slot.
 * @property {boolean} [fullWidth] - Make button full width of container.
 * @property {boolean} [isLoading] - Show loading spinner and disable button.
 * @property {"default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "danger"} [variant] - Button style variant.
 *   - `default` / `primary`: Primary gradient button (blue-purple gradient)
 *   - `destructive` / `danger`: Destructive action button (red gradient)
 *   - `outline`: Outlined button with border
 *   - `secondary`: Secondary button (purple gradient)
 *   - `ghost`: Transparent button with hover effect
 *   - `link`: Text link style button
 * @property {"default" | "sm" | "lg" | "icon"} [size] - Button size.
 *   - `default`: h-12 px-6 (48px height, standard padding)
 *   - `sm`: h-10 px-4 (40px height, small padding)
 *   - `lg`: h-14 px-10 (56px height, large padding)
 *   - `icon`: h-12 w-12 (48x48px square, for icon-only buttons)
 * 
 * @note Legacy variants `primary` and `danger` are aliased to `default` and `destructive` for backward compatibility.
 */
export interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'variant'> {
  /** Render as child component (useful for Next.js Link) */
  asChild?: boolean
  /** Make button full width of container */
  fullWidth?: boolean
  /** Show loading spinner and disable button */
  isLoading?: boolean
  /** Button style variant */
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "primary" | "danger"
  /** Button size */
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, fullWidth, isLoading, disabled, children, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    // Legacy variant aliases for backward compatibility
    const normalizedVariant = variant === "primary" ? "default" : variant === "danger" ? "destructive" : variant
    
    return (
      <Comp
        className={cn(
          buttonVariants({ variant: normalizedVariant, size, className }),
          fullWidth && "w-full"
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {children}
          </>
        ) : children}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
export default Button
