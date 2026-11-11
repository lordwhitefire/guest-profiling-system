import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "./button-variants";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id ?? `input-${label?.toLowerCase().replace(/\s/g, "-")}`;
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-ink-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-lg border bg-white px-3 py-2 text-ink-900 placeholder:text-ink-400",
            "focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30",
            "disabled:bg-ink-100 disabled:cursor-not-allowed",
            error ? "border-danger" : "border-ink-300",
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-sm text-danger"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";
