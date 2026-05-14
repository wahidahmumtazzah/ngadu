import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4fc",
          100: "#dbe8fa",
          200: "#bfd5f5",
          300: "#93b9ed",
          400: "#5f95df",
          500: "#3171c6",
          600: "#295eaa",
          700: "#244d89",
          800: "#234273",
          900: "#23395f"
        },
        ink: "#2d2d2d",
        sand: "#f4f3f1",
        paper: "#fbfaf8"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(45, 45, 45, 0.1)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(49, 113, 198, 0.18), transparent 34%), radial-gradient(circle at bottom right, rgba(45, 45, 45, 0.08), transparent 28%)"
      }
    }
  },
  plugins: []
};

export default config;
