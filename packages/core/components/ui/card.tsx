import { type HTMLAttributes } from "react";
import { cn } from "./button-variants";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export function Card({ className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-ink-200 bg-white p-6 shadow-card",
        className
      )}
      {...props}
    />
  );
}
