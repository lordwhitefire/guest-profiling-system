"use client";

import { Toaster as SonnerToaster } from "sonner";

export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "rounded-lg border border-ink-200 bg-white px-4 py-3 shadow-raised text-ink-900",
          title: "font-medium",
          description: "text-sm text-ink-600",
        },
      }}
    />
  );
}

export { toast } from "sonner";
