import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        shore: {
          50:  "#F7F4ED",
          100: "#EDE7D7",
          200: "#D9CFB6",
          300: "#A89F87",
          400: "#6B7889",
          500: "#3C4A5C",
          600: "#243240",
          700: "#1A2734",
          800: "#13202E",
          900: "#0F1B2D",
        },
        spark: {
          300: "#D6FF9A",
          400: "#C2FF7B",
          500: "#A8FF60",
          600: "#85DB44",
          700: "#5FA82E",
        },
        ember: {
          400: "#FF8554",
          500: "#FF6B35",
          600: "#E04E1B",
        },
        cream: {
          50:  "#FBF9F4",
          100: "#F7F4ED",
          200: "#EDE7D7",
        },
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', "serif"],
        body:    ["Manrope", "sans-serif"],
        mono:    ['"JetBrains Mono"', "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
