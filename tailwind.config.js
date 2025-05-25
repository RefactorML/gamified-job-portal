/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary-color, #4A90E2)", // A nice blue
        "primary-dark": "var(--primary-dark-color, #357ABD)",
        "primary-hover": "var(--primary-hover-color, #357ABD)",
        secondary: "var(--secondary-color, #50E3C2)", // A teal/mint
        accent: "var(--accent-color, #F5A623)", // An orange
        light: "var(--color-light, #FFFFFF)",
        dark: "var(--color-dark, #171717)",
        "gray-50": "#F9FAFB",
        "gray-100": "#F3F4F6",
        "gray-200": "#E5E7EB",
        "gray-500": "#6B7280",
        "gray-600": "#4B5563",
        "gray-700": "#374151",
        "gray-800": "#1F2937",
      },
      spacing: {
        section: "3rem",
      },
      borderRadius: {
        container: "0.5rem",
      },
      fontFamily: {
        sans: [
          "Inter Variable",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "Noto Sans",
          "sans-serif",
          "Apple Color Emoji",
          "Segoe UI Emoji",
          "Segoe UI Symbol",
          "Noto Color Emoji",
        ],
      },
    },
  },
  plugins: [],
};
