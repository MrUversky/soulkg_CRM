import * as React from "react"

import { cn } from "@/lib/utils"

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: string // Legacy prop for backward compatibility (ignored)
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl text-card-foreground shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] transition-all duration-300 ease-spring hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15),0_8px_12px_-4px_rgba(0,0,0,0.1)] hover:border-primary/20 overflow-hidden",
        className
      )}
      {...props}
    />
  )
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-2 px-8 pt-8 pb-4", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-bold leading-tight tracking-normal",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-base text-muted-foreground leading-relaxed", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-8 pt-6 pb-8", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center px-8 pb-8 pt-6 border-t border-border/50 mt-6", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Legacy alias for backward compatibility (will be removed after migration)
const CardBody = CardContent

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardBody }
