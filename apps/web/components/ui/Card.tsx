/**
 * Card Component
 * 
 * A flexible card component for displaying content in containers.
 * Built on top of shadcn/ui with custom styling, glassmorphism effects, and hover animations.
 * 
 * @example
 * ```tsx
 * // Basic card
 * <Card>
 *   <CardHeader>
 *     <CardTitle>Card Title</CardTitle>
 *     <CardDescription>Card description text</CardDescription>
 *   </CardHeader>
 *   <CardBody>
 *     <p>Card content goes here</p>
 *   </CardBody>
 *   <CardFooter>
 *     <Button>Action</Button>
 *   </CardFooter>
 * </Card>
 * 
 * // Simple card without sections
 * <Card>
 *   <CardBody>
 *     <p>Simple content</p>
 *   </CardBody>
 * </Card>
 * ```
 * 
 * @see {@link https://ui.shadcn.com/docs/components/card} shadcn/ui Card documentation
 */

import * as React from "react"

import { cn } from "@/lib/utils"

/**
 * Card component props
 * 
 * @interface CardProps
 * @extends {React.HTMLAttributes<HTMLDivElement>}
 * 
 * @property {string} [variant] - Legacy prop for backward compatibility (ignored, visual styling handled by className)
 * 
 * @note All standard HTML div props are supported
 * @note Card has glassmorphism effect (backdrop-blur-xl) and hover animations
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Legacy prop for backward compatibility (ignored) */
  variant?: string
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

/**
 * CardHeader Component
 * 
 * Header section of a card. Typically contains CardTitle and CardDescription.
 * 
 * @example
 * ```tsx
 * <CardHeader>
 *   <CardTitle>Title</CardTitle>
 *   <CardDescription>Description</CardDescription>
 * </CardHeader>
 * ```
 * 
 * @note Padding: px-8 pt-8 pb-4 (32px horizontal, 32px top, 16px bottom)
 */
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

/**
 * CardTitle Component
 * 
 * Title text for a card. Typically used inside CardHeader.
 * 
 * @example
 * ```tsx
 * <CardTitle>Card Title</CardTitle>
 * ```
 * 
 * @note Typography: text-2xl font-bold leading-tight tracking-normal
 */
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

/**
 * CardDescription Component
 * 
 * Description text for a card. Typically used inside CardHeader below CardTitle.
 * 
 * @example
 * ```tsx
 * <CardDescription>This is a description of the card content</CardDescription>
 * ```
 * 
 * @note Typography: text-base text-muted-foreground leading-relaxed
 */
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

/**
 * CardContent Component
 * 
 * Main content area of a card. Use this for the primary content.
 * 
 * @example
 * ```tsx
 * <CardContent>
 *   <p>Main content goes here</p>
 * </CardContent>
 * ```
 * 
 * @note Padding: px-8 pt-6 pb-8 (32px horizontal, 24px top, 32px bottom)
 * @note Legacy alias: CardBody (for backward compatibility)
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("px-8 pt-6 pb-8", className)} {...props} />
))
CardContent.displayName = "CardContent"

/**
 * CardFooter Component
 * 
 * Footer section of a card. Typically contains action buttons.
 * Has a top border for visual separation.
 * 
 * @example
 * ```tsx
 * <CardFooter>
 *   <Button variant="outline">Cancel</Button>
 *   <Button variant="primary">Save</Button>
 * </CardFooter>
 * ```
 * 
 * @note Padding: px-8 pb-8 pt-6 (32px horizontal, 32px bottom, 24px top)
 * @note Has top border (border-t border-border/50) and margin-top (mt-6)
 */
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

/**
 * CardBody Component
 * 
 * Legacy alias for CardContent. Use CardContent for new code.
 * 
 * @deprecated Use CardContent instead. This alias will be removed after migration.
 */
const CardBody = CardContent

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent, CardBody }
