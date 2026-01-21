import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['"Inter"', "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "sans-serif"],
        display: ['"Inter"', "sans-serif"],
        serif: ['"Playfair Display"', "Georgia", '"Times New Roman"', "serif"],
        mono: ['"Geist Mono"', '"Geist Mono Fallback"', "ui-monospace", "monospace"],
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        "background-light": "hsl(var(--background-light))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        chart: {
          1: "hsl(var(--chart-1))",
          2: "hsl(var(--chart-2))",
          3: "hsl(var(--chart-3))",
          4: "hsl(var(--chart-4))",
          5: "hsl(var(--chart-5))",
        },
        "ink": "hsl(var(--color-ink))",
        "honey": "hsl(42 100% 71%)",
        "honey-light": "hsl(42 100% 80%)",
        "honey-pale": "hsl(42 100% 90%)",
        "honey-dark": "hsl(42 75% 63%)",
        "lavender": "hsl(280 60% 82%)",
        "lavender-light": "hsl(280 50% 90%)",
        "lavender-pale": "hsl(280 75% 94%)",
        "sage": "hsl(72 85% 42%)",
        "sage-light": "hsl(72 60% 60%)",
        "sage-pale": "hsl(72 40% 85%)",
        "lilac": "hsl(280 30% 80%)",
        "lilac-light": "hsl(280 25% 88%)",
        "lilac-pale": "hsl(280 20% 94%)",
        "cream": "hsl(50 100% 98%)",
        "cloud": "hsl(0 0% 97%)",
        "coral": "hsl(15 100% 68%)",
        "soft-blue": "hsl(200 90% 63%)",
        "soft-pink": "hsl(340 100% 82%)",
        "yellow": "hsl(42 100% 71%)",
        "success": {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
      },
      borderRadius: {
        sm: "calc(var(--radius) - 4px)",
        md: "calc(var(--radius) - 2px)",
        lg: "var(--radius)",
        xl: "calc(var(--radius) + 4px)",
        "2xl": "24px",
        "3xl": "32px",
        full: "9999px",
        DEFAULT: "var(--radius)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
