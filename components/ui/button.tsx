import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "ghost" | "danger"; size?: "default" | "sm" };

export function Button({ className, variant = "primary", size = "default", type = "button", ...props }: Props) {
  return <button className={cn(
    "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
    size === "default" ? "h-10 px-4 text-sm" : "h-8 px-3 text-xs",
    variant === "primary" && "bg-primary text-primary-foreground hover:bg-primary/90",
    variant === "secondary" && "bg-secondary text-secondary-foreground hover:bg-secondary/75",
    variant === "ghost" && "hover:bg-muted",
    variant === "danger" && "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    className,
  )} type={type} {...props} />;
}
