import type { Config } from "tailwindcss";

// =============================================================================
// Tailwind CSS 4 config — Guest Profiling System design system
// =============================================================================
// Per PM Plan Section 14.4: custom token set on Tailwind 4.
// Single accent (deep teal DM-1 from upstream deliverables); neutral grays;
// semantic colors for success / warning / error.
// =============================================================================

export default {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Single accent — deep teal from DM-1 palette used in upstream deliverables.
        accent: {
          DEFAULT: "#1B6B7A",
          foreground: "#FFFFFF",
          muted: "#5B8DB8",
        },
        // Neutral grays.
        ink: {
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
        },
        // Semantic colors.
        success: "#16A34A",
        warning: "#D97706",
        danger: "#DC2626",
        // Surface (table alternating rows, card backgrounds).
        surface: {
          DEFAULT: "#EDF3F5",
          muted: "#F8FAFC",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Inter Tight", "Inter", "system-ui", "sans-serif"],
        mono: ["Courier New", "monospace"],
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        card: "0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        raised: "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
      },
      transitionDuration: {
        fast: "150ms",
        DEFAULT: "200ms",
        slow: "300ms",
      },
      transitionTimingFunction: {
        "ease-out-soft": "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
} satisfies Config;
