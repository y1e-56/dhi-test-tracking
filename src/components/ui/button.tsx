import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/*
 * Boutons façon Geist : hauteurs compactes, rayon léger, bordure 1px,
 * pas de dégradé, transition sur la couleur uniquement.
 */
const buttonVariants = cva(
  "inline-flex select-none items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-[13px] font-medium leading-none cursor-pointer transition-[background-color,border-color,color,box-shadow] duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-45 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground border border-primary hover:bg-primary/85 active:bg-primary",
        destructive:
          "bg-destructive text-destructive-foreground border border-destructive hover:bg-destructive/88",
        outline:
          "border border-border bg-background text-foreground hover:border-border-strong hover:bg-secondary",
        secondary: "border border-transparent bg-secondary text-secondary-foreground hover:bg-muted",
        ghost: "border border-transparent text-muted-foreground hover:bg-secondary hover:text-foreground",
        link: "text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground",
      },
      size: {
        default: "h-8 px-3",
        sm: "h-7 px-2.5 text-xs rounded-[6px]",
        lg: "h-10 px-4 text-sm",
        icon: "size-8",
        "icon-sm": "size-7 rounded-[6px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
