import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        petal: {
          DEFAULT: "#D81B60", // primary
          deep: "#B3154E",
          blush: "#FFEBEF", // page background
          mist: "#FFF5F7", // soft card fill
          rose: "#FFB7C5", // light pills
          line: "#E8C7D1", // delicate borders
          ink: "#33252C",
          muted: "#8F6F7D",
          plum: "#2E242B",
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ['"DM Sans Variable"', "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        soft: "0 1px 0 rgba(216,27,96,.04), 0 18px 40px -22px rgba(216,27,96,.28)",
      },
      keyframes: {
        pop: {
          "0%": { transform: "scale(.4)", opacity: "0" },
          "35%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        flash: { "0%": { opacity: "0.95" }, "100%": { opacity: "0" } },
        rise: {
          "0%": { transform: "translateY(10px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        pop: "pop .8s cubic-bezier(.2,.9,.3,1.2) both",
        flash: "flash .5s ease-out forwards",
        rise: "rise .35s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
