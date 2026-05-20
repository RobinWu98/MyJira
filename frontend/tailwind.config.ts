import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        line: "#d6dbe6",
        surface: "#f6f8fb",
        brand: "#2563eb"
      }
    }
  },
  plugins: []
} satisfies Config;
