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
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        "background-light": "hsl(var(--background-light))",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        chart: {
          1: "var(--chart-1)",
          2: "var(--chart-2)",
          3: "var(--chart-3)",
          4: "var(--chart-4)",
          5: "var(--chart-5)",
        },
        "ink": "hsl(var(--color-ink))",
        "honey": "hsl(var(--color-honey))",
        "honey-light": "hsl(var(--color-honey-light))",
        "honey-pale": "hsl(var(--color-honey-pale))",
        "honey-dark": "hsl(var(--color-honey-dark))",
        "lavender": "hsl(var(--color-lavender))",
        "lavender-light": "hsl(var(--color-lavender-light))",
        "lavender-pale": "hsl(var(--color-lavender-pale))",
        "sage": "hsl(var(--color-sage))",
        "sage-light": "hsl(var(--color-sage-light))",
        "sage-pale": "hsl(var(--color-sage-pale))",
        "lilac": "hsl(var(--color-lilac))",
        "lilac-light": "hsl(var(--color-lilac-light))",
        "lilac-pale": "hsl(var(--color-lilac-pale))",
        "cream": "hsl(var(--color-cream))",
        "cloud": "hsl(var(--color-cloud))",
        "coral": "var(--coral)",
        "coral-light": "var(--coral-light)",
        "soft-blue": "var(--soft-blue)",
        "soft-pink": "var(--soft-pink)",
        "yellow": "var(--yellow)",
        "success": {
          DEFAULT: "var(--success)",
          foreground: "var(--success-foreground)",
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
