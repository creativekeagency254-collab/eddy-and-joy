import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[4px] text-sm font-medium ring-offset-background transition-all duration-100 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border-2 border-primary shadow-[0_4px_0_hsl(var(--primary))] hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-[0_6px_0_hsl(var(--primary))] active:translate-y-1 active:shadow-none",
        destructive:
          "bg-destructive text-destructive-foreground border-2 border-destructive shadow-[0_4px_0_hsl(var(--destructive))] hover:bg-destructive/90 hover:-translate-y-0.5 hover:shadow-[0_6px_0_hsl(var(--destructive))] active:translate-y-1 active:shadow-none",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-white text-primary border-2 border-primary shadow-[0_4px_0_hsl(var(--border))] hover:bg-gray-100 hover:-translate-y-0.5 hover:shadow-[0_6px_0_hsl(var(--border))] active:translate-y-1 active:shadow-none",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        "tactile-green":
          "bg-[#25D366] text-white border-2 border-[#128C7E] shadow-[0_4px_0_#128C7E] hover:bg-[#20b35a] hover:-translate-y-0.5 hover:shadow-[0_6px_0_#128C7E] active:translate-y-1 active:shadow-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
