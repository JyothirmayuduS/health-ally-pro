/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./public/index.html"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'IBM Plex Sans'", "system-ui", "sans-serif"],
        heading: ["'Work Sans'", "system-ui", "sans-serif"],
        mono: ["'IBM Plex Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        // Custom hospital palette
        bone: "#F9F9F6",
        paper: "#EFF1EC",
        deeppaper: "#E5E9E1",
        sage: {
          DEFAULT: "#2C5E4E",
          hover: "#1E4237",
          soft: "#E9F0EE",
        },
        // Module accents — earthy, non-blue
        clay: { DEFAULT: "#B85C38", soft: "#F7E7DC" },
        mustard: { DEFAULT: "#A87826", soft: "#F5ECD7" },
        plum: { DEFAULT: "#7A4A6B", soft: "#F0E6EC" },
        teal: { DEFAULT: "#2C7873", soft: "#DCEEEC" },
        money: { DEFAULT: "#15803D", soft: "#DCFCE7" },
        ink: {
          900: "#1C1C19",
          600: "#575753",
          400: "#8A8A86",
          200: "#E5E5E0",
        },
        status: {
          waitBg: "#FEF3C7",
          waitText: "#92400E",
          waitBorder: "#FDE68A",
          consultBg: "#E0F2FE",
          consultText: "#075985",
          consultBorder: "#BAE6FD",
          doneBg: "#DCFCE7",
          doneText: "#166534",
          doneBorder: "#BBF7D0",
          noshowBg: "#FEE2E2",
          noshowText: "#991B1B",
          noshowBorder: "#FECACA",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        pulse_dot: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.3" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.25s ease-out",
        "pulse-dot": "pulse_dot 1.6s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
