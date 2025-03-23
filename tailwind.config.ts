import type { Config } from "tailwindcss"
const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
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
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
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
        // Dark Atlas exact colors
        dark: {
          bg: "rgb(15, 15, 27)",
          card: "rgb(23, 23, 39)",
          "card-translucent": "rgba(23, 23, 39, 0.85)",
          purple: "rgb(33, 19, 57)",
        },
        purple: {
          DEFAULT: "rgb(138, 44, 226)",
          secondary: "rgb(120, 40, 195)",
          "bg-5": "rgba(138, 44, 226, 0.05)",
          "bg-10": "rgba(138, 44, 226, 0.1)",
          "bg-15": "rgba(138, 44, 226, 0.15)",
          "bg-20": "rgba(138, 44, 226, 0.2)",
          "bg-30": "rgba(138, 44, 226, 0.3)",
          "text-85": "rgba(138, 44, 226, 0.85)",
        },
        white: {
          DEFAULT: "rgb(255, 255, 255)",
          "text-85": "rgba(255, 255, 255, 0.85)",
          "text-45": "rgba(255, 255, 255, 0.45)",
        },
        teal: {
          "bg-10": "rgba(6, 182, 212, 0.1)",
        },
        green: {
          text: "rgb(19, 103, 65)",
        },
        // Cybersecurity theme colors - updated to match Dark Atlas
        cyber: {
          primary: "rgb(138, 44, 226)", // Purple
          secondary: "rgb(120, 40, 195)", // Darker purple
          accent: "rgb(6, 182, 212)", // Teal
          dark: "rgb(15, 15, 27)", // Very dark blue/black
          darker: "rgb(10, 10, 18)", // Even darker background
          gray: "rgb(23, 23, 39)", // Dark purple-blue gray
          lightgray: "rgba(255, 255, 255, 0.45)", // Light text for dark backgrounds
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "pulse-glow": {
          "0%, 100%": {
            opacity: "1",
            filter: "brightness(1)",
          },
          "50%": {
            opacity: "0.8",
            filter: "brightness(1.2)",
          },
        },
        "data-flow": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "pulse-glow": "pulse-glow 2s infinite",
        "data-flow": "data-flow 20s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
      backgroundImage: {
        "gradient-purple": "linear-gradient(to right, rgb(120, 40, 195), rgb(138, 44, 226))",
        "gradient-purple-bright": "linear-gradient(to right, rgb(138, 44, 226), rgb(160, 80, 255))",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    ({ addUtilities, theme }) => {
      const newUtilities = {
        ".hover\\:bg-purple-bg-5:hover": {
          backgroundColor: "rgba(138, 44, 226, 0.05)",
        },
        ".hover\\:bg-purple-bg-10:hover": {
          backgroundColor: "rgba(138, 44, 226, 0.1)",
        },
        ".hover\\:bg-purple-bg-15:hover": {
          backgroundColor: "rgba(138, 44, 226, 0.15)",
        },
        ".hover\\:bg-purple-bg-20:hover": {
          backgroundColor: "rgba(138, 44, 226, 0.2)",
        },
      }
      addUtilities(newUtilities)
    },
  ],
} satisfies Config

export default config

