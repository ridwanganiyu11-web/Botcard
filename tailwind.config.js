/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#060913",
          900: "#0B1021",
          800: "#111832",
          700: "#192347",
        },
        brand: {
          purple: "#8B5CF6",
          blue: "#3B82F6",
          cyan: "#06B6D4",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        glow: "0 0 35px -5px rgba(139, 92, 246, 0.35)",
        "glow-blue": "0 0 35px -5px rgba(59, 130, 246, 0.35)",
      },
    },
  },
  plugins: [],
};

