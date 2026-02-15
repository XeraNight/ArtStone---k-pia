import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        success: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warning: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        info: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
        new: "border-transparent bg-blue-500/15 text-blue-600 dark:text-blue-400",
        contacted: "border-transparent bg-purple-500/15 text-purple-600 dark:text-purple-400",
        offer: "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        won: "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        lost: "border-transparent bg-red-500/15 text-red-600 dark:text-red-400",
        waiting: "border-transparent bg-cyan-500/15 text-cyan-600 dark:text-cyan-400",
        completed: "border-transparent bg-teal-500/15 text-teal-600 dark:text-teal-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
