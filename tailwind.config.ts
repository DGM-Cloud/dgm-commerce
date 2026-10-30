import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Theme tokens (legacy key `store` kept for CSS compatibility; white-label via brand.ts)
        store: {
          primary: '#6366F1',      // Indigo vibrante
          secondary: '#EC4899',    // Rosa moderno
          accent: '#10B981',       // Verde esmeralda
          neutral: '#374151',      // Gris oscuro
          light: '#FAF7F2',        // Crema claro
          dark: '#1F2937',         // Gris muy oscuro
        },
        brand: {
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
        }
      },
    },
  },
  plugins: [],
} satisfies Config;
